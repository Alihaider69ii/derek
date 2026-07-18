import { NextRequest, NextResponse } from "next/server";
import {
  HONEYPOT_PATH,
  BLOCKED_UA_SUBSTRINGS,
  PROTECTED_API_PREFIXES,
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX_REQUESTS,
  HONEYPOT_BLOCK_MS,
} from "@/lib/security-constants";

/**
 * CONTENT PROTECTION - DO NOT REMOVE
 *
 * Anti-scraping edge middleware. Runs on every request (see `config.matcher`
 * below) before it reaches a route handler or page.
 *
 * IMPORTANT LIMITATION — read before relying on this in production:
 * Next.js middleware runs on the Edge Runtime. The `Map`s below live in the
 * memory of a single edge isolate. They are NOT shared across regions,
 * across multiple concurrent isolates, or guaranteed to survive a cold
 * start/redeploy. That makes the rate limiter and the honeypot IP-block
 * list best-effort: fine for deterring a casual script hitting a
 * single-region deployment, but not a real distributed rate limiter. If
 * this needs to hold up at scale or across multiple regions, back it with
 * Upstash Redis / Vercel KV (swap the Map lookups below for calls to that
 * store — the rest of the logic doesn't need to change).
 */

const requestLog = new Map<string, number[]>();
const blockedIPs = new Map<string, number>();

function getClientIP(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  const realIP = req.headers.get("x-real-ip");
  if (realIP) return realIP;
  return "unknown";
}

function isBlockedUserAgent(ua: string): boolean {
  const lower = ua.toLowerCase();
  return BLOCKED_UA_SUBSTRINGS.some((s) => lower.includes(s));
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (requestLog.get(ip) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  timestamps.push(now);
  requestLog.set(ip, timestamps);
  return timestamps.length > RATE_LIMIT_MAX_REQUESTS;
}

function blockIPForHoneypot(ip: string) {
  blockedIPs.set(ip, Date.now() + HONEYPOT_BLOCK_MS);
}

function isCurrentlyBlocked(ip: string): boolean {
  const until = blockedIPs.get(ip);
  if (!until) return false;
  if (Date.now() > until) {
    blockedIPs.delete(ip);
    return false;
  }
  return true;
}

// Cheap periodic cleanup so the maps don't grow unbounded on a long-lived isolate.
let lastSweep = Date.now();
function sweepStaleEntries() {
  const now = Date.now();
  if (now - lastSweep < RATE_LIMIT_WINDOW_MS) return;
  lastSweep = now;
  requestLog.forEach((timestamps, ip) => {
    const fresh = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
    if (fresh.length === 0) requestLog.delete(ip);
    else requestLog.set(ip, fresh);
  });
  blockedIPs.forEach((until, ip) => {
    if (now > until) blockedIPs.delete(ip);
  });
}

function isSameHost(referer: string, host: string | null): boolean {
  if (!host) return false;
  try {
    return new URL(referer).host === host;
  } catch {
    return false;
  }
}

export function middleware(req: NextRequest) {
  sweepStaleEntries();

  const { pathname } = req.nextUrl;
  const ip = getClientIP(req);
  const ua = req.headers.get("user-agent") || "";

  // 1. Repeat offender — already tripped the honeypot within the last 24h.
  if (isCurrentlyBlocked(ip)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // 2. Honeypot hit. The link only exists in the raw HTML, hidden off-screen
  // (see src/components/shared/ProtectionInit.tsx) — a real user never
  // triggers a navigation to it, only something blindly following every
  // <a href> it finds.
  if (pathname === HONEYPOT_PATH) {
    blockIPForHoneypot(ip);
    return new NextResponse("Forbidden", { status: 403 });
  }

  // 3. No User-Agent at all.
  if (!ua.trim()) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // 4. Known scripting/automation tools. Deliberately a narrow, explicit
  // list (not a generic "bot|crawler" match) so we never block legitimate
  // search engine crawlers.
  if (isBlockedUserAgent(ua)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // 5. Rate limiting. Skip Next.js's own background link-prefetch requests
  // so they don't silently eat into a real user's quota and cause
  // unrelated navigations to start 429-ing.
  const isPrefetch =
    req.headers.get("next-router-prefetch") === "1" || req.headers.get("purpose") === "prefetch";
  if (!isPrefetch && isRateLimited(ip)) {
    return new NextResponse("Too Many Requests", {
      status: 429,
      headers: { "Retry-After": "60" },
    });
  }

  // 6. Lock the data APIs down to same-origin browser requests. Scoped to
  // these two prefixes (rather than site-wide) so a missing/blocked
  // Referer or fingerprint header on some unrelated request never breaks
  // page navigation for real visitors.
  const isProtectedApi = PROTECTED_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  if (isProtectedApi) {
    const referer = req.headers.get("referer");
    const host = req.headers.get("host");
    const secFetchSite = req.headers.get("sec-fetch-site");

    const refererSameOrigin = referer ? isSameHost(referer, host) : false;
    const fetchSameOrigin = secFetchSite === "same-origin" || secFetchSite === "same-site";

    if (!refererSameOrigin && !fetchSameOrigin) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Browser fingerprint headers: real browsers always attach at least one
    // of these to same-origin fetch/XHR calls; bare HTTP clients don't set
    // them unless deliberately spoofed.
    const hasFingerprint = req.headers.get("sec-fetch-mode") || req.headers.get("accept-language");
    if (!hasFingerprint) {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};
