import { NextResponse } from "next/server";
import { requireAdminApiSession } from "@/lib/adminSession";
import { logAdminAction } from "@/lib/adminActivityLog";
import connectToDatabase from "@/lib/db";
import { User } from "@/lib/models/User";
import { MarketplaceListing } from "@/lib/models/MarketplaceListing";
import { Notification } from "@/lib/models/Notification";
import { AdminActivityLog } from "@/lib/models/AdminActivityLog";
import { logApiError } from "@/lib/apiErrorLog";

export const dynamic = "force-dynamic";

const SEGMENTS = ["all", "sellers", "free_plan", "pro_plan"] as const;
type Segment = (typeof SEGMENTS)[number];

async function resolveRecipientIds(segment: Segment): Promise<string[]> {
    if (segment === "sellers") {
        const ids = await MarketplaceListing.distinct("sellerId");
        return ids.map((id) => id.toString());
    }
    if (segment === "free_plan" || segment === "pro_plan") {
        // Docs created before `plan` existed have no stored value — the schema
        // default is "Free", but Mongoose doesn't backfill defaults into query
        // filters, so treat a missing field as "Free" explicitly here (same
        // legacy-doc pattern used for MarketplaceListing.status elsewhere).
        const filter = segment === "pro_plan" ? { plan: "Pro" } : { $or: [{ plan: "Free" }, { plan: { $exists: false } }] };
        const users = await User.find(filter).select("_id").lean();
        return users.map((u: any) => u._id.toString());
    }
    const users = await User.find({}).select("_id").lean();
    return users.map((u: any) => u._id.toString());
}

// GET /api/admin/broadcast — recent broadcast send history (from the audit log).
export async function GET() {
    const adminSession = await requireAdminApiSession();
    if (!adminSession) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    try {
        await connectToDatabase();
        const history = await AdminActivityLog.find({ action: "broadcast_sent" })
            .sort({ createdAt: -1 })
            .limit(20)
            .lean();
        return NextResponse.json(history.map((h: any) => ({
            _id: h._id,
            adminEmail: h.adminEmail,
            details: h.details,
            createdAt: h.createdAt,
        })));
    } catch (error) {
        console.error("Admin Broadcast History Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// POST /api/admin/broadcast — send a notification to every user in a segment.
// body: { title, message, segment: "all"|"sellers"|"free_plan"|"pro_plan" }
export async function POST(req: Request) {
    const adminSession = await requireAdminApiSession();
    if (!adminSession) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const { title, message, segment } = await req.json();
        if (!title?.trim() || !message?.trim()) {
            return NextResponse.json({ error: "Title and message are required" }, { status: 400 });
        }
        if (!SEGMENTS.includes(segment)) {
            return NextResponse.json({ error: "Invalid segment" }, { status: 400 });
        }

        await connectToDatabase();

        const recipientIds = await resolveRecipientIds(segment);
        if (recipientIds.length === 0) {
            return NextResponse.json({ error: "No users match this segment" }, { status: 400 });
        }

        await Notification.insertMany(
            recipientIds.map((userId) => ({
                userId,
                type: "broadcast",
                title: title.trim(),
                message: message.trim(),
            }))
        );

        await logAdminAction({
            admin: adminSession,
            action: "broadcast_sent",
            targetType: "Segment",
            targetId: segment,
            details: `[${segment}, ${recipientIds.length} recipients] "${title.trim()}" — ${message.trim()}`,
        });

        return NextResponse.json({ success: true, recipientCount: recipientIds.length });
    } catch (error) {
        console.error("Admin Broadcast Send Error:", error);
        await logApiError("/api/admin/broadcast", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
