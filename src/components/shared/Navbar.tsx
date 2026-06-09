"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Sun, Moon } from "lucide-react"

// ── Theme Toggle Button ───────────────────────────────────────────────────────
function ThemeToggle() {
    const [theme, setTheme] = useState<"dark" | "light">("light")

    // On mount: read saved preference and apply it (default = light)
    useEffect(() => {
        const saved = (localStorage.getItem("emp-theme") as "dark" | "light") || "light"
        setTheme(saved)
        if (saved === "dark") {
            document.documentElement.classList.add("dark-theme")
        } else {
            document.documentElement.classList.remove("dark-theme")
        }
    }, [])

    const toggleTheme = () => {
        const next = theme === "dark" ? "light" : "dark"
        setTheme(next)
        localStorage.setItem("emp-theme", next)
        if (next === "dark") {
            document.documentElement.classList.add("dark-theme")
        } else {
            document.documentElement.classList.remove("dark-theme")
        }
    }

    return (
        <button
            onClick={toggleTheme}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="relative w-[52px] h-[28px] rounded-full border border-border bg-bg-panel transition-colors hover:border-[#6c63ff]/60 focus:outline-none focus:ring-2 focus:ring-[#6c63ff]/40"
            aria-label="Toggle theme"
        >
            {/* sliding pill */}
            <span
                className={`absolute top-[3px] left-[3px] w-[22px] h-[22px] rounded-full flex items-center justify-center transition-transform duration-300 ${
                    theme === "dark"
                        ? "translate-x-[24px] bg-[#6c63ff] text-white shadow-[0_0_8px_rgba(108,99,255,0.6)]"
                        : "translate-x-0 bg-bg-hover text-text-secondary"
                }`}
            >
                {theme === "light" ? <Moon size={13} /> : <Sun size={13} />}
            </span>
        </button>
    )
}

export function Navbar() {
    const navLinks = [
        { href: "/", label: "Home" },
        { href: "/#about", label: "About Us" },
        { href: "/blog", label: "Blogs" },
        { href: "/marketplace", label: "Marketplace" },
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
                            className="object-cover rounded-full ring-2 ring-[#6c63ff]/40"
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
                            className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors relative group"
                        >
                            {link.label}
                            <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-accent rounded-full transition-all group-hover:w-full" />
                        </Link>
                    ))}
                </div>

                {/* Right Auth actions */}
                <div className="flex items-center gap-3">
                    <ThemeToggle />
                    <Link href="/login">
                        <Button variant="ghost" className="hidden sm:inline-flex text-sm font-medium">Login</Button>
                    </Link>
                    <Link href="/signup">
                        <Button className="text-sm font-semibold px-5 rounded-full bg-accent hover:bg-accent-hover text-white shadow-md hover:shadow-lg transition-all">
                            Get started
                        </Button>
                    </Link>
                </div>
            </div>
        </nav>
    )
}
