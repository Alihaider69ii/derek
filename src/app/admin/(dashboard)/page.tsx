"use client"

import * as React from "react"
import {
    Users, FileText, IndianRupee, Circle, UserMinus, TrendingUp, TrendingDown,
    ShoppingBag, Sparkles, Trophy, Crown,
} from "lucide-react"
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts"

export const dynamic = "force-dynamic"

function formatINR(n: number) {
    return `₹${n.toLocaleString("en-IN")}`
}

type ChurnedUser = { _id: string; name: string; email: string; lastSeenAt: string }

type Overview = {
    totalUsers: number
    totalUsersGrowthPct: number | null
    onlineUsers: number
    churnedUsers: { count: number; list: ChurnedUser[] }
    newSignups: { thisMonth: number; lastMonth: number }
    totalPrompts: number
    listingsBreakdown: { live: number; pending: number; draft: number; rejected: number }
    totalSales: number
    totalRevenue: number
    revenueTrend: { month: string; label: string; amount: number }[]
    signupsTrend: { month: string; label: string; count: number }[]
    categoryBreakdown: { category: string; count: number; revenue: number }[]
    bestSellingCategory: { category: string; revenue: number } | null
    topSellingPrompts: { _id: string; title: string; sellerName: string; category: string; salesCount: number; revenue: number }[]
    topSellers: { _id: string; name: string; email: string; promptsCount: number; salesCount: number; totalEarnings: number }[]
}

function StatCard({
    icon, label, value, sub,
}: { icon: React.ReactNode; label: string; value: string; sub?: React.ReactNode }) {
    return (
        <div className="rounded-card border border-border bg-bg-panel p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-text-secondary">{label}</span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-accent/10 text-accent">
                    {icon}
                </div>
            </div>
            <div>
                <p className="text-2xl font-bold text-text-primary">{value}</p>
                {sub && <div className="mt-1">{sub}</div>}
            </div>
        </div>
    )
}

function GrowthBadge({ pct }: { pct: number | null }) {
    if (pct === null) return <span className="text-xs text-text-secondary">No prior data</span>
    const up = pct >= 0
    return (
        <span className={`inline-flex items-center gap-1 text-xs font-semibold ${up ? "text-success" : "text-danger"}`}>
            {up ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            {Math.abs(pct).toFixed(1)}% vs last month
        </span>
    )
}

const STATUS_LABELS: Record<string, string> = { live: "Live", pending: "Pending", draft: "Draft", rejected: "Rejected" }
const STATUS_COLORS: Record<string, string> = {
    live: "bg-success/10 text-success border-success/20",
    pending: "bg-gold/10 text-gold-text border-gold/20",
    draft: "bg-bg-hover text-text-secondary border-border",
    rejected: "bg-danger/10 text-danger border-danger/20",
}

export default function AdminDashboardPage() {
    const [data, setData] = React.useState<Overview | null>(null)
    const [loading, setLoading] = React.useState(true)
    const [showChurned, setShowChurned] = React.useState(false)

    const load = React.useCallback(() => {
        fetch("/api/admin/overview")
            .then((r) => r.json())
            .then((d) => { if (!d?.error) setData(d) })
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    React.useEffect(() => {
        load()
        const interval = setInterval(load, 30000)
        return () => clearInterval(interval)
    }, [load])

    return (
        <div className="flex flex-col h-full bg-bg-base overflow-y-auto">
            <div className="px-4 sm:px-6 pt-6 sm:pt-8 pb-6">
                <h1 className="text-2xl font-bold text-text-primary">Admin Dashboard</h1>
                <p className="text-text-secondary text-sm mt-0.5">Platform overview and moderation queue</p>
            </div>

            <div className="px-4 sm:px-6 pb-10 space-y-6">
                {loading || !data ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[...Array(8)].map((_, i) => <div key={i} className="h-28 rounded-card bg-bg-hover animate-pulse" />)}
                    </div>
                ) : (
                    <>
                        {/* KPI cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <StatCard
                                icon={<Users size={16} />}
                                label="Total users"
                                value={data.totalUsers.toLocaleString("en-IN")}
                                sub={<GrowthBadge pct={data.totalUsersGrowthPct} />}
                            />
                            <StatCard
                                icon={<Circle size={16} className="fill-success text-success" />}
                                label="Active right now"
                                value={data.onlineUsers.toLocaleString("en-IN")}
                            />
                            <StatCard
                                icon={<UserMinus size={16} />}
                                label="Churned (30+ days)"
                                value={data.churnedUsers.count.toLocaleString("en-IN")}
                                sub={
                                    data.churnedUsers.count > 0 && (
                                        <button
                                            onClick={() => setShowChurned((v) => !v)}
                                            className="text-xs text-accent hover:underline font-medium"
                                        >
                                            {showChurned ? "Hide list" : "View list"}
                                        </button>
                                    )
                                }
                            />
                            <StatCard
                                icon={<Sparkles size={16} />}
                                label="New signups this month"
                                value={data.newSignups.thisMonth.toLocaleString("en-IN")}
                                sub={<span className="text-xs text-text-secondary">{data.newSignups.lastMonth.toLocaleString("en-IN")} last month</span>}
                            />
                            <StatCard
                                icon={<FileText size={16} />}
                                label="Prompt Bank prompts"
                                value={data.totalPrompts.toLocaleString("en-IN")}
                            />
                            <StatCard
                                icon={<ShoppingBag size={16} />}
                                label="Total sales (all-time)"
                                value={data.totalSales.toLocaleString("en-IN")}
                            />
                            <StatCard
                                icon={<IndianRupee size={16} />}
                                label="Total revenue (all-time)"
                                value={formatINR(data.totalRevenue)}
                            />
                            <div className="rounded-card border border-border bg-bg-panel p-5 flex flex-col gap-3">
                                <span className="text-xs font-medium text-text-secondary">Listings breakdown</span>
                                <div className="flex flex-wrap gap-1.5">
                                    {(["live", "pending", "draft", "rejected"] as const).map((k) => (
                                        <span key={k} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[0.7rem] font-semibold border ${STATUS_COLORS[k]}`}>
                                            {STATUS_LABELS[k]} {data.listingsBreakdown[k]}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Churned users list */}
                        {showChurned && (
                            <div className="rounded-card border border-border bg-bg-panel overflow-hidden">
                                <div className="px-5 py-4 border-b border-border">
                                    <h3 className="text-sm font-semibold text-text-primary">Churned users</h3>
                                    <p className="text-xs text-text-secondary mt-0.5">No activity in 30+ days · showing up to 20</p>
                                </div>
                                <div className="max-h-72 overflow-y-auto divide-y divide-border">
                                    {data.churnedUsers.list.map((u) => (
                                        <div key={u._id} className="px-5 py-3 flex items-center justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-text-primary truncate">{u.name}</p>
                                                <p className="text-xs text-text-secondary truncate">{u.email}</p>
                                            </div>
                                            <span className="text-xs text-text-secondary shrink-0">
                                                Last seen {new Date(u.lastSeenAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Trend charts */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div className="rounded-card border border-border bg-bg-panel p-5">
                                <h3 className="text-sm font-semibold text-text-primary mb-1">Revenue trend</h3>
                                <p className="text-xs text-text-secondary mb-4">Last 12 months</p>
                                <div className="h-56">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={data.revenueTrend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                                            <CartesianGrid vertical={false} stroke="var(--border)" />
                                            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--text-secondary)" }} axisLine={false} tickLine={false} />
                                            <YAxis tick={{ fontSize: 12, fill: "var(--text-secondary)" }} axisLine={false} tickLine={false} />
                                            <Tooltip
                                                formatter={(value) => [formatINR(Number(value)), "Revenue"]}
                                                contentStyle={{ background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                                            />
                                            <Line type="monotone" dataKey="amount" stroke="var(--accent)" strokeWidth={2} dot={false} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="rounded-card border border-border bg-bg-panel p-5">
                                <h3 className="text-sm font-semibold text-text-primary mb-1">Signups trend</h3>
                                <p className="text-xs text-text-secondary mb-4">Last 12 months</p>
                                <div className="h-56">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={data.signupsTrend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                                            <CartesianGrid vertical={false} stroke="var(--border)" />
                                            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--text-secondary)" }} axisLine={false} tickLine={false} />
                                            <YAxis tick={{ fontSize: 12, fill: "var(--text-secondary)" }} axisLine={false} tickLine={false} allowDecimals={false} />
                                            <Tooltip
                                                formatter={(value) => [value, "Signups"]}
                                                contentStyle={{ background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                                            />
                                            <Line type="monotone" dataKey="count" stroke="#0EA5E9" strokeWidth={2} dot={false} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* Category breakdown */}
                        <div className="rounded-card border border-border bg-bg-panel p-5">
                            <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
                                <h3 className="text-sm font-semibold text-text-primary">Category breakdown</h3>
                                {data.bestSellingCategory && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-accent/10 text-accent border border-accent/20">
                                        <Crown size={13} /> Best seller: {data.bestSellingCategory.category} ({formatINR(data.bestSellingCategory.revenue)})
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-text-secondary mb-4">Live prompts per category</p>
                            {data.categoryBreakdown.length === 0 ? (
                                <div className="h-64 flex items-center justify-center text-sm text-text-secondary">No live prompts yet</div>
                            ) : (
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={data.categoryBreakdown} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                                            <CartesianGrid vertical={false} stroke="var(--border)" />
                                            <XAxis dataKey="category" tick={{ fontSize: 11, fill: "var(--text-secondary)" }} axisLine={false} tickLine={false} />
                                            <YAxis tick={{ fontSize: 12, fill: "var(--text-secondary)" }} axisLine={false} tickLine={false} allowDecimals={false} />
                                            <Tooltip
                                                cursor={{ fill: "var(--bg-hover)" }}
                                                formatter={(value) => [value, "Live prompts"]}
                                                contentStyle={{ background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                                            />
                                            <Bar dataKey="count" fill="var(--accent)" radius={[6, 6, 0, 0]} maxBarSize={36} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </div>

                        {/* Top selling prompts */}
                        <div className="rounded-card border border-border bg-bg-panel overflow-hidden">
                            <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                                <Trophy size={15} className="text-accent" />
                                <h3 className="text-sm font-semibold text-text-primary">Top selling prompts</h3>
                            </div>
                            {data.topSellingPrompts.length === 0 ? (
                                <p className="text-sm text-text-secondary px-5 py-6">No sales yet</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-left text-[0.7rem] uppercase tracking-wider text-text-secondary">
                                                <th className="px-5 py-3 font-semibold">Prompt</th>
                                                <th className="px-5 py-3 font-semibold">Seller</th>
                                                <th className="px-5 py-3 font-semibold">Category</th>
                                                <th className="px-5 py-3 font-semibold">Sales</th>
                                                <th className="px-5 py-3 font-semibold">Revenue</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.topSellingPrompts.map((p) => (
                                                <tr key={p._id} className="border-t border-border hover:bg-bg-hover/50 transition-colors">
                                                    <td className="px-5 py-3.5 font-medium text-text-primary truncate max-w-[240px]">{p.title}</td>
                                                    <td className="px-5 py-3.5 text-text-secondary">{p.sellerName}</td>
                                                    <td className="px-5 py-3.5 text-text-secondary">{p.category}</td>
                                                    <td className="px-5 py-3.5 text-text-secondary">{p.salesCount}</td>
                                                    <td className="px-5 py-3.5 font-medium text-text-primary">{formatINR(p.revenue)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Top sellers */}
                        <div className="rounded-card border border-border bg-bg-panel overflow-hidden">
                            <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                                <Crown size={15} className="text-accent" />
                                <h3 className="text-sm font-semibold text-text-primary">Top sellers</h3>
                            </div>
                            {data.topSellers.length === 0 ? (
                                <p className="text-sm text-text-secondary px-5 py-6">No sales yet</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-left text-[0.7rem] uppercase tracking-wider text-text-secondary">
                                                <th className="px-5 py-3 font-semibold">Seller</th>
                                                <th className="px-5 py-3 font-semibold">Prompts</th>
                                                <th className="px-5 py-3 font-semibold">Sales</th>
                                                <th className="px-5 py-3 font-semibold">Earnings</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.topSellers.map((s) => (
                                                <tr key={s._id} className="border-t border-border hover:bg-bg-hover/50 transition-colors">
                                                    <td className="px-5 py-3.5">
                                                        <p className="font-medium text-text-primary truncate max-w-[220px]">{s.name}</p>
                                                        <p className="text-xs text-text-secondary truncate max-w-[220px]">{s.email}</p>
                                                    </td>
                                                    <td className="px-5 py-3.5 text-text-secondary">{s.promptsCount}</td>
                                                    <td className="px-5 py-3.5 text-text-secondary">{s.salesCount}</td>
                                                    <td className="px-5 py-3.5 font-medium text-text-primary">{formatINR(s.totalEarnings)}</td>
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
