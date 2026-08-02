import { NextResponse } from "next/server";
import { requireAdminApiSession } from "@/lib/adminSession";
import connectToDatabase from "@/lib/db";
import { User } from "@/lib/models/User";
import { MarketplaceListing } from "@/lib/models/MarketplaceListing";

export const dynamic = "force-dynamic";

function dayKey(d: Date) {
    return d.toISOString().slice(0, 10);
}

// GET /api/admin/analytics — signup trend + live-listing category breakdown.
export async function GET() {
    const adminSession = await requireAdminApiSession();
    if (!adminSession) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        await connectToDatabase();

        const [users, listings] = await Promise.all([
            User.find({}).select("createdAt").lean(),
            MarketplaceListing.find({ status: "live" }).select("category").lean(),
        ]);

        const today0 = new Date();
        today0.setHours(0, 0, 0, 0);

        const signupsByDay = new Map<string, number>();
        for (let i = 29; i >= 0; i--) {
            const d = new Date(today0);
            d.setDate(d.getDate() - i);
            signupsByDay.set(dayKey(d), 0);
        }
        for (const u of users as any[]) {
            const key = dayKey(new Date(u.createdAt));
            if (signupsByDay.has(key)) signupsByDay.set(key, (signupsByDay.get(key) || 0) + 1);
        }
        const signupsChart = Array.from(signupsByDay.entries()).map(([date, count]) => ({
            date,
            label: new Date(date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            count,
        }));

        const categoryCounts = new Map<string, number>();
        for (const l of listings as any[]) {
            const category = l.category || "Uncategorized";
            categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
        }
        const categoryBreakdown = Array.from(categoryCounts.entries())
            .map(([category, count]) => ({ category, count }))
            .sort((a, b) => b.count - a.count);

        return NextResponse.json({ signupsChart, categoryBreakdown });
    } catch (error) {
        console.error("Admin Analytics Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
