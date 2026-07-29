import { getServerSession, Session } from "next-auth";
import { authOptions } from "@/lib/auth";

// Server-only guard for /api/admin/* routes. Re-checks role from the
// session (populated fresh per-request by the jwt callback in auth.ts)
// rather than trusting the client, since middleware only protects pages.
export async function requireAdminSession(): Promise<Session | null> {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "admin") {
        return null;
    }
    return session;
}
