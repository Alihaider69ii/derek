"use client"

import * as React from "react"
import { useSession } from "next-auth/react"
import { Check, Loader2, User } from "lucide-react"

export const dynamic = 'force-dynamic'

export default function DashboardSettingsPage() {
    const { data: session, update } = useSession()
    const userId = (session?.user as any)?.id

    const [name, setName] = React.useState("")
    const [bio, setBio] = React.useState("")
    const [loaded, setLoaded] = React.useState(false)
    const [saving, setSaving] = React.useState(false)
    const [saved, setSaved] = React.useState(false)
    const [error, setError] = React.useState("")

    React.useEffect(() => {
        if (!userId) return
        fetch(`/api/profile/${userId}`)
            .then(r => r.json())
            .then(d => {
                if (!d?.error) {
                    setName(d.name || "")
                    setBio(d.bio || "")
                }
            })
            .catch(console.error)
            .finally(() => setLoaded(true))
    }, [userId])

    const save = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!userId) return
        setSaving(true)
        setError("")
        setSaved(false)
        try {
            const res = await fetch(`/api/profile/${userId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, bio }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Failed to save")
            setSaved(true)
            update?.()
        } catch (e: any) {
            setError(e.message || "Something went wrong")
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="flex flex-col h-full bg-bg-base overflow-y-auto">
            <div className="px-4 sm:px-6 pt-6 sm:pt-8 pb-6">
                <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
                <p className="text-text-secondary text-sm mt-0.5">Manage your seller profile</p>
            </div>

            <div className="px-4 sm:px-6 pb-10">
                <div className="max-w-lg rounded-card border border-border bg-bg-panel p-5 sm:p-6">
                    <div className="flex items-center gap-2 mb-5">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-accent/10 text-accent">
                            <User size={16} />
                        </div>
                        <h3 className="text-sm font-semibold text-text-primary">Profile details</h3>
                    </div>

                    {!loaded ? (
                        <div className="space-y-4">
                            {[...Array(2)].map((_, i) => <div key={i} className="h-16 rounded-btn bg-bg-hover animate-pulse" />)}
                        </div>
                    ) : (
                        <form onSubmit={save} className="space-y-4">
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
                            {saved && <p className="text-sm text-success">Saved.</p>}
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold text-white bg-accent hover:bg-accent-hover disabled:opacity-50 transition-colors"
                            >
                                {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                                Save changes
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
}
