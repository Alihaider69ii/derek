import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin";
import connectToDatabase from "@/lib/db";
import { MarketplaceListing } from "@/lib/models/MarketplaceListing";
import { Notification } from "@/lib/models/Notification";

export const dynamic = "force-dynamic";

// PATCH /api/admin/reviews/[id] — approve or reject a pending_review listing.
// body: { action: "approve" | "reject", reason?: string }
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    const session = await requireAdminSession();
    if (!session) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const { action, reason } = await req.json();
        if (action !== "approve" && action !== "reject") {
            return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }
        if (action === "reject" && !reason?.trim()) {
            return NextResponse.json({ error: "Rejection reason is required" }, { status: 400 });
        }

        await connectToDatabase();

        const listing = await MarketplaceListing.findById(params.id);
        if (!listing) {
            return NextResponse.json({ error: "Listing not found" }, { status: 404 });
        }

        if (action === "approve") {
            listing.status = "live";
            await listing.save();
            await Notification.create({
                userId: listing.sellerId,
                type: "prompt_approved",
                title: "Your prompt was approved",
                message: `"${listing.title}" is now live on the marketplace.`,
                listingId: listing._id,
            });
        } else {
            listing.status = "rejected";
            await listing.save();
            await Notification.create({
                userId: listing.sellerId,
                type: "prompt_rejected",
                title: "Your prompt was rejected",
                message: `"${listing.title}" was not approved for the marketplace.`,
                listingId: listing._id,
                reason: reason.trim(),
            });
        }

        return NextResponse.json({ success: true, status: listing.status });
    } catch (error) {
        console.error("Admin Review Action Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
