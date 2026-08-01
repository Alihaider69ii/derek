"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
    Plus, IndianRupee, FileText, Sparkles, ShoppingBag,
    Clock, CheckCircle2, XCircle, Tag, Bell,
} from "lucide-react"
import { ListingWizardModal } from "@/components/shared/ListingWizard"

export const dynamic = 'force-dynamic'

function formatINR(n: number) {
    return `₹${n.toLocaleString("en-IN")}`
}

type Stats = {
    promptsBuiltWithDerek: number
    draftsSaved: number
    liveOnMarketplace: number
    totalEarned: number
}

type Listing = {
    _id: string
    title: string
    status: "draft" | "pending_review" | "live" | "rejected"
    createdAt: string
}

type ActivityItem = {
    id: string
    type: "listed" | "sale" | "approved" | "rejected"
    message: string
    date: string
}

type NotificationItem = {
    _id: string
    type: "prompt_approved" | "prompt_rejected"
    title: string
    message: string
    reason?: string
    createdAt: string
}

function StatCard({
    icon, label, value,
}: {
    icon: React.ReactNode
    label: string
    value: string
}) {
    return (
        <div className="rounded-card border border-border bg-bg-panel p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-text-secondary">{label}</span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-accent/10 text-accent">
                    {icon}
                </div>
            </div>
            <p className="text-2xl font-bold text-text-primary">{value}</p>
        </div>
    )
}

function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60_000)
    if (mins < 1) return "just now"
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
}

function activityIcon(type: ActivityItem["type"]) {
    if (type === "sale") return <IndianRupee size={14} />
    if (type === "approved") return <CheckCircle2 size={14} />
    if (type === "rejected") return <XCircle size={14} />
    return <FileText size={14} />
}

function DashboardOverviewInner() {
    const router = useRouter()
    const searchParams = useSearchParams()

    const [stats, setStats] = React.useState<Stats | null>(null)
    const [pending, setPending] = React.useState<Listing[]>([])
    const [activity, setActivity] = React.useState<ActivityItem[]>([])
    const [notifications, setNotifications] = React.useState<NotificationItem[]>([])
    const [loading, setLoading] = React.useState(true)
    const [wizardOpen, setWizardOpen] = React.useState(false)

    const load = React.useCallback(() => {
        setLoading(true)
        Promise.all([
            fetch("/api/dashboard/stats").then(r => r.json()),
            fetch("/api/dashboard/listings").then(r => r.json()),
            fetch("/api/dashboard/activity").then(r => r.json()),
            fetch("/api/notifications").then(r => r.json()),
        ])
            .then(([statsData, listingsData, activityData, notifData]) => {
                if (!statsData?.error) setStats(statsData)
                if (Array.isArray(listingsData)) {
                    setPending(listingsData.filter((l: Listing) => l.status === "pending_review"))
                }
                if (Array.isArray(activityData)) setActivity(activityData)
                if (Array.isArray(notifData?.notifications)) setNotifications(notifData.notifications.slice(0, 5))
            })
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    React.useEffect(() => { load() }, [load])

    React.useEffect(() => {
        if (searchParams.get("new") === "1") {
            setWizardOpen(true)
            router.replace("/dashboard")
        }
    }, [searchParams, router])

    return (
        <div className="flex flex-col h-full bg-bg-base overflow-y-auto">
            <div className="px-4 sm:px-6 pt-6 sm:pt-8 pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
                    <p className="text-text-secondary text-sm mt-0.5">Track what you&apos;ve built and sold with Derek</p>
                </div>
                <button
                    onClick={() => setWizardOpen(true)}
                    className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white bg-accent hover:bg-accent-hover transition-colors"
                >
                    <Plus size={16} /> New Prompt
                </button>
            </div>

            <div className="px-4 sm:px-6 pb-10 space-y-6">
                {/* Stat cards */}
                {loading || !stats ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[...Array(4)].map((_, i) => <div key={i} className="h-28 rounded-card bg-bg-hover animate-pulse" />)}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard icon={<Sparkles size={16} />} label="Total Prompts Built (with Derek)" value={stats.promptsBuiltWithDerek.toLocaleString("en-IN")} />
                        <StatCard icon={<FileText size={16} />} label="Drafts Saved" value={stats.draftsSaved.toLocaleString("en-IN")} />
                        <StatCard icon={<ShoppingBag size={16} />} label="Live on Marketplace" value={stats.liveOnMarketplace.toLocaleString("en-IN")} />
                        <StatCard icon={<IndianRupee size={16} />} label="Total Earnings" value={formatINR(stats.totalEarned)} />
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Pending approval */}
                    <div className="rounded-card border border-border bg-bg-panel overflow-hidden flex flex-col">
                        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                            <Clock size={15} className="text-orange-500" />
                            <h3 className="text-sm font-semibold text-text-primary">Pending approval</h3>
                        </div>
                        {loading ? (
                            <div className="p-5 space-y-3">
                                {[...Array(2)].map((_, i) => <div key={i} className="h-10 rounded-btn bg-bg-hover animate-pulse" />)}
                            </div>
                        ) : pending.length === 0 ? (
                            <p className="text-sm text-text-secondary px-5 py-6">Nothing waiting on review right now.</p>
                        ) : (
                            <div className="divide-y divide-border">
                                {pending.map(l => (
                                    <div key={l._id} className="px-5 py-3 flex items-center justify-between gap-3">
                                        <span className="text-sm font-medium text-text-primary truncate">{l.title}</span>
                                        <span className="inline-flex items-center gap-1 text-[0.7rem] font-semibold px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 shrink-0">
                                            <Tag size={10} /> In review
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Recent activity */}
                    <div className="rounded-card border border-border bg-bg-panel overflow-hidden flex flex-col">
                        <div className="px-5 py-4 border-b border-border">
                            <h3 className="text-sm font-semibold text-text-primary">Recent activity</h3>
                        </div>
                        {loading ? (
                            <div className="p-5 space-y-3">
                                {[...Array(3)].map((_, i) => <div key={i} className="h-10 rounded-btn bg-bg-hover animate-pulse" />)}
                            </div>
                        ) : activity.length === 0 ? (
                            <p className="text-sm text-text-secondary px-5 py-6">No activity yet — build your first prompt with Derek.</p>
                        ) : (
                            <div className="divide-y divide-border">
                                {activity.map(a => (
                                    <div key={a.id} className="px-5 py-3 flex items-start gap-3">
                                        <div className="w-6 h-6 rounded-full flex items-center justify-center bg-accent/10 text-accent shrink-0 mt-0.5">
                                            {activityIcon(a.type)}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm text-text-primary truncate">{a.message}</p>
                                            <p className="text-[0.7rem] text-text-secondary mt-0.5">{timeAgo(a.date)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Notifications */}
                <div className="rounded-card border border-border bg-bg-panel overflow-hidden">
                    <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                        <Bell size={15} className="text-text-secondary" />
                        <h3 className="text-sm font-semibold text-text-primary">Notifications</h3>
                    </div>
                    {loading ? (
                        <div className="p-5 space-y-3">
                            {[...Array(2)].map((_, i) => <div key={i} className="h-10 rounded-btn bg-bg-hover animate-pulse" />)}
                        </div>
                    ) : notifications.length === 0 ? (
                        <p className="text-sm text-text-secondary px-5 py-6">You&apos;re all caught up — no approvals or rejections yet.</p>
                    ) : (
                        <div className="divide-y divide-border">
                            {notifications.map(n => (
                                <div key={n._id} className="px-5 py-3 flex items-start gap-3">
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${n.type === "prompt_approved" ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}>
                                        {n.type === "prompt_approved" ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-text-primary">{n.title}</p>
                                        <p className="text-xs text-text-secondary mt-0.5">{n.message}</p>
                                        {n.reason && <p className="text-xs text-text-secondary mt-1 italic">&ldquo;{n.reason}&rdquo;</p>}
                                        <p className="text-[0.7rem] text-text-secondary/70 mt-1">{timeAgo(n.createdAt)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {wizardOpen && (
                <ListingWizardModal
                    onClose={() => setWizardOpen(false)}
                    onSubmitted={() => load()}
                />
            )}
        </div>
    )
}

export default function DashboardOverviewPage() {
    return (
        <React.Suspense fallback={<div className="flex-1 bg-bg-base" />}>
            <DashboardOverviewInner />
        </React.Suspense>
    )
}
