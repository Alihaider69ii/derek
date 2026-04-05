"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"

export function Navbar() {
    return (
        <nav className="sticky top-0 z-50 w-full h-[60px] border-b border-border bg-bg-base/95 backdrop-blur supports-[backdrop-filter]:bg-bg-base/80">
            <div className="container mx-auto px-4 h-full flex items-center justify-between">

                {/* Logo + Derek avatar */}
                <Link href="/" className="flex items-center gap-2 font-bold text-lg md:text-xl">
                    <div className="relative w-8 h-8 shrink-0">
                        <Image
                            src="/derek-logo.png"
                            alt="Derek"
                            fill
                            className="object-cover rounded-full ring-2 ring-[#e05252]/40"
                            onError={(e) => {
                                const t = e.target as HTMLImageElement
                                t.style.display = 'none'
                            }}
                        />
                    </div>
                    <span className="text-text-primary">EaseMyPrompt</span>
                    <span className="text-accent">.ai</span>
                </Link>

                {/* Center Links (Desktop) */}
                <div className="hidden md:flex items-center gap-6">
                    <Link href="/" className="text-sm text-text-secondary hover:text-text-primary transition-colors">Home</Link>
                    <Link href="/prompt-bank" className="text-sm text-text-secondary hover:text-text-primary transition-colors">Prompt Bank</Link>
                    <Link href="/blog" className="text-sm text-text-secondary hover:text-text-primary transition-colors">Blog</Link>
                    <Link href="/projects" className="text-sm text-text-secondary hover:text-text-primary transition-colors">Projects</Link>
                    <Link href="/#about" className="text-sm text-text-secondary hover:text-text-primary transition-colors">About</Link>
                    <Link href="/#contact" className="text-sm text-text-secondary hover:text-text-primary transition-colors">Contact</Link>
                </div>

                {/* Right Auth actions */}
                <div className="flex items-center gap-3">
                    <Link href="/login">
                        <Button variant="ghost" className="hidden sm:inline-flex">Login</Button>
                    </Link>
                    <Link href="/signup">
                        <Button>Sign Up Free</Button>
                    </Link>
                </div>
            </div>
        </nav>
    )
}
