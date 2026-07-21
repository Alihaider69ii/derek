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
