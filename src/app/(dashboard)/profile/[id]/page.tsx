"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft, Pencil, X, Check, Loader2, FileText, ShoppingBag, Star, IndianRupee,
} from "lucide-react"
import { categoryTagStyle } from "@/lib/utils"

export const dynamic = 'force-dynamic'

type Profile = {
  id: string
  name: string
  handle: string
  bio: string
  plan: "Free" | "Pro"
  sellerLabel: string
  isOwner: boolean
  stats: { prompts: number; sales: number; rating: number | null }
  categories: string[]
  listings: {
    _id: string
    title: string
    category: string | null
    previewSnippet: string | null
    price: number
    isFree: boolean
    rating: number
    salesCount: number
  }[]
}

function initialsOf(name: string) {
  return name.split(" ").filter(Boolean).map(n => n[0]).join("").slice(0, 2).toUpperCase() || "U"
}

function ListingTile({ listing }: { listing: Profile["listings"][number] }) {
  const tag = categoryTagStyle(listing.category || undefined)
  return (
    <div className="flex flex-col gap-3 p-4 rounded-card border border-border bg-bg-panel">
      <div className="flex items-center justify-between gap-2">
        {listing.category ? (
          <span className={`text-[0.65rem] font-bold px-2 py-0.5 rounded-full border ${tag.bg} ${tag.text} ${tag.border}`}>
            {listing.category}
          </span>
        ) : <span />}
        <span className="inline-flex items-center gap-0.5 text-[0.7rem] font-semibold text-amber-600">
          <Star size={11} className="fill-amber-500 text-amber-500" /> {listing.rating.toFixed(1)}
        </span>
      </div>
      <div>
        <h3 className="font-bold text-text-primary text-sm mb-1">{listing.title}</h3>
        <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">
          {listing.previewSnippet || "No preview available yet."}
        </p>
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-border">
        {listing.isFree ? (
          <span className="text-sm font-bold text-accent2">Free</span>
        ) : (
          <span className="inline-flex items-center text-sm font-bold text-accent2">
            <IndianRupee size={12} />{listing.price}
          </span>
        )}
        <span className="text-[0.7rem] text-text-secondary">
          {listing.salesCount > 0 ? `${listing.salesCount} sale${listing.salesCount === 1 ? "" : "s"}` : "New"}
        </span>
      </div>
    </div>
  )
}

function EditProfileModal({
  profile, onClose, onSaved,
}: {
  profile: Profile
  onClose: () => void
  onSaved: (patch: { name: string; bio: string }) => void
}) {
  const [name, setName] = React.useState(profile.name)
  const [bio, setBio] = React.useState(profile.bio)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState("")

  const save = async () => {
    setSaving(true)
    setError("")
    try {
      const res = await fetch(`/api/profile/${profile.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, bio }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to save")
      onSaved({ name: data.name, bio: data.bio })
      onClose()
    } catch (e: any) {
      setError(e.message || "Something went wrong")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-bg-panel border border-border w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-bold text-text-primary">Edit profile</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-hover"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-text-primary">Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full h-10 rounded-btn border border-border bg-bg-input px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-text-primary">Bio</label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              rows={3}
              maxLength={280}
              placeholder="Tell buyers a little about yourself..."
              className="w-full rounded-btn border border-border bg-bg-input px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent/30 resize-none"
            />
            <p className="text-xs text-text-secondary text-right">{bio.length}/280</p>
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <button
            onClick={save}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-bold text-white bg-accent hover:bg-accent-hover disabled:opacity-50 transition-colors"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
            Save changes
          </button>
        </div>
      </div>
    </div>
  )
}

export default function UserProfilePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [profile, setProfile] = React.useState<Profile | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [notFound, setNotFound] = React.useState(false)
  const [category, setCategory] = React.useState("all")
  const [editing, setEditing] = React.useState(false)

  const load = React.useCallback(() => {
    setLoading(true)
    const params2 = category !== "all" ? `?category=${encodeURIComponent(category)}` : ""
    fetch(`/api/profile/${params.id}${params2}`)
      .then(async r => {
        if (r.status === 404) { setNotFound(true); return null }
        return r.json()
      })
      .then(d => { if (d && !d.error) setProfile(d) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [params.id, category])

  React.useEffect(() => { load() }, [load])

  if (loading && !profile) {
    return (
      <div className="flex flex-col h-full bg-bg-base overflow-y-auto">
        <div className="h-40 bg-bg-hover animate-pulse" />
        <div className="px-6 pt-6 space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-24 rounded-card bg-bg-hover animate-pulse" />)}
        </div>
      </div>
    )
  }

  if (notFound || !profile) {
    return (
      <div className="flex flex-col h-full bg-bg-base items-center justify-center px-6 text-center">
        <p className="text-text-primary font-semibold">Profile not found</p>
        <Link href="/marketplace" className="text-sm text-accent hover:underline mt-2">Back to marketplace</Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-bg-base overflow-y-auto">
      {/* Banner */}
      <div className="relative bg-accent px-4 sm:px-8 pt-5 pb-16 sm:pb-20">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => router.back()} className="flex items-center gap-1 text-xs text-white/70 hover:text-white transition-colors">
            <ArrowLeft size={14} /> Back
          </button>
          {profile.isOwner && (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/15 text-white hover:bg-white/25 transition-colors"
            >
              <Pencil size={12} /> Edit
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white text-accent flex items-center justify-center font-bold text-lg sm:text-xl shrink-0">
              {initialsOf(profile.name)}
            </div>
            <div className="sm:hidden">
              <p className="font-bold text-white text-base">{profile.name}</p>
              <p className="text-xs text-white/70">@{profile.handle} · {profile.sellerLabel}</p>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="hidden sm:block font-bold text-white text-lg">{profile.name}</p>
            <p className="hidden sm:block text-xs text-white/70 mb-1.5">@{profile.handle} · {profile.sellerLabel}</p>
            {profile.bio && <p className="text-xs sm:text-[0.8rem] text-white/85 leading-relaxed max-w-lg mt-2 sm:mt-0">{profile.bio}</p>}
          </div>
          <div className="flex items-center gap-5 sm:gap-6 shrink-0">
            <div className="text-center">
              <div className="font-bold text-white text-lg">{profile.stats.prompts}</div>
              <div className="text-[0.65rem] text-white/60">Prompts</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-white text-lg">{profile.stats.sales}</div>
              <div className="text-[0.65rem] text-white/60">Sales</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-white text-lg">{profile.stats.rating !== null ? `${profile.stats.rating.toFixed(1)}★` : "—"}</div>
              <div className="text-[0.65rem] text-white/60">Rating</div>
            </div>
          </div>
        </div>
      </div>

      {/* Content — overlaps banner slightly */}
      <div className="relative -mt-8 sm:-mt-10 rounded-t-2xl bg-bg-base px-4 sm:px-8 pt-5 pb-10 flex-1">
        {/* Category chips */}
        <div className="flex gap-2 flex-wrap mb-5">
          <button
            onClick={() => setCategory("all")}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${category === "all" ? "bg-accent text-white border-accent" : "bg-bg-panel border-border text-text-secondary hover:bg-bg-hover"}`}
          >
            All prompts
          </button>
          {profile.categories.map(c => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${category === c ? "bg-accent text-white border-accent" : "bg-bg-panel border-border text-text-secondary hover:bg-bg-hover"}`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Listings grid */}
        {profile.listings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {profile.listings.map(l => <ListingTile key={l._id} listing={l} />)}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-accent/10 text-accent">
              <FileText size={24} />
            </div>
            <div>
              <p className="text-text-primary font-semibold">No prompts listed yet</p>
              <p className="text-text-secondary text-sm mt-1">
                {profile.isOwner ? "List your first prompt to show up here." : "This seller hasn't published anything yet."}
              </p>
            </div>
            {profile.isOwner && (
              <Link href="/dashboard?new=1">
                <button className="mt-1 flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold text-white bg-accent hover:bg-accent-hover transition-colors">
                  <ShoppingBag size={15} /> List a prompt
                </button>
              </Link>
            )}
          </div>
        )}
      </div>

      {editing && (
        <EditProfileModal
          profile={profile}
          onClose={() => setEditing(false)}
          onSaved={patch => setProfile(prev => prev ? { ...prev, ...patch } : prev)}
        />
      )}
    </div>
  )
}
