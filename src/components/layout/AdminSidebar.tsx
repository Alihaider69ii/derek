"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
    LayoutDashboard, FileCheck, Users, BarChart3, Settings, Menu, X, LogOut, ShieldCheck,
    MessageSquare, Activity, BookOpen, ShoppingBag, Wallet, Flag, Megaphone, HeartPulse,
    ScrollText, ChevronsLeft, ChevronsRight,
} from "lucide-react"

const NAV_ITEMS = [
    { href: "/admin", icon: <LayoutDashboard size={16} />, label: "Dashboard" },
    { href: "/admin/reviews", icon: <FileCheck size={16} />, label: "Prompt Reviews", badgeKey: "pendingReviews" as const },
    { href: "/admin/marketplace", icon: <ShoppingBag size={16} />, label: "Marketplace" },
    { href: "/admin/prompt-bank", icon: <BookOpen size={16} />, label: "Prompt Bank" },
    { href: "/admin/payouts", icon: <Wallet size={16} />, label: "Payouts" },
    { href: "/admin/reports", icon: <Flag size={16} />, label: "Reports", badgeKey: "openReports" as const },
    { href: "/admin/broadcast", icon: <Megaphone size={16} />, label: "Broadcast" },
    { href: "/admin/users", icon: <Users size={16} />, label: "Users" },
    { href: "/admin/derek-chats", icon: <MessageSquare size={16} />, label: "Derek Chats" },
    { href: "/admin/ai-usage", icon: <Activity size={16} />, label: "AI Usage" },
    { href: "/admin/analytics", icon: <BarChart3 size={16} />, label: "Analytics" },
    { href: "/admin/system", icon: <HeartPulse size={16} />, label: "System" },
    { href: "/admin/activity-log", icon: <ScrollText size={16} />, label: "Activity Log" },
    { href: "/admin/settings", icon: <Settings size={16} />, label: "Settings" },
]

const COLLAPSE_STORAGE_KEY = "admin-sidebar-collapsed"

export function AdminSidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const [isOpen, setIsOpen] = React.useState(false)
    const [collapsed, setCollapsed] = React.useState(false)
    const [pendingReviews, setPendingReviews] = React.useState(0)
    const [openReports, setOpenReports] = React.useState(0)

    React.useEffect(() => {
        setCollapsed(window.localStorage.getItem(COLLAPSE_STORAGE_KEY) === "1")
    }, [])

    const toggleCollapsed = React.useCallback(() => {
        setCollapsed((prev) => {
            const next = !prev
            window.localStorage.setItem(COLLAPSE_STORAGE_KEY, next ? "1" : "0")
            return next
        })
    }, [])

    const handleSignOut = React.useCallback(async () => {
        await fetch("/api/admin/logout", { method: "POST" })
        router.push("/admin/login")
        router.refresh()
    }, [router])

    React.useEffect(() => {
        fetch("/api/admin/stats")
            .then((r) => r.json())
            .then((data) => {
                setPendingReviews(data?.pendingReviews || 0)
                setOpenReports(data?.openReports || 0)
            })
            .catch(() => { })
    }, [pathname])

    React.useEffect(() => {
        setIsOpen(false)
    }, [pathname])

    const sidebarContent = (
        <>
            <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between mb-4 px-2">
                    <Link href="/admin" className="flex items-center gap-2 font-bold text-lg min-w-0">
                        <div className="w-7 h-7 rounded-full bg-[#1A1D24] text-white flex items-center justify-center shrink-0">
                            <ShieldCheck size={15} />
                        </div>
                        {!collapsed && (
                            <span className="truncate">
                                <span className="text-text-primary">easemyprompt</span>
                                <span className="text-accent">.admin</span>
                            </span>
                        )}
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
                    const badge = item.badgeKey === "pendingReviews" ? pendingReviews : item.badgeKey === "openReports" ? openReports : 0
                    return (
                        <Link key={item.href} href={item.href} title={collapsed ? item.label : undefined}>
                            <button
                                className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-btn transition-colors relative ${collapsed ? "justify-center" : ""} ${active
                                    ? "bg-accent/10 text-accent font-semibold"
                                    : "text-text-secondary hover:text-text-primary hover:bg-bg-hover"
                                    }`}
                            >
                                <span className="relative shrink-0">
                                    {item.icon}
                                    {collapsed && badge > 0 && (
                                        <span className="absolute -top-1.5 -right-1.5 w-2 h-2 rounded-full bg-danger" />
                                    )}
                                </span>
                                {!collapsed && (
                                    <>
                                        <span className="flex-1 text-left">{item.label}</span>
                                        {badge > 0 && (
                                            <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-danger text-white text-[0.65rem] font-bold">
                                                {badge}
                                            </span>
                                        )}
                                    </>
                                )}
                            </button>
                        </Link>
                    )
                })}
            </nav>

            <div className="p-4 border-t border-border space-y-1">
                <button
                    onClick={toggleCollapsed}
                    title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                    className={`hidden md:flex w-full items-center gap-3 px-3 py-2 text-sm rounded-btn text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors ${collapsed ? "justify-center" : ""}`}
                >
                    {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
                    {!collapsed && "Collapse"}
                </button>
                <button
                    onClick={handleSignOut}
                    title={collapsed ? "Sign out" : undefined}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-btn text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors ${collapsed ? "justify-center" : ""}`}
                >
                    <LogOut size={16} />
                    {!collapsed && "Sign out"}
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
                    ${collapsed ? "md:w-[76px]" : "md:w-[240px]"} w-[240px] shrink-0 border-r border-border bg-bg-base flex flex-col h-full
                    transition-[transform,width] duration-300 ease-in-out
                    ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
                `}
            >
                {sidebarContent}
            </aside>
        </>
    )
}
