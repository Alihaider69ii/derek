"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { FileText, Plus, Star, Pencil } from "lucide-react"
import { ListingWizardModal } from "@/components/shared/ListingWizard"

export const dynamic = 'force-dynamic'

function formatINR(n: number) {
    return `₹${n.toLocaleString("en-IN")}`
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

const FILTERS = [
    { key: "all", label: "All" },
    { key: "live", label: "Live" },
    { key: "draft", label: "Drafts" },
    { key: "pending_review", label: "Pending" },
    { key: "rejected", label: "Rejected" },
] as const

function StatusBadge({ status }: { status: Listing["status"] }) {
    if (status === "live") {
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[0.7rem] font-semibold bg-success/10 text-success border border-success/20">Live</span>
    }
    if (status === "pending_review") {
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[0.7rem] font-semibold bg-orange-500/10 text-orange-600 border border-orange-500/20">Pending</span>
    }
    if (status === "rejected") {
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[0.7rem] font-semibold bg-danger/10 text-danger border border-danger/20">Rejected</span>
    }
    return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[0.7rem] font-semibold bg-bg-hover text-text-secondary border border-border">Draft</span>
}

function MyPromptsPageInner() {
    const searchParams = useSearchParams()
    const initialFilter = (FILTERS.some(f => f.key === searchParams.get("filter"))
        ? searchParams.get("filter")
        : "all") as (typeof FILTERS)[number]["key"]

    const [listings, setListings] = React.useState<Listing[]>([])
    const [loading, setLoading] = React.useState(true)
    const [filter, setFilter] = React.useState<(typeof FILTERS)[number]["key"]>(initialFilter)
    const [wizardOpen, setWizardOpen] = React.useState(false)
    const [editingId, setEditingId] = React.useState<string | null>(null)
    const [prefillData, setPrefillData] = React.useState<{ title?: string; promptText?: string; favouriteId?: string } | null>(null)

    const openNew = () => { setEditingId(null); setPrefillData(null); setWizardOpen(true) }
    const openEdit = (id: string) => { setEditingId(id); setPrefillData(null); setWizardOpen(true) }

    // Derek's "List for sale" action stores the structured prompt here (it
    // can be long, so it goes through localStorage rather than the URL) and
    // navigates to /dashboard/prompts?new=1 — pick it up and open the wizard
    // pre-filled, same as clicking "New Prompt" manually.
    React.useEffect(() => {
        if (searchParams.get("new") !== "1") return
        try {
            const raw = localStorage.getItem("derek_wizard_prefill")
            if (raw) {
                setPrefillData(JSON.parse(raw))
                localStorage.removeItem("derek_wizard_prefill")
            }
        } catch { }
        setEditingId(null)
        setWizardOpen(true)
        const url = new URL(window.location.href)
        url.searchParams.delete("new")
        window.history.replaceState(null, "", url.pathname + url.search)
    }, [searchParams])

    const load = React.useCallback(() => {
        setLoading(true)
        fetch("/api/dashboard/listings")
            .then(r => r.json())
            .then(data => { if (Array.isArray(data)) setListings(data) })
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    React.useEffect(() => { load() }, [load])

    const filtered = filter === "all" ? listings : listings.filter(l => l.status === filter)

    return (
        <div className="flex flex-col h-full bg-bg-base overflow-y-auto">
            <div className="px-4 sm:px-6 pt-6 sm:pt-8 pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">My Prompts</h1>
                    <p className="text-text-secondary text-sm mt-0.5">All the prompts you&apos;ve listed, in every status</p>
                </div>
                <button
                    onClick={openNew}
                    className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white bg-accent hover:bg-accent-hover transition-colors"
                >
                    <Plus size={16} /> New Prompt
                </button>
            </div>

            <div className="px-4 sm:px-6 pb-10 space-y-4">
                <div className="flex gap-2 flex-wrap">
                    {FILTERS.map(f => (
                        <button
                            key={f.key}
                            onClick={() => setFilter(f.key)}
                            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${filter === f.key ? "bg-accent text-white border-accent" : "bg-bg-panel border-border text-text-secondary hover:bg-bg-hover"}`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                <div className="rounded-card border border-border bg-bg-panel overflow-hidden">
                    {loading ? (
                        <div className="p-5 space-y-3">
                            {[...Array(4)].map((_, i) => <div key={i} className="h-12 rounded-btn bg-bg-hover animate-pulse" />)}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-5">
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-accent/10 text-accent">
                                <FileText size={24} />
                            </div>
                            <div>
                                <p className="text-text-primary font-semibold">No prompts here yet</p>
                                <p className="text-text-secondary text-sm mt-1">List your first prompt to start earning</p>
                            </div>
                            <button
                                onClick={openNew}
                                className="mt-1 px-6 py-2.5 rounded-full text-sm font-semibold text-white bg-accent hover:bg-accent-hover transition-colors"
                            >
                                + New Prompt
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-[0.7rem] uppercase tracking-wider text-text-secondary">
                                            <th className="px-5 py-3 font-semibold">Prompt</th>
                                            <th className="px-5 py-3 font-semibold">Sales</th>
                                            <th className="px-5 py-3 font-semibold">Revenue</th>
                                            <th className="px-5 py-3 font-semibold">Rating</th>
                                            <th className="px-5 py-3 font-semibold">Status</th>
                                            <th className="px-5 py-3 font-semibold text-right">&nbsp;</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filtered.map(l => (
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
                                                <td className="px-5 py-3.5 text-right">
                                                    {(l.status === "draft" || l.status === "rejected") && (
                                                        <button
                                                            onClick={() => openEdit(l._id)}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-btn text-xs font-semibold border border-border text-text-primary hover:bg-bg-hover transition-colors"
                                                        >
                                                            <Pencil size={12} /> Continue editing
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="md:hidden divide-y divide-border">
                                {filtered.map(l => (
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
                                        {(l.status === "draft" || l.status === "rejected") && (
                                            <button
                                                onClick={() => openEdit(l._id)}
                                                className="mt-1 inline-flex items-center gap-1.5 self-start px-3 py-1.5 rounded-btn text-xs font-semibold border border-border text-text-primary hover:bg-bg-hover transition-colors"
                                            >
                                                <Pencil size={12} /> Continue editing
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {wizardOpen && (
                <ListingWizardModal
                    editListingId={editingId || undefined}
                    initialData={prefillData || undefined}
                    onClose={() => { setWizardOpen(false); setEditingId(null); setPrefillData(null) }}
                    onSubmitted={() => load()}
                />
            )}
        </div>
    )
}

export default function MyPromptsPage() {
    return (
        <React.Suspense fallback={<div className="flex-1 bg-bg-base" />}>
            <MyPromptsPageInner />
        </React.Suspense>
    )
}
