import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import { Favourite } from "@/lib/models/Favourite";
import { MarketplaceListing } from "@/lib/models/MarketplaceListing";

export const dynamic = 'force-dynamic';

// GET the user's recent Derek-built prompts for the chat screen's right
// panel. Every structured ("Job 1") Derek reply is auto-saved as a
// Favourite (source: "generated") — see /api/chat/derek. Status is derived
// by checking whether a MarketplaceListing was ever created from that
// favourite (via ListingWizard's "List for sale" prefill flow):
//   - no listing found                -> "active" (built, not submitted)
//   - listing status "draft"/"rejected" -> "draft" (needs finishing/fixing)
//   - listing status "pending_review"/"live" -> "listed"
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        await connectToDatabase();
        const userId = (session.user as any).id;

        const builds = await Favourite.find({ userId, source: "generated" })
            .sort({ createdAt: -1 })
            .limit(12)
            .lean();

        if (builds.length === 0) return NextResponse.json([]);

        const listings = await MarketplaceListing.find({
            favouriteId: { $in: builds.map((b) => b._id) },
        }).select("favouriteId status").lean();
        const listingByFavId = new Map(listings.map((l) => [l.favouriteId.toString(), l.status]));

        const result = builds.map((b) => {
            const listingStatus = listingByFavId.get(b._id.toString());
            let status: "active" | "listed" | "draft" = "active";
            if (listingStatus === "live" || listingStatus === "pending_review") status = "listed";
            else if (listingStatus === "draft" || listingStatus === "rejected") status = "draft";
            return {
                _id: b._id,
                title: b.title,
                promptText: b.promptText,
                status,
                createdAt: b.createdAt,
            };
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error("Derek Builds Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
