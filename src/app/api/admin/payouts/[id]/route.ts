import { NextResponse } from "next/server";
import { requireAdminApiSession } from "@/lib/adminSession";
import { logAdminAction } from "@/lib/adminActivityLog";
import connectToDatabase from "@/lib/db";
import { Payout } from "@/lib/models/Payout";
import { Notification } from "@/lib/models/Notification";

export const dynamic = "force-dynamic";

const ACTION_TO_STATUS: Record<string, string> = {
    approve: "approved",
    reject: "rejected",
    mark_paid: "paid",
};

// PATCH /api/admin/payouts/[id] — approve, reject, or mark a withdrawal
// request as paid. body: { action: "approve"|"reject"|"mark_paid", note?: string }
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    const adminSession = await requireAdminApiSession();
    if (!adminSession) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const { action, note } = await req.json();
        const newStatus = ACTION_TO_STATUS[action];
        if (!newStatus) {
            return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }
        if (action === "reject" && !note?.trim()) {
            return NextResponse.json({ error: "A reason is required to reject a payout" }, { status: 400 });
        }

        await connectToDatabase();

        const payout = await Payout.findById(params.id);
        if (!payout) {
            return NextResponse.json({ error: "Payout request not found" }, { status: 404 });
        }

        payout.status = newStatus as any;
        payout.processedAt = new Date();
        payout.processedBy = adminSession.email;
        if (note?.trim()) payout.adminNote = note.trim();
        await payout.save();

        const notifByAction: Record<string, { type: string; title: string; message: string }> = {
            approve: {
                type: "payout_approved",
                title: "Withdrawal approved",
                message: `Your request for ₹${payout.amount} has been approved and is being processed.`,
            },
            reject: {
                type: "payout_rejected",
                title: "Withdrawal rejected",
                message: `Your request for ₹${payout.amount} was rejected.`,
            },
            mark_paid: {
                type: "payout_paid",
                title: "Withdrawal paid",
                message: `₹${payout.amount} has been sent to you.`,
            },
        };
        const n = notifByAction[action];
        await Notification.create({
            userId: payout.sellerId,
            type: n.type,
            title: n.title,
            message: n.message,
            reason: action === "reject" ? note.trim() : undefined,
        });

        await logAdminAction({
            admin: adminSession,
            action: `payout_${action}`,
            targetType: "Payout",
            targetId: payout._id.toString(),
            details: `₹${payout.amount} — ${payout.sellerEmail || payout.sellerName || payout.sellerId}${note?.trim() ? ` — ${note.trim()}` : ""}`,
        });

        return NextResponse.json({ success: true, status: payout.status });
    } catch (error) {
        console.error("Admin Payout Action Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
