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
        className="flex flex-col gap-4 p-5 rounded-2xl border border-[#2a2a4a] bg-[#161b22] hover:border-[#6c63ff]/40 transition-all duration-200 hover:shadow-[0_0_24px_rgba(108,99,255,0.1)] cursor-pointer"
        onClick={() => listing.purchased && setShowDetail(true)}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-white text-sm truncate">{listing.title}</h3>
            <div className="flex items-center gap-1.5 mt-1">
              <User size={11} className="text-[#8b949e]" />
              <span className="text-[0.65rem] text-[#8b949e]">{listing.sellerName}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0 bg-[#0d0d1a] border border-[#2a2a4a] px-2.5 py-1 rounded-full">
            <IndianRupee size={11} className="text-[#f59e0b]" />
            <span className="text-[#f59e0b] font-bold text-sm">{listing.price}</span>
          </div>
        </div>

        {/* Blurred / revealed prompt */}
        <div className="relative rounded-xl overflow-hidden border border-[#2a2a4a]">
          <div className={`bg-[#0d0d1a] p-4 text-xs font-mono text-[#8b949e] leading-relaxed min-h-[80px] ${!listing.purchased ? "blur-sm select-none" : ""}`}>
            {listing.promptText || "Your purchased prompt will appear here in full detail..."}
          </div>
          {!listing.purchased && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/30 backdrop-blur-[1px]">
              <Lock size={18} className="text-[#8b949e]" />
              <span className="text-xs text-[#8b949e] font-medium">Purchase to reveal</span>
            </div>
          )}
        </div>

        {/* Status badge */}
        {listing.purchased && (
          <span className="text-[0.6rem] font-bold uppercase tracking-widest px-2 py-1 rounded-full self-start bg-green-500/10 text-green-400 border border-green-500/20">
            ✓ Purchased
          </span>
        )}

        {/* Action */}
        <div className="flex gap-2 mt-auto">
          {listing.purchased ? (
            <>
              <button
                onClick={e => { e.stopPropagation(); handleCopy() }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full text-xs font-semibold border border-[#2a2a4a] text-white hover:bg-white/5 transition-colors"
              >
                {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
                {copied ? "Copied!" : "Copy Prompt"}
              </button>
              <button
                onClick={e => { e.stopPropagation(); setShowDetail(true) }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full text-xs font-semibold text-white hover:opacity-80"
                style={{ background: "linear-gradient(135deg,#6c63ff,#5a52e0)" }}
              >
                View Full Prompt
              </button>
            </>
          ) : (
            <button
              onClick={e => { e.stopPropagation(); handleBuy() }}
              disabled={buying}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-bold text-white hover:opacity-80 disabled:opacity-50 transition-opacity"
              style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)" }}
            >
              <ShoppingBag size={14} /> {buying ? "Processing..." : `Buy Now · ₹${listing.price}`}
            </button>
          )}
        </div>
      </div>

      {/* Full Prompt Modal (after purchase) */}
      {showDetail && listing.purchased && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={e => { if (e.target === e.currentTarget) setShowDetail(false) }}>
          <div className="bg-[#1a1a2e] border border-[#2a2a4a] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a4a]">
              <div>
                <h2 className="text-lg font-bold text-white">{listing.title}</h2>
                <p className="text-xs text-[#8b949e] mt-0.5">by {listing.sellerName} · ₹{listing.price}</p>
              </div>
              <button onClick={() => setShowDetail(false)} className="p-1.5 rounded-lg text-[#8b949e] hover:text-white hover:bg-white/10"><X size={18} /></button>
            </div>
            <div className="p-6">
              <div className="bg-[#0d0d1a] border border-[#2a2a4a] rounded-xl p-5 text-sm text-white font-mono whitespace-pre-wrap leading-relaxed max-h-[400px] overflow-y-auto">
                {listing.promptText}
              </div>
              <button onClick={handleCopy} className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-full text-sm font-bold border border-[#2a2a4a] text-white hover:bg-white/5 transition-colors">
                {copied ? <Check size={15} className="text-green-400" /> : <Copy size={15} />}
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
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)" }}>
            <ShoppingBag size={20} style={{ color: "#f59e0b" }} />
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
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b949e]" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search prompts..."
            className="w-full pl-9 pr-4 py-2.5 bg-[#161b22] border border-[#2a2a4a] rounded-xl text-sm text-white placeholder:text-[#8b949e] focus:outline-none focus:border-[#6c63ff] transition-colors"
          />
        </div>
      </div>

      {/* Info Banner */}
      <div className="px-6 mb-6">
        <div className="flex items-center gap-3 bg-[#161b22] border border-[#f59e0b]/20 rounded-xl p-4">
          <Tag size={18} className="text-[#f59e0b] shrink-0" />
          <p className="text-xs text-[#8b949e] leading-relaxed">
            Prompts are blurred until purchased. After purchase, the full prompt is revealed and copyable. Prices range from ₹1 to ₹1000.
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 px-6 pb-10">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => <div key={i} className="h-52 rounded-2xl bg-[#161b22] animate-pulse" />)}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(listing => <ListingCard key={listing._id} listing={listing} onBuy={handleBuy} />)}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)" }}>
              <ShoppingBag size={28} style={{ color: "#f59e0b" }} />
            </div>
            <div>
              <p className="text-text-primary font-semibold">{search ? "No prompts match your search" : "Marketplace is empty"}</p>
              <p className="text-text-secondary text-sm mt-1">{search ? "Try a different keyword" : "Be the first to list a prompt from your Favourites!"}</p>
            </div>
            {!search && status === "authenticated" && (
              <Link href="/favourites">
                <button className="mt-2 px-6 py-2.5 rounded-full text-sm font-semibold text-white hover:opacity-80" style={{ background: "linear-gradient(135deg,#6c63ff,#5a52e0)" }}>
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
