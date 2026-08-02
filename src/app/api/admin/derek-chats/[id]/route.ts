import { NextResponse } from "next/server";
import { requireAdminApiSession } from "@/lib/adminSession";
import connectToDatabase from "@/lib/db";
import { Chat } from "@/lib/models/Chat";
import { User } from "@/lib/models/User";

export const dynamic = "force-dynamic";

// GET /api/admin/derek-chats/[id] — full conversation transcript.
export async function GET(req: Request, { params }: { params: { id: string } }) {
    const adminSession = await requireAdminApiSession();
    if (!adminSession) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        await connectToDatabase();

        const chat = await Chat.findById(params.id).lean();
        if (!chat) {
            return NextResponse.json({ error: "Chat not found" }, { status: 404 });
        }

        const user = (chat as any).userId
            ? await User.findById((chat as any).userId).select("name email").lean()
            : null;

        return NextResponse.json({
            _id: (chat as any)._id,
            title: (chat as any).title,
            createdAt: (chat as any).createdAt,
            updatedAt: (chat as any).updatedAt,
            userName: (user as any)?.name || "Unknown",
            userEmail: (user as any)?.email || "—",
            derekMessages: (chat as any).derekMessages || [],
            claudeMessages: (chat as any).claudeMessages || [],
        });
    } catch (error) {
        console.error("Admin Derek Chat Detail Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
