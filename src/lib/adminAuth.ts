import { SignJWT, jwtVerify } from "jose";

// Fully independent from next-auth: own cookie, own secret, own JWT payload
// shape. A regular user NextAuth session and an admin session are signed
// with different secrets and stored under different cookie names, so the
// two can coexist in the same browser without interfering with each other.
export const ADMIN_SESSION_COOKIE = "admin_session";
const ADMIN_SESSION_MAX_AGE_SECONDS = 12 * 60 * 60; // 12 hours

export interface AdminSessionPayload {
    adminId: string;
    email: string;
}

function getSecretKey(): Uint8Array {
    const secret = process.env.ADMIN_SESSION_SECRET;
    if (!secret) {
        throw new Error('Invalid/Missing environment variable: "ADMIN_SESSION_SECRET"');
    }
    return new TextEncoder().encode(secret);
}

export async function createAdminSessionToken(payload: AdminSessionPayload): Promise<string> {
    return new SignJWT({ email: payload.email })
        .setProtectedHeader({ alg: "HS256" })
        .setSubject(payload.adminId)
        .setIssuedAt()
        .setExpirationTime(`${ADMIN_SESSION_MAX_AGE_SECONDS}s`)
        .sign(getSecretKey());
}

// Pure token -> payload verification, safe to call from both the Edge
// runtime (middleware, via req.cookies) and the Node runtime (route
// handlers/Server Components, via next/headers cookies()).
export async function verifyAdminSessionToken(
    token: string | undefined | null
): Promise<AdminSessionPayload | null> {
    if (!token) return null;
    try {
        const { payload } = await jwtVerify(token, getSecretKey());
        if (!payload.sub || typeof payload.email !== "string") return null;
        return { adminId: payload.sub, email: payload.email };
    } catch {
        return null;
    }
}

export function adminSessionCookieOptions() {
    return {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax" as const,
        path: "/",
        maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
    };
}
