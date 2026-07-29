import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin";
import connectToDatabase from "@/lib/db";
import { MarketplaceListing } from "@/lib/models/MarketplaceListing";
import { User } from "@/lib/models/User";
import { handleFromName } from "@/lib/utils";

export const dynamic = "force-dynamic";

// GET /api/admin/reviews — all listings awaiting moderation.
export async function GET() {
    const session = await requireAdminSession();
    if (!session) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        await connectToDatabase();

        const listings = await MarketplaceListing.find({ status: "pending_review" })
            .sort({ createdAt: 1 })
            .lean();

        const sellerIds = Array.from(new Set((listings as any[]).map((l) => l.sellerId?.toString()).filter(Boolean)));
        const sellers = await User.find({ _id: { $in: sellerIds } }).select("name").lean();
        const sellerById = new Map(sellers.map((s: any) => [s._id.toString(), s]));

        const result = (listings as any[]).map((l) => {
            const seller = sellerById.get(l.sellerId?.toString());
            return {
                _id: l._id,
                title: l.title,
                sellerUsername: handleFromName(seller?.name, l.sellerId?.toString()),
                category: l.category || "Uncategorized",
                price: l.price,
                isFree: !!l.isFree,
                submittedAt: l.createdAt,
            };
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error("Admin Reviews Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
