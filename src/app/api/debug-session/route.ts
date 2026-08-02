import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// TEMPORARY DEBUG ROUTE — remove once the /admin role issue is resolved.
// GET /api/debug-session — dumps the current session's user object so we
// can see exactly what role/id/email next-auth resolved, straight from
// the browser instead of digging through server logs.
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }
    return NextResponse.json({ user: session.user });
}
