"use client"

import * as React from "react"
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts"
import { Users, FileText, ShoppingBag, Eye, ChevronRight } from "lucide-react"

export const dynamic = "force-dynamic"

type Granularity = "daily" | "weekly" | "monthly"

type Analytics = {
    granularity: Granularity
    revenueTrend: { label: string; amount: number }[]
    userGrowthTrend: { label: string; count: number }[]
    categoryPopularity: { category: string; count: number; revenue: number }[]
    funnel: { visitors: number; signups: number; firstPromptCreated: number; firstSale: number }
}

function formatINR(n: number) {
    return `₹${n.toLocaleString("en-IN")}`
}

const GRANULARITY_TABS: { value: Granularity; label: string }[] = [
    { value: "daily", label: "Daily (30d)" },
    { value: "weekly", label: "Weekly (12w)" },
    { value: "monthly", label: "Monthly (12mo)" },
]

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
    return (
        <div className="rounded-card border border-border bg-bg-panel p-5">
            <h3 className="text-sm font-semibold text-text-primary mb-1">{title}</h3>
            <p className="text-xs text-text-secondary mb-4">{subtitle}</p>
            {children}
        </div>
    )
}

function FunnelStage({
    icon, label, value, pctOfPrevious, isFirst,
}: { icon: React.ReactNode; label: string; value: number; pctOfPrevious: number | null; isFirst: boolean }) {
    return (
        <div className="flex items-center gap-3">
            {!isFirst && <ChevronRight size={16} className="text-text-secondary shrink-0 hidden sm:block" />}
            <div className="flex-1 rounded-btn border border-border bg-bg-panel p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-accent/10 text-accent shrink-0">{icon}</div>
                <div className="min-w-0">
                    <p className="text-xs text-text-secondary">{label}</p>
                    <p className="text-lg font-bold text-text-primary">{value.toLocaleString("en-IN")}</p>
                    {pctOfPrevious !== null && (
                        <p className="text-[0.7rem] text-text-secondary">{pctOfPrevious}% of previous stage</p>
                    )}
                </div>
            </div>
        </div>
    )
}

export default function AdminAnalyticsPage() {
    const [data, setData] = React.useState<Analytics | null>(null)
    const [loading, setLoading] = React.useState(true)
    const [granularity, setGranularity] = React.useState<Granularity>("daily")

    React.useEffect(() => {
        setLoading(true)
        fetch(`/api/admin/analytics?granularity=${granularity}`)
            .then((r) => r.json())
            .then((d) => { if (!d?.error) setData(d) })
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [granularity])

    const funnel = data?.funnel
    const stages = funnel ? [
        { key: "visitors", label: "Visitors", value: funnel.visitors, icon: <Eye size={16} /> },
        { key: "signups", label: "Signups", value: funnel.signups, icon: <Users size={16} /> },
        { key: "firstPromptCreated", label: "First prompt created", value: funnel.firstPromptCreated, icon: <FileText size={16} /> },
        { key: "firstSale", label: "First sale", value: funnel.firstSale, icon: <ShoppingBag size={16} /> },
    ] : []

    return (
        <div className="flex flex-col h-full bg-bg-base overflow-y-auto">
            <div className="px-4 sm:px-6 pt-6 sm:pt-8 pb-6 flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Analytics</h1>
                    <p className="text-text-secondary text-sm mt-0.5">Growth, revenue, and conversion</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                    {GRANULARITY_TABS.map((t) => (
                        <button
                            key={t.value}
                            onClick={() => setGranularity(t.value)}
                            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${granularity === t.value ? "bg-accent text-white border-accent" : "border-border text-text-secondary hover:text-text-primary hover:bg-bg-hover"}`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="px-4 sm:px-6 pb-10 space-y-4">
                <div className="rounded-card border border-border bg-bg-panel p-5">
                    <h3 className="text-sm font-semibold text-text-primary mb-1">Conversion funnel</h3>
                    <p className="text-xs text-text-secondary mb-4">
                        All-time. Visitor tracking started with this dashboard, so early cohorts won&apos;t have visitor data.
                    </p>
                    {loading || !funnel ? (
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                            {[...Array(4)].map((_, i) => <div key={i} className="h-20 rounded-btn bg-bg-hover animate-pulse" />)}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 sm:gap-1">
                            {stages.map((s, i) => (
                                <FunnelStage
                                    key={s.key}
                                    icon={s.icon}
                                    label={s.label}
                                    value={s.value}
                                    isFirst={i === 0}
                                    pctOfPrevious={i === 0 ? null : (stages[i - 1].value > 0 ? Math.round((s.value / stages[i - 1].value) * 100) : 0)}
                                />
                            ))}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <ChartCard title="Revenue trend" subtitle={`Marketplace revenue, ${granularity}`}>
                        {loading || !data ? (
                            <div className="h-64 rounded-btn bg-bg-hover animate-pulse" />
                        ) : (
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={data.revenueTrend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                                        <CartesianGrid vertical={false} stroke="var(--border)" />
                                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--text-secondary)" }} axisLine={false} tickLine={false} interval={Math.ceil(data.revenueTrend.length / 8)} />
                                        <YAxis tick={{ fontSize: 12, fill: "var(--text-secondary)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                                        <Tooltip
                                            formatter={(value) => [formatINR(Number(value)), "Revenue"]}
                                            contentStyle={{ background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                                        />
                                        <Line type="monotone" dataKey="amount" stroke="var(--accent)" strokeWidth={2} dot={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </ChartCard>

                    <ChartCard title="User growth" subtitle={`New signups, ${granularity}`}>
                        {loading || !data ? (
                            <div className="h-64 rounded-btn bg-bg-hover animate-pulse" />
                        ) : (
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={data.userGrowthTrend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                                        <CartesianGrid vertical={false} stroke="var(--border)" />
                                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--text-secondary)" }} axisLine={false} tickLine={false} interval={Math.ceil(data.userGrowthTrend.length / 8)} />
                                        <YAxis tick={{ fontSize: 12, fill: "var(--text-secondary)" }} axisLine={false} tickLine={false} allowDecimals={false} />
                                        <Tooltip
                                            formatter={(value) => [value, "Signups"]}
                                            contentStyle={{ background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                                        />
                                        <Line type="monotone" dataKey="count" stroke="var(--accent2)" strokeWidth={2} dot={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </ChartCard>
                </div>

                <ChartCard title="Category popularity" subtitle={`Top categories by revenue, this ${granularity === "daily" ? "30-day" : granularity === "weekly" ? "12-week" : "12-month"} window`}>
                    {loading || !data ? (
                        <div className="h-64 rounded-btn bg-bg-hover animate-pulse" />
                    ) : data.categoryPopularity.length === 0 ? (
                        <div className="h-64 flex items-center justify-center text-sm text-text-secondary">No sales in this window yet</div>
                    ) : (
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.categoryPopularity} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                                    <CartesianGrid vertical={false} stroke="var(--border)" />
                                    <XAxis dataKey="category" tick={{ fontSize: 11, fill: "var(--text-secondary)" }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 12, fill: "var(--text-secondary)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                                    <Tooltip
                                        formatter={(value, name) => [name === "revenue" ? formatINR(Number(value)) : value, name === "revenue" ? "Revenue" : "Sales"]}
                                        contentStyle={{ background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                                    />
                                    <Bar dataKey="revenue" fill="var(--accent)" radius={[6, 6, 0, 0]} maxBarSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </ChartCard>
            </div>
        </div>
    )
}
