import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import { MarketplaceListing } from "@/lib/models/MarketplaceListing";
import { Report } from "@/lib/models/Report";

export const dynamic = "force-dynamic";

const ALLOWED_REASONS = ["spam", "inappropriate", "copyright", "misleading", "other"];

// POST /api/marketplace/[id]/report — flag a listing for admin review.
export async function POST(request: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
        const body = await request.json();
        const reason = body?.reason;
        const details = typeof body?.details === "string" ? body.details.trim().slice(0, 500) : "";
        if (!ALLOWED_REASONS.includes(reason)) {
            return NextResponse.json({ error: "Invalid reason" }, { status: 400 });
        }

        await connectToDatabase();

        const listing = await MarketplaceListing.findById(params.id).select("title").lean();
        if (!listing) {
            return NextResponse.json({ error: "Listing not found" }, { status: 404 });
        }

        const reporterId = (session.user as any).id;
        const existing = await Report.findOne({ listingId: params.id, reporterId, status: "open" });
        if (existing) {
            return NextResponse.json({ error: "You've already reported this prompt — our team is reviewing it." }, { status: 409 });
        }

        await Report.create({
            listingId: params.id,
            listingTitle: (listing as any).title,
            reporterId,
            reporterName: session.user.name || session.user.email || "Anonymous",
            reason,
            details,
        });

        return NextResponse.json({ success: true }, { status: 201 });
    } catch (error) {
        console.error("Report Listing Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
