"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import {
    ArrowLeft, Flame, Star, IndianRupee, Lock, ShoppingBag,
    Sparkles, Check, Copy, ShieldCheck, Clock, Layers, TrendingUp,
} from "lucide-react"
import { ProtectedContent } from "@/components/shared/ProtectedContent"
import { embedZeroWidthWatermark } from "@/lib/protection"
import { categoryTagStyle } from "@/lib/utils"
import { AI_MODELS } from "@/lib/ai-models"

type Listing = {
    _id: string
    title: string
    description: string
    category: string | null
    models: string[]
    promptText: string | null
    promptHead: string
    previewSnippet: string
    price: number
    isFree: boolean
    rating: number
    hasReviews: boolean
    salesCount: number
    trending: boolean
    createdAt: string
    updatedAt: string
    purchased: boolean
    isOwner: boolean
    seller: {
        id: string
        name: string
        username: string
        joinedYear: number | null
        totalSales: number
    }
}

function formatDate(d: string) {
    return new Date(d).toLocaleDateString("en-IN", { month: "short", year: "numeric" })
}

// The Prompt Detail & Purchase page (Screen 4), rendered at the public
// /[slug] URL. Takes the resolved listing id as a prop — the caller
// (root [handle] route, or the legacy /marketplace/[id] redirect target)
// is responsible for turning a slug or id into this id.
export function ListingDetailView({ id }: { id: string }) {
    const router = useRouter()
    const { data: session, status } = useSession()

    const [listing, setListing] = React.useState<Listing | null>(null)
    const [loading, setLoading] = React.useState(true)
    const [notFound, setNotFound] = React.useState(false)
    const [buying, setBuying] = React.useState(false)
    const [copied, setCopied] = React.useState(false)
    const [toast, setToast] = React.useState("")

    const previewRef = React.useRef<HTMLDivElement>(null)

    const load = React.useCallback(() => {
        setLoading(true)
        fetch(`/api/marketplace/${id}?view=detail`)
            .then(async r => {
                if (r.status === 404) { setNotFound(true); return null }
                return r.json()
            })
            .then(d => { if (d && !d.error) setListing(d) })
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [id])

    React.useEffect(() => { load() }, [load])

    React.useEffect(() => {
        if (!toast) return
        const t = setTimeout(() => setToast(""), 3500)
        return () => clearTimeout(t)
    }, [toast])

    const handleBuy = async () => {
        if (!listing) return
        if (status !== "authenticated") {
            alert("Please sign in to purchase prompts.")
            return
        }
        if (listing.purchased) {
            previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
            return
        }
        setBuying(true)
        try {
            const res = await fetch(`/api/marketplace/${listing._id}/buy`, { method: "POST" })
            const data = await res.json()
            if (res.ok) {
                setListing(prev => prev ? { ...prev, purchased: true, promptText: data.promptText } : prev)
                setToast(listing.isFree ? "Added to your library ✓" : "Prompt purchased ✓ The full prompt is now unlocked!")
            } else {
                setToast(data?.error || "Something went wrong")
            }
        } finally {
            setBuying(false)
        }
    }

    const handleCopy = () => {
        if (!listing?.purchased || !listing.promptText) return
        const watermarkId = session?.user?.email || "anonymous"
        navigator.clipboard.writeText(embedZeroWidthWatermark(listing.promptText, watermarkId))
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const tryWithDerek = () => {
        if (!listing) return
        let text: string
        if (listing.purchased && listing.promptText) {
            text = listing.promptText
        } else {
            text = `I'm considering buying the "${listing.title}" prompt from the marketplace (₹${listing.price}, category: ${listing.category || "General"}). Here's the description: ${listing.description}\n\nPreview: ${listing.previewSnippet}\n\nCan you help me figure out if this fits what I need, and suggest what to check before I buy?`
        }
        const watermarkId = session?.user?.email || "anonymous"
        const encoded = encodeURIComponent(embedZeroWidthWatermark(text, watermarkId))
        router.push(`/chat?prefillDerek=${encoded}`)
    }

    if (loading && !listing) {
        return (
            <div className="flex flex-col h-full bg-bg-base overflow-y-auto">
                <div className="h-16 bg-bg-hover animate-pulse" />
                <div className="max-w-6xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
                    <div className="space-y-4">
                        <div className="h-8 w-2/3 rounded bg-bg-hover animate-pulse" />
                        <div className="h-24 rounded-card bg-bg-hover animate-pulse" />
                        <div className="h-40 rounded-card bg-bg-hover animate-pulse" />
                    </div>
                    <div className="h-64 rounded-card bg-bg-hover animate-pulse" />
                </div>
            </div>
        )
    }

    if (notFound || !listing) {
        return (
            <div className="flex flex-col h-full bg-bg-base items-center justify-center px-6 text-center gap-3">
                <p className="text-text-primary font-semibold">This listing isn&apos;t available</p>
                <Link href="/marketplace" className="text-sm text-accent hover:underline">Back to marketplace</Link>
            </div>
        )
    }

    const tag = categoryTagStyle(listing.category || undefined)
    const compatibleModels = AI_MODELS.filter(m => listing.models.includes(m.id))
    const isLocked = !listing.purchased

    const PriceCard = () => (
        <div className="rounded-card border border-border bg-bg-panel p-5">
            <div className="flex items-baseline gap-1 mb-0.5">
                {listing.isFree ? (
                    <span className="text-3xl font-extrabold text-accent">Free</span>
                ) : (
                    <span className="text-3xl font-extrabold text-accent2 inline-flex items-center">
                        <IndianRupee size={22} className="mt-0.5" />{listing.price}
                    </span>
                )}
            </div>
            <p className="text-xs text-text-secondary mb-4">One-time purchase · Lifetime access</p>

            {listing.isOwner ? (
                <div className="w-full flex items-center justify-center gap-2 py-3 rounded-full text-sm font-bold border border-border text-text-secondary">
                    This is your listing
                </div>
            ) : (
                <button
                    onClick={handleBuy}
                    disabled={buying}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-full text-sm font-bold text-white hover:opacity-90 disabled:opacity-50 transition-opacity mb-2.5"
                    style={{ background: "linear-gradient(135deg,var(--accent),var(--accent-hover))" }}
                >
                    <ShoppingBag size={15} />
                    {buying ? "Processing..." : listing.purchased ? "View full prompt" : listing.isFree ? "Get for free" : "Buy now"}
                </button>
            )}

            <button
                onClick={tryWithDerek}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-full text-sm font-bold text-white hover:opacity-90 transition-opacity"
                style={{ background: "linear-gradient(135deg,#00A67E,#00c896)" }}
            >
                <Sparkles size={15} /> Try with Derek first
            </button>

            <p className="flex items-center justify-center gap-1.5 text-[0.7rem] text-text-secondary mt-3">
                <ShieldCheck size={12} /> 30-day money back guarantee
            </p>
        </div>
    )

    return (
        <div className="flex flex-col h-full bg-bg-base overflow-y-auto">
            {/* Header — desktop */}
            <div className="hidden lg:flex sticky top-0 z-10 bg-bg-base/90 backdrop-blur-md border-b border-border px-6 py-3 items-center justify-between">
                <Link href="/marketplace" className="flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
                    <ArrowLeft size={16} /> Marketplace
                </Link>
            </div>

            {/* Header — mobile: back button + logo */}
            <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-bg-base">
                <button onClick={() => router.push("/marketplace")} className="flex items-center gap-1.5 text-sm font-semibold text-accent">
                    <ArrowLeft size={16} /> Back
                </button>
                <div className="flex items-center gap-1.5 font-bold text-sm">
                    <div className="relative w-5 h-5 shrink-0">
                        <Image src="/derek-logo.png" alt="Derek" fill className="object-cover rounded-full ring-1 ring-[#e05252]/40" />
                    </div>
                    <span className="text-text-primary">easemyprompt<span className="text-accent">.ai</span></span>
                </div>
                <span className="w-12" />
            </div>

            <div className="max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 pb-16">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
                    {/* ── LEFT COLUMN ─────────────────────────────────── */}
                    <div className="min-w-0 lg:border-r lg:border-border lg:pr-8">
                        <div className="flex items-center gap-2 mb-3">
                            {listing.category && (
                                <span className={`text-[0.65rem] font-bold px-2.5 py-1 rounded-full border ${tag.bg} ${tag.text} ${tag.border}`}>
                                    {listing.category}
                                </span>
                            )}
                            {listing.trending && (
                                <span className="inline-flex items-center gap-1 text-[0.65rem] font-bold px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-600 border border-orange-500/20">
                                    <Flame size={11} /> Trending
                                </span>
                            )}
                        </div>

                        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-2 leading-tight">{listing.title}</h1>

                        {listing.hasReviews ? (
                            <div className="flex items-center gap-2 mb-5">
                                <span className="inline-flex items-center gap-0.5 text-amber-500">
                                    {[...Array(5)].map((_, i) => <Star key={i} size={14} className={i < Math.round(listing.rating) ? "fill-amber-500" : "fill-none"} />)}
                                </span>
                                <span className="text-sm text-text-secondary">{listing.rating.toFixed(1)}</span>
                            </div>
                        ) : (
                            <p className="text-sm text-text-secondary mb-5">No reviews yet</p>
                        )}

                        {/* Price card — mobile only, sits right after rating per wireframe */}
                        <div className="lg:hidden mb-6">
                            <PriceCard />
                        </div>

                        {/* Seller row */}
                        <div className="flex items-center gap-3 mb-5">
                            <Link href={`/${listing.seller.username}`} className="w-10 h-10 rounded-full bg-accent/10 border border-accent/20 text-accent flex items-center justify-center font-bold text-sm shrink-0">
                                {listing.seller.name.slice(0, 1).toUpperCase()}
                            </Link>
                            <div className="min-w-0 flex-1">
                                <Link href={`/${listing.seller.username}`} className="text-sm font-semibold text-text-primary hover:text-accent transition-colors">
                                    @{listing.seller.username}
                                </Link>
                                <p className="text-xs text-text-secondary">
                                    {listing.seller.totalSales} sale{listing.seller.totalSales === 1 ? "" : "s"}
                                    {listing.seller.joinedYear ? ` · Joined ${listing.seller.joinedYear}` : ""}
                                </p>
                            </div>
                            {!listing.isOwner && (
                                // No follow system exists yet — placeholder only, wire up once one ships.
                                <button
                                    title="Follow system not implemented yet"
                                    className="px-3.5 py-1.5 rounded-full text-xs font-semibold border border-border text-text-primary hover:bg-bg-hover transition-colors shrink-0"
                                >
                                    Follow
                                </button>
                            )}
                        </div>

                        <div className="h-px bg-border mb-6" />

                        <h2 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-2.5">About this prompt</h2>
                        <p className="text-sm text-text-secondary leading-relaxed mb-6">
                            {listing.description || "No description provided yet."}
                        </p>

                        <h2 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-2.5">What you get</h2>
                        <ul className="space-y-2 mb-6">
                            {[
                                "Full structured prompt with role, task, format, constraints",
                                compatibleModels.length > 0
                                    ? `Compatible with ${compatibleModels.map(m => m.name).join(", ")}`
                                    : "Compatible with your favorite AI models",
                                "Instant delivery after purchase",
                                "Lifetime access & future updates",
                            ].map(item => (
                                <li key={item} className="flex items-start gap-2.5 text-sm text-text-primary">
                                    <span className="w-4 h-4 rounded-full bg-success/10 text-success flex items-center justify-center shrink-0 mt-0.5">
                                        <Check size={11} strokeWidth={3} />
                                    </span>
                                    {item}
                                </li>
                            ))}
                        </ul>

                        <h2 ref={previewRef} className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-2.5 scroll-mt-20">Preview</h2>
                        {isLocked ? (
                            <div className="relative rounded-xl border border-border overflow-hidden">
                                <div className="bg-bg-input p-4 font-mono text-sm text-text-primary whitespace-pre-wrap leading-relaxed">
                                    {listing.promptHead || "Purchase to reveal the full prompt..."}
                                    {/* Decorative only — not real prompt content. The actual remainder
                                        is never sent to the client pre-purchase (see API route comment),
                                        so this represents "more hidden text" without a fake transcript. */}
                                    <div className="mt-3 space-y-2 blur-[3px] select-none pointer-events-none" aria-hidden="true">
                                        <div className="h-3 rounded bg-text-secondary/30 w-[95%]" />
                                        <div className="h-3 rounded bg-text-secondary/30 w-[88%]" />
                                        <div className="h-3 rounded bg-text-secondary/30 w-[92%]" />
                                        <div className="h-3 rounded bg-text-secondary/30 w-[70%]" />
                                    </div>
                                </div>
                                <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-bg-base via-bg-base/70 to-transparent flex items-end justify-center pb-4">
                                    <button
                                        onClick={handleBuy}
                                        disabled={buying}
                                        className="px-5 py-2.5 rounded-full text-sm font-bold text-white shadow-lg hover:opacity-90 disabled:opacity-50 transition-opacity inline-flex items-center gap-2"
                                        style={{ background: "linear-gradient(135deg,var(--accent),var(--accent-hover))" }}
                                    >
                                        <Lock size={14} /> {buying ? "Processing..." : "Purchase to unlock full prompt"}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-xl border border-border overflow-hidden">
                                <ProtectedContent
                                    text={listing.promptText || ""}
                                    className="text-sm text-text-primary font-mono whitespace-pre-wrap leading-relaxed"
                                    wrapperClassName="bg-bg-input p-4 max-h-[420px] overflow-y-auto block"
                                />
                                <button
                                    onClick={handleCopy}
                                    className="w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold text-text-primary bg-bg-panel border-t border-border hover:bg-bg-hover transition-colors"
                                >
                                    {copied ? <Check size={15} className="text-success" /> : <Copy size={15} />}
                                    {copied ? "Copied!" : "Copy full prompt"}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* ── RIGHT COLUMN (sticky on desktop) ────────────────── */}
                    <div className="hidden lg:block">
                        <div className="sticky top-20 space-y-4">
                            <PriceCard />

                            <div className="rounded-card border border-border bg-bg-panel p-5">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-3">Prompt details</h3>
                                <div className="grid grid-cols-2 gap-y-3 gap-x-3">
                                    <div>
                                        <p className="text-[0.65rem] text-text-secondary flex items-center gap-1"><Layers size={10} /> Compatible with</p>
                                        <p className="text-sm font-semibold text-text-primary">
                                            {compatibleModels.length > 0 ? compatibleModels.map(m => m.name).join(", ") : "Any"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[0.65rem] text-text-secondary">Category</p>
                                        <p className="text-sm font-semibold text-text-primary">{listing.category || "General"}</p>
                                    </div>
                                    <div>
                                        <p className="text-[0.65rem] text-text-secondary flex items-center gap-1"><TrendingUp size={10} /> Sales</p>
                                        <p className="text-sm font-semibold text-text-primary">{listing.salesCount}</p>
                                    </div>
                                    <div>
                                        <p className="text-[0.65rem] text-text-secondary flex items-center gap-1"><Clock size={10} /> Updated</p>
                                        <p className="text-sm font-semibold text-text-primary">{formatDate(listing.updatedAt)}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-card border border-border bg-bg-panel p-5">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-3">Top reviews</h3>
                                {listing.hasReviews ? null : (
                                    <div className="text-center py-6">
                                        <p className="text-sm text-text-secondary">No reviews yet</p>
                                        <p className="text-[0.7rem] text-text-secondary/70 mt-1">Be the first to buy and review this prompt.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Prompt details + reviews — mobile, after preview */}
                <div className="lg:hidden mt-6 space-y-4">
                    <div className="rounded-card border border-border bg-bg-panel p-5">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-3">Prompt details</h3>
                        <div className="grid grid-cols-2 gap-y-3 gap-x-3">
                            <div>
                                <p className="text-[0.65rem] text-text-secondary">Compatible with</p>
                                <p className="text-sm font-semibold text-text-primary">
                                    {compatibleModels.length > 0 ? compatibleModels.map(m => m.name).join(", ") : "Any"}
                                </p>
                            </div>
                            <div>
                                <p className="text-[0.65rem] text-text-secondary">Category</p>
                                <p className="text-sm font-semibold text-text-primary">{listing.category || "General"}</p>
                            </div>
                            <div>
                                <p className="text-[0.65rem] text-text-secondary">Sales</p>
                                <p className="text-sm font-semibold text-text-primary">{listing.salesCount}</p>
                            </div>
                            <div>
                                <p className="text-[0.65rem] text-text-secondary">Updated</p>
                                <p className="text-sm font-semibold text-text-primary">{formatDate(listing.updatedAt)}</p>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-card border border-border bg-bg-panel p-5 text-center">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-3 text-left">Top reviews</h3>
                        <p className="text-sm text-text-secondary">No reviews yet</p>
                    </div>
                </div>
            </div>

            {toast && (
                <div className="fixed bottom-6 right-6 z-[300] flex items-center gap-3 bg-green-600 text-white px-5 py-3 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-4 duration-300 text-sm font-semibold">
                    <Check size={18} /> {toast}
                </div>
            )}
        </div>
    )
}
