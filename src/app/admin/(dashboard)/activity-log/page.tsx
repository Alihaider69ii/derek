"use client"

import * as React from "react"
import { Search, ScrollText, ChevronLeft, ChevronRight } from "lucide-react"

export const dynamic = "force-dynamic"

type Entry = {
    _id: string
    adminEmail: string
    action: string
    targetType?: string
    targetId?: string
    details?: string
    createdAt: string
}

export default function AdminActivityLogPage() {
    const [entries, setEntries] = React.useState<Entry[]>([])
    const [actions, setActions] = React.useState<string[]>([])
    const [total, setTotal] = React.useState(0)
    const [page, setPage] = React.useState(1)
    const [q, setQ] = React.useState("")
    const [action, setAction] = React.useState("")
    const [loading, setLoading] = React.useState(true)

    const load = React.useCallback((query: string, act: string, p: number) => {
        setLoading(true)
        const params = new URLSearchParams()
        if (query) params.set("q", query)
        if (act) params.set("action", act)
        params.set("page", String(p))
        fetch(`/api/admin/activity-log?${params.toString()}`)
            .then((r) => r.json())
            .then((data) => {
                setEntries(data.entries || [])
                setTotal(data.total || 0)
                setActions(data.actions || [])
            })
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    React.useEffect(() => { load(q, action, page) }, [action, page]) // eslint-disable-line react-hooks/exhaustive-deps

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        setPage(1)
        load(q, action, 1)
    }

    const totalPages = Math.max(1, Math.ceil(total / 30))

    return (
        <div className="flex flex-col h-full bg-bg-base overflow-y-auto">
            <div className="px-4 sm:px-6 pt-6 sm:pt-8 pb-6">
                <h1 className="text-2xl font-bold text-text-primary">Activity Log</h1>
                <p className="text-text-secondary text-sm mt-0.5">Audit trail of every admin-panel action</p>
            </div>

            <div className="px-4 sm:px-6 pb-10 space-y-4">
                <div className="flex flex-wrap gap-3">
                    <form onSubmit={handleSearch} className="flex gap-3 flex-1 min-w-[240px]">
                        <div className="relative flex-1 max-w-md">
                            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                            <input
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                placeholder="Search by admin, target, or details"
                                className="w-full h-10 rounded-btn border border-border bg-bg-input pl-9 pr-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30"
                            />
                        </div>
                        <button type="submit" className="h-10 px-5 rounded-full text-sm font-bold text-white bg-accent hover:bg-accent-hover transition-colors">
                            Search
                        </button>
                    </form>
                    <select
                        value={action}
                        onChange={(e) => { setAction(e.target.value); setPage(1) }}
                        className="h-10 rounded-btn border border-border bg-bg-input px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30"
                    >
                        <option value="">All actions</option>
                        {actions.map((a) => <option key={a} value={a}>{a}</option>)}
                    </select>
                </div>

                <div className="rounded-card border border-border bg-bg-panel overflow-hidden">
                    {loading ? (
                        <div className="p-5 space-y-3">
                            {[...Array(8)].map((_, i) => <div key={i} className="h-12 rounded-btn bg-bg-hover animate-pulse" />)}
                        </div>
                    ) : entries.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-5">
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-accent/10 text-accent">
                                <ScrollText size={24} />
                            </div>
                            <p className="text-text-primary font-semibold">No activity found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-[0.7rem] uppercase tracking-wider text-text-secondary">
                                        <th className="px-5 py-3 font-semibold">Admin</th>
                                        <th className="px-5 py-3 font-semibold">Action</th>
                                        <th className="px-5 py-3 font-semibold">Target</th>
                                        <th className="px-5 py-3 font-semibold">Details</th>
                                        <th className="px-5 py-3 font-semibold">When</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {entries.map((e) => (
                                        <tr key={e._id} className="border-t border-border hover:bg-bg-hover/50 transition-colors">
                                            <td className="px-5 py-3 text-text-primary whitespace-nowrap">{e.adminEmail}</td>
                                            <td className="px-5 py-3">
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[0.7rem] font-semibold border bg-accent/10 text-accent border-accent/20">
                                                    {e.action}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-text-secondary whitespace-nowrap">{e.targetType || "—"}</td>
                                            <td className="px-5 py-3 text-text-secondary max-w-[320px] truncate">{e.details || "—"}</td>
                                            <td className="px-5 py-3 text-text-secondary whitespace-nowrap">
                                                {new Date(e.createdAt).toLocaleString("en-IN", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
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
                            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="p-1.5 rounded-btn border border-border text-text-secondary hover:bg-bg-hover disabled:opacity-40 transition-colors"><ChevronLeft size={15} /></button>
                            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="p-1.5 rounded-btn border border-border text-text-secondary hover:bg-bg-hover disabled:opacity-40 transition-colors"><ChevronRight size={15} /></button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
