import { NextResponse } from "next/server";
import { requireAdminApiSession } from "@/lib/adminSession";
import { logAdminAction } from "@/lib/adminActivityLog";
import connectToDatabase from "@/lib/db";
import { MarketplaceListing } from "@/lib/models/MarketplaceListing";

export const dynamic = "force-dynamic";

// PATCH /api/admin/marketplace/[id] — body: { action: "toggle_featured" }.
// Approve/reject stay on /api/admin/reviews/[id] (same underlying listing,
// no need to duplicate that logic here).
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    const adminSession = await requireAdminApiSession();
    if (!adminSession) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const { action } = await req.json();
        if (action !== "toggle_featured") {
            return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }

        await connectToDatabase();

        const listing = await MarketplaceListing.findById(params.id);
        if (!listing) {
            return NextResponse.json({ error: "Listing not found" }, { status: 404 });
        }

        listing.featured = !listing.featured;
        await listing.save();

        await logAdminAction({
            admin: adminSession,
            action: listing.featured ? "listing_featured" : "listing_unfeatured",
            targetType: "MarketplaceListing",
            targetId: listing._id.toString(),
            details: listing.title,
        });

        return NextResponse.json({ success: true, featured: listing.featured });
    } catch (error) {
        console.error("Admin Marketplace Action Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
