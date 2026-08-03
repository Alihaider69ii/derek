"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { AlertTriangle } from "lucide-react"

// Informational only — does not block access. Admin routes are excluded so
// an admin can never lock themselves out of turning maintenance mode back off.
export function MaintenanceBanner() {
    const pathname = usePathname()
    const [message, setMessage] = React.useState<string | null>(null)

    React.useEffect(() => {
        if (pathname?.startsWith("/admin")) return
        fetch("/api/system/status")
            .then((r) => r.json())
            .then((data) => setMessage(data?.maintenanceMode ? (data.maintenanceMessage || "We're down for scheduled maintenance.") : null))
            .catch(() => { })
    }, [pathname])

    if (!message || pathname?.startsWith("/admin")) return null

    return (
        <div className="sticky top-0 z-[100] flex items-center justify-center gap-2 bg-gold/15 border-b border-gold/30 text-gold-text text-xs sm:text-sm font-medium px-4 py-2 text-center">
            <AlertTriangle size={14} className="shrink-0" />
            <span>{message}</span>
        </div>
    )
}
