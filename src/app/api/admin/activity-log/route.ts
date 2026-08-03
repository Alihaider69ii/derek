import { NextRequest, NextResponse } from "next/server";
import { requireAdminApiSession } from "@/lib/adminSession";
import connectToDatabase from "@/lib/db";
import { AdminActivityLog } from "@/lib/models/AdminActivityLog";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 30;

// GET /api/admin/activity-log?q=&action=&page= — the audit trail behind
// every admin-panel mutation. `q` matches admin email or target id.
export async function GET(req: NextRequest) {
    const adminSession = await requireAdminApiSession();
    if (!adminSession) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        await connectToDatabase();

        const { searchParams } = new URL(req.url);
        const q = searchParams.get("q")?.trim();
        const action = searchParams.get("action")?.trim();
        const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);

        const match: Record<string, unknown> = {};
        if (action) match.action = action;
        if (q) {
            match.$or = [
                { adminEmail: { $regex: q, $options: "i" } },
                { targetId: { $regex: q, $options: "i" } },
                { details: { $regex: q, $options: "i" } },
            ];
        }

        const [result, actions] = await Promise.all([
            AdminActivityLog.aggregate([
                { $match: match },
                { $sort: { createdAt: -1 } },
                {
                    $facet: {
                        data: [{ $skip: (page - 1) * PAGE_SIZE }, { $limit: PAGE_SIZE }],
                        total: [{ $count: "n" }],
                    },
                },
            ]),
            AdminActivityLog.distinct("action"),
        ]);

        const data = result[0];
        return NextResponse.json({
            entries: data?.data || [],
            total: data?.total?.[0]?.n || 0,
            page,
            pageSize: PAGE_SIZE,
            actions: actions.sort(),
        });
    } catch (error) {
        console.error("Admin Activity Log Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
