import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import { MarketplaceListing } from "@/lib/models/MarketplaceListing";
import { User } from "@/lib/models/User";
import { placeholderRating } from "@/lib/utils";
import mongoose from "mongoose";

export const dynamic = 'force-dynamic';

const MIN_PAYOUT_THRESHOLD = 1000; // placeholder minimum payout amount (no real payout policy yet)

function dayKey(d: Date) {
    return d.toISOString().slice(0, 10);
}

// GET /api/dashboard/seller stats for the logged-in seller: earnings, sales,
// active/pending prompt counts, avg rating, 7-day earnings chart, payout info.
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        await connectToDatabase();
        const sellerId = new mongoose.Types.ObjectId((session.user as any).id);

        const [listings, user] = await Promise.all([
            MarketplaceListing.find({ sellerId }).lean(),
            User.findById(sellerId).lean(),
        ]);

        const now = new Date();
        const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const today0 = new Date();
        today0.setHours(0, 0, 0, 0);
        const weekAgo = new Date(today0);
        weekAgo.setDate(weekAgo.getDate() - 6);

        const last7 = new Map<string, number>();
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today0);
            d.setDate(d.getDate() - i);
            last7.set(dayKey(d), 0);
        }

        let totalEarned = 0;
        let earnedThisMonth = 0;
        let earnedLastMonth = 0;
        let totalSales = 0;
        let salesThisWeek = 0;
        let activePrompts = 0;
        let pendingReview = 0;
        const ratings: number[] = [];

        for (const l of listings as any[]) {
            if (l.status === "live" || l.status === undefined) activePrompts++;
            if (l.status === "pending_review") pendingReview++;
            ratings.push(typeof l.rating === "number" ? l.rating : placeholderRating(l._id.toString()));

            const sales = Array.isArray(l.sales) ? l.sales : [];
            if (sales.length > 0) {
                for (const s of sales) {
                    totalEarned += s.price;
                    totalSales++;
                    const pd = new Date(s.purchasedAt);
                    if (pd >= startOfThisMonth) earnedThisMonth += s.price;
                    else if (pd >= startOfLastMonth) earnedLastMonth += s.price;
                    if (pd >= weekAgo) salesThisWeek++;
                    const key = dayKey(pd);
                    if (last7.has(key)) last7.set(key, (last7.get(key) || 0) + s.price);
                }
            } else if (Array.isArray(l.buyers) && l.buyers.length > 0) {
                // Legacy purchases made before per-sale records existed — no
                // timestamp available, so they count toward totals only.
                totalEarned += l.buyers.length * l.price;
                totalSales += l.buyers.length;
            }
        }

        const avgRating = ratings.length
            ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
            : null;

        const earnedGrowthPct = earnedLastMonth > 0
            ? Math.round(((earnedThisMonth - earnedLastMonth) / earnedLastMonth) * 100)
            : (earnedThisMonth > 0 ? 100 : 0);

        const chart = Array.from(last7.entries()).map(([date, amount]) => ({
            date,
            label: new Date(date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short" }),
            amount,
        }));

        const availableToWithdraw = totalEarned;
        const progressPct = Math.min(100, Math.round((availableToWithdraw / MIN_PAYOUT_THRESHOLD) * 100));

        return NextResponse.json({
            plan: (user as any)?.plan || "Free",
            totalEarned,
            earnedGrowthPct,
            totalSales,
            salesThisWeek,
            activePrompts,
            pendingReview,
            avgRating,
            chart,
            payout: {
                available: availableToWithdraw,
                nextPayoutDate: "Aug 1",
                progressPct,
            },
        });
    } catch (error) {
        console.error("Dashboard Stats Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
