import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectToDatabase from "@/lib/db";
import { Visit } from "@/lib/models/Visit";

export const dynamic = "force-dynamic";

const VISITOR_ID_COOKIE = "emp_vid";
const SESSION_PING_COOKIE = "emp_visit_ping";
const VISITOR_ID_MAX_AGE = 60 * 60 * 24 * 365; // 1 year
const SESSION_PING_MAX_AGE = 60 * 30; // 30 minutes — dedupes repeat visits within a session

function randomId() {
    return Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, "0")).join("");
}

// POST /api/track/visit — anonymous, cookie-deduped visit counter. Fire-and-
// forget from the client; never blocks or throws on the caller's behalf.
export async function POST() {
    try {
        const jar = cookies();
        let visitorId = jar.get(VISITOR_ID_COOKIE)?.value;
        if (!visitorId) visitorId = randomId();

        const alreadyPinged = !!jar.get(SESSION_PING_COOKIE)?.value;
        if (!alreadyPinged) {
            await connectToDatabase();
            await Visit.create({ visitorId });
        }

        const res = NextResponse.json({ ok: true });
        res.cookies.set(VISITOR_ID_COOKIE, visitorId, { maxAge: VISITOR_ID_MAX_AGE, httpOnly: true, sameSite: "lax" });
        res.cookies.set(SESSION_PING_COOKIE, "1", { maxAge: SESSION_PING_MAX_AGE, httpOnly: true, sameSite: "lax" });
        return res;
    } catch (error) {
        console.error("Track Visit Error:", error);
        return NextResponse.json({ ok: false }, { status: 200 });
    }
}
