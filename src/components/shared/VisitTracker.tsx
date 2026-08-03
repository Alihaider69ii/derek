"use client"

import * as React from "react"
import { usePathname } from "next/navigation"

// Fires a single fire-and-forget visit ping per page load, skipped on
// /admin/* so admin's own traffic never pollutes the visitor funnel.
export function VisitTracker() {
    const pathname = usePathname()

    React.useEffect(() => {
        if (pathname?.startsWith("/admin")) return
        fetch("/api/track/visit", { method: "POST" }).catch(() => { })
    }, [pathname])

    return null
}
