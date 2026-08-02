import { NextResponse } from "next/server";
import { requireAdminApiSession } from "@/lib/adminSession";
import connectToDatabase from "@/lib/db";
import { AiUsageLog } from "@/lib/models/AiUsageLog";

export const dynamic = "force-dynamic";

// GET /api/admin/ai-usage — API call volume and token usage for the AI
// chat features (Derek + Claude), broken down by feature, model, and user.
export async function GET() {
    const adminSession = await requireAdminApiSession();
    if (!adminSession) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        await connectToDatabase();

        const [totalsAgg, byFeature, byModel, byUser, recent] = await Promise.all([
            AiUsageLog.aggregate([
                {
                    $group: {
                        _id: null,
                        totalCalls: { $sum: 1 },
                        totalInputTokens: { $sum: "$inputTokens" },
                        totalOutputTokens: { $sum: "$outputTokens" },
                        successCount: { $sum: { $cond: ["$success", 1, 0] } },
                        errorCount: { $sum: { $cond: ["$success", 0, 1] } },
                    },
                },
            ]),
            AiUsageLog.aggregate([
                { $group: { _id: "$feature", calls: { $sum: 1 }, inputTokens: { $sum: "$inputTokens" }, outputTokens: { $sum: "$outputTokens" } } },
                { $sort: { calls: -1 } },
            ]),
            AiUsageLog.aggregate([
                { $group: { _id: "$aiModel", calls: { $sum: 1 }, inputTokens: { $sum: "$inputTokens" }, outputTokens: { $sum: "$outputTokens" } } },
                { $sort: { calls: -1 } },
            ]),
            AiUsageLog.aggregate([
                {
                    $group: {
                        _id: { $ifNull: ["$userEmail", "Guest / not signed in"] },
                        calls: { $sum: 1 },
                        inputTokens: { $sum: "$inputTokens" },
                        outputTokens: { $sum: "$outputTokens" },
                    },
                },
                { $sort: { calls: -1 } },
                { $limit: 25 },
            ]),
            AiUsageLog.find({})
                .sort({ createdAt: -1 })
                .limit(25)
                .select("userEmail feature aiModel inputTokens outputTokens success createdAt")
                .lean(),
        ]);

        const totals = totalsAgg[0] || { totalCalls: 0, totalInputTokens: 0, totalOutputTokens: 0, successCount: 0, errorCount: 0 };

        return NextResponse.json({
            totalCalls: totals.totalCalls,
            totalInputTokens: totals.totalInputTokens,
            totalOutputTokens: totals.totalOutputTokens,
            successCount: totals.successCount,
            errorCount: totals.errorCount,
            byFeature: (byFeature as any[]).map((f) => ({ feature: f._id, calls: f.calls, inputTokens: f.inputTokens, outputTokens: f.outputTokens })),
            byModel: (byModel as any[]).map((m) => ({ model: m._id, calls: m.calls, inputTokens: m.inputTokens, outputTokens: m.outputTokens })),
            byUser: (byUser as any[]).map((u) => ({ userEmail: u._id, calls: u.calls, inputTokens: u.inputTokens, outputTokens: u.outputTokens })),
            recent: (recent as any[]).map((r) => ({
                userEmail: r.userEmail || "Guest",
                feature: r.feature,
                model: r.aiModel,
                inputTokens: r.inputTokens,
                outputTokens: r.outputTokens,
                success: r.success,
                createdAt: r.createdAt,
            })),
        });
    } catch (error) {
        console.error("Admin AI Usage Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
