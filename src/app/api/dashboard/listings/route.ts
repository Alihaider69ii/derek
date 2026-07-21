import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import { MarketplaceListing } from "@/lib/models/MarketplaceListing";
import { placeholderRating } from "@/lib/utils";
import mongoose from "mongoose";

export const dynamic = 'force-dynamic';

// GET /api/dashboard/listings — the logged-in seller's own listings (all
// statuses) with computed sales/revenue/rating, for the "Top Prompts" table.
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        await connectToDatabase();
        const sellerId = new mongoose.Types.ObjectId((session.user as any).id);

        const listings = await MarketplaceListing.find({ sellerId })
            .sort({ createdAt: -1 })
            .lean();

        const result = (listings as any[]).map((l) => {
            const sales = Array.isArray(l.sales) ? l.sales.length : 0;
            const salesCount = sales > 0 ? sales : (l.buyers?.length || 0);
            const revenue = sales > 0
                ? l.sales.reduce((sum: number, s: any) => sum + s.price, 0)
                : salesCount * l.price;
            return {
                _id: l._id,
                title: l.title,
                price: l.price,
                isFree: !!l.isFree,
                status: l.status || "live",
                sales: salesCount,
                revenue,
                rating: typeof l.rating === "number" ? l.rating : placeholderRating(l._id.toString()),
                createdAt: l.createdAt,
            };
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error("Dashboard Listings Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
