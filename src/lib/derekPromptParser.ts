// Parses Derek's "Job 1" structured output (ROLE / TASK / FORMAT /
// CONSTRAINTS) out of a raw reply. Shared between the API route (to decide
// whether to auto-save a "build") and the chat UI (to decide whether to
// render pastel cards or a plain bubble). Pure/isomorphic — no server-only
// imports — so it's safe to use on both sides.

export interface StructuredPrompt {
    role: string;
    task: string;
    format: string;
    constraints: string;
}

const SECTION_KEYS = ["ROLE", "TASK", "FORMAT", "CONSTRAINTS"] as const;
type SectionKey = (typeof SECTION_KEYS)[number];

// Matches a section header at the start of a line, tolerating markdown bold
// markers (**ROLE:**) and optional leading list/markdown noise.
function buildHeaderRegex(key: SectionKey): RegExp {
    return new RegExp(`^\\s*\\**${key}\\**\\s*:\\s*`, "i");
}

/**
 * Attempts to split raw Derek output into ROLE/TASK/FORMAT/CONSTRAINTS
 * sections. Returns null if the text doesn't contain all four section
 * headers (i.e. Derek answered in "platform expert" mode instead).
 */
export function parseStructuredPrompt(text: string): StructuredPrompt | null {
    if (!text) return null;

    const lines = text.split(/\r?\n/);
    const sections: Partial<Record<SectionKey, string[]>> = {};
    let current: SectionKey | null = null;

    for (const line of lines) {
        const matchedKey = SECTION_KEYS.find((key) => buildHeaderRegex(key).test(line));
        if (matchedKey) {
            current = matchedKey;
            const remainder = line.replace(buildHeaderRegex(matchedKey), "");
            sections[matchedKey] = [remainder];
        } else if (current) {
            sections[current]!.push(line);
        }
    }

    if (!SECTION_KEYS.every((key) => sections[key] && sections[key]!.join("").trim().length > 0)) {
        return null;
    }

    return {
        role: sections.ROLE!.join("\n").trim(),
        task: sections.TASK!.join("\n").trim(),
        format: sections.FORMAT!.join("\n").trim(),
        constraints: sections.CONSTRAINTS!.join("\n").trim(),
    };
}

export function isStructuredPrompt(text: string): boolean {
    return parseStructuredPrompt(text) !== null;
}

/** Short, human-friendly title for a structured prompt, used for saved "builds" and listings. */
export function deriveBuildTitle(structured: StructuredPrompt, fallback: string): string {
    const source = structured.task || structured.role || fallback;
    const oneLine = source.replace(/\s+/g, " ").trim();
    return oneLine.length > 60 ? `${oneLine.slice(0, 57)}...` : oneLine || "Untitled prompt";
}
