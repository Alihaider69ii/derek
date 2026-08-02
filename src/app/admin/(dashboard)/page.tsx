"use client"

import * as React from "react"
import { Users, FileText, Clock, IndianRupee, Circle } from "lucide-react"
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts"

export const dynamic = "force-dynamic"

function formatINR(n: number) {
    return `₹${n.toLocaleString("en-IN")}`
}

type Stats = {
    totalUsers: number
    livePrompts: number
    pendingReviews: number
    totalRevenue: number
    onlineUsers: number
    recentSignups: { _id: string; name?: string; email: string; createdAt: string; role: string }[]
    revenueChart: { date: string; label: string; amount: number }[]
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

export default function AdminDashboardPage() {
    const [stats, setStats] = React.useState<Stats | null>(null)
    const [loading, setLoading] = React.useState(true)

    const load = React.useCallback(() => {
        fetch("/api/admin/stats")
            .then((r) => r.json())
            .then((data) => { if (!data?.error) setStats(data) })
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    React.useEffect(() => {
        load()
        const interval = setInterval(load, 15000) // refresh online-users count periodically
        return () => clearInterval(interval)
    }, [load])

    return (
        <div className="flex flex-col h-full bg-bg-base overflow-y-auto">
            <div className="px-4 sm:px-6 pt-6 sm:pt-8 pb-6">
                <h1 className="text-2xl font-bold text-text-primary">Admin Dashboard</h1>
                <p className="text-text-secondary text-sm mt-0.5">Platform overview and moderation queue</p>
            </div>

            <div className="px-4 sm:px-6 pb-10 space-y-6">
                {loading || !stats ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[...Array(4)].map((_, i) => <div key={i} className="h-28 rounded-card bg-bg-hover animate-pulse" />)}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard icon={<Users size={16} />} label="Total users" value={stats.totalUsers.toLocaleString("en-IN")} />
                        <StatCard icon={<FileText size={16} />} label="Live prompts" value={stats.livePrompts.toLocaleString("en-IN")} />
                        <StatCard icon={<Clock size={16} />} label="Pending reviews" value={stats.pendingReviews.toLocaleString("en-IN")} />
                        <StatCard icon={<IndianRupee size={16} />} label="Total revenue" value={formatINR(stats.totalRevenue)} />
                    </div>
                )}

                {/* Real-time online users */}
                <div className="rounded-card border border-border bg-bg-panel p-5 flex items-center gap-3 w-fit">
                    <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                        <Circle size={10} className="relative fill-success text-success" />
                    </span>
                    <span className="text-sm text-text-secondary">
                        <span className="font-semibold text-text-primary">{loading || !stats ? "—" : stats.onlineUsers}</span> users online now
                    </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Revenue chart */}
                    <div className="lg:col-span-2 rounded-card border border-border bg-bg-panel p-5">
                        <h3 className="text-sm font-semibold text-text-primary mb-1">Revenue (last 30 days)</h3>
                        <p className="text-xs text-text-secondary mb-4">Platform-wide prompt sales</p>
                        {loading || !stats ? (
                            <div className="h-56 rounded-btn bg-bg-hover animate-pulse" />
                        ) : (
                            <div className="h-56">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={stats.revenueChart} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="adminRevenueFill" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.35} />
                                                <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid vertical={false} stroke="var(--border)" />
                                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--text-secondary)" }} axisLine={false} tickLine={false} interval={4} />
                                        <YAxis tick={{ fontSize: 12, fill: "var(--text-secondary)" }} axisLine={false} tickLine={false} />
                                        <Tooltip
                                            formatter={(value) => [formatINR(Number(value)), "Revenue"]}
                                            contentStyle={{ background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                                        />
                                        <Area type="monotone" dataKey="amount" stroke="var(--accent)" strokeWidth={2} fill="url(#adminRevenueFill)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>

                    {/* Recent signups */}
                    <div className="rounded-card border border-border bg-bg-panel overflow-hidden flex flex-col">
                        <div className="px-5 py-4 border-b border-border">
                            <h3 className="text-sm font-semibold text-text-primary">Recent signups</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto divide-y divide-border">
                            {loading || !stats ? (
                                <div className="p-5 space-y-3">
                                    {[...Array(5)].map((_, i) => <div key={i} className="h-8 rounded-btn bg-bg-hover animate-pulse" />)}
                                </div>
                            ) : stats.recentSignups.length === 0 ? (
                                <p className="text-sm text-text-secondary px-5 py-6">No signups yet</p>
                            ) : (
                                stats.recentSignups.map((u) => (
                                    <div key={u._id} className="px-5 py-3 flex items-center justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-text-primary truncate">{u.name || "Unnamed"}</p>
                                            <p className="text-xs text-text-secondary truncate">{u.email}</p>
                                        </div>
                                        <span className="text-xs text-text-secondary shrink-0">
                                            {new Date(u.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
