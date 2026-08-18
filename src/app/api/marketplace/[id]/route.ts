import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import { MarketplaceListing } from "@/lib/models/MarketplaceListing";
import { User } from "@/lib/models/User";
import { placeholderRating } from "@/lib/utils";
import { ensureListingSlug, ensureUserUsername } from "@/lib/slug";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

const ALLOWED_STATUSES = ["draft", "pending_review", "live"];
const ALLOWED_OUTPUT_TYPES = ["Text", "Image", "Video", "Code", "Audio", "Other"];
const DAY_MS = 24 * 60 * 60 * 1000;

// GET /api/marketplace/[id] — the owner gets the full raw doc (used to
// pre-fill the listing wizard when resuming a draft). Anyone else gets a
// sanitized public "detail page" payload (Screen 4): promptText is only
// included if the requester purchased it or it's free.
export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        if (!mongoose.Types.ObjectId.isValid(params.id)) {
            return NextResponse.json({ error: "Invalid listing id" }, { status: 400 });
        }
        const session = await getServerSession(authOptions);
        await connectToDatabase();

        const listing: any = await MarketplaceListing.findById(params.id).lean();
        if (!listing) {
            return NextResponse.json({ error: "Listing not found" }, { status: 404 });
        }

        const userId = (session?.user as any)?.id as string | undefined;
        const isOwner = !!userId && listing.sellerId.toString() === userId;

        // ?view=detail is used by the public /marketplace/[id] page — even
        // when the requester owns the listing, they get the same detail
        // payload as a buyer would (so a seller can preview their own page)
        // instead of the raw wizard-edit doc.
        const { searchParams } = new URL(request.url);
        const isDetailView = searchParams.get("view") === "detail";

        if (isOwner && !isDetailView) {
            return NextResponse.json(listing);
        }

        // Publicly-visible listings only, unless the requester is the owner.
        if (!isOwner && listing.status && listing.status !== "live") {
            return NextResponse.json({ error: "Listing not found" }, { status: 404 });
        }

        const hasPurchased = isOwner || (!!userId && listing.buyers?.some((b: any) => b.toString() === userId));
        const salesCount = Array.isArray(listing.sales) ? listing.sales.length : (listing.buyers?.length || 0);
        const rating = typeof listing.rating === "number" ? listing.rating : placeholderRating(listing._id.toString());
        const trending = salesCount > 0 && Date.now() - new Date(listing.createdAt).getTime() <= 30 * DAY_MS;

        const seller: any = await User.findById(listing.sellerId).lean();
        let sellerTotalSales = salesCount;
        if (seller) {
            const sellerListings = await MarketplaceListing.find({ sellerId: listing.sellerId }).select("sales buyers").lean();
            sellerTotalSales = sellerListings.reduce((sum: number, l: any) => sum + (Array.isArray(l.sales) ? l.sales.length : (l.buyers?.length || 0)), 0);
        }
        const slug = await ensureListingSlug(listing);
        const sellerUsername = seller ? await ensureUserUsername(seller) : "";

        return NextResponse.json({
            _id: listing._id,
            slug,
            title: listing.title,
            description: listing.description || "",
            category: listing.category || null,
            models: listing.models || [],
            outputType: listing.outputType,
            promptText: hasPurchased || listing.isFree ? listing.promptText : null,
            // Teaser only — first couple of lines of the *real* prompt, sent
            // even when locked so the PREVIEW section can show genuine text
            // above the blur. The remainder is never sent to the client
            // pre-purchase (blurred-but-present text in the DOM would be
            // trivially readable via view-source, defeating the paywall).
            promptHead: (listing.promptText || "").split("\n").filter((l: string) => l.trim()).slice(0, 2).join("\n"),
            previewSnippet: listing.previewSnippet || listing.description || "",
            price: listing.price,
            isFree: !!listing.isFree,
            rating,
            hasReviews: false, // no per-review records exist yet — see TOP REVIEWS note on the detail page
            salesCount,
            trending,
            createdAt: listing.createdAt,
            updatedAt: listing.updatedAt,
            purchased: hasPurchased || !!listing.isFree,
            isOwner,
            isOfficial: !!listing.isOfficial,
            emoji: listing.emoji || null,
            isMega: !!listing.isMega,
            sampleOutput: listing.sampleOutput || null,
            seller: {
                id: listing.sellerId,
                name: seller ? (seller as any).name || listing.sellerName : listing.sellerName,
                username: sellerUsername,
                joinedYear: seller ? new Date((seller as any).createdAt).getFullYear() : null,
                totalSales: sellerTotalSales,
            },
        });
    } catch (error) {
        console.error("Fetch Listing Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// PATCH /api/marketplace/[id] — owner-only: update an existing listing
// (used by "Continue editing" on drafts/rejected prompts).
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
    try {
        if (!mongoose.Types.ObjectId.isValid(params.id)) {
            return NextResponse.json({ error: "Invalid listing id" }, { status: 400 });
        }
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        await connectToDatabase();

        const listing = await MarketplaceListing.findById(params.id);
        if (!listing) {
            return NextResponse.json({ error: "Listing not found" }, { status: 404 });
        }
        if (listing.sellerId.toString() !== (session.user as any).id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json();
        const {
            title, promptText, price, isFree, description, category,
            models, previewSnippet, status, outputType,
        } = body;

        if (title !== undefined) listing.title = String(title).trim();
        if (promptText !== undefined) listing.promptText = String(promptText).trim();
        if (description !== undefined) listing.description = String(description).trim();
        if (category !== undefined) listing.category = String(category).trim();
        if (previewSnippet !== undefined) listing.previewSnippet = String(previewSnippet).trim();
        if (Array.isArray(models)) listing.models = models;
        if (ALLOWED_OUTPUT_TYPES.includes(outputType)) listing.outputType = outputType;

        if (isFree !== undefined) {
            const free = !!isFree;
            listing.isFree = free;
            listing.price = free ? 0 : Number(price);
        } else if (price !== undefined) {
            listing.price = Number(price);
        }

        if (ALLOWED_STATUSES.includes(status)) listing.status = status;

        await listing.save();
        return NextResponse.json(listing);
    } catch (error) {
        console.error("Update Listing Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
