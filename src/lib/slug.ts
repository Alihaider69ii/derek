import { User } from "@/lib/models/User";
import { MarketplaceListing } from "@/lib/models/MarketplaceListing";

// Top-level route segments that must never be claimed by a generated (or
// user-chosen) username or prompt slug, since both now live at the site
// root — e.g. easemyprompt.ai/hussainshah, easemyprompt.ai/cold-email-seq.
export const RESERVED_HANDLES = new Set([
    "admin", "api", "blog", "forgot-password", "login", "signup",
    "chat", "favourites", "marketplace", "profile", "projects",
    "prompt-bank", "prompts", "dashboard", "settings",
    "_next", "favicon.ico", "robots.txt", "sitemap.xml",
]);

export function slugify(input: string): string {
    return (input || "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 60);
}

export function isValidUsernameFormat(username: string): boolean {
    return /^[a-z0-9_]{3,20}$/.test(username);
}

function randomSuffix(length = 4): string {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let out = "";
    for (let i = 0; i < length; i++) out += chars[Math.floor(Math.random() * chars.length)];
    return out;
}

// Usernames and listing slugs share the same root-level URL namespace, so a
// candidate must be checked against both collections (plus reserved routes)
// before it can be considered free.
async function isHandleTaken(
    candidate: string,
    opts?: { excludeUserId?: string; excludeListingId?: string }
): Promise<boolean> {
    if (RESERVED_HANDLES.has(candidate)) return true;
    const [userMatch, listingMatch] = await Promise.all([
        User.exists({
            username: candidate,
            ...(opts?.excludeUserId ? { _id: { $ne: opts.excludeUserId } } : {}),
        }),
        MarketplaceListing.exists({
            slug: candidate,
            ...(opts?.excludeListingId ? { _id: { $ne: opts.excludeListingId } } : {}),
        }),
    ]);
    return !!userMatch || !!listingMatch;
}

export async function isHandleAvailable(
    candidate: string,
    opts?: { excludeUserId?: string; excludeListingId?: string }
): Promise<boolean> {
    return !(await isHandleTaken(candidate, opts));
}

// Generates a unique, URL-safe username from a display name, e.g.
// "Hussain Shah" -> "hussainshah", falling back to "hussainshah2" etc. on
// collision, per the Instagram-style /[username] profile URLs.
export async function generateUniqueUsername(
    name?: string,
    opts?: { excludeUserId?: string }
): Promise<string> {
    const base = slugify(name || "").replace(/-/g, "") || "user";
    let candidate = base;
    let n = 2;
    while (await isHandleTaken(candidate, opts)) {
        candidate = `${base}${n}`;
        n++;
    }
    return candidate;
}

// Generates a unique, URL-safe slug from a prompt title, appending a short
// random suffix on collision, e.g. "cold-email-sequence-saas-x7k2".
export async function generateUniqueSlug(
    title: string,
    opts?: { excludeListingId?: string }
): Promise<string> {
    const base = slugify(title) || "prompt";
    let candidate = base;
    let attempts = 0;
    while (await isHandleTaken(candidate, opts)) {
        candidate = `${base}-${randomSuffix(attempts > 6 ? 6 : 4)}`;
        attempts++;
    }
    return candidate;
}

// Lazily backfills a username for users created before this field existed.
// Called wherever a user doc is read for public display so old accounts
// keep working under the new /[username] URLs without a separate migration.
export async function ensureUserUsername(user: { _id: any; username?: string; name?: string }): Promise<string> {
    if (user.username) return user.username;
    const username = await generateUniqueUsername(user.name, { excludeUserId: user._id.toString() });
    await User.updateOne({ _id: user._id }, { $set: { username } });
    return username;
}

// Lazily backfills a slug for listings created before this field existed.
export async function ensureListingSlug(listing: { _id: any; slug?: string; title: string }): Promise<string> {
    if (listing.slug) return listing.slug;
    const slug = await generateUniqueSlug(listing.title, { excludeListingId: listing._id.toString() });
    await MarketplaceListing.updateOne({ _id: listing._id }, { $set: { slug } });
    return slug;
}
