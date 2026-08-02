import { NextRequest, NextResponse } from "next/server";
import { requireAdminApiSession } from "@/lib/adminSession";
import connectToDatabase from "@/lib/db";
import { User } from "@/lib/models/User";
import { MarketplaceListing } from "@/lib/models/MarketplaceListing";

export const dynamic = "force-dynamic";

// GET /api/admin/users?q=&role=&status= — all users with computed
// prompt/sales/spend counts. q searches name/email; role is "user"|"admin";
// status is "active"|"suspended".
export async function GET(req: NextRequest) {
    const adminSession = await requireAdminApiSession();
    if (!adminSession) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        await connectToDatabase();

        const { searchParams } = new URL(req.url);
        const q = searchParams.get("q")?.trim();
        const role = searchParams.get("role");
        const status = searchParams.get("status");

        const filter: Record<string, unknown> = {};
        if (q) {
            filter.$or = [
                { name: { $regex: q, $options: "i" } },
                { email: { $regex: q, $options: "i" } },
            ];
        }
        if (role === "user" || role === "admin") filter.role = role;
        if (status === "suspended") filter.suspended = true;
        else if (status === "active") filter.suspended = { $ne: true };

        const [users, listings, spendAgg] = await Promise.all([
            User.find(filter).sort({ createdAt: -1 }).select("name email createdAt role suspended lastActiveAt").lean(),
            MarketplaceListing.find({}).select("sellerId sales buyers price").lean(),
            MarketplaceListing.aggregate([
                { $unwind: "$sales" },
                { $group: { _id: "$sales.buyerId", totalSpent: { $sum: "$sales.price" } } },
            ]),
        ]);

        const countsBySeller = new Map<string, { prompts: number; sales: number }>();
        for (const l of listings as any[]) {
            const key = l.sellerId?.toString();
            if (!key) continue;
            const entry = countsBySeller.get(key) || { prompts: 0, sales: 0 };
            entry.prompts += 1;
            entry.sales += Array.isArray(l.sales) && l.sales.length > 0 ? l.sales.length : (l.buyers?.length || 0);
            countsBySeller.set(key, entry);
        }

        const spentByBuyer = new Map<string, number>(
            (spendAgg as any[]).map((s) => [s._id?.toString(), s.totalSpent])
        );

        const result = (users as any[]).map((u) => {
            const counts = countsBySeller.get(u._id.toString()) || { prompts: 0, sales: 0 };
            return {
                _id: u._id,
                name: u.name || "Unnamed",
                email: u.email,
                joinDate: u.createdAt,
                lastActiveAt: u.lastActiveAt || null,
                promptsCount: counts.prompts,
                salesCount: counts.sales,
                totalSpent: spentByBuyer.get(u._id.toString()) || 0,
                role: u.role || "user",
                suspended: !!u.suspended,
            };
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error("Admin Users Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
