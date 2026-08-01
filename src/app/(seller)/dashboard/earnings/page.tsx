"use client"

import * as React from "react"
import { Wallet, IndianRupee, Check, ArrowLeftRight } from "lucide-react"

export const dynamic = 'force-dynamic'

function formatINR(n: number) {
    return `₹${n.toLocaleString("en-IN")}`
}

type Stats = {
    totalEarned: number
    payout: { available: number; nextPayoutDate: string; progressPct: number }
}

type Transaction = {
    id: string
    listingTitle: string
    price: number
    purchasedAt: string
}

function Toast({ message, onDone }: { message: string; onDone: () => void }) {
    React.useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t) }, [onDone])
    return (
        <div className="fixed bottom-6 right-6 z-[300] flex items-center gap-3 bg-accent text-white px-5 py-3 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-4 duration-300 text-sm font-semibold">
            <Check size={18} /> {message}
        </div>
    )
}

export default function EarningsPage() {
    const [stats, setStats] = React.useState<Stats | null>(null)
    const [transactions, setTransactions] = React.useState<Transaction[]>([])
    const [loading, setLoading] = React.useState(true)
    const [toast, setToast] = React.useState("")

    React.useEffect(() => {
        Promise.all([
            fetch("/api/dashboard/stats").then(r => r.json()),
            fetch("/api/dashboard/transactions").then(r => r.json()),
        ])
            .then(([statsData, txData]) => {
                if (!statsData?.error) setStats(statsData)
                if (Array.isArray(txData)) setTransactions(txData)
            })
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    return (
        <div className="flex flex-col h-full bg-bg-base overflow-y-auto">
            <div className="px-4 sm:px-6 pt-6 sm:pt-8 pb-6">
                <h1 className="text-2xl font-bold text-text-primary">Earnings</h1>
                <p className="text-text-secondary text-sm mt-0.5">Your payouts and transaction history</p>
            </div>

            <div className="px-4 sm:px-6 pb-10 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="rounded-card border border-border bg-bg-panel p-5 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-text-secondary">Total earned</span>
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-accent/10 text-accent"><IndianRupee size={16} /></div>
                        </div>
                        <p className="text-2xl font-bold text-text-primary">{loading || !stats ? "—" : formatINR(stats.totalEarned)}</p>
                    </div>

                    <div className="rounded-card border border-border bg-bg-panel p-5 flex flex-col gap-4">
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
                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-semibold text-white bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Withdraw
                        </button>
                    </div>
                </div>

                <div className="rounded-card border border-border bg-bg-panel overflow-hidden">
                    <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                        <ArrowLeftRight size={15} className="text-text-secondary" />
                        <h3 className="text-sm font-semibold text-text-primary">Transaction history</h3>
                    </div>
                    {loading ? (
                        <div className="p-5 space-y-3">
                            {[...Array(4)].map((_, i) => <div key={i} className="h-10 rounded-btn bg-bg-hover animate-pulse" />)}
                        </div>
                    ) : transactions.length === 0 ? (
                        <p className="text-sm text-text-secondary px-5 py-6">No sales yet — once a prompt sells, it&apos;ll show up here.</p>
                    ) : (
                        <div className="divide-y divide-border">
                            {transactions.map(t => (
                                <div key={t.id} className="px-5 py-3 flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-text-primary truncate">{t.listingTitle}</p>
                                        <p className="text-xs text-text-secondary mt-0.5">{new Date(t.purchasedAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}</p>
                                    </div>
                                    <span className="text-sm font-semibold text-success shrink-0">+{formatINR(t.price)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {toast && <Toast message={toast} onDone={() => setToast("")} />}
        </div>
    )
}
