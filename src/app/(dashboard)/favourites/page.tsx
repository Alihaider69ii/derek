"use client"

import * as React from "react"
import { Star, Trash2, ShoppingBag, X, IndianRupee, Filter, BookOpen, Cpu, Copy, Check } from "lucide-react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { ProtectedContent } from "@/components/shared/ProtectedContent"
import { embedZeroWidthWatermark } from "@/lib/protection"

export const dynamic = 'force-dynamic'

function SellModal({ fav, onClose, onSell }: { fav: any; onClose: () => void; onSell: (p: number) => Promise<void> }) {
  const [price, setPrice] = React.useState("")
  const [error, setError] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const handle = async () => {
    const p = Number(price)
    if (!price || isNaN(p) || p < 1 || p > 1000) { setError("Price must be between ₹1 and ₹1000"); return }
    setLoading(true); await onSell(p); setLoading(false)
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-bg-panel border border-border w-full max-w-sm rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border">
          <div><h2 className="text-base font-bold text-text-primary">List for Sale</h2><p className="text-xs text-text-secondary mt-0.5 truncate max-w-[200px]">{fav.title}</p></div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-hover"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-sm text-text-secondary mb-2 block">Set your price (₹1 – ₹1000)</label>
            <div className="relative">
              <IndianRupee size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-accent2" />
              <input type="number" min={1} max={1000} value={price} onChange={e => { setPrice(e.target.value); setError("") }} placeholder="e.g. 99" autoFocus
                className="w-full pl-9 pr-4 py-3 bg-bg-input border border-border rounded-xl text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent" />
            </div>
            {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
          </div>
          <p className="text-xs text-text-secondary bg-bg-input border border-border rounded-lg p-3 leading-relaxed">
            💡 Your prompt will appear in the Marketplace with a blurred preview until purchased.
          </p>
          <button onClick={handle} disabled={loading} className="w-full py-3 rounded-full text-sm font-bold text-white hover:opacity-80 disabled:opacity-40" style={{ background: "linear-gradient(135deg,var(--accent),var(--accent-hover))" }}>
            {loading ? "Listing..." : "List on Marketplace"}
          </button>
        </div>
      </div>
    </div>
  )
}

function FavCard({ fav, onDelete, onSell }: { fav: any; onDelete: () => void; onSell: () => void }) {
  const { data: session } = useSession()
  const [confirm, setConfirm] = React.useState(false)
  const [copied, setCopied] = React.useState(false)
  const handleCopy = () => {
    const watermarkId = session?.user?.email || "anonymous"
    navigator.clipboard.writeText(embedZeroWidthWatermark(fav.promptText, watermarkId))
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="group flex flex-col gap-3 p-5 rounded-2xl border border-border bg-bg-panel hover:border-accent/40 transition-all duration-200 hover:shadow-[0_0_20px_rgba(255,77,0,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Star size={15} className="text-yellow-400 fill-yellow-400 shrink-0" />
          <h3 className="font-semibold text-text-primary text-sm truncate">{fav.title}</h3>
        </div>
        <button onClick={() => { if (!confirm) { setConfirm(true); return } onDelete() }}
          className={`p-1.5 rounded-lg shrink-0 transition-colors ${confirm ? "bg-red-500/20 text-red-400" : "opacity-0 group-hover:opacity-100 text-text-secondary hover:text-red-400 hover:bg-red-500/10"}`}>
          <Trash2 size={13} />
        </button>
      </div>
      <div className="bg-bg-input rounded-lg p-3 border border-border">
        <ProtectedContent
          text={fav.promptText}
          className="text-xs text-text-secondary line-clamp-3 leading-relaxed font-mono"
        />
      </div>
      <div className="flex items-center justify-between">
        <span className={`text-[0.6rem] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${fav.source === "generated" ? "bg-accent2/10 text-accent2 border border-accent2/20" : "bg-accent/10 text-accent border border-accent/20"}`}>
          {fav.source === "generated" ? "🤖 Derek" : "📚 Bank"}
        </span>
        <div className="flex items-center gap-1">
          <button onClick={handleCopy} className="flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary px-2 py-1 rounded-lg hover:bg-bg-hover">
            {copied ? <Check size={12} className="text-success" /> : <Copy size={12} />}
            {copied ? "Copied" : "Copy"}
          </button>
          {fav.source === "generated" && (
            <button onClick={onSell} className="flex items-center gap-1 text-xs font-semibold text-white px-3 py-1.5 rounded-full hover:opacity-80" style={{ background: "linear-gradient(135deg,var(--accent),var(--accent-hover))" }}>
              <ShoppingBag size={11} /> Sell
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function FavouritesPage() {
  const { status } = useSession()
  const [favs, setFavs] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [tab, setTab] = React.useState<"all" | "generated" | "bank">("all")
  const [sellFav, setSellFav] = React.useState<any>(null)
  const [toast, setToast] = React.useState("")

  React.useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/favourites").then(r => r.json()).then(d => { if (Array.isArray(d)) setFavs(d) }).catch(console.error).finally(() => setLoading(false))
    } else if (status === "unauthenticated") setLoading(false)
  }, [status])

  const handleDelete = async (id: string) => {
    await fetch(`/api/favourites/${id}`, { method: "DELETE" })
    setFavs(prev => prev.filter(f => f._id !== id))
  }

  const handleSell = async (price: number) => {
    if (!sellFav) return
    const res = await fetch("/api/marketplace", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ favouriteId: sellFav._id, title: sellFav.title, promptText: sellFav.promptText, price }),
    })
    if (res.ok) {
      setToast(`"${sellFav.title}" listed on Marketplace for ₹${price}!`)
      setSellFav(null)
      setTimeout(() => setToast(""), 4000)
    }
  }

  const filtered = tab === "all" ? favs : favs.filter(f => f.source === tab)

  if (status === "unauthenticated") {
    return (
      <div className="flex flex-col h-full bg-bg-base items-center justify-center p-6">
        <div className="text-center max-w-xs">
          <div className="text-5xl mb-4">⭐</div>
          <h2 className="text-xl font-bold text-text-primary mb-2">Sign in to view Favourites</h2>
          <p className="text-text-secondary text-sm mb-6">Star prompts from Derek or the Prompt Bank to save them here.</p>
          <Link href="/login"><button className="px-8 py-2.5 rounded-full text-sm font-semibold text-white" style={{ background: "linear-gradient(135deg,var(--accent),var(--accent-hover))" }}>Sign In</button></Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-bg-base overflow-y-auto">
      <div className="px-6 pt-8 pb-4">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Star size={22} className="text-yellow-400 fill-yellow-400" /> My Favourites
          </h1>
          <span className="text-xs text-text-secondary bg-bg-panel border border-border px-3 py-1 rounded-full">{favs.length} saved</span>
        </div>
        <p className="text-text-secondary text-sm">Your starred prompts from Derek and the Prompt Bank</p>
      </div>

      <div className="px-6 mb-4 flex gap-2 flex-wrap">
        {[{ key: "all", label: "All", icon: <Filter size={12} /> }, { key: "generated", label: "Derek Generated", icon: <Cpu size={12} /> }, { key: "bank", label: "From Bank", icon: <BookOpen size={12} /> }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${tab === t.key ? "bg-accent text-white shadow-[0_0_12px_rgba(255,77,0,0.4)]" : "bg-bg-panel border border-border text-text-secondary hover:text-text-primary hover:border-accent/40"}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {toast && (
        <div className="mx-6 mb-4 px-4 py-3 rounded-xl text-sm font-medium text-white bg-green-500/15 border border-green-500/30 flex items-center gap-2">
          <Check size={15} className="text-green-400 shrink-0" /> {toast}
        </div>
      )}

      <div className="flex-1 px-6 pb-10">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(6)].map((_, i) => <div key={i} className="h-44 rounded-2xl bg-bg-hover animate-pulse" />)}</div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(fav => <FavCard key={fav._id} fav={fav} onDelete={() => handleDelete(fav._id)} onSell={() => setSellFav(fav)} />)}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,77,0,0.10)", border: "1px solid rgba(255,77,0,0.20)" }}>
              <Star size={28} style={{ color: "var(--accent)" }} />
            </div>
            <div>
              <p className="text-text-primary font-semibold">No favourites yet</p>
              <p className="text-text-secondary text-sm mt-1">
                {tab === "generated" ? "Star Derek's responses using the ⭐ icon next to Smart Copy"
                  : tab === "bank" ? "Star prompts from the Prompt Bank to save them here"
                    : "Star prompts from Derek chat or the Prompt Bank"}
              </p>
            </div>
          </div>
        )}
      </div>

      {sellFav && <SellModal fav={sellFav} onClose={() => setSellFav(null)} onSell={handleSell} />}
    </div>
  )
}
