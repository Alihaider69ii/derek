"use client"

import * as React from "react"
import Link from "next/link"
import { MessageSquare, Search, ChevronLeft, ChevronRight } from "lucide-react"

export const dynamic = "force-dynamic"

type ChatRow = {
    _id: string
    title: string
    createdAt: string
    updatedAt: string
    userName: string
    userEmail: string
    messageCount: number
    preview: string
}

export default function AdminDerekChatsPage() {
    const [chats, setChats] = React.useState<ChatRow[]>([])
    const [total, setTotal] = React.useState(0)
    const [page, setPage] = React.useState(1)
    const [pageSize, setPageSize] = React.useState(20)
    const [loading, setLoading] = React.useState(true)

    const [q, setQ] = React.useState("")
    const [from, setFrom] = React.useState("")
    const [to, setTo] = React.useState("")

    const load = React.useCallback((opts: { q: string; from: string; to: string; page: number }) => {
        setLoading(true)
        const params = new URLSearchParams()
        if (opts.q) params.set("q", opts.q)
        if (opts.from) params.set("from", opts.from)
        if (opts.to) params.set("to", opts.to)
        params.set("page", String(opts.page))

        fetch(`/api/admin/derek-chats?${params.toString()}`)
            .then((r) => r.json())
            .then((data) => {
                if (data?.error) return
                setChats(data.chats || [])
                setTotal(data.total || 0)
                setPageSize(data.pageSize || 20)
            })
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    React.useEffect(() => { load({ q, from, to, page }) }, [page]) // eslint-disable-line react-hooks/exhaustive-deps

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        setPage(1)
        load({ q, from, to, page: 1 })
    }

    const totalPages = Math.max(1, Math.ceil(total / pageSize))

    return (
        <div className="flex flex-col h-full bg-bg-base overflow-y-auto">
            <div className="px-4 sm:px-6 pt-6 sm:pt-8 pb-6">
                <h1 className="text-2xl font-bold text-text-primary">Derek Chats</h1>
                <p className="text-text-secondary text-sm mt-0.5">All Derek conversations across every user</p>
            </div>

            <div className="px-4 sm:px-6 pb-10 space-y-4">
                <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                        <input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Search by user name or email"
                            className="w-full h-10 rounded-btn border border-border bg-bg-input pl-9 pr-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30"
                        />
                    </div>
                    <input
                        type="date"
                        value={from}
                        onChange={(e) => setFrom(e.target.value)}
                        className="h-10 rounded-btn border border-border bg-bg-input px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30"
                    />
                    <input
                        type="date"
                        value={to}
                        onChange={(e) => setTo(e.target.value)}
                        className="h-10 rounded-btn border border-border bg-bg-input px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30"
                    />
                    <button
                        type="submit"
                        className="h-10 px-5 rounded-full text-sm font-bold text-white bg-accent hover:bg-accent-hover transition-colors"
                    >
                        Filter
                    </button>
                </form>

                <div className="rounded-card border border-border bg-bg-panel overflow-hidden">
                    {loading ? (
                        <div className="p-5 space-y-3">
                            {[...Array(6)].map((_, i) => <div key={i} className="h-14 rounded-btn bg-bg-hover animate-pulse" />)}
                        </div>
                    ) : chats.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-5">
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-accent/10 text-accent">
                                <MessageSquare size={24} />
                            </div>
                            <p className="text-text-primary font-semibold">No Derek chats found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-[0.7rem] uppercase tracking-wider text-text-secondary">
                                        <th className="px-5 py-3 font-semibold">User</th>
                                        <th className="px-5 py-3 font-semibold">Preview</th>
                                        <th className="px-5 py-3 font-semibold">Messages</th>
                                        <th className="px-5 py-3 font-semibold">Last activity</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {chats.map((c) => (
                                        <tr key={c._id} className="border-t border-border hover:bg-bg-hover/50 transition-colors">
                                            <td className="px-5 py-3.5">
                                                <Link href={`/admin/derek-chats/${c._id}`} className="block">
                                                    <p className="font-medium text-text-primary truncate max-w-[200px]">{c.userName}</p>
                                                    <p className="text-xs text-text-secondary truncate max-w-[200px]">{c.userEmail}</p>
                                                </Link>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <Link href={`/admin/derek-chats/${c._id}`} className="block text-text-secondary truncate max-w-[360px]">
                                                    {c.preview || "—"}
                                                </Link>
                                            </td>
                                            <td className="px-5 py-3.5 text-text-secondary">{c.messageCount}</td>
                                            <td className="px-5 py-3.5 text-text-secondary whitespace-nowrap">
                                                {new Date(c.updatedAt).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {total > pageSize && (
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-text-secondary">
                            Page {page} of {totalPages} · {total} chats
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page <= 1}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-btn text-xs font-semibold border border-border text-text-primary hover:bg-bg-hover disabled:opacity-50 transition-colors"
                            >
                                <ChevronLeft size={13} /> Prev
                            </button>
                            <button
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page >= totalPages}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-btn text-xs font-semibold border border-border text-text-primary hover:bg-bg-hover disabled:opacity-50 transition-colors"
                            >
                                Next <ChevronRight size={13} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
