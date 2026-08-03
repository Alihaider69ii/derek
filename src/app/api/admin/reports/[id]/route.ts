import { NextResponse } from "next/server";
import { requireAdminApiSession } from "@/lib/adminSession";
import { logAdminAction } from "@/lib/adminActivityLog";
import connectToDatabase from "@/lib/db";
import { Report } from "@/lib/models/Report";
import { MarketplaceListing } from "@/lib/models/MarketplaceListing";
import { Notification } from "@/lib/models/Notification";

export const dynamic = "force-dynamic";

// PATCH /api/admin/reports/[id] — dismiss (keep listing live) or action
// (remove the listing from the marketplace). body: { action: "dismiss"|"remove_listing" }
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    const adminSession = await requireAdminApiSession();
    if (!adminSession) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const { action } = await req.json();
        if (action !== "dismiss" && action !== "remove_listing") {
            return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }

        await connectToDatabase();

        const report = await Report.findById(params.id);
        if (!report) {
            return NextResponse.json({ error: "Report not found" }, { status: 404 });
        }

        report.status = action === "dismiss" ? "dismissed" : "actioned";
        report.reviewedAt = new Date();
        report.reviewedBy = adminSession.email;
        await report.save();

        if (action === "remove_listing") {
            const listing = await MarketplaceListing.findById(report.listingId);
            if (listing && listing.status !== "rejected") {
                listing.status = "rejected";
                await listing.save();
                await Notification.create({
                    userId: listing.sellerId,
                    type: "report_actioned",
                    title: "Your prompt was removed",
                    message: `"${listing.title}" was removed from the marketplace after a content report.`,
                    listingId: listing._id,
                    reason: `Reported for: ${report.reason}`,
                });
            }
            // Any other open reports on the same listing are now moot.
            await Report.updateMany(
                { listingId: report.listingId, status: "open" },
                { $set: { status: "actioned", reviewedAt: new Date(), reviewedBy: adminSession.email } }
            );
        }

        await logAdminAction({
            admin: adminSession,
            action: action === "dismiss" ? "report_dismiss" : "report_remove_listing",
            targetType: "Report",
            targetId: report._id.toString(),
            details: `${report.listingTitle} — ${report.reason}`,
        });

        return NextResponse.json({ success: true, status: report.status });
    } catch (error) {
        console.error("Admin Report Action Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
