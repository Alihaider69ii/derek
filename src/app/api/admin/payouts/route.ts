import { NextRequest, NextResponse } from "next/server";
import { requireAdminApiSession } from "@/lib/adminSession";
import connectToDatabase from "@/lib/db";
import { Payout } from "@/lib/models/Payout";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

// GET /api/admin/payouts?status=&page= — list payout requests, plus the
// total amount currently sitting in pending status (for the KPI card).
export async function GET(req: NextRequest) {
    const adminSession = await requireAdminApiSession();
    if (!adminSession) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        await connectToDatabase();

        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status");
        const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);

        const match: Record<string, unknown> = {};
        if (status && status !== "all") match.status = status;

        const [listResult, pendingAgg] = await Promise.all([
            Payout.aggregate([
                { $match: match },
                { $sort: { createdAt: -1 } },
                {
                    $facet: {
                        data: [{ $skip: (page - 1) * PAGE_SIZE }, { $limit: PAGE_SIZE }],
                        total: [{ $count: "n" }],
                    },
                },
            ]),
            Payout.aggregate([
                { $match: { status: "pending" } },
                { $group: { _id: null, total: { $sum: "$amount" } } },
            ]),
        ]);

        const result = listResult[0];
        const payouts = result?.data || [];
        const total = result?.total?.[0]?.n || 0;
        const totalPendingAmount = pendingAgg[0]?.total || 0;

        return NextResponse.json({ payouts, total, page, pageSize: PAGE_SIZE, totalPendingAmount });
    } catch (error) {
        console.error("Admin Payouts List Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
