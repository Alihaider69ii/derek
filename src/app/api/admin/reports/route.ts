import { NextRequest, NextResponse } from "next/server";
import { requireAdminApiSession } from "@/lib/adminSession";
import connectToDatabase from "@/lib/db";
import { Report } from "@/lib/models/Report";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

// GET /api/admin/reports?status=&page= — list content reports, plus the
// count of currently-open reports (for the sidebar badge / KPI card).
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

        const [listResult, openCount] = await Promise.all([
            Report.aggregate([
                { $match: match },
                { $sort: { createdAt: -1 } },
                {
                    $facet: {
                        data: [{ $skip: (page - 1) * PAGE_SIZE }, { $limit: PAGE_SIZE }],
                        total: [{ $count: "n" }],
                    },
                },
            ]),
            Report.countDocuments({ status: "open" }),
        ]);

        const result = listResult[0];
        const reports = result?.data || [];
        const total = result?.total?.[0]?.n || 0;

        return NextResponse.json({ reports, total, page, pageSize: PAGE_SIZE, openCount });
    } catch (error) {
        console.error("Admin Reports List Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
