"use client";

/* CONTENT PROTECTION - DO NOT REMOVE */

import * as React from "react";
import { initGlobalProtection } from "@/lib/protection";
import { HONEYPOT_PATH } from "@/lib/security-constants";

/**
 * Mounted once in the root layout. Wires up the site-wide JS protections
 * (see src/lib/protection.ts) and renders the honeypot link that
 * src/middleware.ts uses to identify link-following bots. The link is
 * server-rendered into the raw HTML (so non-JS scrapers see it too) but
 * visually hidden off-screen so a real user never encounters it.
 */
export function ProtectionInit() {
  React.useEffect(() => {
    return initGlobalProtection();
  }, []);

  return (
    <a
      href={HONEYPOT_PATH}
      aria-hidden="true"
      tabIndex={-1}
      rel="noreferrer"
      style={{
        position: "absolute",
        top: 0,
        left: "-9999px",
        width: "1px",
        height: "1px",
        overflow: "hidden",
        whiteSpace: "nowrap",
      }}
    >
      resource index
    </a>
  );
}
