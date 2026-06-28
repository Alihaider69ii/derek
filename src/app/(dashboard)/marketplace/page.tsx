"use client"

import * as React from "react"
import { ShoppingBag, X, Copy, Check, Lock, Tag, User, IndianRupee, Search } from "lucide-react"
import { useSession } from "next-auth/react"
import Link from "next/link"

export const dynamic = 'force-dynamic'

// ── Marketplace Card ──────────────────────────────────────────────────────────
function ListingCard({ listing, onBuy }: { listing: any; onBuy: (id: string) => void }) {
  const [copied, setCopied] = React.useState(false)
  const [buying, setBuying] = React.useState(false)
  const [showDetail, setShowDetail] = React.useState(false)

  const handleCopy = () => {
    if (!listing.purchased) return
    navigator.clipboard.writeText(listing.promptText)
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
        className="relative flex flex-col gap-4 p-5 rounded-2xl border border-border bg-bg-panel hover:border-accent/40 transition-all duration-200 hover:shadow-[0_0_24px_rgba(255,77,0,0.10)] cursor-pointer overflow-hidden"
        onClick={() => listing.purchased && setShowDetail(true)}
      >
        <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: "linear-gradient(90deg, var(--accent), var(--accent-2))" }} />
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-text-primary text-sm truncate">{listing.title}</h3>
            <div className="flex items-center gap-1.5 mt-1">
              <User size={11} className="text-text-secondary" />
              <span className="text-[0.65rem] text-text-secondary">{listing.sellerName}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0 bg-bg-input border border-border px-2.5 py-1 rounded-full">
            <IndianRupee size={11} className="text-accent2" />
            <span className="text-accent2 font-bold text-sm">{listing.price}</span>
          </div>
        </div>

        {/* Blurred / revealed prompt */}
        <div className="relative rounded-xl overflow-hidden border border-border">
          <div className={`bg-bg-input p-4 text-xs font-mono text-text-secondary leading-relaxed min-h-[80px] ${!listing.purchased ? "blur-sm select-none" : ""}`}>
            {listing.promptText || "Your purchased prompt will appear here in full detail..."}
          </div>
          {!listing.purchased && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/20 backdrop-blur-[1px]">
              <Lock size={18} className="text-text-secondary" />
              <span className="text-xs text-text-secondary font-medium">Purchase to reveal</span>
            </div>
          )}
        </div>

        {/* Status badge */}
        {listing.purchased && (
          <span className="text-[0.6rem] font-bold uppercase tracking-widest px-2 py-1 rounded-full self-start bg-success/10 text-success border border-success/20">
            ✓ Purchased
          </span>
        )}

        {/* Action */}
        <div className="flex gap-2 mt-auto">
          {listing.purchased ? (
            <>
              <button
                onClick={e => { e.stopPropagation(); handleCopy() }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full text-xs font-semibold border border-border text-text-primary hover:bg-bg-hover transition-colors"
              >
                {copied ? <Check size={13} className="text-success" /> : <Copy size={13} />}
                {copied ? "Copied!" : "Copy Prompt"}
              </button>
              <button
                onClick={e => { e.stopPropagation(); setShowDetail(true) }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full text-xs font-semibold text-white hover:opacity-80"
                style={{ background: "linear-gradient(135deg,var(--accent-2),#0036C2)" }}
              >
                View Full Prompt
              </button>
            </>
          ) : (
            <button
              onClick={e => { e.stopPropagation(); handleBuy() }}
              disabled={buying}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-bold text-white hover:opacity-80 disabled:opacity-50 transition-opacity"
              style={{ background: "linear-gradient(135deg,var(--accent),var(--accent-hover))" }}
            >
              <ShoppingBag size={14} /> {buying ? "Processing..." : `Buy Now · ₹${listing.price}`}
            </button>
          )}
        </div>
      </div>

      {/* Full Prompt Modal (after purchase) */}
      {showDetail && listing.purchased && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={e => { if (e.target === e.currentTarget) setShowDetail(false) }}>
          <div className="bg-bg-panel border border-border w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <h2 className="text-lg font-bold text-text-primary">{listing.title}</h2>
                <p className="text-xs text-text-secondary mt-0.5">by {listing.sellerName} · ₹{listing.price}</p>
              </div>
              <button onClick={() => setShowDetail(false)} className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-hover"><X size={18} /></button>
            </div>
            <div className="p-6">
              <div className="bg-bg-input border border-border rounded-xl p-5 text-sm text-text-primary font-mono whitespace-pre-wrap leading-relaxed max-h-[400px] overflow-y-auto">
                {listing.promptText}
              </div>
              <button onClick={handleCopy} className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-full text-sm font-bold border border-border text-text-primary hover:bg-bg-hover transition-colors">
                {copied ? <Check size={15} className="text-success" /> : <Copy size={15} />}
                {copied ? "Copied!" : "Copy Prompt"}
              </button>
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
  const [listings, setListings] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [toast, setToast] = React.useState("")

  const load = React.useCallback(() => {
    fetch("/api/marketplace").then(r => r.json()).then(d => { if (Array.isArray(d)) setListings(d) }).catch(console.error).finally(() => setLoading(false))
  }, [])

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
      <div className="px-6 pt-8 pb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,77,0,0.10)", border: "1px solid rgba(255,77,0,0.25)" }}>
            <ShoppingBag size={20} style={{ color: "var(--accent)" }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Prompt Marketplace</h1>
            <p className="text-text-secondary text-sm">Discover and buy community-crafted prompts</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="px-6 mb-6">
        <div className="relative max-w-md">
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

      {/* Info Banner */}
      <div className="px-6 mb-6">
        <div className="flex items-center gap-3 bg-bg-panel border border-accent/20 rounded-xl p-4">
          <Tag size={18} className="text-accent shrink-0" />
          <p className="text-xs text-text-secondary leading-relaxed">
            Prompts are blurred until purchased. After purchase, the full prompt is revealed and copyable. Prices range from ₹1 to ₹1000.
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 px-6 pb-10">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => <div key={i} className="h-52 rounded-2xl bg-bg-hover animate-pulse" />)}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(listing => <ListingCard key={listing._id} listing={listing} onBuy={handleBuy} />)}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,77,0,0.10)", border: "1px solid rgba(255,77,0,0.20)" }}>
              <ShoppingBag size={28} style={{ color: "var(--accent)" }} />
            </div>
            <div>
              <p className="text-text-primary font-semibold">{search ? "No prompts match your search" : "Marketplace is empty"}</p>
              <p className="text-text-secondary text-sm mt-1">{search ? "Try a different keyword" : "Be the first to list a prompt from your Favourites!"}</p>
            </div>
            {!search && status === "authenticated" && (
              <Link href="/favourites">
                <button className="mt-2 px-6 py-2.5 rounded-full text-sm font-semibold text-white hover:opacity-80" style={{ background: "linear-gradient(135deg,var(--accent),var(--accent-hover))" }}>
                  Go to Favourites
                </button>
              </Link>
            )}
          </div>
        )}
      </div>

      {toast && <Toast message={toast} onDone={() => setToast("")} />}
    </div>
  )
}
