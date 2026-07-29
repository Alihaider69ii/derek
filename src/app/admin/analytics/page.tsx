"use client"

import * as React from "react"
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
    PieChart, Pie, Cell, Legend,
} from "recharts"

export const dynamic = "force-dynamic"

const PIE_COLORS = ["#2E5BFF", "#0EA5E9", "#EC4899", "#84CC16", "#F59E0B", "#10B981", "#8B5CF6"]

type Analytics = {
    signupsChart: { date: string; label: string; count: number }[]
    categoryBreakdown: { category: string; count: number }[]
}

export default function AdminAnalyticsPage() {
    const [data, setData] = React.useState<Analytics | null>(null)
    const [loading, setLoading] = React.useState(true)

    React.useEffect(() => {
        fetch("/api/admin/analytics")
            .then((r) => r.json())
            .then((d) => { if (!d?.error) setData(d) })
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    return (
        <div className="flex flex-col h-full bg-bg-base overflow-y-auto">
            <div className="px-4 sm:px-6 pt-6 sm:pt-8 pb-6">
                <h1 className="text-2xl font-bold text-text-primary">Analytics</h1>
                <p className="text-text-secondary text-sm mt-0.5">Growth and marketplace composition</p>
            </div>

            <div className="px-4 sm:px-6 pb-10 grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 rounded-card border border-border bg-bg-panel p-5">
                    <h3 className="text-sm font-semibold text-text-primary mb-1">New signups (last 30 days)</h3>
                    <p className="text-xs text-text-secondary mb-4">Daily user registrations</p>
                    {loading || !data ? (
                        <div className="h-64 rounded-btn bg-bg-hover animate-pulse" />
                    ) : (
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.signupsChart} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                                    <CartesianGrid vertical={false} stroke="var(--border)" />
                                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--text-secondary)" }} axisLine={false} tickLine={false} interval={4} />
                                    <YAxis tick={{ fontSize: 12, fill: "var(--text-secondary)" }} axisLine={false} tickLine={false} allowDecimals={false} />
                                    <Tooltip
                                        cursor={{ fill: "var(--bg-hover)" }}
                                        formatter={(value) => [value, "Signups"]}
                                        contentStyle={{ background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                                    />
                                    <Bar dataKey="count" fill="var(--accent)" radius={[6, 6, 0, 0]} maxBarSize={24} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                <div className="rounded-card border border-border bg-bg-panel p-5">
                    <h3 className="text-sm font-semibold text-text-primary mb-1">Live prompts by category</h3>
                    <p className="text-xs text-text-secondary mb-4">Marketplace composition</p>
                    {loading || !data ? (
                        <div className="h-64 rounded-btn bg-bg-hover animate-pulse" />
                    ) : data.categoryBreakdown.length === 0 ? (
                        <div className="h-64 flex items-center justify-center text-sm text-text-secondary">No live prompts yet</div>
                    ) : (
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={data.categoryBreakdown} dataKey="count" nameKey="category" innerRadius={45} outerRadius={75} paddingAngle={2}>
                                        {data.categoryBreakdown.map((_, i) => (
                                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                                    <Legend wrapperStyle={{ fontSize: 11 }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
