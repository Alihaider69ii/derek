import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import { MarketplaceListing } from "@/lib/models/MarketplaceListing";
import mongoose from "mongoose";

export const dynamic = 'force-dynamic';

// POST /api/marketplace/[id]/buy — simulate purchase, reveal promptText
export async function POST(
    _request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        await connectToDatabase();
        const userId = new mongoose.Types.ObjectId((session.user as any).id);

        const listing = await MarketplaceListing.findById(params.id);
        if (!listing) {
            return NextResponse.json({ error: "Listing not found" }, { status: 404 });
        }

        // Don't add duplicate buyers
        const alreadyBought = listing.buyers.some((b: any) => b.toString() === userId.toString());
        if (!alreadyBought) {
            listing.buyers.push(userId);
            await listing.save();
        }

        return NextResponse.json({
            success: true,
            message: "Prompt Purchased",
            promptText: listing.promptText,
        });
    } catch (error) {
        console.error("Buy Listing Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
