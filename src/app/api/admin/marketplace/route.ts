import { NextRequest, NextResponse } from "next/server";
import { requireAdminApiSession } from "@/lib/adminSession";
import connectToDatabase from "@/lib/db";
import { MarketplaceListing } from "@/lib/models/MarketplaceListing";

export const dynamic = "force-dynamic";

// GET /api/admin/marketplace?status=&q= — every listing regardless of
// status (unlike /api/admin/reviews, which is pending-only), with computed
// sales count and revenue per listing.
export async function GET(req: NextRequest) {
    const adminSession = await requireAdminApiSession();
    if (!adminSession) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        await connectToDatabase();

        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status");
        const q = searchParams.get("q")?.trim();

        const filter: Record<string, unknown> = {};
        if (status && status !== "all" && ["draft", "pending_review", "live", "rejected"].includes(status)) {
            filter.status = status;
        }
        if (q) {
            filter.$or = [
                { title: { $regex: q, $options: "i" } },
                { sellerName: { $regex: q, $options: "i" } },
            ];
        }

        const listings = await MarketplaceListing.find(filter).sort({ createdAt: -1 }).lean();

        const result = (listings as any[]).map((l) => {
            const salesCount = Array.isArray(l.sales) ? l.sales.length : 0;
            const revenue = Array.isArray(l.sales) ? l.sales.reduce((sum: number, s: any) => sum + (s.price || 0), 0) : 0;
            return {
                _id: l._id,
                title: l.title,
                sellerName: l.sellerName,
                sellerId: l.sellerId,
                category: l.category || "Uncategorized",
                price: l.price,
                isFree: !!l.isFree,
                status: l.status,
                featured: !!l.featured,
                salesCount,
                revenue,
                createdAt: l.createdAt,
            };
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error("Admin Marketplace List Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
