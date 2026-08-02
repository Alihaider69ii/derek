"use client"

import * as React from "react"
import { ShieldCheck, ShieldOff, Ban, Users as UsersIcon } from "lucide-react"

export const dynamic = "force-dynamic"

type AdminUser = {
    _id: string
    name: string
    email: string
    joinDate: string
    promptsCount: number
    salesCount: number
    role: "user" | "admin"
    suspended: boolean
}

export default function AdminUsersPage() {
    const [users, setUsers] = React.useState<AdminUser[]>([])
    const [loading, setLoading] = React.useState(true)
    const [busyId, setBusyId] = React.useState<string | null>(null)
    const [error, setError] = React.useState("")

    const load = React.useCallback(() => {
        setLoading(true)
        fetch("/api/admin/users")
            .then((r) => r.json())
            .then((data) => { if (Array.isArray(data)) setUsers(data) })
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    React.useEffect(() => { load() }, [load])

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

    return (
        <div className="flex flex-col h-full bg-bg-base overflow-y-auto">
            <div className="px-4 sm:px-6 pt-6 sm:pt-8 pb-6">
                <h1 className="text-2xl font-bold text-text-primary">Users</h1>
                <p className="text-text-secondary text-sm mt-0.5">Manage roles and account access</p>
            </div>

            <div className="px-4 sm:px-6 pb-10">
                {error && (
                    <div className="p-3 mb-4 text-sm text-center border rounded-btn bg-danger/10 border-danger/20 text-danger">
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
                            <p className="text-text-primary font-semibold">No users yet</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-[0.7rem] uppercase tracking-wider text-text-secondary">
                                        <th className="px-5 py-3 font-semibold">User</th>
                                        <th className="px-5 py-3 font-semibold">Joined</th>
                                        <th className="px-5 py-3 font-semibold">Prompts</th>
                                        <th className="px-5 py-3 font-semibold">Sales</th>
                                        <th className="px-5 py-3 font-semibold">Role</th>
                                        <th className="px-5 py-3 font-semibold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((u) => (
                                        <tr key={u._id} className="border-t border-border hover:bg-bg-hover/50 transition-colors">
                                            <td className="px-5 py-3.5">
                                                <p className="font-medium text-text-primary truncate max-w-[220px]">{u.name}</p>
                                                <p className="text-xs text-text-secondary truncate max-w-[220px]">{u.email}</p>
                                            </td>
                                            <td className="px-5 py-3.5 text-text-secondary whitespace-nowrap">
                                                {new Date(u.joinDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                            </td>
                                            <td className="px-5 py-3.5 text-text-secondary">{u.promptsCount}</td>
                                            <td className="px-5 py-3.5 text-text-secondary">{u.salesCount}</td>
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
                                                <div className="flex justify-end gap-2">
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
        </div>
    )
}
