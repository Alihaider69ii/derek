"use client"

import Link from "next/link"
import Image from "next/image"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export function Navbar() {
    const { data: session } = useSession()
    const navLinks = [
        { href: "/marketplace", label: "Marketplace" },
        { href: "/", label: "Home" },
        { href: "/#about", label: "About Us" },
        { href: "/blog", label: "Blogs" },
        { href: "/#contact", label: "Contact" },
    ]

    return (
        <nav className="sticky top-0 z-50 w-full h-[64px] border-b border-border bg-bg-panel/95 backdrop-blur supports-[backdrop-filter]:bg-bg-panel/90 shadow-sm">
            <div className="container mx-auto px-4 h-full flex items-center justify-between">

                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 font-bold text-lg md:text-xl">
                    <div className="relative w-8 h-8 shrink-0">
                        <Image
                            src="/derek-logo.png"
                            alt="Derek"
                            fill
                            className="object-cover rounded-full ring-2 ring-accent/40"
                            onError={(e) => {
                                const t = e.target as HTMLImageElement
                                t.style.display = 'none'
                            }}
                        />
                    </div>
                    <span>
                        <span className="text-text-primary">easemyprompt</span>
                        <span className="text-accent">.ai</span>
                    </span>
                </Link>

                {/* Center Links (Desktop) */}
                <div className="hidden md:flex items-center gap-7">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`text-sm transition-colors relative group ${
                                link.href === "/marketplace"
                                    ? "font-semibold text-accent hover:text-accent-hover"
                                    : "font-medium text-text-secondary hover:text-text-primary"
                            }`}
                        >
                            {link.label}
                            <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-accent rounded-full transition-all group-hover:w-full" />
                        </Link>
                    ))}
                </div>

                {/* Right Auth actions */}
                <div className="flex items-center gap-3">
                    {session?.user ? (
                        <>
                            <Link href="/sell/new">
                                <Button className="text-sm font-semibold px-5 rounded-full bg-accent hover:bg-accent-hover text-white shadow-md hover:shadow-lg transition-all">
                                    <Plus size={15} className="mr-1.5" /> New prompt
                                </Button>
                            </Link>
                            <Link href="/dashboard">
                                <Button variant="ghost" className="hidden sm:inline-flex text-sm font-medium">Dashboard</Button>
                            </Link>
                        </>
                    ) : (
                        <>
                            <Link href="/login">
                                <Button variant="ghost" className="hidden sm:inline-flex text-sm font-medium">Login</Button>
                            </Link>
                            <Link href="/signup">
                                <Button className="text-sm font-semibold px-5 rounded-full bg-accent hover:bg-accent-hover text-white shadow-md hover:shadow-lg transition-all">
                                    Get started
                                </Button>
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    )
}
