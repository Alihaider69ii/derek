"use client"

import * as React from "react"
import { useSession } from "next-auth/react"
import { Bell, CheckCircle2, XCircle, Megaphone } from "lucide-react"
import { cn } from "@/lib/utils"

type NotificationType =
    | "prompt_approved"
    | "prompt_rejected"
    | "payout_approved"
    | "payout_rejected"
    | "payout_paid"
    | "report_actioned"
    | "broadcast"

type NotificationItem = {
    _id: string
    type: NotificationType
    title: string
    message: string
    reason?: string
    read: boolean
    createdAt: string
}

const POSITIVE_TYPES: NotificationType[] = ["prompt_approved", "payout_approved", "payout_paid"]

function iconFor(type: NotificationType) {
    if (type === "broadcast") return { Icon: Megaphone, cls: "bg-accent/10 text-accent" }
    if (POSITIVE_TYPES.includes(type)) return { Icon: CheckCircle2, cls: "bg-success/10 text-success" }
    return { Icon: XCircle, cls: "bg-danger/10 text-danger" }
}

const POLL_MS = 20_000
const HEARTBEAT_MS = 45_000

function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60_000)
    if (mins < 1) return "just now"
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
}

export function NotificationBell({ className }: { className?: string }) {
    const { data: session } = useSession()
    const [items, setItems] = React.useState<NotificationItem[]>([])
    const [unreadCount, setUnreadCount] = React.useState(0)
    const [isOpen, setIsOpen] = React.useState(false)
    const containerRef = React.useRef<HTMLDivElement>(null)

    const fetchNotifications = React.useCallback(() => {
        fetch("/api/notifications")
            .then((r) => r.json())
            .then((data) => {
                if (Array.isArray(data?.notifications)) setItems(data.notifications)
                if (typeof data?.unreadCount === "number") setUnreadCount(data.unreadCount)
            })
            .catch(() => { })
    }, [])

    React.useEffect(() => {
        if (!session?.user) return
        fetchNotifications()
        const interval = setInterval(fetchNotifications, POLL_MS)
        return () => clearInterval(interval)
    }, [session, fetchNotifications])

    // Presence heartbeat — backs the admin dashboard's "online users" count.
    React.useEffect(() => {
        if (!session?.user) return
        const ping = () => fetch("/api/heartbeat", { method: "POST" }).catch(() => { })
        ping()
        const interval = setInterval(ping, HEARTBEAT_MS)
        return () => clearInterval(interval)
    }, [session])

    React.useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const toggleOpen = () => {
        const next = !isOpen
        setIsOpen(next)
        if (next && unreadCount > 0) {
            setUnreadCount(0)
            setItems((prev) => prev.map((n) => ({ ...n, read: true })))
            fetch("/api/notifications", { method: "PATCH" }).catch(() => { })
        }
    }

    if (!session?.user) return null

    return (
        <div className={cn("relative", className)} ref={containerRef}>
            <button
                onClick={toggleOpen}
                aria-label="Notifications"
                className="relative p-2 rounded-btn text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors"
            >
                <Bell size={18} />
                {unreadCount > 0 && (
                    <span className="absolute top-0.5 right-0.5 inline-flex items-center justify-center min-w-[16px] h-[16px] px-1 rounded-full bg-danger text-white text-[0.6rem] font-bold">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-[320px] max-h-[420px] overflow-y-auto bg-bg-panel border border-border rounded-btn shadow-lg z-50">
                    <div className="px-4 py-3 border-b border-border">
                        <h4 className="text-sm font-semibold text-text-primary">Notifications</h4>
                    </div>
                    {items.length === 0 ? (
                        <p className="text-sm text-text-secondary px-4 py-6 text-center">You&apos;re all caught up</p>
                    ) : (
                        <div className="divide-y divide-border">
                            {items.map((n) => {
                                const { Icon, cls } = iconFor(n.type)
                                return (
                                <div key={n._id} className={cn("px-4 py-3 flex gap-3", !n.read && "bg-accent/5")}>
                                    <div className={cn("w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5", cls)}>
                                        <Icon size={15} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-text-primary">{n.title}</p>
                                        <p className="text-xs text-text-secondary mt-0.5">{n.message}</p>
                                        {n.reason && (
                                            <p className="text-xs text-text-secondary mt-1 italic">&ldquo;{n.reason}&rdquo;</p>
                                        )}
                                        <p className="text-[0.7rem] text-text-secondary/70 mt-1">{timeAgo(n.createdAt)}</p>
                                    </div>
                                </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
