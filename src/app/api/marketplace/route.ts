import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import { MarketplaceListing } from "@/lib/models/MarketplaceListing";
import mongoose from "mongoose";

export const dynamic = 'force-dynamic';

// GET all marketplace listings (blurs promptText unless purchased)
export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        const userId = (session?.user as any)?.id || null;

        await connectToDatabase();
        // Only publicly-visible listings: "live", or legacy docs created before
        // the status field existed (lean() reads skip schema defaults).
        const listings = await MarketplaceListing.find({
            $or: [{ status: "live" }, { status: { $exists: false } }],
        })
            .sort({ createdAt: -1 })
            .lean();

        // Return listings with promptText blurred unless the user has purchased
        const sanitized = listings.map((l: any) => {
            const hasPurchased = userId && l.buyers?.some((b: any) => b.toString() === userId);
            return {
                _id: l._id,
                title: l.title,
                sellerName: l.sellerName,
                price: l.price,
                createdAt: l.createdAt,
                promptText: hasPurchased ? l.promptText : null,
                purchased: !!hasPurchased,
            };
        });
        return NextResponse.json(sanitized);
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
            description, category, models, previewSnippet, status,
        } = body;

        if (!title?.trim() || !promptText?.trim()) {
            return NextResponse.json({ error: "title and promptText are required" }, { status: 400 });
        }
        const free = !!isFree;
        const numericPrice = free ? 0 : Number(price);
        if (!free && (!price || numericPrice < 1 || numericPrice > 1000)) {
            return NextResponse.json({ error: "price must be between 1 and 1000" }, { status: 400 });
        }

        const allowedStatuses = ["draft", "pending_review", "live"];
        const resolvedStatus = allowedStatuses.includes(status) ? status : "live";

        const listing = await MarketplaceListing.create({
            sellerId: new mongoose.Types.ObjectId((session.user as any).id),
            sellerName: session.user.name || "Anonymous",
            favouriteId: favouriteId ? new mongoose.Types.ObjectId(favouriteId) : new mongoose.Types.ObjectId(),
            title: title.trim(),
            description: description?.trim(),
            category: category?.trim(),
            models: Array.isArray(models) ? models : [],
            promptText: promptText.trim(),
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
