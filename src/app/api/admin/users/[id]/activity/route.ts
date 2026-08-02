import { NextResponse } from "next/server";
import { requireAdminApiSession } from "@/lib/adminSession";
import connectToDatabase from "@/lib/db";
import { AdminActivityLog } from "@/lib/models/AdminActivityLog";

export const dynamic = "force-dynamic";

// GET /api/admin/users/[id]/activity — admin-panel actions taken on this
// user (make_admin/remove_admin/suspend/unsuspend), newest first.
export async function GET(req: Request, { params }: { params: { id: string } }) {
    const adminSession = await requireAdminApiSession();
    if (!adminSession) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        await connectToDatabase();

        const logs = await AdminActivityLog.find({ targetType: "User", targetId: params.id })
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();

        return NextResponse.json(
            (logs as any[]).map((l) => ({
                _id: l._id,
                adminEmail: l.adminEmail,
                action: l.action,
                details: l.details,
                createdAt: l.createdAt,
            }))
        );
    } catch (error) {
        console.error("Admin User Activity Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
