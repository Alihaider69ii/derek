"use client"

import * as React from "react"
import { Wallet, IndianRupee, Check, ArrowLeftRight, X, Clock3 } from "lucide-react"

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

type PayoutRequest = {
    _id: string
    amount: number
    status: "pending" | "approved" | "paid" | "rejected"
    adminNote: string | null
    createdAt: string
    processedAt: string | null
}

const STATUS_BADGE: Record<string, string> = {
    pending: "bg-gold/10 text-gold-text border-gold/20",
    approved: "bg-accent/10 text-accent border-accent/20",
    paid: "bg-success/10 text-success border-success/20",
    rejected: "bg-danger/10 text-danger border-danger/20",
}

function Toast({ message, onDone }: { message: string; onDone: () => void }) {
    React.useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t) }, [onDone])
    return (
        <div className="fixed bottom-6 right-6 z-[300] flex items-center gap-3 bg-accent text-white px-5 py-3 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-4 duration-300 text-sm font-semibold">
            <Check size={18} /> {message}
        </div>
    )
}

function WithdrawModal({
    available, onCancel, onSubmit,
}: {
    available: number
    onCancel: () => void
    onSubmit: (amount: number, payoutDetails: string) => Promise<string | null>
}) {
    const [amount, setAmount] = React.useState(String(available))
    const [payoutDetails, setPayoutDetails] = React.useState("")
    const [error, setError] = React.useState("")
    const [submitting, setSubmitting] = React.useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const numAmount = Number(amount)
        if (!numAmount || numAmount <= 0 || numAmount > available) {
            setError(`Enter an amount between ₹1 and ${formatINR(available)}`)
            return
        }
        if (!payoutDetails.trim()) {
            setError("Enter your UPI ID or bank details")
            return
        }
        setSubmitting(true)
        const err = await onSubmit(numAmount, payoutDetails.trim())
        setSubmitting(false)
        if (err) setError(err)
    }

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-bg-panel border border-border rounded-card p-6">
                <div className="flex items-center justify-between mb-1">
                    <h3 className="text-lg font-semibold text-text-primary">Request withdrawal</h3>
                    <button onClick={onCancel} className="p-1 rounded-lg text-text-secondary hover:bg-bg-hover"><X size={18} /></button>
                </div>
                <p className="text-sm text-text-secondary mb-4">Available balance: <span className="font-semibold text-text-primary">{formatINR(available)}</span></p>
                <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                        <label className="text-xs font-medium text-text-secondary">Amount (INR)</label>
                        <input
                            type="number" min={1} max={available} value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full mt-1 h-10 rounded-btn border border-border bg-bg-input px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-text-secondary">UPI ID or bank details</label>
                        <textarea
                            value={payoutDetails} onChange={(e) => setPayoutDetails(e.target.value)}
                            placeholder="e.g. yourname@upi"
                            className="w-full mt-1 h-20 rounded-btn border border-border bg-bg-input px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent/30"
                        />
                    </div>
                    {error && <p className="text-xs text-danger">{error}</p>}
                    <div className="flex justify-end gap-3 pt-1">
                        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-btn text-sm font-medium text-text-secondary hover:bg-bg-hover transition-colors">
                            Cancel
                        </button>
                        <button
                            type="submit" disabled={submitting}
                            className="px-4 py-2 rounded-btn text-sm font-semibold text-white bg-accent hover:bg-accent-hover disabled:opacity-50 transition-colors"
                        >
                            {submitting ? "Submitting..." : "Submit request"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default function EarningsPage() {
    const [stats, setStats] = React.useState<Stats | null>(null)
    const [transactions, setTransactions] = React.useState<Transaction[]>([])
    const [payoutRequests, setPayoutRequests] = React.useState<PayoutRequest[]>([])
    const [loading, setLoading] = React.useState(true)
    const [toast, setToast] = React.useState("")
    const [showWithdraw, setShowWithdraw] = React.useState(false)

    const loadAll = React.useCallback(() => {
        Promise.all([
            fetch("/api/dashboard/stats").then(r => r.json()),
            fetch("/api/dashboard/transactions").then(r => r.json()),
            fetch("/api/dashboard/earnings/payout").then(r => r.json()),
        ])
            .then(([statsData, txData, payoutData]) => {
                if (!statsData?.error) setStats(statsData)
                if (Array.isArray(txData)) setTransactions(txData)
                if (Array.isArray(payoutData)) setPayoutRequests(payoutData)
            })
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    React.useEffect(() => { loadAll() }, [loadAll])

    const handleWithdraw = async (amount: number, payoutDetails: string): Promise<string | null> => {
        const res = await fetch("/api/dashboard/earnings/payout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ amount, payoutDetails }),
        })
        const data = await res.json()
        if (!res.ok) return data?.error || "Something went wrong"
        setShowWithdraw(false)
        setToast("Withdrawal request submitted")
        loadAll()
        return null
    }

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
                            onClick={() => setShowWithdraw(true)}
                            disabled={loading || !stats || stats.payout.available <= 0}
                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-semibold text-white bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Withdraw
                        </button>
                    </div>
                </div>

                {payoutRequests.length > 0 && (
                    <div className="rounded-card border border-border bg-bg-panel overflow-hidden">
                        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                            <Clock3 size={15} className="text-text-secondary" />
                            <h3 className="text-sm font-semibold text-text-primary">Withdrawal requests</h3>
                        </div>
                        <div className="divide-y divide-border">
                            {payoutRequests.map(p => (
                                <div key={p._id} className="px-5 py-3 flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-text-primary">{formatINR(p.amount)}</p>
                                        <p className="text-xs text-text-secondary mt-0.5">
                                            Requested {new Date(p.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                                            {p.adminNote && ` · "${p.adminNote}"`}
                                        </p>
                                    </div>
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[0.7rem] font-semibold border shrink-0 ${STATUS_BADGE[p.status]}`}>
                                        {p.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

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

            {showWithdraw && stats && (
                <WithdrawModal
                    available={stats.payout.available}
                    onCancel={() => setShowWithdraw(false)}
                    onSubmit={handleWithdraw}
                />
            )}

            {toast && <Toast message={toast} onDone={() => setToast("")} />}
        </div>
    )
}
