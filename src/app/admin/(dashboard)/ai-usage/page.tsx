"use client"

import * as React from "react"
import { Activity, ArrowDownToLine, ArrowUpFromLine, AlertTriangle } from "lucide-react"

export const dynamic = "force-dynamic"

type Usage = {
    totalCalls: number
    totalInputTokens: number
    totalOutputTokens: number
    successCount: number
    errorCount: number
    byFeature: { feature: string; calls: number; inputTokens: number; outputTokens: number }[]
    byModel: { model: string; calls: number; inputTokens: number; outputTokens: number }[]
    byUser: { userEmail: string; calls: number; inputTokens: number; outputTokens: number }[]
    recent: { userEmail: string; feature: string; model: string; inputTokens: number; outputTokens: number; success: boolean; createdAt: string }[]
}

function fmt(n: number) {
    return n.toLocaleString("en-IN")
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
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

export default function AdminAiUsagePage() {
    const [data, setData] = React.useState<Usage | null>(null)
    const [loading, setLoading] = React.useState(true)

    React.useEffect(() => {
        fetch("/api/admin/ai-usage")
            .then((r) => r.json())
            .then((d) => { if (!d?.error) setData(d) })
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    return (
        <div className="flex flex-col h-full bg-bg-base overflow-y-auto">
            <div className="px-4 sm:px-6 pt-6 sm:pt-8 pb-6">
                <h1 className="text-2xl font-bold text-text-primary">AI Usage</h1>
                <p className="text-text-secondary text-sm mt-0.5">API calls and token usage for Derek + Claude</p>
            </div>

            <div className="px-4 sm:px-6 pb-10 space-y-6">
                {loading || !data ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[...Array(4)].map((_, i) => <div key={i} className="h-28 rounded-card bg-bg-hover animate-pulse" />)}
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <StatCard icon={<Activity size={16} />} label="Total API calls" value={fmt(data.totalCalls)} />
                            <StatCard icon={<ArrowDownToLine size={16} />} label="Input tokens" value={fmt(data.totalInputTokens)} />
                            <StatCard icon={<ArrowUpFromLine size={16} />} label="Output tokens" value={fmt(data.totalOutputTokens)} />
                            <StatCard icon={<AlertTriangle size={16} />} label="Failed calls" value={fmt(data.errorCount)} />
                        </div>

                        {data.totalCalls === 0 && (
                            <div className="rounded-card border border-border bg-bg-panel p-5 text-sm text-text-secondary">
                                No AI usage recorded yet — this dashboard only tracks calls made after usage logging was added. Numbers will populate as Derek/Claude are used.
                            </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div className="rounded-card border border-border bg-bg-panel overflow-hidden">
                                <div className="px-5 py-4 border-b border-border">
                                    <h3 className="text-sm font-semibold text-text-primary">By feature</h3>
                                </div>
                                {data.byFeature.length === 0 ? (
                                    <p className="text-sm text-text-secondary px-5 py-6">No data yet</p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="text-left text-[0.7rem] uppercase tracking-wider text-text-secondary">
                                                    <th className="px-5 py-3 font-semibold">Feature</th>
                                                    <th className="px-5 py-3 font-semibold">Calls</th>
                                                    <th className="px-5 py-3 font-semibold">In tokens</th>
                                                    <th className="px-5 py-3 font-semibold">Out tokens</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data.byFeature.map((f) => (
                                                    <tr key={f.feature} className="border-t border-border">
                                                        <td className="px-5 py-3.5 font-medium text-text-primary capitalize">{f.feature}</td>
                                                        <td className="px-5 py-3.5 text-text-secondary">{fmt(f.calls)}</td>
                                                        <td className="px-5 py-3.5 text-text-secondary">{fmt(f.inputTokens)}</td>
                                                        <td className="px-5 py-3.5 text-text-secondary">{fmt(f.outputTokens)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            <div className="rounded-card border border-border bg-bg-panel overflow-hidden">
                                <div className="px-5 py-4 border-b border-border">
                                    <h3 className="text-sm font-semibold text-text-primary">By model</h3>
                                </div>
                                {data.byModel.length === 0 ? (
                                    <p className="text-sm text-text-secondary px-5 py-6">No data yet</p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="text-left text-[0.7rem] uppercase tracking-wider text-text-secondary">
                                                    <th className="px-5 py-3 font-semibold">Model</th>
                                                    <th className="px-5 py-3 font-semibold">Calls</th>
                                                    <th className="px-5 py-3 font-semibold">In tokens</th>
                                                    <th className="px-5 py-3 font-semibold">Out tokens</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data.byModel.map((m) => (
                                                    <tr key={m.model} className="border-t border-border">
                                                        <td className="px-5 py-3.5 font-medium text-text-primary truncate max-w-[160px]">{m.model}</td>
                                                        <td className="px-5 py-3.5 text-text-secondary">{fmt(m.calls)}</td>
                                                        <td className="px-5 py-3.5 text-text-secondary">{fmt(m.inputTokens)}</td>
                                                        <td className="px-5 py-3.5 text-text-secondary">{fmt(m.outputTokens)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="rounded-card border border-border bg-bg-panel overflow-hidden">
                            <div className="px-5 py-4 border-b border-border">
                                <h3 className="text-sm font-semibold text-text-primary">By user</h3>
                                <p className="text-xs text-text-secondary mt-0.5">Top 25 by call volume · guest usage grouped separately</p>
                            </div>
                            {data.byUser.length === 0 ? (
                                <p className="text-sm text-text-secondary px-5 py-6">No data yet</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-left text-[0.7rem] uppercase tracking-wider text-text-secondary">
                                                <th className="px-5 py-3 font-semibold">User</th>
                                                <th className="px-5 py-3 font-semibold">Calls</th>
                                                <th className="px-5 py-3 font-semibold">In tokens</th>
                                                <th className="px-5 py-3 font-semibold">Out tokens</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.byUser.map((u) => (
                                                <tr key={u.userEmail} className="border-t border-border">
                                                    <td className="px-5 py-3.5 text-text-primary truncate max-w-[240px]">{u.userEmail}</td>
                                                    <td className="px-5 py-3.5 text-text-secondary">{fmt(u.calls)}</td>
                                                    <td className="px-5 py-3.5 text-text-secondary">{fmt(u.inputTokens)}</td>
                                                    <td className="px-5 py-3.5 text-text-secondary">{fmt(u.outputTokens)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        <div className="rounded-card border border-border bg-bg-panel overflow-hidden">
                            <div className="px-5 py-4 border-b border-border">
                                <h3 className="text-sm font-semibold text-text-primary">Recent activity</h3>
                            </div>
                            {data.recent.length === 0 ? (
                                <p className="text-sm text-text-secondary px-5 py-6">No calls yet</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-left text-[0.7rem] uppercase tracking-wider text-text-secondary">
                                                <th className="px-5 py-3 font-semibold">User</th>
                                                <th className="px-5 py-3 font-semibold">Feature</th>
                                                <th className="px-5 py-3 font-semibold">Model</th>
                                                <th className="px-5 py-3 font-semibold">Tokens (in/out)</th>
                                                <th className="px-5 py-3 font-semibold">Status</th>
                                                <th className="px-5 py-3 font-semibold">When</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.recent.map((r, i) => (
                                                <tr key={i} className="border-t border-border">
                                                    <td className="px-5 py-3.5 text-text-primary truncate max-w-[200px]">{r.userEmail}</td>
                                                    <td className="px-5 py-3.5 text-text-secondary capitalize">{r.feature}</td>
                                                    <td className="px-5 py-3.5 text-text-secondary truncate max-w-[140px]">{r.model}</td>
                                                    <td className="px-5 py-3.5 text-text-secondary">{fmt(r.inputTokens)} / {fmt(r.outputTokens)}</td>
                                                    <td className="px-5 py-3.5">
                                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[0.7rem] font-semibold border ${r.success ? "bg-success/10 text-success border-success/20" : "bg-danger/10 text-danger border-danger/20"}`}>
                                                            {r.success ? "OK" : "Error"}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-3.5 text-text-secondary whitespace-nowrap">
                                                        {new Date(r.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
