import { NextRequest, NextResponse } from "next/server";
import { requireAdminApiSession } from "@/lib/adminSession";
import connectToDatabase from "@/lib/db";
import { User } from "@/lib/models/User";
import { MarketplaceListing } from "@/lib/models/MarketplaceListing";
import { Project } from "@/lib/models/Project";
import { Visit } from "@/lib/models/Visit";

export const dynamic = "force-dynamic";

type Granularity = "daily" | "weekly" | "monthly";

function dayKey(d: Date) {
    return d.toISOString().slice(0, 10);
}
function weekStart(d: Date) {
    const dt = new Date(d);
    dt.setHours(0, 0, 0, 0);
    const day = dt.getDay();
    const diff = (day === 0 ? -6 : 1) - day; // Monday as the start of the week
    dt.setDate(dt.getDate() + diff);
    return dt;
}
function monthKey(d: Date) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

type Bucket = { key: string; label: string; start: Date };

function buildBuckets(granularity: Granularity, now: Date): Bucket[] {
    if (granularity === "monthly") {
        const buckets: Bucket[] = [];
        for (let i = 11; i >= 0; i--) {
            const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
            buckets.push({ key: monthKey(start), label: start.toLocaleDateString("en-US", { month: "short", year: "2-digit" }), start });
        }
        return buckets;
    }
    if (granularity === "weekly") {
        const buckets: Bucket[] = [];
        const thisWeekStart = weekStart(now);
        for (let i = 11; i >= 0; i--) {
            const start = new Date(thisWeekStart);
            start.setDate(start.getDate() - i * 7);
            buckets.push({ key: dayKey(start), label: start.toLocaleDateString("en-US", { month: "short", day: "numeric" }), start });
        }
        return buckets;
    }
    // daily: last 30 days
    const buckets: Bucket[] = [];
    const today0 = new Date(now);
    today0.setHours(0, 0, 0, 0);
    for (let i = 29; i >= 0; i--) {
        const start = new Date(today0);
        start.setDate(start.getDate() - i);
        buckets.push({ key: dayKey(start), label: start.toLocaleDateString("en-US", { month: "short", day: "numeric" }), start });
    }
    return buckets;
}

function keyFor(granularity: Granularity, d: Date): string {
    if (granularity === "monthly") return monthKey(d);
    if (granularity === "weekly") return dayKey(weekStart(d));
    return dayKey(d);
}

// GET /api/admin/analytics?granularity=daily|weekly|monthly
// Revenue + signup trends over the matching lookback window, category
// popularity within that window, and an all-time conversion funnel.
export async function GET(req: NextRequest) {
    const adminSession = await requireAdminApiSession();
    if (!adminSession) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        await connectToDatabase();

        const { searchParams } = new URL(req.url);
        const rawGranularity = searchParams.get("granularity");
        const granularity: Granularity = rawGranularity === "weekly" || rawGranularity === "monthly" ? rawGranularity : "daily";

        const now = new Date();
        const buckets = buildBuckets(granularity, now);
        const windowStart = buckets[0].start;

        const [usersInWindow, listingsWithSales, totalUsers, visitorIds, promptCreatorIds, sellersWithSalesAgg] = await Promise.all([
            User.find({ createdAt: { $gte: windowStart } }).select("createdAt").lean(),
            MarketplaceListing.find({ "sales.0": { $exists: true } }).select("sales category").lean(),
            User.countDocuments({}),
            Visit.distinct("visitorId"),
            Project.distinct("userId"),
            MarketplaceListing.aggregate([
                { $match: { "sales.0": { $exists: true } } },
                { $group: { _id: "$sellerId" } },
            ]),
        ]);

        // --- Revenue + category popularity, bucketed by granularity ---------
        const revenueByBucket = new Map<string, number>(buckets.map((b) => [b.key, 0]));
        const categoryStats = new Map<string, { count: number; revenue: number }>();

        for (const l of listingsWithSales as any[]) {
            const category = l.category || "Uncategorized";
            for (const s of l.sales || []) {
                const purchasedAt = new Date(s.purchasedAt);
                if (purchasedAt < windowStart) continue;
                const key = keyFor(granularity, purchasedAt);
                if (revenueByBucket.has(key)) revenueByBucket.set(key, (revenueByBucket.get(key) || 0) + s.price);

                const stat = categoryStats.get(category) || { count: 0, revenue: 0 };
                stat.count += 1;
                stat.revenue += s.price;
                categoryStats.set(category, stat);
            }
        }
        const revenueTrend = buckets.map((b) => ({ label: b.label, amount: revenueByBucket.get(b.key) || 0 }));

        const signupsByBucket = new Map<string, number>(buckets.map((b) => [b.key, 0]));
        for (const u of usersInWindow as any[]) {
            const key = keyFor(granularity, new Date(u.createdAt));
            if (signupsByBucket.has(key)) signupsByBucket.set(key, (signupsByBucket.get(key) || 0) + 1);
        }
        const userGrowthTrend = buckets.map((b) => ({ label: b.label, count: signupsByBucket.get(b.key) || 0 }));

        const categoryPopularity = Array.from(categoryStats.entries())
            .map(([category, s]) => ({ category, count: s.count, revenue: s.revenue }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 8);

        // --- Conversion funnel (all-time, not affected by granularity) ------
        const funnel = {
            visitors: visitorIds.length,
            signups: totalUsers,
            firstPromptCreated: promptCreatorIds.length,
            firstSale: sellersWithSalesAgg.length,
        };

        return NextResponse.json({ granularity, revenueTrend, userGrowthTrend, categoryPopularity, funnel });
    } catch (error) {
        console.error("Admin Analytics Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
