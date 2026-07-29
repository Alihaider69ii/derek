import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import { Notification } from "@/lib/models/Notification";

export const dynamic = "force-dynamic";

// GET /api/notifications — the logged-in user's recent notifications + unread count.
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        await connectToDatabase();
        const userId = (session.user as any).id;

        const [notifications, unreadCount] = await Promise.all([
            Notification.find({ userId }).sort({ createdAt: -1 }).limit(20).lean(),
            Notification.countDocuments({ userId, read: false }),
        ]);

        return NextResponse.json({ notifications, unreadCount });
    } catch (error) {
        console.error("Notifications Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// PATCH /api/notifications — mark all of the logged-in user's notifications as read.
export async function PATCH() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        await connectToDatabase();
        const userId = (session.user as any).id;

        await Notification.updateMany({ userId, read: false }, { $set: { read: true } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Notifications Mark-Read Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
