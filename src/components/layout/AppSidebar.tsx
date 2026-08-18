"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { useSession, signOut } from "next-auth/react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { NotificationBell } from "@/components/shared/NotificationBell"
import {
    Plus, Settings, HelpCircle, LogOut, Menu, X, FolderKanban,
    Star, ShoppingBag, LayoutDashboard, FileText, Wallet, ChevronLeft, ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"

const COLLAPSE_KEY = "app-sidebar-collapsed"

const NAV_LINKS = [
    { href: "/projects", icon: <FolderKanban size={16} />, label: "My Projects" },
    { href: "/favourites", icon: <Star size={16} />, label: "My Favourites" },
    { href: "/dashboard", icon: <LayoutDashboard size={16} />, label: "Dashboard" },
    { href: "/dashboard/prompts", icon: <FileText size={16} />, label: "My Prompts" },
    { href: "/dashboard/earnings", icon: <Wallet size={16} />, label: "Earnings" },
]

export function AppSidebar() {
    const { data: session } = useSession()
    const userId = (session?.user as any)?.id
    const username = (session?.user as any)?.username
    const router = useRouter()
    const searchParams = useSearchParams()
    const pathname = usePathname()
    const currentChatId = searchParams.get('id')

    const [isOpen, setIsOpen] = React.useState(false)
    const [chats, setChats] = React.useState<any[]>([])
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
            fetch("/api/chats")
                .then(res => res.json())
                .then(data => { if (Array.isArray(data)) setChats(data) })
                .catch(err => console.error(err))

            fetch("/api/dashboard/stats")
                .then(res => res.json())
                .then(data => setPlan(data?.plan || "Free"))
                .catch(() => setPlan("Free"))
        }
    }, [session, currentChatId])

    // Close sidebar on route change (mobile)
    React.useEffect(() => {
        setIsOpen(false)
    }, [currentChatId, pathname])

    const name = session?.user?.name || "User"
    const email = session?.user?.email || "No email"
    const initials = name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()

    // Collapse only ever applies at md:+ — the mobile drawer always shows full labels.
    const iconOnly = hydrated && collapsed

    // Group chats by date
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayChats = chats.filter(c => new Date(c.updatedAt) >= today)
    const olderChats = chats.filter(c => new Date(c.updatedAt) < today)

    const sidebarContent = (
        <>
            <div className="p-4 border-b border-border">
                <div className={cn("flex items-center mb-6", iconOnly ? "md:justify-center px-0" : "justify-between px-2")}>
                    <Link href="/" className="flex items-center gap-2 font-bold text-xl" onClick={() => setIsOpen(false)}>
                        <div className="relative w-7 h-7 shrink-0">
                            <Image
                                src="/derek-logo.png"
                                alt="Derek"
                                fill
                                className="object-cover rounded-full ring-1 ring-[#e05252]/40"
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

                <button
                    onClick={() => { router.push('/chat'); setIsOpen(false) }}
                    title={iconOnly ? "New Chat" : undefined}
                    className={cn(
                        "w-full flex items-center gap-2 h-10 rounded-btn text-sm font-semibold bg-accent text-white hover:bg-accent-hover transition-colors",
                        iconOnly ? "md:justify-center md:px-0" : "justify-start px-4"
                    )}
                >
                    <Plus size={16} /> <span className={cn(iconOnly && "md:hidden")}>New Chat</span>
                </button>

                {/* Marketplace — promoted, hero feature */}
                <Link href="/marketplace" onClick={() => setIsOpen(false)}>
                    <button
                        title={iconOnly ? "Marketplace" : undefined}
                        className={cn(
                            "w-full mt-2 flex items-center gap-3 py-2.5 rounded-btn border transition-colors",
                            iconOnly ? "md:justify-center md:px-0 px-3" : "px-3",
                            pathname === "/marketplace"
                                ? "bg-accent/10 border-accent/40 text-accent"
                                : "bg-accent/5 border-accent/20 text-accent hover:bg-accent/10 hover:border-accent/40"
                        )}
                    >
                        <ShoppingBag size={16} />
                        <span className={cn("flex-1 text-left text-sm font-semibold", iconOnly && "md:hidden")}>Marketplace</span>
                        <span className={cn("text-[0.65rem] text-accent2 font-medium", iconOnly && "md:hidden")}>Buy & sell</span>
                    </button>
                </Link>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6 hide-scrollbar">
                {/* Navigation Links */}
                <div className="space-y-1">
                    {NAV_LINKS.map(link => {
                        const active = pathname === link.href
                        return (
                            <Link key={link.href} href={link.href} onClick={() => setIsOpen(false)}>
                                <button
                                    title={iconOnly ? link.label : undefined}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-3 py-2 text-sm rounded-btn transition-colors",
                                        iconOnly && "md:justify-center md:px-0",
                                        active ? "bg-accent/10 text-accent font-semibold" : "text-text-secondary hover:text-text-primary hover:bg-bg-hover"
                                    )}
                                >
                                    {link.icon}
                                    <span className={cn(iconOnly && "md:hidden")}>{link.label}</span>
                                </button>
                            </Link>
                        )
                    })}
                </div>

                {!iconOnly && todayChats.length > 0 && (
                    <div>
                        <h4 className="text-[0.7rem] uppercase tracking-wider text-text-secondary font-semibold mb-3 px-2">Today</h4>
                        <div className="space-y-1">
                            {todayChats.map(chat => (
                                <button
                                    key={chat._id}
                                    onClick={() => { router.push(`/chat?id=${chat._id}`); setIsOpen(false) }}
                                    className={`w-full text-left px-3 py-2 text-sm truncate transition-colors rounded-btn ${currentChatId === chat._id ? 'bg-bg-hover text-text-primary' : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'}`}
                                >
                                    {chat.title}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {!iconOnly && olderChats.length > 0 && (
                    <div>
                        <h4 className="text-[0.7rem] uppercase tracking-wider text-text-secondary font-semibold mb-3 px-2">Previous 7 Days</h4>
                        <div className="space-y-1">
                            {olderChats.map(chat => (
                                <button
                                    key={chat._id}
                                    onClick={() => { router.push(`/chat?id=${chat._id}`); setIsOpen(false) }}
                                    className={`w-full text-left px-3 py-2 text-sm truncate transition-colors rounded-btn ${currentChatId === chat._id ? 'bg-bg-hover text-text-primary' : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'}`}
                                >
                                    {chat.title}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="p-4 border-t border-border mt-auto">
                <Link
                    href={username ? `/${username}` : userId ? `/profile/${userId}` : "/profile"}
                    onClick={() => setIsOpen(false)}
                    title={iconOnly ? name : undefined}
                    className={cn(
                        "flex items-center gap-3 mb-4 rounded-btn hover:bg-bg-hover transition-colors -mx-2 py-1",
                        iconOnly ? "md:justify-center px-2" : "px-2"
                    )}
                >
                    <div className="w-9 h-9 rounded-full bg-accent text-white flex items-center justify-center font-bold text-sm shrink-0">
                        {initials}
                    </div>
                    <div className={cn("flex-1 min-w-0", iconOnly && "md:hidden")}>
                        <p className="text-sm font-medium text-text-primary truncate">{name}</p>
                        <p className="text-xs text-text-secondary truncate">{email}</p>
                    </div>
                </Link>

                <div className={cn("flex items-center", iconOnly ? "md:flex-col md:gap-3 justify-between" : "justify-between px-2")}>
                    <div className={cn("flex items-center gap-4 text-text-secondary", iconOnly && "md:flex-col md:gap-3")}>
                        <Link href="/dashboard/settings" aria-label="Settings" className="hover:text-text-primary transition-colors">
                            <Settings size={16} />
                        </Link>
                        <button aria-label="Help" className="hover:text-text-primary transition-colors"><HelpCircle size={16} /></button>
                        <button aria-label="Logout" onClick={() => signOut({ callbackUrl: '/' })} className="hover:text-text-primary transition-colors"><LogOut size={16} /></button>
                        <NotificationBell />
                    </div>
                    <Badge variant="secondary" className={cn("bg-bg-hover whitespace-nowrap", iconOnly && "md:hidden", !iconOnly && "px-2")}>
                        {plan === "Pro" ? "Pro Seller" : "Free Plan"}
                    </Badge>
                </div>
            </div>
        </>
    )

    return (
        <>
            {/* ── HAMBURGER BUTTON (mobile only) ── */}
            <button
                className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-btn bg-bg-panel border border-border text-text-primary shadow-md hover:bg-bg-hover transition-colors"
                onClick={() => setIsOpen(true)}
                aria-label="Open sidebar"
            >
                <Menu size={20} />
            </button>

            {/* ── BACKDROP (mobile only) ── */}
            {isOpen && (
                <div
                    className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* ── SIDEBAR ── */}
            <aside
                className={cn(
                    "fixed md:static inset-y-0 left-0 z-[60]",
                    "w-[280px] shrink-0 border-r border-border bg-bg-base flex flex-col h-full relative",
                    "transition-[transform,width] duration-300 ease-in-out",
                    isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
                    iconOnly && "md:w-[76px]"
                )}
            >
                {sidebarContent}

                {/* Collapse/expand toggle — vertically centered on the sidebar's edge.
                    Desktop-only: on mobile the sidebar is a full slide-over drawer
                    (open/closed via the hamburger + backdrop), not a persistent rail,
                    so an icon-only "collapsed" state doesn't apply there. */}
                <button
                    onClick={toggleCollapsed}
                    aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                    className="hidden md:flex absolute top-1/2 -right-[18px] -translate-y-1/2 z-10 w-9 h-9 items-center justify-center rounded-full bg-accent text-white ring-2 ring-bg-base hover:bg-accent-hover shadow-md transition-colors"
                >
                    {collapsed ? <ChevronRight size={19} /> : <ChevronLeft size={19} />}
                </button>
            </aside>
        </>
    )
}
