import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import { User } from "@/lib/models/User";

export const dynamic = "force-dynamic";

// POST /api/heartbeat — updates the logged-in user's lastActiveAt, called
// periodically by the client while a session is active. Backs the "real-time
// online users" count on the admin dashboard (see /api/admin/stats).
export async function POST() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        await connectToDatabase();
        await User.findByIdAndUpdate((session.user as any).id, { lastActiveAt: new Date() });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Heartbeat Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
