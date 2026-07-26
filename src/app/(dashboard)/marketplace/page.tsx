"use client"

import * as React from "react"
import {
  ShoppingBag, X, Copy, Check, Lock, User, IndianRupee, Search,
  Star, SlidersHorizontal, Flame, Sparkles, Gift, Trophy,
} from "lucide-react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { ProtectedContent } from "@/components/shared/ProtectedContent"
import { embedZeroWidthWatermark } from "@/lib/protection"
import { categoryTagStyle } from "@/lib/utils"

export const dynamic = 'force-dynamic'

type Listing = {
  _id: string
  sellerId: string
  title: string
  sellerName: string
  category: string | null
  previewSnippet: string | null
  price: number
  isFree: boolean
  rating: number
  salesCount: number
  createdAt: string
  promptText: string | null
  purchased: boolean
}

type CategoryOpt = { name: string; emoji: string }

const PRICE_OPTIONS = [
  { value: "all", label: "All prices" },
  { value: "free", label: "Free only" },
  { value: "under100", label: "Under ₹100" },
  { value: "100-500", label: "₹100 – ₹500" },
  { value: "500plus", label: "₹500+" },
]

const RATING_OPTIONS = [
  { value: "0", label: "All ratings" },
  { value: "4.5", label: "4.5+ stars" },
  { value: "4.0", label: "4.0+ stars" },
]

const CHIPS = [
  { value: "all", label: "All", icon: null },
  { value: "trending", label: "Trending", icon: <Flame size={12} /> },
  { value: "new", label: "New arrivals", icon: <Sparkles size={12} /> },
  { value: "free", label: "Free", icon: <Gift size={12} /> },
  { value: "bestsellers", label: "Best sellers", icon: <Trophy size={12} /> },
]

const SORT_OPTIONS = [
  { value: "top-rated", label: "Sort: Top rated" },
  { value: "newest", label: "Sort: Newest" },
  { value: "sales", label: "Sort: Best selling" },
  { value: "price-asc", label: "Sort: Price low to high" },
  { value: "price-desc", label: "Sort: Price high to low" },
]

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-[0.7rem] font-semibold text-amber-600">
      <Star size={11} className="fill-amber-500 text-amber-500" /> {rating.toFixed(1)}
    </span>
  )
}

// ── Filter panel (shared between desktop sidebar + mobile drawer) ────────────
function FilterPanel({
  categories, category, setCategory, price, setPrice, rating, setRating,
}: {
  categories: CategoryOpt[]
  category: string
  setCategory: (v: string) => void
  price: string
  setPrice: (v: string) => void
  rating: string
  setRating: (v: string) => void
}) {
  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="mb-6">
      <h4 className="text-[0.7rem] uppercase tracking-wider text-text-secondary font-semibold mb-2">{title}</h4>
      <div className="space-y-0.5">{children}</div>
    </div>
  )
  const Item = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button
      onClick={onClick}
      className={`w-full text-left px-2.5 py-1.5 rounded-btn text-sm transition-colors ${active ? "bg-accent/10 text-accent font-semibold" : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
        }`}
    >
      {children}
    </button>
  )
  return (
    <div>
      <Section title="Category">
        <Item active={category === "all"} onClick={() => setCategory("all")}>All prompts</Item>
        {categories.map(c => (
          <Item key={c.name} active={category === c.name} onClick={() => setCategory(c.name)}>
            {c.emoji} {c.name}
          </Item>
        ))}
      </Section>
      <Section title="Price">
        {PRICE_OPTIONS.map(p => (
          <Item key={p.value} active={price === p.value} onClick={() => setPrice(p.value)}>{p.label}</Item>
        ))}
      </Section>
      <Section title="Rating">
        {RATING_OPTIONS.map(r => (
          <Item key={r.value} active={rating === r.value} onClick={() => setRating(r.value)}>{r.label}</Item>
        ))}
      </Section>
    </div>
  )
}

// ── Marketplace Card ──────────────────────────────────────────────────────────
function ListingCard({ listing, onBuy }: { listing: Listing; onBuy: (id: string) => Promise<void> }) {
  const { data: session } = useSession()
  const [copied, setCopied] = React.useState(false)
  const [buying, setBuying] = React.useState(false)
  const [showDetail, setShowDetail] = React.useState(false)

  const tag = categoryTagStyle(listing.category || undefined)
  const isTrending = listing.salesCount > 0 && Date.now() - new Date(listing.createdAt).getTime() <= 30 * 24 * 60 * 60 * 1000

  const handleCopy = () => {
    if (!listing.purchased || !listing.promptText) return
    const watermarkId = session?.user?.email || "anonymous"
    navigator.clipboard.writeText(embedZeroWidthWatermark(listing.promptText, watermarkId))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleBuy = async () => {
    setBuying(true)
    await onBuy(listing._id)
    setBuying(false)
  }

  return (
    <>
      <div
        className="relative flex flex-col gap-3 p-4 rounded-card border border-border bg-bg-panel hover:border-accent/40 transition-all duration-200 hover:shadow-[0_0_24px_rgba(46,91,255,0.10)] cursor-pointer"
        onClick={() => setShowDetail(true)}
      >
        {/* Tag row */}
        <div className="flex items-center justify-between gap-2">
          {isTrending ? (
            <span className="inline-flex items-center gap-1 text-[0.65rem] font-bold px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 border border-orange-500/20">
              <Flame size={10} /> Trending
            </span>
          ) : listing.category ? (
            <span className={`text-[0.65rem] font-bold px-2 py-0.5 rounded-full border ${tag.bg} ${tag.text} ${tag.border}`}>
              {listing.category}
            </span>
          ) : <span />}
          {listing.purchased && (
            <span className="text-[0.6rem] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-success/10 text-success border border-success/20">
              ✓ Purchased
            </span>
          )}
        </div>

        {/* Title + preview */}
        <div>
          <h3 className="font-bold text-text-primary text-sm mb-1">{listing.title}</h3>
          <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">
            {listing.previewSnippet || "No preview available yet."}
          </p>
        </div>

        {/* Footer: price/free · author+sales · rating */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-2 min-w-0">
            {listing.isFree ? (
              <span className="text-sm font-bold text-accent2">Free</span>
            ) : (
              <span className="inline-flex items-center text-sm font-bold text-accent2">
                <IndianRupee size={12} />{listing.price}
              </span>
            )}
            <span className="text-text-secondary/40">·</span>
            <Link
              href={`/profile/${listing.sellerId}`}
              onClick={e => e.stopPropagation()}
              className="flex items-center gap-1 text-[0.7rem] text-text-secondary hover:text-accent truncate"
            >
              <User size={10} /> {listing.sellerName}
            </Link>
          </div>
          <Stars rating={listing.rating} />
        </div>
        <p className="text-[0.65rem] text-text-secondary -mt-1">
          {listing.salesCount > 0 ? `${listing.salesCount} sale${listing.salesCount === 1 ? "" : "s"}` : "New listing"}
        </p>
      </div>

      {/* Detail / Purchase Modal */}
      {showDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={e => { if (e.target === e.currentTarget) setShowDetail(false) }}>
          <div className="bg-bg-panel border border-border w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-text-primary truncate">{listing.title}</h2>
                <p className="text-xs text-text-secondary mt-0.5">
                  by <Link href={`/profile/${listing.sellerId}`} className="hover:text-accent">{listing.sellerName}</Link> · {listing.isFree ? "Free" : `₹${listing.price}`} · <Stars rating={listing.rating} />
                </p>
              </div>
              <button onClick={() => setShowDetail(false)} className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-hover shrink-0"><X size={18} /></button>
            </div>
            <div className="p-6">
              <div className="relative rounded-xl overflow-hidden border border-border">
                {listing.purchased && listing.promptText ? (
                  <ProtectedContent
                    text={listing.promptText}
                    className="text-sm text-text-primary font-mono whitespace-pre-wrap leading-relaxed"
                    wrapperClassName="bg-bg-input p-4 max-h-[400px] overflow-y-auto block"
                  />
                ) : (
                  <>
                    <div className="bg-bg-input p-4 text-xs font-mono text-text-secondary leading-relaxed min-h-[100px] blur-sm select-none">
                      {listing.previewSnippet || "Purchase to reveal the full prompt..."}
                    </div>
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/20 backdrop-blur-[1px]">
                      <Lock size={18} className="text-text-secondary" />
                      <span className="text-xs text-text-secondary font-medium">Purchase to reveal</span>
                    </div>
                  </>
                )}
              </div>

              {listing.purchased ? (
                <button onClick={handleCopy} className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-full text-sm font-bold border border-border text-text-primary hover:bg-bg-hover transition-colors">
                  {copied ? <Check size={15} className="text-success" /> : <Copy size={15} />}
                  {copied ? "Copied!" : "Copy Prompt"}
                </button>
              ) : (
                <button
                  onClick={handleBuy}
                  disabled={buying}
                  className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-full text-sm font-bold text-white hover:opacity-80 disabled:opacity-50 transition-opacity"
                  style={{ background: "linear-gradient(135deg,var(--accent),var(--accent-hover))" }}
                >
                  <ShoppingBag size={14} /> {buying ? "Processing..." : listing.isFree ? "Get for Free" : `Buy Now · ₹${listing.price}`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ── Purchase Success Toast ────────────────────────────────────────────────────
function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  React.useEffect(() => { const t = setTimeout(onDone, 3500); return () => clearTimeout(t) }, [onDone])
  return (
    <div className="fixed bottom-6 right-6 z-[300] flex items-center gap-3 bg-green-600 text-white px-5 py-3 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-4 duration-300 text-sm font-semibold">
      <Check size={18} /> {message}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function MarketplacePage() {
  const { status } = useSession()
  const [listings, setListings] = React.useState<Listing[]>([])
  const [total, setTotal] = React.useState(0)
  const [categories, setCategories] = React.useState<CategoryOpt[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [toast, setToast] = React.useState("")

  const [category, setCategory] = React.useState("all")
  const [price, setPrice] = React.useState("all")
  const [rating, setRating] = React.useState("0")
  const [chip, setChip] = React.useState("all")
  const [sort, setSort] = React.useState("top-rated")
  const [filtersOpen, setFiltersOpen] = React.useState(false)

  React.useEffect(() => {
    fetch("/api/categories").then(r => r.json()).then(d => { if (Array.isArray(d)) setCategories(d) }).catch(console.error)
  }, [])

  const load = React.useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (category !== "all") params.set("category", category)
    if (price !== "all") params.set("price", price)
    if (rating !== "0") params.set("rating", rating)
    if (chip !== "all") params.set("chip", chip)
    params.set("sort", sort)

    fetch(`/api/marketplace?${params.toString()}`)
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d?.listings)) { setListings(d.listings); setTotal(d.total ?? d.listings.length) }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [category, price, rating, chip, sort])

  React.useEffect(() => { load() }, [load])

  const handleBuy = async (id: string) => {
    if (status !== "authenticated") {
      alert("Please sign in to purchase prompts.")
      return
    }
    const res = await fetch(`/api/marketplace/${id}/buy`, { method: "POST" })
    const data = await res.json()
    if (res.ok) {
      setListings(prev => prev.map(l => l._id === id ? { ...l, purchased: true, promptText: data.promptText } : l))
      setToast("Prompt Purchased ✓ The full prompt is now revealed!")
    }
  }

  const filtered = listings.filter(l => l.title.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="flex flex-col h-full bg-bg-base overflow-y-auto">
      {/* Header */}
      <div className="px-4 sm:px-6 pt-6 sm:pt-8 pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-accent/10 border border-accent/25 shrink-0">
            <ShoppingBag size={20} className="text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Prompt Marketplace</h1>
            <p className="text-text-secondary text-sm">Discover and buy community-crafted prompts</p>
          </div>
        </div>
        <div className="relative w-full sm:w-64 shrink-0">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search prompts..."
            className="w-full pl-9 pr-4 py-2.5 bg-bg-panel border border-border rounded-xl text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent transition-colors"
          />
        </div>
      </div>

      <div className="flex-1 px-4 sm:px-6 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6">
          {/* Desktop sidebar */}
          <aside className="hidden md:block">
            <FilterPanel
              categories={categories} category={category} setCategory={setCategory}
              price={price} setPrice={setPrice} rating={rating} setRating={setRating}
            />
          </aside>

          {/* Main column */}
          <div className="min-w-0">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setFiltersOpen(true)}
                  className="md:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border border-border text-text-primary hover:bg-bg-hover"
                >
                  <SlidersHorizontal size={13} /> Filters
                </button>
                <span className="font-bold text-text-primary text-base">
                  {loading ? "…" : `${total} prompt${total === 1 ? "" : "s"}`}
                </span>
              </div>
              <select
                value={sort}
                onChange={e => setSort(e.target.value)}
                className="text-xs sm:text-sm border border-border rounded-btn px-3 py-1.5 bg-bg-panel text-text-primary focus:outline-none focus:border-accent"
              >
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {/* Chips */}
            <div className="flex gap-2 flex-wrap mb-5">
              {CHIPS.map(c => (
                <button
                  key={c.value}
                  onClick={() => setChip(c.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${chip === c.value
                    ? "bg-accent text-white border-accent"
                    : "bg-bg-panel border-border text-text-secondary hover:bg-bg-hover"
                    }`}
                >
                  {c.icon}{c.label}
                </button>
              ))}
            </div>

            {/* Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[...Array(6)].map((_, i) => <div key={i} className="h-44 rounded-card bg-bg-hover animate-pulse" />)}
              </div>
            ) : filtered.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filtered.map(listing => <ListingCard key={listing._id} listing={listing} onBuy={handleBuy} />)}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-accent/10 border border-accent/20">
                  <ShoppingBag size={28} className="text-accent" />
                </div>
                <div>
                  <p className="text-text-primary font-semibold">{search ? "No prompts match your search" : "No prompts match these filters"}</p>
                  <p className="text-text-secondary text-sm mt-1">{search ? "Try a different keyword" : "Try widening your filters, or be the first to list one!"}</p>
                </div>
                {!search && status === "authenticated" && (
                  <Link href="/sell/new">
                    <button className="mt-2 px-6 py-2.5 rounded-full text-sm font-semibold text-white hover:opacity-80" style={{ background: "linear-gradient(135deg,var(--accent),var(--accent-hover))" }}>
                      List a Prompt
                    </button>
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter drawer */}
      {filtersOpen && (
        <div className="md:hidden fixed inset-0 z-[70] flex justify-end">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setFiltersOpen(false)} />
          <div className="relative w-[280px] h-full bg-bg-base border-l border-border p-4 overflow-y-auto animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-text-primary text-sm">Filters</h3>
              <button onClick={() => setFiltersOpen(false)} className="p-1.5 rounded-lg text-text-secondary hover:bg-bg-hover"><X size={18} /></button>
            </div>
            <FilterPanel
              categories={categories} category={category} setCategory={setCategory}
              price={price} setPrice={setPrice} rating={rating} setRating={setRating}
            />
          </div>
        </div>
      )}

      {toast && <Toast message={toast} onDone={() => setToast("")} />}
    </div>
  )
}
