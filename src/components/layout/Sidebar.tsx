"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { useSession, signOut } from "next-auth/react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, LayoutGrid, Settings, HelpCircle, LogOut, Menu, X, BookOpen, FolderKanban, Star, ShoppingBag } from "lucide-react"

export function Sidebar() {
    const { data: session } = useSession()
    const router = useRouter()
    const searchParams = useSearchParams()
    const pathname = usePathname()
    const currentChatId = searchParams.get('id')
    const [isOpen, setIsOpen] = React.useState(false)
    const [chats, setChats] = React.useState<any[]>([])

    React.useEffect(() => {
        if (session?.user) {
            fetch("/api/chats")
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) setChats(data)
                })
                .catch(err => console.error(err))
        }
    }, [session, currentChatId])

    // Close sidebar on route change (mobile)
    React.useEffect(() => {
        setIsOpen(false)
    }, [currentChatId, pathname])

    const name = session?.user?.name || "User"
    const email = session?.user?.email || "No email"
    const initials = name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()

    // Group chats by date
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todayChats = chats.filter(c => new Date(c.updatedAt) >= today)
    const olderChats = chats.filter(c => new Date(c.updatedAt) < today)

    const navLinks = [
        { href: "/prompt-bank", icon: <LayoutGrid size={16} />, label: "Prompt Bank" },
        { href: "/projects", icon: <FolderKanban size={16} />, label: "My Projects" },
        { href: "/favourites", icon: <Star size={16} />, label: "My Favourites" },
    ]

    const sidebarContent = (
        <>
            <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between mb-6 px-2">
                    <Link href="/" className="flex items-center gap-2 font-bold text-xl" onClick={() => setIsOpen(false)}>
                        {/* Derek logo — small rounded circle */}
                        <div className="relative w-7 h-7 shrink-0">
                            <Image
                                src="/derek-logo.png"
                                alt="Derek"
                                fill
                                className="object-cover rounded-full ring-1 ring-[#e05252]/40"
                                onError={(e) => {
                                    const t = e.target as HTMLImageElement
                                    t.style.display = 'none'
                                }}
                            />
                        </div>
                        <span><span className="text-text-primary">easemyprompt</span><span className="text-accent">.ai</span></span>
                    </Link>
                    {/* Close button — only visible on mobile */}
                    <button
                        className="md:hidden p-1 rounded-btn text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors"
                        onClick={() => setIsOpen(false)}
                        aria-label="Close sidebar"
                    >
                        <X size={20} />
                    </button>
                </div>
                <Button
                    onClick={() => { router.push('/chat'); setIsOpen(false) }}
                    className="w-full justify-start gap-2 bg-accent text-white hover:bg-accent-hover"
                >
                    <Plus size={16} /> New Chat
                </Button>

                {/* Marketplace — promoted, hero feature */}
                <Link href="/marketplace" onClick={() => setIsOpen(false)}>
                    <button
                        className={`w-full mt-2 flex items-center gap-3 px-3 py-2.5 rounded-btn border transition-colors ${pathname === "/marketplace"
                            ? "bg-accent/10 border-accent/40 text-accent"
                            : "bg-accent/5 border-accent/20 text-accent hover:bg-accent/10 hover:border-accent/40"
                            }`}
                    >
                        <ShoppingBag size={16} />
                        <span className="flex-1 text-left text-sm font-semibold">Marketplace</span>
                        <span className="text-[0.65rem] text-accent2 font-medium">Buy & sell</span>
                    </button>
                </Link>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6 hide-scrollbar">
                {todayChats.length > 0 && (
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

                {olderChats.length > 0 && (
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

                {/* Navigation Links */}
                <div className="pt-2 border-t border-border mt-4 space-y-1">
                    {navLinks.map(link => (
                        <Link key={link.href} href={link.href} onClick={() => setIsOpen(false)}>
                            <button
                                className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-btn transition-colors ${pathname === link.href
                                    ? 'bg-bg-hover text-text-primary'
                                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
                                    }`}
                            >
                                {link.icon}
                                {link.label}
                            </button>
                        </Link>
                    ))}
                </div>
            </div>

            <div className="p-4 border-t border-border mt-auto">
                <div className="flex items-center gap-3 px-2 mb-4">
                    <div className="w-9 h-9 rounded-full bg-accent text-white flex items-center justify-center font-bold text-sm shrink-0">
                        {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">{name}</p>
                        <p className="text-xs text-text-secondary truncate">{email}</p>
                    </div>
                </div>

                <div className="flex items-center justify-between px-2 mb-4">
                    <div className="flex items-center gap-4 text-text-secondary">
                        <button aria-label="Settings" className="hover:text-text-primary transition-colors"><Settings size={16} /></button>
                        <button aria-label="Help" className="hover:text-text-primary transition-colors"><HelpCircle size={16} /></button>
                        <button aria-label="Logout" onClick={() => signOut({ callbackUrl: '/' })} className="hover:text-text-primary transition-colors"><LogOut size={16} /></button>
                    </div>
                    <Badge variant="secondary" className="bg-bg-hover">Free Plan</Badge>
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
                className={`
                    fixed md:static inset-y-0 left-0 z-[60]
                    w-[280px] shrink-0 border-r border-border bg-bg-base flex flex-col h-full
                    transition-transform duration-300 ease-in-out
                    ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                `}
            >
                {sidebarContent}
            </aside>
        </>
    )
}
