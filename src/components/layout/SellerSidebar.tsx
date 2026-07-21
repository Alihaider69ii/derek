"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { useSession } from "next-auth/react"
import { usePathname } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import {
    LayoutDashboard, FileText, Wallet, ArrowLeftRight,
    Settings, HelpCircle, Menu, X,
} from "lucide-react"

const NAV_SECTIONS = [
    {
        label: "OVERVIEW",
        items: [
            { href: "/dashboard", icon: <LayoutDashboard size={16} />, label: "Dashboard" },
            { href: "/dashboard#top-prompts", icon: <FileText size={16} />, label: "My prompts" },
        ],
    },
    {
        label: "EARNINGS",
        items: [
            { href: "/dashboard#payout", icon: <Wallet size={16} />, label: "Payouts" },
            { href: "/dashboard#top-prompts", icon: <ArrowLeftRight size={16} />, label: "Transactions" },
        ],
    },
]

const ACCOUNT_ITEMS = [
    { icon: <Settings size={16} />, label: "Settings" },
    { icon: <HelpCircle size={16} />, label: "Help" },
]

export function SellerSidebar() {
    const { data: session } = useSession()
    const pathname = usePathname()
    const [isOpen, setIsOpen] = React.useState(false)
    const [plan, setPlan] = React.useState<string | null>(null)

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

    const sidebarContent = (
        <>
            <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between mb-4 px-2">
                    <Link href="/" className="flex items-center gap-2 font-bold text-lg">
                        <div className="relative w-7 h-7 shrink-0">
                            <Image
                                src="/derek-logo.png"
                                alt="Derek"
                                fill
                                className="object-cover rounded-full ring-1 ring-accent/40"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                            />
                        </div>
                        <span><span className="text-text-primary">easemyprompt</span><span className="text-accent">.ai</span></span>
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
                <div className="flex items-center gap-3 px-2">
                    <div className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center font-bold text-sm shrink-0">
                        {initial}
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-text-primary truncate">{name}</p>
                        <Badge variant="secondary" className="bg-bg-hover mt-0.5 text-[0.65rem]">
                            {plan === "Pro" ? "Pro seller" : "Seller"}
                        </Badge>
                    </div>
                </div>
            </div>

            <nav className="flex-1 overflow-y-auto p-4 space-y-6 hide-scrollbar">
                {NAV_SECTIONS.map(section => (
                    <div key={section.label}>
                        <h4 className="text-[0.7rem] uppercase tracking-wider text-text-secondary font-semibold mb-2 px-2">
                            {section.label}
                        </h4>
                        <div className="space-y-1">
                            {section.items.map(item => {
                                const active = item.href === "/dashboard"
                                    ? pathname === "/dashboard"
                                    : false
                                return (
                                    <Link key={item.label} href={item.href}>
                                        <button
                                            className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-btn transition-colors ${active
                                                ? "bg-accent/10 text-accent font-semibold"
                                                : "text-text-secondary hover:text-text-primary hover:bg-bg-hover"
                                                }`}
                                        >
                                            {item.icon}
                                            {item.label}
                                        </button>
                                    </Link>
                                )
                            })}
                        </div>
                    </div>
                ))}

                <div>
                    <h4 className="text-[0.7rem] uppercase tracking-wider text-text-secondary font-semibold mb-2 px-2">
                        ACCOUNT
                    </h4>
                    <div className="space-y-1">
                        {ACCOUNT_ITEMS.map(item => (
                            <button
                                key={item.label}
                                title="Coming soon"
                                className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-btn text-text-secondary/60 cursor-not-allowed"
                            >
                                {item.icon}
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>
            </nav>
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
                    w-[260px] shrink-0 border-r border-border bg-bg-base flex flex-col h-full
                    transition-transform duration-300 ease-in-out
                    ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                `}
            >
                {sidebarContent}
            </aside>
        </>
    )
}
