import { NextRequest, NextResponse } from "next/server";
import { requireAdminApiSession } from "@/lib/adminSession";
import connectToDatabase from "@/lib/db";
import { Chat } from "@/lib/models/Chat";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

// GET /api/admin/derek-chats?q=&from=&to=&page=
// Lists chats that have at least one Derek message, newest first. `q`
// searches the owning user's name/email; `from`/`to` filter on updatedAt.
export async function GET(req: NextRequest) {
    const adminSession = await requireAdminApiSession();
    if (!adminSession) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        await connectToDatabase();

        const { searchParams } = new URL(req.url);
        const q = searchParams.get("q")?.trim();
        const from = searchParams.get("from");
        const to = searchParams.get("to");
        const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);

        const match: Record<string, unknown> = { "derekMessages.0": { $exists: true } };
        if (from || to) {
            const updatedAt: Record<string, Date> = {};
            if (from) updatedAt.$gte = new Date(from);
            if (to) updatedAt.$lte = new Date(to);
            match.updatedAt = updatedAt;
        }

        const pipeline: any[] = [
            { $match: match },
            { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "user" } },
            { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
        ];

        if (q) {
            pipeline.push({
                $match: {
                    $or: [
                        { "user.name": { $regex: q, $options: "i" } },
                        { "user.email": { $regex: q, $options: "i" } },
                    ],
                },
            });
        }

        pipeline.push(
            { $sort: { updatedAt: -1 } },
            {
                $facet: {
                    data: [
                        { $skip: (page - 1) * PAGE_SIZE },
                        { $limit: PAGE_SIZE },
                        {
                            $project: {
                                title: 1,
                                createdAt: 1,
                                updatedAt: 1,
                                userName: { $ifNull: ["$user.name", "Unknown"] },
                                userEmail: { $ifNull: ["$user.email", "—"] },
                                messageCount: { $size: "$derekMessages" },
                                firstMessage: { $arrayElemAt: ["$derekMessages.content", 0] },
                                lastMessage: { $arrayElemAt: ["$derekMessages.content", -1] },
                            },
                        },
                    ],
                    total: [{ $count: "n" }],
                },
            }
        );

        const [result] = await Chat.aggregate(pipeline);
        const chats = (result?.data || []).map((c: any) => ({
            _id: c._id,
            title: c.title,
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
            userName: c.userName,
            userEmail: c.userEmail,
            messageCount: c.messageCount,
            preview: (c.lastMessage || c.firstMessage || "").slice(0, 140),
        }));
        const total = result?.total?.[0]?.n || 0;

        return NextResponse.json({ chats, total, page, pageSize: PAGE_SIZE });
    } catch (error) {
        console.error("Admin Derek Chats Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
