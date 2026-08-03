"use client"

import * as React from "react"
import { Flag, Trash2, ShieldCheck, ChevronLeft, ChevronRight } from "lucide-react"

export const dynamic = "force-dynamic"

type ReportItem = {
    _id: string
    listingId: string
    listingTitle: string
    reporterName?: string
    reason: string
    details?: string
    status: "open" | "dismissed" | "actioned"
    createdAt: string
}

const STATUS_TABS = [
    { value: "all", label: "All" },
    { value: "open", label: "Open" },
    { value: "dismissed", label: "Kept" },
    { value: "actioned", label: "Removed" },
] as const

const STATUS_BADGE: Record<string, string> = {
    open: "bg-gold/10 text-gold-text border-gold/20",
    dismissed: "bg-success/10 text-success border-success/20",
    actioned: "bg-danger/10 text-danger border-danger/20",
}

const REASON_LABEL: Record<string, string> = {
    spam: "Spam",
    inappropriate: "Inappropriate content",
    copyright: "Copyright violation",
    misleading: "Misleading description",
    other: "Other",
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="rounded-card border border-border bg-bg-panel p-5 flex flex-col gap-3 max-w-xs">
            <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-text-secondary">{label}</span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-accent/10 text-accent">{icon}</div>
            </div>
            <p className="text-2xl font-bold text-text-primary">{value}</p>
        </div>
    )
}

export default function AdminReportsPage() {
    const [reports, setReports] = React.useState<ReportItem[]>([])
    const [openCount, setOpenCount] = React.useState(0)
    const [total, setTotal] = React.useState(0)
    const [page, setPage] = React.useState(1)
    const [status, setStatus] = React.useState("open")
    const [loading, setLoading] = React.useState(true)
    const [busyId, setBusyId] = React.useState<string | null>(null)

    const load = React.useCallback((s: string, p: number) => {
        setLoading(true)
        const params = new URLSearchParams()
        if (s !== "all") params.set("status", s)
        params.set("page", String(p))
        fetch(`/api/admin/reports?${params.toString()}`)
            .then((r) => r.json())
            .then((data) => {
                setReports(data.reports || [])
                setTotal(data.total || 0)
                setOpenCount(data.openCount || 0)
            })
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    React.useEffect(() => { load(status, page) }, [status, page]) // eslint-disable-line react-hooks/exhaustive-deps

    const changeStatus = (s: string) => { setStatus(s); setPage(1) }

    const act = async (id: string, action: "dismiss" | "remove_listing") => {
        if (action === "remove_listing" && !window.confirm("Remove this prompt from the marketplace? The seller will be notified.")) return
        setBusyId(id)
        try {
            const res = await fetch(`/api/admin/reports/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action }),
            })
            if (res.ok) load(status, page)
        } finally {
            setBusyId(null)
        }
    }

    const totalPages = Math.max(1, Math.ceil(total / 20))

    return (
        <div className="flex flex-col h-full bg-bg-base overflow-y-auto">
            <div className="px-4 sm:px-6 pt-6 sm:pt-8 pb-6">
                <h1 className="text-2xl font-bold text-text-primary">Reports</h1>
                <p className="text-text-secondary text-sm mt-0.5">User-flagged marketplace content</p>
            </div>

            <div className="px-4 sm:px-6 pb-10 space-y-4">
                <StatCard icon={<Flag size={16} />} label="Open reports" value={String(openCount)} />

                <div className="flex flex-wrap gap-1.5">
                    {STATUS_TABS.map((t) => (
                        <button
                            key={t.value}
                            onClick={() => changeStatus(t.value)}
                            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${status === t.value ? "bg-accent text-white border-accent" : "border-border text-text-secondary hover:text-text-primary hover:bg-bg-hover"}`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                <div className="rounded-card border border-border bg-bg-panel overflow-hidden">
                    {loading ? (
                        <div className="p-5 space-y-3">
                            {[...Array(5)].map((_, i) => <div key={i} className="h-16 rounded-btn bg-bg-hover animate-pulse" />)}
                        </div>
                    ) : reports.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-5">
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-accent/10 text-accent">
                                <Flag size={24} />
                            </div>
                            <p className="text-text-primary font-semibold">No reports found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-[0.7rem] uppercase tracking-wider text-text-secondary">
                                        <th className="px-5 py-3 font-semibold">Prompt</th>
                                        <th className="px-5 py-3 font-semibold">Reporter</th>
                                        <th className="px-5 py-3 font-semibold">Reason</th>
                                        <th className="px-5 py-3 font-semibold">Details</th>
                                        <th className="px-5 py-3 font-semibold">Status</th>
                                        <th className="px-5 py-3 font-semibold">Reported</th>
                                        <th className="px-5 py-3 font-semibold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reports.map((r) => (
                                        <tr key={r._id} className="border-t border-border hover:bg-bg-hover/50 transition-colors">
                                            <td className="px-5 py-3.5 font-medium text-text-primary truncate max-w-[180px]">{r.listingTitle}</td>
                                            <td className="px-5 py-3.5 text-text-secondary">{r.reporterName || "—"}</td>
                                            <td className="px-5 py-3.5 text-text-secondary">{REASON_LABEL[r.reason] || r.reason}</td>
                                            <td className="px-5 py-3.5 text-text-secondary max-w-[220px] truncate">{r.details || "—"}</td>
                                            <td className="px-5 py-3.5">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[0.7rem] font-semibold border ${STATUS_BADGE[r.status]}`}>
                                                    {r.status === "actioned" ? "removed" : r.status === "dismissed" ? "kept" : "open"}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-text-secondary">
                                                {new Date(r.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                {r.status === "open" && (
                                                    <div className="flex justify-end items-center gap-2 flex-wrap">
                                                        <button
                                                            onClick={() => act(r._id, "dismiss")}
                                                            disabled={busyId === r._id}
                                                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-btn text-xs font-semibold text-white bg-success hover:bg-success/90 disabled:opacity-50 transition-colors"
                                                        >
                                                            <ShieldCheck size={13} /> Keep
                                                        </button>
                                                        <button
                                                            onClick={() => act(r._id, "remove_listing")}
                                                            disabled={busyId === r._id}
                                                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-btn text-xs font-semibold text-white bg-danger hover:bg-danger/90 disabled:opacity-50 transition-colors"
                                                        >
                                                            <Trash2 size={13} /> Remove
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {totalPages > 1 && (
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-text-secondary">Page {page} of {totalPages}</p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
                                className="p-1.5 rounded-btn border border-border text-text-secondary hover:bg-bg-hover disabled:opacity-40 transition-colors"
                            ><ChevronLeft size={15} /></button>
                            <button
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                                className="p-1.5 rounded-btn border border-border text-text-secondary hover:bg-bg-hover disabled:opacity-40 transition-colors"
                            ><ChevronRight size={15} /></button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
