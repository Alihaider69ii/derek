"use client";

/* CONTENT PROTECTION - DO NOT REMOVE */

import * as React from "react";
import { useSession } from "next-auth/react";
import { embedZeroWidthWatermark, showProtectionToast } from "@/lib/protection";

interface ProtectedContentProps {
  /** Raw prompt text to display (e.g. a Prompt document's `promptText` field). */
  text: string;
  /** Element the visible text renders as. Defaults to "div". */
  as?: "div" | "span" | "p";
  /** Classes applied to the text node itself (fonts, whitespace, colors, etc). */
  className?: string;
  /** Classes applied to the outer wrapper (layout: width, borders, padding). */
  wrapperClassName?: string;
  /** Skip the zero-width watermark (rarely needed — leave enabled by default). */
  disableWatermark?: boolean;
}

/**
 * Drop-in replacement for rendering raw prompt text. Wrap any place a
 * `promptText` field is shown to a user with this component instead of
 * interpolating the string directly:
 *
 *   <ProtectedContent text={prompt.promptText} className="whitespace-pre-wrap font-mono" />
 *
 * What it does:
 *  - Blocks the right-click context menu over the text.
 *  - Blocks the browser Copy action (Ctrl+C / Cmd+C) and shows a toast.
 *  - Blocks Ctrl+A / Cmd+A "select all" while this component is mounted
 *    (only when focus isn't in an input/textarea, so it never interferes
 *    with typing elsewhere on the page).
 *  - Prevents mouse drag-to-select and drag-out of the text.
 *  - Embeds an invisible zero-width watermark of the viewing user's email
 *    into the rendered text, so a leaked copy can be traced back to the
 *    account that copied it (see src/lib/protection.ts).
 *
 * None of this stops a screenshot — screen capture reads pixels, not the
 * DOM, and no web technology can intercept it. This raises the cost of
 * casual copy/paste and naive scraping, not more than that.
 */
export function ProtectedContent({
  text,
  as: Tag = "div",
  className,
  wrapperClassName,
  disableWatermark = false,
}: ProtectedContentProps) {
  const { data: session } = useSession();

  const displayText = React.useMemo(() => {
    if (disableWatermark) return text || "";
    const identifier = session?.user?.email || "anonymous";
    return embedZeroWidthWatermark(text || "", identifier);
  }, [text, session?.user?.email, disableWatermark]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isFormField =
        !!target && (["INPUT", "TEXTAREA"].includes(target.tagName) || target.isContentEditable);
      if (isFormField) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") {
        e.preventDefault();
        window.getSelection?.()?.removeAllRanges();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    showProtectionToast("Content is protected");
  };

  const handleCopy = (e: React.ClipboardEvent) => {
    e.preventDefault();
    e.clipboardData.setData("text/plain", "Content is protected — EaseMyPrompt.ai");
    showProtectionToast("Content is protected");
  };

  return (
    <div className={`protected-content relative ${wrapperClassName || ""}`}>
      <Tag className={`pointer-events-none select-none ${className || ""}`}>{displayText}</Tag>
      {/* Transparent overlay: catches right-click/copy so the underlying
          (pointer-events: none) text never has to be interactive. Wheel
          scroll still passes through to whatever scrollable ancestor
          contains this component. */}
      <div
        className="absolute inset-0"
        onContextMenu={handleContextMenu}
        onCopy={handleCopy}
        onDragStart={(e) => e.preventDefault()}
      />
    </div>
  );
}
