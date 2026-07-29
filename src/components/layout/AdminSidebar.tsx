"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import {
    LayoutDashboard, FileCheck, Users, BarChart3, Settings, Menu, X, LogOut, ShieldCheck,
} from "lucide-react"

const NAV_ITEMS = [
    { href: "/admin", icon: <LayoutDashboard size={16} />, label: "Dashboard" },
    { href: "/admin/reviews", icon: <FileCheck size={16} />, label: "Prompt Reviews", badgeKey: "pendingReviews" as const },
    { href: "/admin/users", icon: <Users size={16} />, label: "Users" },
    { href: "/admin/analytics", icon: <BarChart3 size={16} />, label: "Analytics" },
]

export function AdminSidebar() {
    const pathname = usePathname()
    const [isOpen, setIsOpen] = React.useState(false)
    const [pendingReviews, setPendingReviews] = React.useState(0)

    React.useEffect(() => {
        fetch("/api/admin/stats")
            .then((r) => r.json())
            .then((data) => setPendingReviews(data?.pendingReviews || 0))
            .catch(() => { })
    }, [pathname])

    React.useEffect(() => {
        setIsOpen(false)
    }, [pathname])

    const sidebarContent = (
        <>
            <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between mb-4 px-2">
                    <Link href="/admin" className="flex items-center gap-2 font-bold text-lg">
                        <div className="w-7 h-7 rounded-full bg-[#1A1D24] text-white flex items-center justify-center shrink-0">
                            <ShieldCheck size={15} />
                        </div>
                        <span>
                            <span className="text-text-primary">easemyprompt</span>
                            <span className="text-accent">.admin</span>
                        </span>
                    </Link>
                    <button
                        className="md:hidden p-1 rounded-btn text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors"
                        onClick={() => setIsOpen(false)}
                        aria-label="Close sidebar"
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>

            <nav className="flex-1 overflow-y-auto p-4 space-y-1 hide-scrollbar">
                {NAV_ITEMS.map((item) => {
                    const active = pathname === item.href
                    const badge = item.badgeKey === "pendingReviews" ? pendingReviews : 0
                    return (
                        <Link key={item.href} href={item.href}>
                            <button
                                className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-btn transition-colors ${active
                                    ? "bg-accent/10 text-accent font-semibold"
                                    : "text-text-secondary hover:text-text-primary hover:bg-bg-hover"
                                    }`}
                            >
                                {item.icon}
                                <span className="flex-1 text-left">{item.label}</span>
                                {badge > 0 && (
                                    <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-danger text-white text-[0.65rem] font-bold">
                                        {badge}
                                    </span>
                                )}
                            </button>
                        </Link>
                    )
                })}

                <button
                    title="Coming soon"
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-btn text-text-secondary/60 cursor-not-allowed"
                >
                    <Settings size={16} />
                    Settings
                </button>
            </nav>

            <div className="p-4 border-t border-border">
                <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-btn text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors"
                >
                    <LogOut size={16} />
                    Sign out
                </button>
            </div>
        </>
    )

    return (
        <>
            <button
                className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-btn bg-bg-panel border border-border text-text-primary shadow-md hover:bg-bg-hover transition-colors"
                onClick={() => setIsOpen(true)}
                aria-label="Open sidebar"
            >
                <Menu size={20} />
            </button>

            {isOpen && (
                <div
                    className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <aside
                className={`
                    fixed md:static inset-y-0 left-0 z-[60]
                    w-[240px] shrink-0 border-r border-border bg-bg-base flex flex-col h-full
                    transition-transform duration-300 ease-in-out
                    ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
                `}
            >
                {sidebarContent}
            </aside>
        </>
    )
}
