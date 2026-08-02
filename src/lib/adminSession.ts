import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, AdminSessionPayload, verifyAdminSessionToken } from "@/lib/adminAuth";

// Node-only (next/headers) — for Server Components and Route Handlers.
// Deliberately kept out of adminAuth.ts so middleware's edge bundle never
// pulls in next/headers.
export async function getAdminSession(): Promise<AdminSessionPayload | null> {
    const token = cookies().get(ADMIN_SESSION_COOKIE)?.value;
    return verifyAdminSessionToken(token);
}

// Route Handler guard for /api/admin/* — mirrors the shape of the old
// requireAdminSession() so call sites stay a one-line swap.
export async function requireAdminApiSession(): Promise<AdminSessionPayload | null> {
    return getAdminSession();
}
