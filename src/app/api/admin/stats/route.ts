import { NextResponse } from "next/server";
import { requireAdminApiSession } from "@/lib/adminSession";
import connectToDatabase from "@/lib/db";
import { User } from "@/lib/models/User";
import { MarketplaceListing } from "@/lib/models/MarketplaceListing";
import { Report } from "@/lib/models/Report";

export const dynamic = "force-dynamic";

const ONLINE_WINDOW_MS = 5 * 60 * 1000; // presence heartbeat window

function dayKey(d: Date) {
    return d.toISOString().slice(0, 10);
}

// GET /api/admin/stats — platform-wide totals for the admin dashboard.
export async function GET() {
    const adminSession = await requireAdminApiSession();
    if (!adminSession) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        await connectToDatabase();

        const [totalUsers, livePrompts, pendingReviews, onlineUsers, recentSignups, listings, openReports] = await Promise.all([
            User.countDocuments({}),
            MarketplaceListing.countDocuments({ status: "live" }),
            MarketplaceListing.countDocuments({ status: "pending_review" }),
            User.countDocuments({ lastActiveAt: { $gte: new Date(Date.now() - ONLINE_WINDOW_MS) } }),
            User.find({}).sort({ createdAt: -1 }).limit(10).select("name email createdAt role").lean(),
            MarketplaceListing.find({}).select("sales").lean(),
            Report.countDocuments({ status: "open" }),
        ]);

        const today0 = new Date();
        today0.setHours(0, 0, 0, 0);
        const monthAgo = new Date(today0);
        monthAgo.setDate(monthAgo.getDate() - 29);

        const dayTotals = new Map<string, number>();
        for (let i = 29; i >= 0; i--) {
            const d = new Date(today0);
            d.setDate(d.getDate() - i);
            dayTotals.set(dayKey(d), 0);
        }

        let totalRevenue = 0;
        for (const l of listings as any[]) {
            for (const s of l.sales || []) {
                totalRevenue += s.price;
                const key = dayKey(new Date(s.purchasedAt));
                if (dayTotals.has(key)) dayTotals.set(key, (dayTotals.get(key) || 0) + s.price);
            }
        }

        const revenueChart = Array.from(dayTotals.entries()).map(([date, amount]) => ({
            date,
            label: new Date(date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            amount,
        }));

        return NextResponse.json({
            totalUsers,
            livePrompts,
            pendingReviews,
            openReports,
            totalRevenue,
            onlineUsers,
            recentSignups,
            revenueChart,
        });
    } catch (error) {
        console.error("Admin Stats Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
