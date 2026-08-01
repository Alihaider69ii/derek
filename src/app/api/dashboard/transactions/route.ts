import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import { MarketplaceListing } from "@/lib/models/MarketplaceListing";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

// GET /api/dashboard/transactions — flattened per-sale history for the
// logged-in seller's listings, newest first.
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        await connectToDatabase();
        const sellerId = new mongoose.Types.ObjectId((session.user as any).id);

        const listings = await MarketplaceListing.find({ sellerId }).select("title sales").lean();

        const transactions = (listings as any[]).flatMap((l) =>
            (l.sales || []).map((s: any) => ({
                id: `${l._id}-${s.purchasedAt}`,
                listingTitle: l.title,
                price: s.price,
                purchasedAt: s.purchasedAt,
            }))
        );

        transactions.sort((a, b) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime());

        return NextResponse.json(transactions);
    } catch (error) {
        console.error("Dashboard Transactions Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
