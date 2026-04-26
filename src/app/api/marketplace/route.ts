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
        const listings = await MarketplaceListing.find({})
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
        const { favouriteId, title, promptText, price } = body;

        if (!title?.trim() || !promptText?.trim()) {
            return NextResponse.json({ error: "title and promptText are required" }, { status: 400 });
        }
        if (!price || price < 1 || price > 1000) {
            return NextResponse.json({ error: "price must be between 1 and 1000" }, { status: 400 });
        }

        const listing = await MarketplaceListing.create({
            sellerId: new mongoose.Types.ObjectId((session.user as any).id),
            sellerName: session.user.name || "Anonymous",
            favouriteId: favouriteId ? new mongoose.Types.ObjectId(favouriteId) : new mongoose.Types.ObjectId(),
            title: title.trim(),
            promptText: promptText.trim(),
            price: Number(price),
            buyers: [],
        });
        return NextResponse.json(listing, { status: 201 });
    } catch (error) {
        console.error("Create Listing Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
