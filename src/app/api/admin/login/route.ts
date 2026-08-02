import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAdminCredentials } from "@/lib/adminCredentials";
import { ADMIN_SESSION_COOKIE, adminSessionCookieOptions, createAdminSessionToken } from "@/lib/adminAuth";
import { logAdminAction } from "@/lib/adminActivityLog";

export const dynamic = "force-dynamic";

function getClientIP(req: NextRequest): string {
    const forwardedFor = req.headers.get("x-forwarded-for");
    if (forwardedFor) return forwardedFor.split(",")[0].trim();
    return req.headers.get("x-real-ip") || "unknown";
}

// POST /api/admin/login — body: { email, password, password2 }.
// Both password fields are independent secrets; both must verify against
// their own stored bcrypt hash. Brute-force protection is handled by
// middleware.ts (LOGIN_RATE_LIMITED_PATHS), same mechanism as the regular
// login/register endpoints.
export async function POST(req: NextRequest) {
    try {
        const { email, password, password2 } = await req.json();
        if (!email || !password || !password2) {
            return NextResponse.json({ error: "Invalid credentials." }, { status: 400 });
        }

        const admin = await verifyAdminCredentials(email, password, password2);
        if (!admin) {
            return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
        }

        const token = await createAdminSessionToken(admin);
        cookies().set(ADMIN_SESSION_COOKIE, token, adminSessionCookieOptions());

        await logAdminAction({
            admin,
            action: "admin_login",
            ip: getClientIP(req),
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Admin Login Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
