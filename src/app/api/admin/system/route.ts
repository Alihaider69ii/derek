import { NextRequest, NextResponse } from "next/server";
import { requireAdminApiSession } from "@/lib/adminSession";
import connectToDatabase from "@/lib/db";
import { ApiErrorLog } from "@/lib/models/ApiErrorLog";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

// GET /api/admin/system?page= — DB health/latency, process uptime, and a
// paginated recent-errors log (see logApiError for which routes report here).
export async function GET(req: NextRequest) {
    const adminSession = await requireAdminApiSession();
    if (!adminSession) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);

        const dbStart = Date.now();
        let dbStatus: "ok" | "error" = "ok";
        let dbLatencyMs = 0;
        try {
            await connectToDatabase();
            if (!mongoose.connection.db) throw new Error("No active DB connection");
            await mongoose.connection.db.admin().ping();
            dbLatencyMs = Date.now() - dbStart;
        } catch {
            dbStatus = "error";
            dbLatencyMs = Date.now() - dbStart;
        }

        const [errorsResult, errorsToday] = await Promise.all([
            ApiErrorLog.aggregate([
                { $sort: { createdAt: -1 } },
                {
                    $facet: {
                        data: [{ $skip: (page - 1) * PAGE_SIZE }, { $limit: PAGE_SIZE }],
                        total: [{ $count: "n" }],
                    },
                },
            ]),
            ApiErrorLog.countDocuments({ createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }),
        ]);

        const result = errorsResult[0];

        return NextResponse.json({
            health: {
                status: dbStatus === "ok" ? "operational" : "degraded",
                dbStatus,
                dbLatencyMs,
                processUptimeSec: Math.round(process.uptime()),
                nodeVersion: process.version,
                env: process.env.NODE_ENV,
                checkedAt: new Date().toISOString(),
            },
            errorsToday,
            errors: result?.data || [],
            total: result?.total?.[0]?.n || 0,
            page,
            pageSize: PAGE_SIZE,
        });
    } catch (error) {
        console.error("Admin System Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
