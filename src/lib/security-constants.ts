/**
 * Shared anti-scraping configuration.
 * Imported by both src/middleware.ts (edge runtime) and any server/client
 * code that needs to stay in sync with it (e.g. the honeypot link).
 */

// Path that only a link-follower (bot/scraper) would ever request — real
// users never see it because it's visually hidden in the DOM. Any hit gets
// the requesting IP temporarily blocked.
export const HONEYPOT_PATH = "/__resource-index.json";

// Case-insensitive substrings matched against the User-Agent header.
// Deliberately limited to known scripting/automation tools so we never
// block legitimate search engine crawlers (Googlebot, Bingbot, etc.).
export const BLOCKED_UA_SUBSTRINGS = [
  "curl",
  "wget",
  "python-requests",
  "python-urllib",
  "scrapy",
  "selenium",
  "puppeteer",
  "playwright",
  "headlesschrome",
  "phantomjs",
  "axios/",
  "go-http-client",
  "libwww-perl",
  "httpclient",
];

// API routes that must only ever be called by the app's own front end.
export const PROTECTED_API_PREFIXES = ["/api/prompts", "/api/categories"];

export const RATE_LIMIT_WINDOW_MS = 60_000;
export const RATE_LIMIT_MAX_REQUESTS = 30;
export const HONEYPOT_BLOCK_MS = 24 * 60 * 60 * 1000; // 24 hours
