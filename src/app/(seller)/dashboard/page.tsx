"use client"

import * as React from "react"
import Link from "next/link"
import {
    Plus, IndianRupee, ShoppingBag, FileText, Star,
    ArrowUpRight, Clock, Wallet, Check,
} from "lucide-react"
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts"

export const dynamic = 'force-dynamic'

function formatINR(n: number) {
    return `₹${n.toLocaleString("en-IN")}`
}

type Stats = {
    totalEarned: number
    earnedGrowthPct: number
    totalSales: number
    salesThisWeek: number
    activePrompts: number
    pendingReview: number
    avgRating: number | null
    chart: { date: string; label: string; amount: number }[]
    payout: { available: number; nextPayoutDate: string; progressPct: number }
}

type Listing = {
    _id: string
    title: string
    price: number
    isFree: boolean
    status: "draft" | "pending_review" | "live" | "rejected"
    sales: number
    revenue: number
    rating: number
    createdAt: string
}

function StatCard({
    icon, label, value, delta, deltaTone,
}: {
    icon: React.ReactNode
    label: string
    value: string
    delta: string
    deltaTone: "green" | "orange"
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
            <span
                className={`inline-flex w-fit items-center gap-1 text-[0.7rem] font-semibold px-2 py-0.5 rounded-full ${deltaTone === "green"
                    ? "bg-success/10 text-success"
                    : "bg-orange-500/10 text-orange-600"
                    }`}
            >
                {deltaTone === "green" ? <ArrowUpRight size={11} /> : <Clock size={11} />}
                {delta}
            </span>
        </div>
    )
}

function StatusBadge({ status }: { status: Listing["status"] }) {
    if (status === "live") {
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[0.7rem] font-semibold bg-success/10 text-success border border-success/20">Live</span>
    }
    if (status === "pending_review") {
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[0.7rem] font-semibold bg-orange-500/10 text-orange-600 border border-orange-500/20">Review</span>
    }
    if (status === "rejected") {
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[0.7rem] font-semibold bg-danger/10 text-danger border border-danger/20">Rejected</span>
    }
    return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[0.7rem] font-semibold bg-bg-hover text-text-secondary border border-border">Draft</span>
}

function Toast({ message, onDone }: { message: string; onDone: () => void }) {
    React.useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t) }, [onDone])
    return (
        <div className="fixed bottom-6 right-6 z-[300] flex items-center gap-3 bg-accent text-white px-5 py-3 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-4 duration-300 text-sm font-semibold">
            <Check size={18} /> {message}
        </div>
    )
}

export default function SellerDashboardPage() {
    const [stats, setStats] = React.useState<Stats | null>(null)
    const [listings, setListings] = React.useState<Listing[]>([])
    const [loading, setLoading] = React.useState(true)
    const [toast, setToast] = React.useState("")

    React.useEffect(() => {
        Promise.all([
            fetch("/api/dashboard/stats").then(r => r.json()),
            fetch("/api/dashboard/listings").then(r => r.json()),
        ])
            .then(([statsData, listingsData]) => {
                if (!statsData?.error) setStats(statsData)
                if (Array.isArray(listingsData)) setListings(listingsData)
            })
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    const maxAmount = Math.max(1, ...(stats?.chart.map(c => c.amount) || [1]))

    return (
        <div className="flex flex-col h-full bg-bg-base overflow-y-auto">
            {/* Header */}
            <div className="px-4 sm:px-6 pt-6 sm:pt-8 pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
                    <p className="text-text-secondary text-sm mt-0.5">Track your prompt sales and earnings</p>
                </div>
                <Link href="/sell/new" className="shrink-0">
                    <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white bg-accent hover:bg-accent-hover transition-colors">
                        <Plus size={16} /> New prompt
                    </button>
                </Link>
            </div>

            <div className="px-4 sm:px-6 pb-10 space-y-6">
                {/* Stat cards */}
                {loading || !stats ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[...Array(4)].map((_, i) => <div key={i} className="h-32 rounded-card bg-bg-hover animate-pulse" />)}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard
                            icon={<IndianRupee size={16} />}
                            label="Total earned"
                            value={formatINR(stats.totalEarned)}
                            delta={`${stats.earnedGrowthPct >= 0 ? "+" : ""}${stats.earnedGrowthPct}% this month`}
                            deltaTone="green"
                        />
                        <StatCard
                            icon={<ShoppingBag size={16} />}
                            label="Total sales"
                            value={stats.totalSales.toLocaleString("en-IN")}
                            delta={`+${stats.salesThisWeek} this week`}
                            deltaTone="green"
                        />
                        <StatCard
                            icon={<FileText size={16} />}
                            label="Active prompts"
                            value={stats.activePrompts.toLocaleString("en-IN")}
                            delta={`${stats.pendingReview} pending review`}
                            deltaTone="orange"
                        />
                        <StatCard
                            icon={<Star size={16} />}
                            label="Avg rating"
                            value={stats.avgRating !== null ? stats.avgRating.toFixed(1) : "—"}
                            delta={stats.avgRating !== null ? `${stats.avgRating.toFixed(1)} this month` : "No ratings yet"}
                            deltaTone="green"
                        />
                    </div>
                )}

                {/* Chart + Payout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2 rounded-card border border-border bg-bg-panel p-5">
                        <h3 className="text-sm font-semibold text-text-primary mb-1">Earnings (last 7 days)</h3>
                        <p className="text-xs text-text-secondary mb-4">Daily revenue from prompt sales</p>
                        {loading || !stats ? (
                            <div className="h-56 rounded-btn bg-bg-hover animate-pulse" />
                        ) : (
                            <div className="h-56">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={stats.chart} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                                        <CartesianGrid vertical={false} stroke="var(--border)" />
                                        <XAxis dataKey="label" tick={{ fontSize: 12, fill: "var(--text-secondary)" }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 12, fill: "var(--text-secondary)" }} axisLine={false} tickLine={false} domain={[0, maxAmount * 1.2]} />
                                        <Tooltip
                                            cursor={{ fill: "var(--bg-hover)" }}
                                            formatter={(value) => [formatINR(Number(value)), "Earnings"]}
                                            contentStyle={{ background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                                        />
                                        <Bar dataKey="amount" fill="var(--accent)" radius={[6, 6, 0, 0]} maxBarSize={40} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>

                    {/* Payout card */}
                    <div id="payout" className="rounded-card border border-border bg-bg-panel p-5 flex flex-col gap-4 scroll-mt-6">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-accent/10 text-accent">
                            <Wallet size={18} />
                        </div>
                        <div>
                            <p className="text-xs text-text-secondary">Available to withdraw</p>
                            <p className="text-2xl font-bold text-text-primary mt-1">
                                {loading || !stats ? "—" : formatINR(stats.payout.available)}
                            </p>
                        </div>
                        <div>
                            <div className="h-2 rounded-full bg-bg-hover overflow-hidden">
                                <div
                                    className="h-full bg-accent rounded-full transition-all"
                                    style={{ width: `${loading || !stats ? 0 : stats.payout.progressPct}%` }}
                                />
                            </div>
                            <p className="text-xs text-text-secondary mt-2">
                                Next payout: {loading || !stats ? "—" : stats.payout.nextPayoutDate}
                            </p>
                        </div>
                        <button
                            onClick={() => setToast("Withdrawal requests are coming soon")}
                            disabled={loading || !stats || stats.payout.available <= 0}
                            className="w-full mt-auto flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-semibold text-white bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Withdraw
                        </button>
                    </div>
                </div>

                {/* Top Prompts table */}
                <div id="top-prompts" className="rounded-card border border-border bg-bg-panel overflow-hidden scroll-mt-6">
                    <div className="px-5 py-4 border-b border-border">
                        <h3 className="text-sm font-semibold text-text-primary">Top prompts</h3>
                    </div>

                    {loading ? (
                        <div className="p-5 space-y-3">
                            {[...Array(4)].map((_, i) => <div key={i} className="h-12 rounded-btn bg-bg-hover animate-pulse" />)}
                        </div>
                    ) : listings.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-5">
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-accent/10 text-accent">
                                <FileText size={24} />
                            </div>
                            <div>
                                <p className="text-text-primary font-semibold">No prompts listed yet</p>
                                <p className="text-text-secondary text-sm mt-1">List your first prompt to start earning</p>
                            </div>
                            <Link href="/sell/new">
                                <button className="mt-1 px-6 py-2.5 rounded-full text-sm font-semibold text-white bg-accent hover:bg-accent-hover transition-colors">
                                    + New prompt
                                </button>
                            </Link>
                        </div>
                    ) : (
                        <>
                            {/* Desktop table */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-[0.7rem] uppercase tracking-wider text-text-secondary">
                                            <th className="px-5 py-3 font-semibold">Prompt</th>
                                            <th className="px-5 py-3 font-semibold">Sales</th>
                                            <th className="px-5 py-3 font-semibold">Revenue</th>
                                            <th className="px-5 py-3 font-semibold">Rating</th>
                                            <th className="px-5 py-3 font-semibold">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {listings.map(l => (
                                            <tr key={l._id} className="border-t border-border hover:bg-bg-hover/50 transition-colors">
                                                <td className="px-5 py-3.5 font-medium text-text-primary max-w-[280px] truncate">{l.title}</td>
                                                <td className="px-5 py-3.5 text-text-secondary">{l.sales}</td>
                                                <td className="px-5 py-3.5 text-text-secondary">{formatINR(l.revenue)}</td>
                                                <td className="px-5 py-3.5 text-text-secondary">
                                                    <span className="inline-flex items-center gap-1">
                                                        <Star size={12} className="text-orange-400 fill-orange-400" /> {l.rating.toFixed(1)}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5"><StatusBadge status={l.status} /></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile cards */}
                            <div className="md:hidden divide-y divide-border">
                                {listings.map(l => (
                                    <div key={l._id} className="px-5 py-4 flex flex-col gap-2">
                                        <div className="flex items-start justify-between gap-2">
                                            <span className="font-medium text-text-primary text-sm truncate">{l.title}</span>
                                            <StatusBadge status={l.status} />
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-text-secondary">
                                            <span>{l.sales} sales</span>
                                            <span>{formatINR(l.revenue)}</span>
                                            <span className="inline-flex items-center gap-1">
                                                <Star size={11} className="text-orange-400 fill-orange-400" /> {l.rating.toFixed(1)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {toast && <Toast message={toast} onDone={() => setToast("")} />}
        </div>
    )
}
