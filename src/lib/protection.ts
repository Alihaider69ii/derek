"use client";

/**
 * CONTENT PROTECTION - DO NOT REMOVE
 *
 * Client-side deterrents against casual copying/scraping of prompt content,
 * plus a zero-width steganographic watermark used to trace leaked prompts
 * back to the account that copied them.
 *
 * Honesty check for whoever reads this next: none of this — nor anything
 * else running in a browser — can prevent an actual screenshot. OS/browser
 * screen capture reads the rendered framebuffer directly and has no
 * visibility into DOM properties like `user-select` or `pointer-events`.
 * What this file *does* raise the bar against is casual text
 * selection/copy/save and naive DOM scraping. A motivated person with
 * DevTools open can always defeat client-side JS; the middleware
 * (src/middleware.ts) is the layer that actually costs an attacker effort.
 */

// ── Zero-width watermarking ───────────────────────────────────────────────
// Encodes `identifier` (e.g. the viewing user's email) as a sequence of
// zero-width joiner/non-joiner characters appended invisibly to `text`.
// Copy-pasting the watermarked text anywhere carries the identifier with
// it, letting a leaked prompt be traced back to whoever copied it.
const ZW_ZERO = "‌"; // zero-width non-joiner (U+200C) -> bit 0
const ZW_ONE = "‍"; // zero-width joiner (U+200D)      -> bit 1
const ZW_DELIMITER = "​"; // zero-width space (U+200B) -> marks start/end

export function embedZeroWidthWatermark(text: string, identifier: string): string {
  if (!text || !identifier) return text;

  const bits = Array.from(identifier)
    .map((ch) => ch.charCodeAt(0).toString(2).padStart(16, "0"))
    .join("");
  const encoded = bits
    .split("")
    .map((bit) => (bit === "1" ? ZW_ONE : ZW_ZERO))
    .join("");

  return `${text}${ZW_DELIMITER}${encoded}${ZW_DELIMITER}`;
}

export function extractZeroWidthWatermark(text: string): string | null {
  const match = text.match(new RegExp(`${ZW_DELIMITER}([${ZW_ZERO}${ZW_ONE}]+)${ZW_DELIMITER}`));
  if (!match) return null;

  const bits = match[1]
    .split("")
    .map((ch) => (ch === ZW_ONE ? "1" : "0"))
    .join("");

  const chars: string[] = [];
  for (let i = 0; i + 16 <= bits.length; i += 16) {
    chars.push(String.fromCharCode(parseInt(bits.slice(i, i + 16), 2)));
  }
  return chars.join("");
}

// ── Toast ────────────────────────────────────────────────────────────────
// Deliberately implemented as a plain DOM node rather than a React toast
// provider so it keeps working from anywhere (event handlers, global
// listeners) regardless of what future component tree surrounds it.
let toastTimer: ReturnType<typeof setTimeout> | null = null;

export function showProtectionToast(message: string = "Content is protected") {
  if (typeof document === "undefined") return;

  document.getElementById("__protection_toast__")?.remove();
  if (toastTimer) clearTimeout(toastTimer);

  const el = document.createElement("div");
  el.id = "__protection_toast__";
  el.textContent = message;
  Object.assign(el.style, {
    position: "fixed",
    bottom: "24px",
    left: "50%",
    transform: "translateX(-50%)",
    background: "#1A1D24",
    color: "#F4F5F7",
    padding: "10px 20px",
    borderRadius: "999px",
    fontSize: "13px",
    fontWeight: "500",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif",
    boxShadow: "0 8px 24px rgba(0,0,0,0.28)",
    zIndex: "2147483647",
    pointerEvents: "none",
    opacity: "0",
    transition: "opacity 0.2s ease",
  });
  document.body.appendChild(el);
  requestAnimationFrame(() => {
    el.style.opacity = "1";
  });

  toastTimer = setTimeout(() => {
    el.style.opacity = "0";
    setTimeout(() => el.remove(), 200);
  }, 2200);
}

// ── DevTools heuristic ───────────────────────────────────────────────────
// Window-size-delta detection. Best-effort only: it can false-positive on
// odd viewport/zoom combos and is trivially bypassed (undocked devtools,
// a second monitor, disabling JS). It's a deterrent, not a lock.
const DEVTOOLS_SIZE_THRESHOLD = 220;
let devtoolsPollTimer: ReturnType<typeof setInterval> | null = null;

function isLikelyDevtoolsOpen(): boolean {
  const widthDelta = window.outerWidth - window.innerWidth;
  const heightDelta = window.outerHeight - window.innerHeight;
  return widthDelta > DEVTOOLS_SIZE_THRESHOLD || heightDelta > DEVTOOLS_SIZE_THRESHOLD;
}

function pollDevtools() {
  // Skip on touch devices — outer/inner size deltas are unreliable there
  // and would blur content for ordinary mobile users.
  if (!window.matchMedia?.("(pointer: fine)").matches) return;
  document.body.classList.toggle("devtools-detected", isLikelyDevtoolsOpen());
}

// ── Global keyboard shortcuts ────────────────────────────────────────────
function blockGlobalShortcuts(e: KeyboardEvent) {
  const key = e.key?.toLowerCase();
  const ctrlOrCmd = e.ctrlKey || e.metaKey;

  // F12, Ctrl/Cmd+Shift+I|J|C — DevTools panels
  if (key === "f12" || (ctrlOrCmd && e.shiftKey && ["i", "j", "c"].includes(key))) {
    e.preventDefault();
    return;
  }

  // Ctrl/Cmd+S — Save page
  if (ctrlOrCmd && key === "s") {
    e.preventDefault();
    showProtectionToast("Saving this page is disabled");
  }
}

/**
 * Wires up the site-wide (non-content-specific) protections. Call once from
 * a client component mounted in the root layout. Returns a cleanup
 * function for the (rare) case a caller needs to tear it down.
 */
export function initGlobalProtection(): () => void {
  if (typeof window === "undefined") return () => {};

  document.addEventListener("keydown", blockGlobalShortcuts);
  if (!devtoolsPollTimer) {
    devtoolsPollTimer = setInterval(pollDevtools, 1000);
  }

  return () => {
    document.removeEventListener("keydown", blockGlobalShortcuts);
    if (devtoolsPollTimer) {
      clearInterval(devtoolsPollTimer);
      devtoolsPollTimer = null;
    }
  };
}
