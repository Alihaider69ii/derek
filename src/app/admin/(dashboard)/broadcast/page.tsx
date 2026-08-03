"use client"

import * as React from "react"
import { Megaphone, Send, Check, History } from "lucide-react"

export const dynamic = "force-dynamic"

type HistoryItem = {
    _id: string
    adminEmail: string
    details: string
    createdAt: string
}

const SEGMENTS = [
    { value: "all", label: "All users" },
    { value: "sellers", label: "Sellers (have a marketplace listing)" },
    { value: "free_plan", label: "Free plan users" },
    { value: "pro_plan", label: "Pro plan users" },
]

function Toast({ message, onDone }: { message: string; onDone: () => void }) {
    React.useEffect(() => { const t = setTimeout(onDone, 3500); return () => clearTimeout(t) }, [onDone])
    return (
        <div className="fixed bottom-6 right-6 z-[300] flex items-center gap-3 bg-accent text-white px-5 py-3 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-4 duration-300 text-sm font-semibold">
            <Check size={18} /> {message}
        </div>
    )
}

export default function AdminBroadcastPage() {
    const [title, setTitle] = React.useState("")
    const [message, setMessage] = React.useState("")
    const [segment, setSegment] = React.useState("all")
    const [sending, setSending] = React.useState(false)
    const [error, setError] = React.useState("")
    const [toast, setToast] = React.useState("")
    const [history, setHistory] = React.useState<HistoryItem[]>([])
    const [loadingHistory, setLoadingHistory] = React.useState(true)

    const loadHistory = React.useCallback(() => {
        setLoadingHistory(true)
        fetch("/api/admin/broadcast")
            .then((r) => r.json())
            .then((data) => { if (Array.isArray(data)) setHistory(data) })
            .catch(console.error)
            .finally(() => setLoadingHistory(false))
    }, [])

    React.useEffect(() => { loadHistory() }, [loadHistory])

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        if (!title.trim() || !message.trim()) {
            setError("Title and message are required")
            return
        }
        const segLabel = SEGMENTS.find((s) => s.value === segment)?.label || segment
        if (!window.confirm(`Send this announcement to "${segLabel}"? This will notify every matching user immediately.`)) return

        setSending(true)
        try {
            const res = await fetch("/api/admin/broadcast", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: title.trim(), message: message.trim(), segment }),
            })
            const data = await res.json()
            if (!res.ok) {
                setError(data?.error || "Something went wrong")
                return
            }
            setToast(`Sent to ${data.recipientCount} user${data.recipientCount === 1 ? "" : "s"}`)
            setTitle("")
            setMessage("")
            loadHistory()
        } finally {
            setSending(false)
        }
    }

    return (
        <div className="flex flex-col h-full bg-bg-base overflow-y-auto">
            <div className="px-4 sm:px-6 pt-6 sm:pt-8 pb-6">
                <h1 className="text-2xl font-bold text-text-primary">Broadcast</h1>
                <p className="text-text-secondary text-sm mt-0.5">Send an announcement to all users or a segment</p>
            </div>

            <div className="px-4 sm:px-6 pb-10 space-y-6 max-w-2xl">
                <form onSubmit={handleSend} className="rounded-card border border-border bg-bg-panel p-6 space-y-4">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-accent/10 text-accent"><Megaphone size={18} /></div>
                        <h3 className="text-sm font-semibold text-text-primary">New announcement</h3>
                    </div>

                    <div>
                        <label className="text-xs font-medium text-text-secondary">Segment</label>
                        <select
                            value={segment} onChange={(e) => setSegment(e.target.value)}
                            className="w-full mt-1 h-10 rounded-btn border border-border bg-bg-input px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30"
                        >
                            {SEGMENTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="text-xs font-medium text-text-secondary">Title</label>
                        <input
                            value={title} onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. New feature: prompt bundles"
                            className="w-full mt-1 h-10 rounded-btn border border-border bg-bg-input px-3 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent/30"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-medium text-text-secondary">Message</label>
                        <textarea
                            value={message} onChange={(e) => setMessage(e.target.value)}
                            className="w-full mt-1 h-28 rounded-btn border border-border bg-bg-input px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30"
                        />
                    </div>

                    {error && <p className="text-xs text-danger">{error}</p>}

                    <button
                        type="submit" disabled={sending}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold text-white bg-accent hover:bg-accent-hover disabled:opacity-50 transition-colors"
                    >
                        <Send size={14} /> {sending ? "Sending..." : "Send announcement"}
                    </button>
                </form>

                <div className="rounded-card border border-border bg-bg-panel overflow-hidden">
                    <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                        <History size={15} className="text-text-secondary" />
                        <h3 className="text-sm font-semibold text-text-primary">Recent broadcasts</h3>
                    </div>
                    {loadingHistory ? (
                        <div className="p-5 space-y-3">
                            {[...Array(3)].map((_, i) => <div key={i} className="h-10 rounded-btn bg-bg-hover animate-pulse" />)}
                        </div>
                    ) : history.length === 0 ? (
                        <p className="text-sm text-text-secondary px-5 py-6">No broadcasts sent yet.</p>
                    ) : (
                        <div className="divide-y divide-border">
                            {history.map((h) => (
                                <div key={h._id} className="px-5 py-3">
                                    <p className="text-sm text-text-primary">{h.details}</p>
                                    <p className="text-xs text-text-secondary mt-1">
                                        {h.adminEmail} · {new Date(h.createdAt).toLocaleString("en-IN", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {toast && <Toast message={toast} onDone={() => setToast("")} />}
        </div>
    )
}
