import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

// Deterministic placeholder rating (4.0-4.9) for listings that don't yet have
// a real review/rating system behind them. Stable per id, not stored in the DB.
export function placeholderRating(id: string): number {
    let sum = 0
    for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i)
    return Math.round((4 + (sum % 10) / 10) * 10) / 10
}

// Deterministic category → color mapping so marketplace/profile tags stay
// visually distinct per category without needing a color field in the DB.
const CATEGORY_TAG_PALETTE = [
    { bg: "bg-accent/10", text: "text-accent", border: "border-accent/20" },
    { bg: "bg-sky-500/10", text: "text-sky-600", border: "border-sky-500/20" },
    { bg: "bg-pink-500/10", text: "text-pink-600", border: "border-pink-500/20" },
    { bg: "bg-lime-500/10", text: "text-lime-700", border: "border-lime-500/20" },
    { bg: "bg-amber-500/10", text: "text-amber-700", border: "border-amber-500/20" },
    { bg: "bg-emerald-500/10", text: "text-emerald-600", border: "border-emerald-500/20" },
]

export function categoryTagStyle(category?: string) {
    if (!category) return CATEGORY_TAG_PALETTE[0]
    let sum = 0
    for (let i = 0; i < category.length; i++) sum += category.charCodeAt(i)
    return CATEGORY_TAG_PALETTE[sum % CATEGORY_TAG_PALETTE.length]
}

// Derives a stable @handle from a user's display name for profile pages.
export function handleFromName(name?: string, fallbackId?: string): string {
    const base = (name || "").toLowerCase().replace(/[^a-z0-9]+/g, "")
    if (base) return base
    return (fallbackId || "user").slice(-8)
}
