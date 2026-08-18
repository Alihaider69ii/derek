"use client"

import Link from "next/link"
import Image from "next/image"
import { useSession } from "next-auth/react"

// Simple top bar for standalone public pages (e.g. /[username] profiles) —
// logo + auth actions, no dashboard sidebar. Works for logged-out visitors.
export function PublicTopBar() {
    const { data: session, status } = useSession()
    const username = (session?.user as any)?.username as string | undefined
    const name = session?.user?.name || "User"

    return (
        <header className="sticky top-0 z-20 flex items-center justify-between px-4 sm:px-8 h-14 border-b border-border bg-bg-base/90 backdrop-blur-md">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg">
                <div className="relative w-7 h-7 shrink-0">
                    <Image src="/derek-logo.png" alt="Derek" fill className="object-cover rounded-full ring-1 ring-[#e05252]/40" />
                </div>
                <span className="text-text-primary">easemyprompt<span className="text-accent">.ai</span></span>
            </Link>

            <div className="flex items-center gap-3">
                {status === "authenticated" ? (
                    <>
                        <Link href="/chat" className="text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors">
                            Dashboard
                        </Link>
                        <Link
                            href={username ? `/${username}` : "/profile"}
                            className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center font-bold text-xs shrink-0"
                        >
                            {name.slice(0, 1).toUpperCase()}
                        </Link>
                    </>
                ) : status === "loading" ? null : (
                    <>
                        <Link href="/login" className="text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors">
                            Log in
                        </Link>
                        <Link
                            href="/login?tab=signup"
                            className="text-sm font-bold text-white bg-accent hover:bg-accent-hover px-4 py-2 rounded-full transition-colors"
                        >
                            Sign up
                        </Link>
                    </>
                )}
            </div>
        </header>
    )
}
