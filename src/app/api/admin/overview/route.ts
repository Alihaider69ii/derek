import { NextResponse } from "next/server";
import { requireAdminApiSession } from "@/lib/adminSession";
import connectToDatabase from "@/lib/db";
import { User } from "@/lib/models/User";
import { Prompt } from "@/lib/models/Prompt";
import { MarketplaceListing } from "@/lib/models/MarketplaceListing";

export const dynamic = "force-dynamic";

const ONLINE_WINDOW_MS = 5 * 60 * 1000;
const CHURN_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

function monthKey(d: Date) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(d: Date) {
    return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

// Oldest -> newest scaffold of the last 12 calendar months (including this one).
function last12MonthScaffold(now: Date) {
    const months: { key: string; label: string }[] = [];
    for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({ key: monthKey(d), label: monthLabel(d) });
    }
    return months;
}

// GET /api/admin/overview — everything the admin overview dashboard needs,
// in one call.
export async function GET() {
    const adminSession = await requireAdminApiSession();
    if (!adminSession) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        await connectToDatabase();

        const now = new Date();
        const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
        const onlineCutoff = new Date(Date.now() - ONLINE_WINDOW_MS);
        const churnCutoff = new Date(Date.now() - CHURN_WINDOW_MS);

        const [
            totalUsers,
            newThisMonth,
            newLastMonth,
            onlineUsers,
            churnAgg,
            totalPrompts,
            statusAgg,
            salesTotalsAgg,
            revenueTrendAgg,
            signupsTrendAgg,
            liveCategoryAgg,
            revenueByCategoryAgg,
            topPromptsAgg,
            sellerEarningsAgg,
            sellerPromptCountsAgg,
        ] = await Promise.all([
            User.countDocuments({}),
            User.countDocuments({ createdAt: { $gte: startOfThisMonth } }),
            User.countDocuments({ createdAt: { $gte: startOfLastMonth, $lt: startOfThisMonth } }),
            User.countDocuments({ lastActiveAt: { $gte: onlineCutoff } }),
            User.aggregate([
                { $addFields: { lastSeen: { $ifNull: ["$lastActiveAt", "$createdAt"] } } },
                { $match: { lastSeen: { $lt: churnCutoff } } },
                {
                    $facet: {
                        count: [{ $count: "n" }],
                        list: [
                            { $sort: { lastSeen: -1 } },
                            { $limit: 20 },
                            { $project: { name: 1, email: 1, lastSeen: 1 } },
                        ],
                    },
                },
            ]),
            Prompt.countDocuments({}),
            MarketplaceListing.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
            MarketplaceListing.aggregate([
                { $unwind: "$sales" },
                { $group: { _id: null, totalSales: { $sum: 1 }, totalRevenue: { $sum: "$sales.price" } } },
            ]),
            MarketplaceListing.aggregate([
                { $unwind: "$sales" },
                { $match: { "sales.purchasedAt": { $gte: twelveMonthsAgo } } },
                {
                    $group: {
                        _id: { y: { $year: "$sales.purchasedAt" }, m: { $month: "$sales.purchasedAt" } },
                        amount: { $sum: "$sales.price" },
                    },
                },
            ]),
            User.aggregate([
                { $match: { createdAt: { $gte: twelveMonthsAgo } } },
                {
                    $group: {
                        _id: { y: { $year: "$createdAt" }, m: { $month: "$createdAt" } },
                        count: { $sum: 1 },
                    },
                },
            ]),
            MarketplaceListing.aggregate([
                { $match: { status: "live" } },
                { $group: { _id: { $ifNull: ["$category", "Uncategorized"] }, count: { $sum: 1 } } },
                { $sort: { count: -1 } },
            ]),
            MarketplaceListing.aggregate([
                { $unwind: "$sales" },
                { $group: { _id: { $ifNull: ["$category", "Uncategorized"] }, revenue: { $sum: "$sales.price" } } },
                { $sort: { revenue: -1 } },
            ]),
            MarketplaceListing.aggregate([
                { $unwind: "$sales" },
                {
                    $group: {
                        _id: "$_id",
                        title: { $first: "$title" },
                        sellerName: { $first: "$sellerName" },
                        category: { $first: "$category" },
                        salesCount: { $sum: 1 },
                        revenue: { $sum: "$sales.price" },
                    },
                },
                { $sort: { revenue: -1 } },
                { $limit: 10 },
            ]),
            MarketplaceListing.aggregate([
                { $unwind: "$sales" },
                {
                    $group: {
                        _id: "$sellerId",
                        salesCount: { $sum: 1 },
                        totalEarnings: { $sum: "$sales.price" },
                    },
                },
                { $sort: { totalEarnings: -1 } },
                { $limit: 10 },
            ]),
            MarketplaceListing.aggregate([{ $group: { _id: "$sellerId", promptsCount: { $sum: 1 } } }]),
        ]);

        // --- Users -----------------------------------------------------------
        const usersBeforeThisMonth = totalUsers - newThisMonth;
        const totalUsersGrowthPct = usersBeforeThisMonth > 0 ? (newThisMonth / usersBeforeThisMonth) * 100 : null;

        const churnedCount = churnAgg[0]?.count?.[0]?.n || 0;
        const churnedList = (churnAgg[0]?.list || []).map((u: any) => ({
            _id: u._id,
            name: u.name || "Unnamed",
            email: u.email,
            lastSeenAt: u.lastSeen,
        }));

        // --- Listings breakdown ------------------------------------------------
        const listingsBreakdown = { live: 0, pending: 0, draft: 0, rejected: 0 };
        for (const s of statusAgg as any[]) {
            if (s._id === "pending_review") listingsBreakdown.pending = s.count;
            else if (s._id in listingsBreakdown) (listingsBreakdown as any)[s._id] = s.count;
        }

        // --- Sales / revenue -----------------------------------------------
        const totalSales = salesTotalsAgg[0]?.totalSales || 0;
        const totalRevenue = salesTotalsAgg[0]?.totalRevenue || 0;

        const months = last12MonthScaffold(now);
        const revenueByMonth = new Map<string, number>(months.map((m) => [m.key, 0]));
        for (const r of revenueTrendAgg as any[]) {
            const key = `${r._id.y}-${String(r._id.m).padStart(2, "0")}`;
            if (revenueByMonth.has(key)) revenueByMonth.set(key, r.amount);
        }
        const revenueTrend = months.map((m) => ({ month: m.key, label: m.label, amount: revenueByMonth.get(m.key) || 0 }));

        const signupsByMonth = new Map<string, number>(months.map((m) => [m.key, 0]));
        for (const s of signupsTrendAgg as any[]) {
            const key = `${s._id.y}-${String(s._id.m).padStart(2, "0")}`;
            if (signupsByMonth.has(key)) signupsByMonth.set(key, s.count);
        }
        const signupsTrend = months.map((m) => ({ month: m.key, label: m.label, count: signupsByMonth.get(m.key) || 0 }));

        // --- Category breakdown ---------------------------------------------
        const revenueByCategory = new Map<string, number>((revenueByCategoryAgg as any[]).map((c) => [c._id, c.revenue]));
        const categoryBreakdown = (liveCategoryAgg as any[]).map((c) => ({
            category: c._id,
            count: c.count,
            revenue: revenueByCategory.get(c._id) || 0,
        }));
        const bestSellingCategory =
            (revenueByCategoryAgg as any[]).length > 0
                ? { category: (revenueByCategoryAgg as any[])[0]._id, revenue: (revenueByCategoryAgg as any[])[0].revenue }
                : null;

        // --- Top prompts / sellers -------------------------------------------
        const topSellingPrompts = (topPromptsAgg as any[]).map((p) => ({
            _id: p._id,
            title: p.title,
            sellerName: p.sellerName,
            category: p.category || "Uncategorized",
            salesCount: p.salesCount,
            revenue: p.revenue,
        }));

        const promptsCountBySeller = new Map<string, number>(
            (sellerPromptCountsAgg as any[]).map((s) => [s._id?.toString(), s.promptsCount])
        );
        const sellerIds = (sellerEarningsAgg as any[]).map((s) => s._id).filter(Boolean);
        const sellerUsers = await User.find({ _id: { $in: sellerIds } }).select("name email").lean();
        const sellerById = new Map((sellerUsers as any[]).map((u) => [u._id.toString(), u]));

        const topSellers = (sellerEarningsAgg as any[]).map((s) => {
            const id = s._id?.toString();
            const user = sellerById.get(id);
            return {
                _id: id,
                name: user?.name || "Unknown",
                email: user?.email || "",
                promptsCount: promptsCountBySeller.get(id) || 0,
                salesCount: s.salesCount,
                totalEarnings: s.totalEarnings,
            };
        });

        return NextResponse.json({
            totalUsers,
            totalUsersGrowthPct,
            onlineUsers,
            churnedUsers: { count: churnedCount, list: churnedList },
            newSignups: { thisMonth: newThisMonth, lastMonth: newLastMonth },
            totalPrompts,
            listingsBreakdown,
            totalSales,
            totalRevenue,
            revenueTrend,
            signupsTrend,
            categoryBreakdown,
            bestSellingCategory,
            topSellingPrompts,
            topSellers,
        });
    } catch (error) {
        console.error("Admin Overview Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
