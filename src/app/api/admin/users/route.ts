import { NextResponse } from "next/server";
import { requireAdminApiSession } from "@/lib/adminSession";
import connectToDatabase from "@/lib/db";
import { User } from "@/lib/models/User";
import { MarketplaceListing } from "@/lib/models/MarketplaceListing";

export const dynamic = "force-dynamic";

// GET /api/admin/users — all users with computed prompt/sales counts.
export async function GET() {
    const adminSession = await requireAdminApiSession();
    if (!adminSession) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        await connectToDatabase();

        const [users, listings] = await Promise.all([
            User.find({}).sort({ createdAt: -1 }).select("name email createdAt role suspended").lean(),
            MarketplaceListing.find({}).select("sellerId sales buyers price").lean(),
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

        const result = (users as any[]).map((u) => {
            const counts = countsBySeller.get(u._id.toString()) || { prompts: 0, sales: 0 };
            return {
                _id: u._id,
                name: u.name || "Unnamed",
                email: u.email,
                joinDate: u.createdAt,
                promptsCount: counts.prompts,
                salesCount: counts.sales,
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
