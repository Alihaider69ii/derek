import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import { User } from "@/lib/models/User";

export const dynamic = 'force-dynamic';

// Lifetime free Derek uses for a Free-plan account. Kept in sync with the
// same constant in /api/chat/derek/route.ts (server-side enforcement lives
// there; this route just reports the count for the "X free uses left" UI).
const FREE_LIMIT = 5;

// GET the current user's Derek usage — used to render "X free uses left" in
// the chat UI. Guests have no Mongo doc to track, so the client falls back
// to a local counter for them (same convention used elsewhere in the app).
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        const userId = (session?.user as any)?.id || null;
        if (!userId) {
            return NextResponse.json({ authenticated: false });
        }

        await connectToDatabase();
        const userDoc = await User.findById(userId).select("plan trialUses").lean();
        const plan = (userDoc?.plan as "Free" | "Pro") || "Free";
        const trialUses = userDoc?.trialUses ?? 0;
        const usesLeft = plan === "Pro" ? null : Math.max(0, FREE_LIMIT - trialUses);

        return NextResponse.json({ authenticated: true, plan, usesLeft, limit: FREE_LIMIT });
    } catch (error) {
        console.error("Derek Usage Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
