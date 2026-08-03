"use client"

import * as React from "react"
import { Activity, Database, Clock, AlertOctagon, ChevronLeft, ChevronRight, CheckCircle2, XCircle } from "lucide-react"

export const dynamic = "force-dynamic"

type Health = {
    status: "operational" | "degraded"
    dbStatus: "ok" | "error"
    dbLatencyMs: number
    processUptimeSec: number
    nodeVersion: string
    env: string
    checkedAt: string
}

type ErrorEntry = {
    _id: string
    route: string
    message: string
    createdAt: string
}

function formatUptime(sec: number) {
    const h = Math.floor(sec / 3600)
    const m = Math.floor((sec % 3600) / 60)
    const s = sec % 60
    if (h > 0) return `${h}h ${m}m`
    if (m > 0) return `${m}m ${s}s`
    return `${s}s`
}

function StatCard({ icon, label, value, sub, ok }: { icon: React.ReactNode; label: string; value: string; sub?: string; ok?: boolean }) {
    return (
        <div className="rounded-card border border-border bg-bg-panel p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-text-secondary">{label}</span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${ok === false ? "bg-danger/10 text-danger" : "bg-accent/10 text-accent"}`}>
                    {icon}
                </div>
            </div>
            <div>
                <p className="text-2xl font-bold text-text-primary">{value}</p>
                {sub && <p className="text-xs text-text-secondary mt-1">{sub}</p>}
            </div>
        </div>
    )
}

export default function AdminSystemPage() {
    const [health, setHealth] = React.useState<Health | null>(null)
    const [errors, setErrors] = React.useState<ErrorEntry[]>([])
    const [errorsToday, setErrorsToday] = React.useState(0)
    const [total, setTotal] = React.useState(0)
    const [page, setPage] = React.useState(1)
    const [loading, setLoading] = React.useState(true)

    const load = React.useCallback((p: number) => {
        setLoading(true)
        fetch(`/api/admin/system?page=${p}`)
            .then((r) => r.json())
            .then((data) => {
                if (data?.health) setHealth(data.health)
                setErrors(data.errors || [])
                setTotal(data.total || 0)
                setErrorsToday(data.errorsToday || 0)
            })
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    React.useEffect(() => { load(page) }, [page]) // eslint-disable-line react-hooks/exhaustive-deps

    const totalPages = Math.max(1, Math.ceil(total / 20))
    const operational = health?.status === "operational"

    return (
        <div className="flex flex-col h-full bg-bg-base overflow-y-auto">
            <div className="px-4 sm:px-6 pt-6 sm:pt-8 pb-6">
                <h1 className="text-2xl font-bold text-text-primary">System</h1>
                <p className="text-text-secondary text-sm mt-0.5">Health, uptime, and recent errors</p>
            </div>

            <div className="px-4 sm:px-6 pb-10 space-y-4">
                {health && (
                    <div className={`rounded-card border p-4 flex items-center gap-3 ${operational ? "border-success/30 bg-success/5" : "border-danger/30 bg-danger/5"}`}>
                        {operational ? <CheckCircle2 size={18} className="text-success shrink-0" /> : <XCircle size={18} className="text-danger shrink-0" />}
                        <p className={`text-sm font-semibold ${operational ? "text-success" : "text-danger"}`}>
                            {operational ? "All systems operational" : "Degraded — database connection issue"}
                        </p>
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        icon={<Database size={16} />} label="Database"
                        value={loading || !health ? "—" : health.dbStatus === "ok" ? `${health.dbLatencyMs}ms` : "Error"}
                        sub={health?.dbStatus === "ok" ? "Ping latency" : "Connection failed"}
                        ok={health?.dbStatus === "ok"}
                    />
                    <StatCard
                        icon={<Clock size={16} />} label="Instance uptime"
                        value={loading || !health ? "—" : formatUptime(health.processUptimeSec)}
                        sub="Since last cold start"
                    />
                    <StatCard
                        icon={<AlertOctagon size={16} />} label="Errors (24h)"
                        value={loading ? "—" : String(errorsToday)}
                        ok={errorsToday === 0}
                    />
                    <StatCard
                        icon={<Activity size={16} />} label="Environment"
                        value={loading || !health ? "—" : health.env}
                        sub={health?.nodeVersion}
                    />
                </div>

                <div className="rounded-card border border-border bg-bg-panel overflow-hidden">
                    <div className="px-5 py-4 border-b border-border">
                        <h3 className="text-sm font-semibold text-text-primary">Recent errors</h3>
                        <p className="text-xs text-text-secondary mt-0.5">Captured from key routes (payments, AI calls, auth, admin actions) — not exhaustive across every endpoint.</p>
                    </div>
                    {loading ? (
                        <div className="p-5 space-y-3">
                            {[...Array(5)].map((_, i) => <div key={i} className="h-12 rounded-btn bg-bg-hover animate-pulse" />)}
                        </div>
                    ) : errors.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-5">
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-success/10 text-success">
                                <CheckCircle2 size={24} />
                            </div>
                            <p className="text-text-primary font-semibold">No errors logged</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-[0.7rem] uppercase tracking-wider text-text-secondary">
                                        <th className="px-5 py-3 font-semibold">Route</th>
                                        <th className="px-5 py-3 font-semibold">Message</th>
                                        <th className="px-5 py-3 font-semibold">When</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {errors.map((e) => (
                                        <tr key={e._id} className="border-t border-border hover:bg-bg-hover/50 transition-colors">
                                            <td className="px-5 py-3 font-mono text-xs text-text-primary whitespace-nowrap">{e.route}</td>
                                            <td className="px-5 py-3 text-text-secondary max-w-[420px] truncate">{e.message}</td>
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
