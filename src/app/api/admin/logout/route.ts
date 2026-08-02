import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

// POST /api/admin/logout — clears the admin session cookie only. Does not
// touch the regular next-auth user session, which is a fully separate cookie.
export async function POST() {
    cookies().delete(ADMIN_SESSION_COOKIE);
    return NextResponse.json({ success: true });
}
