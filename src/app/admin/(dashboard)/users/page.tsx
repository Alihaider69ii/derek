"use client"

import * as React from "react"
import { ShieldCheck, ShieldOff, Ban, Users as UsersIcon, Search, Download, History, X } from "lucide-react"

export const dynamic = "force-dynamic"

type AdminUser = {
    _id: string
    name: string
    email: string
    joinDate: string
    lastActiveAt: string | null
    promptsCount: number
    salesCount: number
    totalSpent: number
    role: "user" | "admin"
    suspended: boolean
}

type ActivityEntry = {
    _id: string
    adminEmail: string
    action: string
    details?: string
    createdAt: string
}

function formatINR(n: number) {
    return `₹${n.toLocaleString("en-IN")}`
}

function csvCell(v: string | number) {
    const s = String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function downloadCsv(filename: string, rows: (string | number)[][]) {
    const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
}

function ActivityModal({ user, onClose }: { user: AdminUser; onClose: () => void }) {
    const [entries, setEntries] = React.useState<ActivityEntry[] | null>(null)

    React.useEffect(() => {
        fetch(`/api/admin/users/${user._id}/activity`)
            .then((r) => r.json())
            .then((data) => { if (Array.isArray(data)) setEntries(data) })
            .catch(() => setEntries([]))
    }, [user._id])

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg bg-bg-panel border border-border rounded-card p-6 max-h-[80vh] flex flex-col">
                <div className="flex items-center justify-between mb-1">
                    <h3 className="text-lg font-semibold text-text-primary">Activity log</h3>
                    <button onClick={onClose} className="p-1 rounded-btn text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors">
                        <X size={18} />
                    </button>
                </div>
                <p className="text-sm text-text-secondary mb-4">Admin actions taken on {user.name} ({user.email})</p>

                <div className="overflow-y-auto flex-1 -mx-6 px-6">
                    {entries === null ? (
                        <div className="space-y-2">
                            {[...Array(3)].map((_, i) => <div key={i} className="h-10 rounded-btn bg-bg-hover animate-pulse" />)}
                        </div>
                    ) : entries.length === 0 ? (
                        <p className="text-sm text-text-secondary py-6 text-center">No admin actions recorded for this user yet</p>
                    ) : (
                        <div className="divide-y divide-border">
                            {entries.map((e) => (
                                <div key={e._id} className="py-3">
                                    <p className="text-sm text-text-primary">
                                        <span className="font-medium">{e.adminEmail}</span> — {e.action.replace(/_/g, " ")}
                                    </p>
                                    {e.details && <p className="text-xs text-text-secondary mt-0.5">{e.details}</p>}
                                    <p className="text-xs text-text-secondary mt-0.5">
                                        {new Date(e.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default function AdminUsersPage() {
    const [users, setUsers] = React.useState<AdminUser[]>([])
    const [loading, setLoading] = React.useState(true)
    const [busyId, setBusyId] = React.useState<string | null>(null)
    const [error, setError] = React.useState("")
    const [activityUser, setActivityUser] = React.useState<AdminUser | null>(null)

    const [q, setQ] = React.useState("")
    const [role, setRole] = React.useState("")
    const [status, setStatus] = React.useState("")

    const load = React.useCallback((opts: { q: string; role: string; status: string }) => {
        setLoading(true)
        const params = new URLSearchParams()
        if (opts.q) params.set("q", opts.q)
        if (opts.role) params.set("role", opts.role)
        if (opts.status) params.set("status", opts.status)

        fetch(`/api/admin/users?${params.toString()}`)
            .then((r) => r.json())
            .then((data) => { if (Array.isArray(data)) setUsers(data) })
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    React.useEffect(() => { load({ q: "", role: "", status: "" }) }, [load])

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault()
        load({ q, role, status })
    }

    const act = async (id: string, action: "make_admin" | "remove_admin" | "suspend" | "unsuspend") => {
        setBusyId(id)
        setError("")
        try {
            const res = await fetch(`/api/admin/users/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action }),
            })
            const data = await res.json()
            if (!res.ok) {
                setError(data.error || "Action failed")
                return
            }
            setUsers((prev) => prev.map((u) => (u._id === id ? { ...u, role: data.user.role, suspended: data.user.suspended } : u)))
        } finally {
            setBusyId(null)
        }
    }

    const exportCsv = () => {
        const header = ["Name", "Email", "Join date", "Last active", "Prompts", "Sales", "Total spent (INR)", "Role", "Suspended"]
        const rows = users.map((u) => [
            u.name, u.email,
            new Date(u.joinDate).toISOString().slice(0, 10),
            u.lastActiveAt ? new Date(u.lastActiveAt).toISOString() : "",
            u.promptsCount, u.salesCount, u.totalSpent, u.role, u.suspended ? "Yes" : "No",
        ])
        downloadCsv(`users-${new Date().toISOString().slice(0, 10)}.csv`, [header, ...rows])
    }

    return (
        <div className="flex flex-col h-full bg-bg-base overflow-y-auto">
            <div className="px-4 sm:px-6 pt-6 sm:pt-8 pb-6 flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Users</h1>
                    <p className="text-text-secondary text-sm mt-0.5">Manage roles and account access</p>
                </div>
                <button
                    onClick={exportCsv}
                    disabled={users.length === 0}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border border-border text-text-primary hover:bg-bg-hover disabled:opacity-50 transition-colors"
                >
                    <Download size={14} /> Export CSV
                </button>
            </div>

            <div className="px-4 sm:px-6 pb-10 space-y-4">
                <form onSubmit={handleFilter} className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                        <input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Search by name or email"
                            className="w-full h-10 rounded-btn border border-border bg-bg-input pl-9 pr-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30"
                        />
                    </div>
                    <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="h-10 rounded-btn border border-border bg-bg-input px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30"
                    >
                        <option value="">All roles</option>
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                    </select>
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="h-10 rounded-btn border border-border bg-bg-input px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30"
                    >
                        <option value="">All statuses</option>
                        <option value="active">Active</option>
                        <option value="suspended">Suspended</option>
                    </select>
                    <button
                        type="submit"
                        className="h-10 px-5 rounded-full text-sm font-bold text-white bg-accent hover:bg-accent-hover transition-colors"
                    >
                        Filter
                    </button>
                </form>

                {error && (
                    <div className="p-3 text-sm text-center border rounded-btn bg-danger/10 border-danger/20 text-danger">
                        {error}
                    </div>
                )}

                <div className="rounded-card border border-border bg-bg-panel overflow-hidden">
                    {loading ? (
                        <div className="p-5 space-y-3">
                            {[...Array(5)].map((_, i) => <div key={i} className="h-14 rounded-btn bg-bg-hover animate-pulse" />)}
                        </div>
                    ) : users.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-5">
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-accent/10 text-accent">
                                <UsersIcon size={24} />
                            </div>
                            <p className="text-text-primary font-semibold">No users found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-[0.7rem] uppercase tracking-wider text-text-secondary">
                                        <th className="px-5 py-3 font-semibold">User</th>
                                        <th className="px-5 py-3 font-semibold">Joined</th>
                                        <th className="px-5 py-3 font-semibold">Last active</th>
                                        <th className="px-5 py-3 font-semibold">Prompts</th>
                                        <th className="px-5 py-3 font-semibold">Sales</th>
                                        <th className="px-5 py-3 font-semibold">Total spent</th>
                                        <th className="px-5 py-3 font-semibold">Role</th>
                                        <th className="px-5 py-3 font-semibold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((u) => (
                                        <tr key={u._id} className="border-t border-border hover:bg-bg-hover/50 transition-colors">
                                            <td className="px-5 py-3.5">
                                                <p className="font-medium text-text-primary truncate max-w-[200px]">{u.name}</p>
                                                <p className="text-xs text-text-secondary truncate max-w-[200px]">{u.email}</p>
                                            </td>
                                            <td className="px-5 py-3.5 text-text-secondary whitespace-nowrap">
                                                {new Date(u.joinDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                            </td>
                                            <td className="px-5 py-3.5 text-text-secondary whitespace-nowrap">
                                                {u.lastActiveAt ? new Date(u.lastActiveAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Never"}
                                            </td>
                                            <td className="px-5 py-3.5 text-text-secondary">{u.promptsCount}</td>
                                            <td className="px-5 py-3.5 text-text-secondary">{u.salesCount}</td>
                                            <td className="px-5 py-3.5 text-text-secondary">{formatINR(u.totalSpent)}</td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-1.5">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[0.7rem] font-semibold border ${u.role === "admin"
                                                        ? "bg-accent/10 text-accent border-accent/20"
                                                        : "bg-bg-hover text-text-secondary border-border"
                                                        }`}>
                                                        {u.role === "admin" ? "Admin" : "User"}
                                                    </span>
                                                    {u.suspended && (
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[0.7rem] font-semibold bg-danger/10 text-danger border border-danger/20">
                                                            Suspended
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex justify-end gap-2 flex-wrap">
                                                    <button
                                                        onClick={() => setActivityUser(u)}
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-btn text-xs font-semibold border border-border text-text-primary hover:bg-bg-hover transition-colors"
                                                    >
                                                        <History size={13} /> Activity
                                                    </button>
                                                    {u.role === "admin" ? (
                                                        <button
                                                            onClick={() => act(u._id, "remove_admin")}
                                                            disabled={busyId === u._id}
                                                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-btn text-xs font-semibold border border-border text-text-primary hover:bg-bg-hover disabled:opacity-50 transition-colors"
                                                        >
                                                            <ShieldOff size={13} /> Remove admin
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => act(u._id, "make_admin")}
                                                            disabled={busyId === u._id}
                                                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-btn text-xs font-semibold border border-border text-text-primary hover:bg-bg-hover disabled:opacity-50 transition-colors"
                                                        >
                                                            <ShieldCheck size={13} /> Make admin
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => act(u._id, u.suspended ? "unsuspend" : "suspend")}
                                                        disabled={busyId === u._id}
                                                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-btn text-xs font-semibold transition-colors disabled:opacity-50 ${u.suspended
                                                            ? "border border-border text-text-primary hover:bg-bg-hover"
                                                            : "text-white bg-danger hover:bg-danger/90"
                                                            }`}
                                                    >
                                                        <Ban size={13} /> {u.suspended ? "Unsuspend" : "Suspend"}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {activityUser && <ActivityModal user={activityUser} onClose={() => setActivityUser(null)} />}
        </div>
    )
}
