"use client"

import * as React from "react"
import { Check, X, FileCheck } from "lucide-react"

export const dynamic = "force-dynamic"

type Review = {
    _id: string
    title: string
    sellerUsername: string
    category: string
    price: number
    isFree: boolean
    submittedAt: string
}

function formatINR(n: number) {
    return `₹${n.toLocaleString("en-IN")}`
}

function RejectModal({ title, onCancel, onConfirm }: { title: string; onCancel: () => void; onConfirm: (reason: string) => void }) {
    const [reason, setReason] = React.useState("")
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-bg-panel border border-border rounded-card p-6">
                <h3 className="text-lg font-semibold text-text-primary">Reject prompt</h3>
                <p className="text-sm text-text-secondary mt-1 mb-4">
                    Give a reason for rejecting <span className="font-medium text-text-primary">&ldquo;{title}&rdquo;</span>. This will be sent to the seller.
                </p>
                <textarea
                    autoFocus
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g. Prompt text is too vague, doesn't meet quality guidelines..."
                    className="w-full h-28 rounded-btn border border-border bg-bg-input px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
                />
                <div className="flex justify-end gap-3 mt-5">
                    <button onClick={onCancel} className="px-4 py-2 rounded-btn text-sm font-medium text-text-secondary hover:bg-bg-hover transition-colors">
                        Cancel
                    </button>
                    <button
                        onClick={() => reason.trim() && onConfirm(reason.trim())}
                        disabled={!reason.trim()}
                        className="px-4 py-2 rounded-btn text-sm font-semibold text-white bg-danger hover:bg-danger/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Reject prompt
                    </button>
                </div>
            </div>
        </div>
    )
}

export default function AdminReviewsPage() {
    const [reviews, setReviews] = React.useState<Review[]>([])
    const [loading, setLoading] = React.useState(true)
    const [busyId, setBusyId] = React.useState<string | null>(null)
    const [rejectTarget, setRejectTarget] = React.useState<Review | null>(null)

    const load = React.useCallback(() => {
        setLoading(true)
        fetch("/api/admin/reviews")
            .then((r) => r.json())
            .then((data) => { if (Array.isArray(data)) setReviews(data) })
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    React.useEffect(() => { load() }, [load])

    const approve = async (id: string) => {
        setBusyId(id)
        try {
            const res = await fetch(`/api/admin/reviews/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "approve" }),
            })
            if (res.ok) setReviews((prev) => prev.filter((r) => r._id !== id))
        } finally {
            setBusyId(null)
        }
    }

    const reject = async (id: string, reason: string) => {
        setBusyId(id)
        try {
            const res = await fetch(`/api/admin/reviews/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "reject", reason }),
            })
            if (res.ok) setReviews((prev) => prev.filter((r) => r._id !== id))
        } finally {
            setBusyId(null)
            setRejectTarget(null)
        }
    }

    return (
        <div className="flex flex-col h-full bg-bg-base overflow-y-auto">
            <div className="px-4 sm:px-6 pt-6 sm:pt-8 pb-6">
                <h1 className="text-2xl font-bold text-text-primary">Prompt Reviews</h1>
                <p className="text-text-secondary text-sm mt-0.5">Approve or reject prompts submitted for the marketplace</p>
            </div>

            <div className="px-4 sm:px-6 pb-10">
                <div className="rounded-card border border-border bg-bg-panel overflow-hidden">
                    {loading ? (
                        <div className="p-5 space-y-3">
                            {[...Array(4)].map((_, i) => <div key={i} className="h-14 rounded-btn bg-bg-hover animate-pulse" />)}
                        </div>
                    ) : reviews.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-5">
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-accent/10 text-accent">
                                <FileCheck size={24} />
                            </div>
                            <div>
                                <p className="text-text-primary font-semibold">Nothing pending review</p>
                                <p className="text-text-secondary text-sm mt-1">New prompt submissions will show up here</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Desktop table */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-[0.7rem] uppercase tracking-wider text-text-secondary">
                                            <th className="px-5 py-3 font-semibold">Prompt</th>
                                            <th className="px-5 py-3 font-semibold">Submitted by</th>
                                            <th className="px-5 py-3 font-semibold">Category</th>
                                            <th className="px-5 py-3 font-semibold">Price</th>
                                            <th className="px-5 py-3 font-semibold">Submitted</th>
                                            <th className="px-5 py-3 font-semibold text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reviews.map((r) => (
                                            <tr key={r._id} className="border-t border-border hover:bg-bg-hover/50 transition-colors">
                                                <td className="px-5 py-3.5 font-medium text-text-primary max-w-[240px] truncate">{r.title}</td>
                                                <td className="px-5 py-3.5 text-text-secondary">@{r.sellerUsername}</td>
                                                <td className="px-5 py-3.5 text-text-secondary">{r.category}</td>
                                                <td className="px-5 py-3.5 text-text-secondary">{r.isFree ? "Free" : formatINR(r.price)}</td>
                                                <td className="px-5 py-3.5 text-text-secondary">{new Date(r.submittedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</td>
                                                <td className="px-5 py-3.5">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => approve(r._id)}
                                                            disabled={busyId === r._id}
                                                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-btn text-xs font-semibold text-white bg-success hover:bg-success/90 disabled:opacity-50 transition-colors"
                                                        >
                                                            <Check size={13} /> Approve
                                                        </button>
                                                        <button
                                                            onClick={() => setRejectTarget(r)}
                                                            disabled={busyId === r._id}
                                                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-btn text-xs font-semibold text-white bg-danger hover:bg-danger/90 disabled:opacity-50 transition-colors"
                                                        >
                                                            <X size={13} /> Reject
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile cards */}
                            <div className="md:hidden divide-y divide-border">
                                {reviews.map((r) => (
                                    <div key={r._id} className="px-5 py-4 flex flex-col gap-2">
                                        <div className="flex items-start justify-between gap-2">
                                            <span className="font-medium text-text-primary text-sm truncate">{r.title}</span>
                                            <span className="text-xs text-text-secondary shrink-0">{r.isFree ? "Free" : formatINR(r.price)}</span>
                                        </div>
                                        <div className="text-xs text-text-secondary">@{r.sellerUsername} · {r.category}</div>
                                        <div className="flex gap-2 mt-1">
                                            <button
                                                onClick={() => approve(r._id)}
                                                disabled={busyId === r._id}
                                                className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 rounded-btn text-xs font-semibold text-white bg-success hover:bg-success/90 disabled:opacity-50 transition-colors"
                                            >
                                                <Check size={13} /> Approve
                                            </button>
                                            <button
                                                onClick={() => setRejectTarget(r)}
                                                disabled={busyId === r._id}
                                                className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 rounded-btn text-xs font-semibold text-white bg-danger hover:bg-danger/90 disabled:opacity-50 transition-colors"
                                            >
                                                <X size={13} /> Reject
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {rejectTarget && (
                <RejectModal
                    title={rejectTarget.title}
                    onCancel={() => setRejectTarget(null)}
                    onConfirm={(reason) => reject(rejectTarget._id, reason)}
                />
            )}
        </div>
    )
}
