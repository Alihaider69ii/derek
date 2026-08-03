"use client"

import * as React from "react"
import { Wallet, Check, X, Banknote, ChevronLeft, ChevronRight } from "lucide-react"

export const dynamic = "force-dynamic"

type Payout = {
    _id: string
    sellerName?: string
    sellerEmail?: string
    amount: number
    payoutDetails?: string
    status: "pending" | "approved" | "paid" | "rejected"
    adminNote?: string
    createdAt: string
    processedAt?: string
}

function formatINR(n: number) {
    return `₹${n.toLocaleString("en-IN")}`
}

const STATUS_TABS = [
    { value: "all", label: "All" },
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "paid", label: "Paid" },
    { value: "rejected", label: "Rejected" },
] as const

const STATUS_BADGE: Record<string, string> = {
    pending: "bg-gold/10 text-gold-text border-gold/20",
    approved: "bg-accent/10 text-accent border-accent/20",
    paid: "bg-success/10 text-success border-success/20",
    rejected: "bg-danger/10 text-danger border-danger/20",
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="rounded-card border border-border bg-bg-panel p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-text-secondary">{label}</span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-accent/10 text-accent">{icon}</div>
            </div>
            <p className="text-2xl font-bold text-text-primary">{value}</p>
        </div>
    )
}

function RejectModal({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: (note: string) => void }) {
    const [note, setNote] = React.useState("")
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-bg-panel border border-border rounded-card p-6">
                <h3 className="text-lg font-semibold text-text-primary">Reject withdrawal</h3>
                <p className="text-sm text-text-secondary mt-1 mb-4">Give a reason — this will be sent to the seller.</p>
                <textarea
                    autoFocus value={note} onChange={(e) => setNote(e.target.value)}
                    className="w-full h-24 rounded-btn border border-border bg-bg-input px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
                />
                <div className="flex justify-end gap-3 mt-5">
                    <button onClick={onCancel} className="px-4 py-2 rounded-btn text-sm font-medium text-text-secondary hover:bg-bg-hover transition-colors">Cancel</button>
                    <button
                        onClick={() => note.trim() && onConfirm(note.trim())}
                        disabled={!note.trim()}
                        className="px-4 py-2 rounded-btn text-sm font-semibold text-white bg-danger hover:bg-danger/90 disabled:opacity-50 transition-colors"
                    >
                        Reject
                    </button>
                </div>
            </div>
        </div>
    )
}

export default function AdminPayoutsPage() {
    const [payouts, setPayouts] = React.useState<Payout[]>([])
    const [totalPendingAmount, setTotalPendingAmount] = React.useState(0)
    const [total, setTotal] = React.useState(0)
    const [page, setPage] = React.useState(1)
    const [status, setStatus] = React.useState("all")
    const [loading, setLoading] = React.useState(true)
    const [busyId, setBusyId] = React.useState<string | null>(null)
    const [rejectTarget, setRejectTarget] = React.useState<Payout | null>(null)

    const load = React.useCallback((s: string, p: number) => {
        setLoading(true)
        const params = new URLSearchParams()
        if (s !== "all") params.set("status", s)
        params.set("page", String(p))
        fetch(`/api/admin/payouts?${params.toString()}`)
            .then((r) => r.json())
            .then((data) => {
                setPayouts(data.payouts || [])
                setTotal(data.total || 0)
                setTotalPendingAmount(data.totalPendingAmount || 0)
            })
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    React.useEffect(() => { load(status, page) }, [status, page]) // eslint-disable-line react-hooks/exhaustive-deps

    const changeStatus = (s: string) => { setStatus(s); setPage(1) }

    const act = async (id: string, action: "approve" | "reject" | "mark_paid", note?: string) => {
        setBusyId(id)
        try {
            const res = await fetch(`/api/admin/payouts/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action, note }),
            })
            if (res.ok) load(status, page)
        } finally {
            setBusyId(null)
            setRejectTarget(null)
        }
    }

    const totalPages = Math.max(1, Math.ceil(total / 20))

    return (
        <div className="flex flex-col h-full bg-bg-base overflow-y-auto">
            <div className="px-4 sm:px-6 pt-6 sm:pt-8 pb-6">
                <h1 className="text-2xl font-bold text-text-primary">Payouts</h1>
                <p className="text-text-secondary text-sm mt-0.5">Seller withdrawal requests</p>
            </div>

            <div className="px-4 sm:px-6 pb-10 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
                    <StatCard icon={<Wallet size={16} />} label="Total pending amount" value={formatINR(totalPendingAmount)} />
                    <StatCard icon={<Banknote size={16} />} label="Total requests" value={String(total)} />
                </div>

                <div className="flex flex-wrap gap-1.5">
                    {STATUS_TABS.map((t) => (
                        <button
                            key={t.value}
                            onClick={() => changeStatus(t.value)}
                            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${status === t.value ? "bg-accent text-white border-accent" : "border-border text-text-secondary hover:text-text-primary hover:bg-bg-hover"}`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                <div className="rounded-card border border-border bg-bg-panel overflow-hidden">
                    {loading ? (
                        <div className="p-5 space-y-3">
                            {[...Array(5)].map((_, i) => <div key={i} className="h-14 rounded-btn bg-bg-hover animate-pulse" />)}
                        </div>
                    ) : payouts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-5">
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-accent/10 text-accent">
                                <Wallet size={24} />
                            </div>
                            <p className="text-text-primary font-semibold">No payout requests found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-[0.7rem] uppercase tracking-wider text-text-secondary">
                                        <th className="px-5 py-3 font-semibold">Seller</th>
                                        <th className="px-5 py-3 font-semibold">Amount</th>
                                        <th className="px-5 py-3 font-semibold">Payout details</th>
                                        <th className="px-5 py-3 font-semibold">Status</th>
                                        <th className="px-5 py-3 font-semibold">Requested</th>
                                        <th className="px-5 py-3 font-semibold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payouts.map((p) => (
                                        <tr key={p._id} className="border-t border-border hover:bg-bg-hover/50 transition-colors">
                                            <td className="px-5 py-3.5">
                                                <p className="font-medium text-text-primary">{p.sellerName || "—"}</p>
                                                <p className="text-xs text-text-secondary">{p.sellerEmail}</p>
                                            </td>
                                            <td className="px-5 py-3.5 font-semibold text-text-primary">{formatINR(p.amount)}</td>
                                            <td className="px-5 py-3.5 text-text-secondary max-w-[200px] truncate">{p.payoutDetails || "—"}</td>
                                            <td className="px-5 py-3.5">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[0.7rem] font-semibold border ${STATUS_BADGE[p.status]}`}>
                                                    {p.status}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-text-secondary">
                                                {new Date(p.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex justify-end items-center gap-2 flex-wrap">
                                                    {p.status === "pending" && (
                                                        <>
                                                            <button
                                                                onClick={() => act(p._id, "approve")}
                                                                disabled={busyId === p._id}
                                                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-btn text-xs font-semibold text-white bg-success hover:bg-success/90 disabled:opacity-50 transition-colors"
                                                            >
                                                                <Check size={13} /> Approve
                                                            </button>
                                                            <button
                                                                onClick={() => setRejectTarget(p)}
                                                                disabled={busyId === p._id}
                                                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-btn text-xs font-semibold text-white bg-danger hover:bg-danger/90 disabled:opacity-50 transition-colors"
                                                            >
                                                                <X size={13} /> Reject
                                                            </button>
                                                        </>
                                                    )}
                                                    {p.status === "approved" && (
                                                        <button
                                                            onClick={() => act(p._id, "mark_paid")}
                                                            disabled={busyId === p._id}
                                                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-btn text-xs font-semibold text-white bg-accent hover:bg-accent-hover disabled:opacity-50 transition-colors"
                                                        >
                                                            <Banknote size={13} /> Mark paid
                                                        </button>
                                                    )}
                                                </div>
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
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
                                className="p-1.5 rounded-btn border border-border text-text-secondary hover:bg-bg-hover disabled:opacity-40 transition-colors"
                            ><ChevronLeft size={15} /></button>
                            <button
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                                className="p-1.5 rounded-btn border border-border text-text-secondary hover:bg-bg-hover disabled:opacity-40 transition-colors"
                            ><ChevronRight size={15} /></button>
                        </div>
                    </div>
                )}
            </div>

            {rejectTarget && (
                <RejectModal onCancel={() => setRejectTarget(null)} onConfirm={(note) => act(rejectTarget._id, "reject", note)} />
            )}
        </div>
    )
}
