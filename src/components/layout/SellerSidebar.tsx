"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { useSession } from "next-auth/react"
import { usePathname } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { NotificationBell } from "@/components/shared/NotificationBell"
import {
    LayoutDashboard, FileText, Wallet, Settings, Menu, X,
    Sparkles, ShoppingBag, PanelLeftClose, PanelLeftOpen,
} from "lucide-react"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
    { href: "/dashboard", icon: <LayoutDashboard size={18} />, label: "Dashboard" },
    { href: "/dashboard/prompts", icon: <FileText size={18} />, label: "My Prompts" },
    { href: "/chat", icon: <Sparkles size={18} />, label: "Ask Derek" },
    { href: "/marketplace", icon: <ShoppingBag size={18} />, label: "Marketplace" },
    { href: "/dashboard/earnings", icon: <Wallet size={18} />, label: "Earnings" },
    { href: "/dashboard/settings", icon: <Settings size={18} />, label: "Settings" },
]

const COLLAPSE_KEY = "seller-sidebar-collapsed"

export function SellerSidebar() {
    const { data: session } = useSession()
    const pathname = usePathname()
    const [isOpen, setIsOpen] = React.useState(false)
    const [plan, setPlan] = React.useState<string | null>(null)
    const [collapsed, setCollapsed] = React.useState(false)
    const [hydrated, setHydrated] = React.useState(false)

    React.useEffect(() => {
        const stored = window.localStorage.getItem(COLLAPSE_KEY)
        if (stored === "1") setCollapsed(true)
        setHydrated(true)
    }, [])

    const toggleCollapsed = () => {
        setCollapsed(prev => {
            const next = !prev
            window.localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0")
            return next
        })
    }

    React.useEffect(() => {
        if (session?.user) {
            fetch("/api/dashboard/stats")
                .then(res => res.json())
                .then(data => setPlan(data?.plan || "Free"))
                .catch(() => setPlan("Free"))
        }
    }, [session])

    React.useEffect(() => {
        setIsOpen(false)
    }, [pathname])

    const name = session?.user?.name || "User"
    const initial = name.charAt(0).toUpperCase()

    // Collapse only ever applies at md:+ — the mobile drawer always shows full labels.
    const iconOnly = hydrated && collapsed

    const sidebarContent = (
        <>
            <div className="p-4 border-b border-border">
                <div className={cn("flex items-center mb-4", iconOnly ? "md:justify-center px-0 md:px-0" : "justify-between px-2")}>
                    <Link href="/" className={cn("flex items-center gap-2 font-bold text-lg", iconOnly && "md:justify-center")}>
                        <div className="relative w-7 h-7 shrink-0">
                            <Image
                                src="/derek-logo.png"
                                alt="Derek"
                                fill
                                className="object-cover rounded-full ring-1 ring-accent/40"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                            />
                        </div>
                        <span className={cn(iconOnly && "md:hidden")}>
                            <span className="text-text-primary">easemyprompt</span><span className="text-accent">.ai</span>
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

                {/* Avatar + username + Pro seller badge */}
                <div className={cn("flex items-center gap-3", iconOnly ? "md:justify-center px-0 md:px-0" : "px-2")}>
                    <div className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center font-bold text-sm shrink-0">
                        {initial}
                    </div>
                    <div className={cn("min-w-0 flex-1", iconOnly && "md:hidden")}>
                        <p className="text-sm font-semibold text-text-primary truncate">{name}</p>
                        <Badge variant="secondary" className="bg-bg-hover mt-0.5 text-[0.65rem]">
                            {plan === "Pro" ? "Pro seller" : "Seller"}
                        </Badge>
                    </div>
                    <div className={cn(iconOnly && "md:hidden")}>
                        <NotificationBell />
                    </div>
                </div>
            </div>

            <nav className="flex-1 overflow-y-auto p-4 space-y-1 hide-scrollbar">
                {NAV_ITEMS.map(item => {
                    const active = pathname === item.href
                    return (
                        <Link key={item.href} href={item.href} title={iconOnly ? item.label : undefined}>
                            <button
                                className={cn(
                                    "w-full flex items-center gap-3 px-3 py-2 text-sm rounded-btn transition-colors",
                                    iconOnly && "md:justify-center md:px-0",
                                    active
                                        ? "bg-accent/10 text-accent font-semibold"
                                        : "text-text-secondary hover:text-text-primary hover:bg-bg-hover"
                                )}
                            >
                                {item.icon}
                                <span className={cn(iconOnly && "md:hidden")}>{item.label}</span>
                            </button>
                        </Link>
                    )
                })}
            </nav>

            <div className="hidden md:block p-3 border-t border-border">
                <button
                    onClick={toggleCollapsed}
                    aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                    className={cn(
                        "w-full flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-btn text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors",
                        iconOnly && "justify-center"
                    )}
                >
                    {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
                    <span className={cn(iconOnly && "md:hidden")}>Collapse</span>
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
                className={cn(
                    "fixed md:static inset-y-0 left-0 z-[60]",
                    "w-[260px] shrink-0 border-r border-border bg-bg-base flex flex-col h-full",
                    "transition-[transform,width] duration-300 ease-in-out",
                    isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
                    iconOnly && "md:w-[76px]"
                )}
            >
                {sidebarContent}
            </aside>
        </>
    )
}
