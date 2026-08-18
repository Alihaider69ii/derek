import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import { MarketplaceListing } from "@/lib/models/MarketplaceListing";
import { User } from "@/lib/models/User";
import { placeholderRating } from "@/lib/utils";
import { generateUniqueSlug, ensureListingSlug, ensureUserUsername } from "@/lib/slug";
import { migratePromptBankIfNeeded } from "@/lib/promptBankMigration";
import mongoose from "mongoose";

export const dynamic = 'force-dynamic';

const DAY_MS = 24 * 60 * 60 * 1000;

// GET all marketplace listings (blurs promptText unless purchased). Supports
// ?category=&price=&rating=&chip=&sort= query params — see marketplace page.
export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        const userId = (session?.user as any)?.id || null;
        const { searchParams } = new URL(request.url);
        const category = searchParams.get("category");
        const price = searchParams.get("price"); // free | under100 | 100-500 | 500plus
        const minRating = Number(searchParams.get("rating")) || 0;
        const chip = searchParams.get("chip") || "all"; // all | trending | new | free | bestsellers
        const sort = searchParams.get("sort") || "top-rated"; // top-rated | newest | price-asc | price-desc | sales

        await connectToDatabase();
        // One-time, self-healing migration of legacy Prompt Bank docs into the
        // unified marketplace — a no-op once it's already run.
        await migratePromptBankIfNeeded();
        // Only publicly-visible listings: "live", or legacy docs created before
        // the status field existed (lean() reads skip schema defaults).
        const dbFilter: any = {
            $or: [{ status: "live" }, { status: { $exists: false } }],
        };
        if (category) dbFilter.category = category;

        const listings = await MarketplaceListing.find(dbFilter).lean();

        // Batch-resolve seller usernames (denormalized nowhere else), backfilling
        // any legacy sellers that predate the username field.
        const sellerIds = Array.from(new Set((listings as any[]).map(l => l.sellerId.toString())));
        const sellerDocs = await User.find({ _id: { $in: sellerIds } }).select("username name").lean();
        const sellerMap = new Map(sellerDocs.map((s: any) => [s._id.toString(), s]));
        const usernameById = new Map<string, string>();
        await Promise.all(sellerIds.map(async (id) => {
            const seller = sellerMap.get(id);
            usernameById.set(id, seller ? await ensureUserUsername(seller) : "");
        }));

        const now = Date.now();
        let sanitized = await Promise.all((listings as any[]).map(async (l) => {
            const hasPurchased = userId && l.buyers?.some((b: any) => b.toString() === userId);
            const salesCount = Array.isArray(l.sales) ? l.sales.length : (l.buyers?.length || 0);
            const rating = typeof l.rating === "number" ? l.rating : placeholderRating(l._id.toString());
            const slug = await ensureListingSlug(l);
            return {
                _id: l._id,
                slug,
                sellerId: l.sellerId,
                sellerUsername: usernameById.get(l.sellerId.toString()) || "",
                title: l.title,
                sellerName: l.sellerName,
                category: l.category || null,
                previewSnippet: l.previewSnippet || l.description || null,
                price: l.price,
                isFree: !!l.isFree,
                rating,
                salesCount,
                featured: !!l.featured,
                createdAt: l.createdAt,
                promptText: hasPurchased ? l.promptText : null,
                purchased: !!hasPurchased,
                isOfficial: !!l.isOfficial,
                emoji: l.emoji || null,
                isMega: !!l.isMega,
            };
        }));

        // Price bucket filter
        if (price === "free") sanitized = sanitized.filter(l => l.isFree);
        else if (price === "under100") sanitized = sanitized.filter(l => !l.isFree && l.price < 100);
        else if (price === "100-500") sanitized = sanitized.filter(l => !l.isFree && l.price >= 100 && l.price <= 500);
        else if (price === "500plus") sanitized = sanitized.filter(l => !l.isFree && l.price > 500);

        // Rating filter
        if (minRating > 0) sanitized = sanitized.filter(l => l.rating >= minRating);

        // Chip filter (quick filters shown as pills above the grid)
        if (chip === "trending") {
            sanitized = sanitized.filter(l => l.salesCount > 0 && now - new Date(l.createdAt).getTime() <= 30 * DAY_MS);
        } else if (chip === "new") {
            sanitized = sanitized.filter(l => now - new Date(l.createdAt).getTime() <= 14 * DAY_MS);
        } else if (chip === "free") {
            sanitized = sanitized.filter(l => l.isFree);
        } else if (chip === "bestsellers") {
            sanitized = sanitized.filter(l => l.salesCount > 0);
        }

        // Sort
        sanitized.sort((a, b) => {
            switch (sort) {
                case "newest": return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                case "price-asc": return a.price - b.price;
                case "price-desc": return b.price - a.price;
                case "sales": return b.salesCount - a.salesCount;
                case "top-rated":
                default:
                    if (a.featured !== b.featured) return a.featured ? -1 : 1;
                    return b.rating - a.rating;
            }
        });

        return NextResponse.json({ total: sanitized.length, listings: sanitized });
    } catch (error) {
        console.error("Fetch Marketplace Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// POST create a new marketplace listing (from a favourite)
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        await connectToDatabase();
        const body = await request.json();
        const {
            favouriteId, title, promptText, price, isFree,
            description, category, models, previewSnippet, status, outputType,
        } = body;

        const allowedStatuses = ["draft", "pending_review", "live"];
        const resolvedStatus = allowedStatuses.includes(status) ? status : "live";
        const isDraft = resolvedStatus === "draft";

        if (!title?.trim()) {
            return NextResponse.json({ error: "Title is required" }, { status: 400 });
        }
        // Drafts only need a title — the rest can be filled in later. Full
        // prompt text and a valid price are only required once the listing
        // actually leaves draft status (submitted for review / made live).
        if (!isDraft && !promptText?.trim()) {
            return NextResponse.json({ error: "title and promptText are required" }, { status: 400 });
        }
        const free = !!isFree;
        const numericPrice = free ? 0 : (Number(price) || 0);
        if (!isDraft && !free && (!price || numericPrice < 1 || numericPrice > 1000)) {
            return NextResponse.json({ error: "price must be between 1 and 1000" }, { status: 400 });
        }

        const allowedOutputTypes = ["Text", "Image", "Video", "Code", "Audio", "Other"];
        const resolvedOutputType = allowedOutputTypes.includes(outputType) ? outputType : "Text";
        const slug = await generateUniqueSlug(title.trim());

        const listing = await MarketplaceListing.create({
            sellerId: new mongoose.Types.ObjectId((session.user as any).id),
            sellerName: session.user.name || "Anonymous",
            favouriteId: favouriteId ? new mongoose.Types.ObjectId(favouriteId) : new mongoose.Types.ObjectId(),
            slug,
            title: title.trim(),
            description: description?.trim(),
            category: category?.trim(),
            models: Array.isArray(models) ? models : [],
            outputType: resolvedOutputType,
            promptText: promptText?.trim() || "",
            previewSnippet: previewSnippet?.trim(),
            price: numericPrice,
            isFree: free,
            status: resolvedStatus,
            buyers: [],
            sales: [],
        });
        return NextResponse.json(listing, { status: 201 });
    } catch (error) {
        console.error("Create Listing Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
