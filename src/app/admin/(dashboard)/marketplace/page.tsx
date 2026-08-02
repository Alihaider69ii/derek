"use client"

import * as React from "react"
import { Check, X, Star, Search, Download, ShoppingBag } from "lucide-react"

export const dynamic = "force-dynamic"

type Listing = {
    _id: string
    title: string
    sellerName: string
    category: string
    price: number
    isFree: boolean
    status: "draft" | "pending_review" | "live" | "rejected"
    featured: boolean
    salesCount: number
    revenue: number
    createdAt: string
}

function formatINR(n: number) {
    return `₹${n.toLocaleString("en-IN")}`
}

const STATUS_TABS = [
    { value: "all", label: "All" },
    { value: "live", label: "Live" },
    { value: "pending_review", label: "Pending" },
    { value: "draft", label: "Draft" },
    { value: "rejected", label: "Rejected" },
] as const

const STATUS_BADGE: Record<string, string> = {
    live: "bg-success/10 text-success border-success/20",
    pending_review: "bg-gold/10 text-gold-text border-gold/20",
    draft: "bg-bg-hover text-text-secondary border-border",
    rejected: "bg-danger/10 text-danger border-danger/20",
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

export default function AdminMarketplacePage() {
    const [listings, setListings] = React.useState<Listing[]>([])
    const [loading, setLoading] = React.useState(true)
    const [busyId, setBusyId] = React.useState<string | null>(null)
    const [status, setStatus] = React.useState<string>("all")
    const [q, setQ] = React.useState("")
    const [rejectTarget, setRejectTarget] = React.useState<Listing | null>(null)

    const load = React.useCallback((opts: { status: string; q: string }) => {
        setLoading(true)
        const params = new URLSearchParams()
        if (opts.status !== "all") params.set("status", opts.status)
        if (opts.q) params.set("q", opts.q)

        fetch(`/api/admin/marketplace?${params.toString()}`)
            .then((r) => r.json())
            .then((data) => { if (Array.isArray(data)) setListings(data) })
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    React.useEffect(() => { load({ status, q }) }, [status]) // eslint-disable-line react-hooks/exhaustive-deps

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        load({ status, q })
    }

    const reviewAction = async (id: string, action: "approve" | "reject", reason?: string) => {
        setBusyId(id)
        try {
            const res = await fetch(`/api/admin/reviews/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action, reason }),
            })
            if (res.ok) load({ status, q })
        } finally {
            setBusyId(null)
            setRejectTarget(null)
        }
    }

    const toggleFeatured = async (id: string) => {
        setBusyId(id)
        try {
            const res = await fetch(`/api/admin/marketplace/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "toggle_featured" }),
            })
            const data = await res.json()
            if (res.ok) {
                setListings((prev) => prev.map((l) => (l._id === id ? { ...l, featured: data.featured } : l)))
            }
        } finally {
            setBusyId(null)
        }
    }

    return (
        <div className="flex flex-col h-full bg-bg-base overflow-y-auto">
            <div className="px-4 sm:px-6 pt-6 sm:pt-8 pb-6 flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Marketplace</h1>
                    <p className="text-text-secondary text-sm mt-0.5">All listings, sales, and featured curation</p>
                </div>
                <a
                    href="/api/admin/marketplace/export-sales"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border border-border text-text-primary hover:bg-bg-hover transition-colors"
                >
                    <Download size={14} /> Export sales CSV
                </a>
            </div>

            <div className="px-4 sm:px-6 pb-10 space-y-4">
                <div className="flex flex-wrap gap-1.5">
                    {STATUS_TABS.map((t) => (
                        <button
                            key={t.value}
                            onClick={() => setStatus(t.value)}
                            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${status === t.value ? "bg-accent text-white border-accent" : "border-border text-text-secondary hover:text-text-primary hover:bg-bg-hover"}`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSearch} className="flex gap-3">
                    <div className="relative flex-1 max-w-md">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                        <input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Search by title or seller"
                            className="w-full h-10 rounded-btn border border-border bg-bg-input pl-9 pr-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30"
                        />
                    </div>
                    <button type="submit" className="h-10 px-5 rounded-full text-sm font-bold text-white bg-accent hover:bg-accent-hover transition-colors">
                        Search
                    </button>
                </form>

                <div className="rounded-card border border-border bg-bg-panel overflow-hidden">
                    {loading ? (
                        <div className="p-5 space-y-3">
                            {[...Array(5)].map((_, i) => <div key={i} className="h-14 rounded-btn bg-bg-hover animate-pulse" />)}
                        </div>
                    ) : listings.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-5">
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-accent/10 text-accent">
                                <ShoppingBag size={24} />
                            </div>
                            <p className="text-text-primary font-semibold">No listings found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-[0.7rem] uppercase tracking-wider text-text-secondary">
                                        <th className="px-5 py-3 font-semibold">Prompt</th>
                                        <th className="px-5 py-3 font-semibold">Seller</th>
                                        <th className="px-5 py-3 font-semibold">Price</th>
                                        <th className="px-5 py-3 font-semibold">Status</th>
                                        <th className="px-5 py-3 font-semibold">Sales</th>
                                        <th className="px-5 py-3 font-semibold">Revenue</th>
                                        <th className="px-5 py-3 font-semibold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {listings.map((l) => (
                                        <tr key={l._id} className="border-t border-border hover:bg-bg-hover/50 transition-colors">
                                            <td className="px-5 py-3.5 font-medium text-text-primary truncate max-w-[220px]">{l.title}</td>
                                            <td className="px-5 py-3.5 text-text-secondary">{l.sellerName}</td>
                                            <td className="px-5 py-3.5 text-text-secondary">{l.isFree ? "Free" : formatINR(l.price)}</td>
                                            <td className="px-5 py-3.5">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[0.7rem] font-semibold border ${STATUS_BADGE[l.status]}`}>
                                                    {l.status.replace("_", " ")}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-text-secondary">{l.salesCount}</td>
                                            <td className="px-5 py-3.5 text-text-secondary">{formatINR(l.revenue)}</td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex justify-end items-center gap-2 flex-wrap">
                                                    <button
                                                        onClick={() => toggleFeatured(l._id)}
                                                        disabled={busyId === l._id}
                                                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-btn text-xs font-semibold transition-colors disabled:opacity-50 ${l.featured
                                                            ? "text-white bg-gold border border-gold"
                                                            : "border border-border text-text-primary hover:bg-bg-hover"
                                                            }`}
                                                    >
                                                        <Star size={13} fill={l.featured ? "currentColor" : "none"} /> {l.featured ? "Featured" : "Feature"}
                                                    </button>
                                                    {l.status === "pending_review" && (
                                                        <>
                                                            <button
                                                                onClick={() => reviewAction(l._id, "approve")}
                                                                disabled={busyId === l._id}
                                                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-btn text-xs font-semibold text-white bg-success hover:bg-success/90 disabled:opacity-50 transition-colors"
                                                            >
                                                                <Check size={13} /> Approve
                                                            </button>
                                                            <button
                                                                onClick={() => setRejectTarget(l)}
                                                                disabled={busyId === l._id}
                                                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-btn text-xs font-semibold text-white bg-danger hover:bg-danger/90 disabled:opacity-50 transition-colors"
                                                            >
                                                                <X size={13} /> Reject
                                                            </button>
                                                        </>
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
            </div>

            {rejectTarget && (
                <RejectModal
                    title={rejectTarget.title}
                    onCancel={() => setRejectTarget(null)}
                    onConfirm={(reason) => reviewAction(rejectTarget._id, "reject", reason)}
                />
            )}
        </div>
    )
}
