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
    const [username, setUsername] = React.useState("")
    const [originalUsername, setOriginalUsername] = React.useState("")
    const [usernameLocked, setUsernameLocked] = React.useState(false)
    const [loaded, setLoaded] = React.useState(false)
    const [saving, setSaving] = React.useState(false)
    const [saved, setSaved] = React.useState(false)
    const [error, setError] = React.useState("")
    const [usernameError, setUsernameError] = React.useState("")

    React.useEffect(() => {
        if (!userId) return
        fetch(`/api/profile/${userId}`)
            .then(r => r.json())
            .then(d => {
                if (!d?.error) {
                    setName(d.name || "")
                    setBio(d.bio || "")
                    setUsername(d.username || "")
                    setOriginalUsername(d.username || "")
                    setUsernameLocked(!!d.usernameLocked)
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
        setUsernameError("")
        setSaved(false)
        try {
            const body: { name: string; bio: string; username?: string } = { name, bio }
            if (!usernameLocked && username.trim().toLowerCase() !== originalUsername) {
                body.username = username.trim().toLowerCase()
            }
            const res = await fetch(`/api/profile/${userId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            })
            const data = await res.json()
            if (!res.ok) {
                if (body.username) {
                    setUsernameError(data.error || "Failed to update username")
                    setUsername(originalUsername)
                } else {
                    throw new Error(data.error || "Failed to save")
                }
                return
            }
            if (typeof data.username === "string") {
                setUsername(data.username)
                setOriginalUsername(data.username)
                setUsernameLocked(!!data.usernameLocked)
            }
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
                                <label className="text-sm font-semibold text-text-primary">Username</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-secondary">@</span>
                                    <input
                                        value={username}
                                        onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                                        disabled={usernameLocked}
                                        maxLength={20}
                                        className="w-full h-10 rounded-btn border border-border bg-bg-input pl-7 pr-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:opacity-60 disabled:cursor-not-allowed"
                                    />
                                </div>
                                <p className="text-xs text-text-secondary">
                                    {usernameLocked
                                        ? "You've already used your one-time username change."
                                        : `Your profile: easemyprompt.ai/${username || "..."} — you can only change this once.`}
                                </p>
                                {usernameError && <p className="text-sm text-danger">{usernameError}</p>}
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
