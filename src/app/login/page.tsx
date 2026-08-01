"use client"

import * as React from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type Tab = "signin" | "signup"

const BULLETS = [
    "Build prompts with Derek in seconds",
    "Browse 12,400+ proven prompts",
    "Sell your expertise. Keep 80%.",
]

function GoogleIcon() {
    return (
        <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
    )
}

function TabToggle({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
    return (
        <div className="relative grid grid-cols-2 rounded-full bg-bg-hover p-1 mb-7">
            <div
                className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full bg-accent shadow-sm transition-transform duration-200 ease-out"
                style={{ transform: tab === "signup" ? "translateX(calc(100% + 8px))" : "translateX(0)" }}
            />
            <button
                type="button"
                onClick={() => onChange("signin")}
                className={`relative z-10 py-2 rounded-full text-sm font-semibold transition-colors ${tab === "signin" ? "text-white" : "text-text-secondary hover:text-text-primary"}`}
            >
                Sign in
            </button>
            <button
                type="button"
                onClick={() => onChange("signup")}
                className={`relative z-10 py-2 rounded-full text-sm font-semibold transition-colors ${tab === "signup" ? "text-white" : "text-text-secondary hover:text-text-primary"}`}
            >
                Create account
            </button>
        </div>
    )
}

function SignInForm({ onSwitchTab }: { onSwitchTab: () => void }) {
    const [email, setEmail] = React.useState("")
    const [password, setPassword] = React.useState("")
    const [loading, setLoading] = React.useState(false)
    const [message, setMessage] = React.useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email || !password) return
        setLoading(true)
        setMessage("")
        try {
            const res = await signIn("credentials", { email, password, redirect: false })
            if (res?.error) {
                setMessage("Invalid email or password.")
            } else {
                setMessage("Success! Redirecting...")
                window.location.href = "/marketplace"
            }
        } catch {
            setMessage("An unexpected error occurred.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-4">
            <Button
                onClick={() => signIn("google", { callbackUrl: "/marketplace" })}
                variant="outline"
                className="w-full bg-bg-input text-text-primary border-border hover:bg-bg-hover"
            >
                <GoogleIcon /> Sign in with Google
            </Button>

            <div className="relative my-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border"></div></div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-bg-panel text-text-secondary">Or sign in with email</span>
                </div>
            </div>

            {message && (
                <div className="p-3 text-sm text-center border rounded-btn bg-accent/10 border-accent/20 text-accent">
                    {message}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-2 text-text-primary">Email address</label>
                    <Input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-text-primary">Password</label>
                        <Link href="/forgot-password" className="text-xs text-accent hover:underline">Forgot password?</Link>
                    </div>
                    <Input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Signing in..." : "Sign in"}
                </Button>
            </form>

            <p className="text-center text-sm text-text-secondary mt-6">
                Don&apos;t have an account?{" "}
                <button type="button" onClick={onSwitchTab} className="text-accent hover:underline font-medium">
                    Create one
                </button>
            </p>
        </div>
    )
}

function SignUpForm({ onSwitchTab }: { onSwitchTab: () => void }) {
    const router = useRouter()
    const [firstName, setFirstName] = React.useState("")
    const [lastName, setLastName] = React.useState("")
    const [email, setEmail] = React.useState("")
    const [password, setPassword] = React.useState("")
    const [agreed, setAgreed] = React.useState(false)
    const [loading, setLoading] = React.useState(false)
    const [message, setMessage] = React.useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email || !password || !firstName || !agreed) return
        if (password.length < 8) {
            setMessage("Password must be at least 8 characters.")
            return
        }
        setLoading(true)
        setMessage("")
        try {
            const regRes = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ firstName, lastName, email, password }),
            })
            const regData = await regRes.json()
            if (!regRes.ok) {
                setMessage(regData.error || "Registration failed.")
                setLoading(false)
                return
            }
            const res = await signIn("credentials", { email, password, redirect: false })
            if (res?.error) {
                setMessage("Account created — please sign in.")
                setLoading(false)
                onSwitchTab()
                return
            }
            router.push("/marketplace")
        } catch {
            setMessage("An unexpected error occurred.")
            setLoading(false)
        }
    }

    return (
        <div className="space-y-3">
            <Button
                onClick={() => signIn("google", { callbackUrl: "/marketplace" })}
                variant="outline"
                className="w-full bg-bg-input text-text-primary border-border hover:bg-bg-hover"
            >
                <GoogleIcon /> Continue with Google
            </Button>

            <div className="relative my-5">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border"></div></div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-bg-panel text-text-secondary">or use email</span>
                </div>
            </div>

            {message && (
                <div className="p-3 text-sm text-center border rounded-btn bg-accent/10 border-accent/20 text-accent">
                    {message}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex gap-4">
                    <div className="flex-1">
                        <label className="block text-sm font-medium mb-2 text-text-primary">First name</label>
                        <Input type="text" placeholder="John" value={firstName} onChange={e => setFirstName(e.target.value)} required />
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm font-medium mb-2 text-text-primary">Last name</label>
                        <Input type="text" placeholder="Doe" value={lastName} onChange={e => setLastName(e.target.value)} />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-2 text-text-primary">Email</label>
                    <Input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-2 text-text-primary">Password</label>
                    <Input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} />
                    <p className="text-xs text-text-secondary mt-1.5">At least 8 characters</p>
                </div>

                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                        type="checkbox"
                        checked={agreed}
                        onChange={e => setAgreed(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded accent-accent shrink-0"
                        required
                    />
                    <span className="text-xs text-text-secondary leading-relaxed">
                        I agree to the <span className="text-accent font-medium">Terms of Service</span> and{" "}
                        <span className="text-accent font-medium">Privacy Policy</span>
                    </span>
                </label>

                <Button type="submit" className="w-full" disabled={loading || !agreed}>
                    {loading ? "Creating account..." : "Create account"}
                </Button>
            </form>

            <p className="text-center text-sm text-text-secondary mt-6">
                Already have one?{" "}
                <button type="button" onClick={onSwitchTab} className="text-accent hover:underline font-medium">
                    Sign in
                </button>
            </p>
        </div>
    )
}

function LoginPageInner() {
    const searchParams = useSearchParams()
    const initialTab: Tab = searchParams.get("tab") === "signup" ? "signup" : "signin"
    const [tab, setTab] = React.useState<Tab>(initialTab)
    const verify = searchParams.get("verify")

    return (
        <div className="min-h-screen flex flex-col md:grid md:grid-cols-2 bg-bg-base">
            {/* LEFT PANEL — desktop only */}
            <div className="hidden md:flex flex-col justify-between bg-accent text-white p-10 lg:p-14">
                <div>
                    <Link href="/" className="inline-flex items-center gap-2 font-bold text-xl">
                        <div className="relative w-8 h-8 shrink-0">
                            <Image
                                src="/derek-logo.png"
                                alt="Derek"
                                fill
                                className="object-cover rounded-full ring-2 ring-white/40"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
                            />
                        </div>
                        <span>easemyprompt.ai</span>
                    </Link>

                    <h1 className="text-3xl lg:text-4xl font-bold leading-tight mt-12 max-w-sm">
                        The hub for AI that works.
                    </h1>

                    <div className="flex flex-col gap-4 mt-8">
                        {BULLETS.map((b) => (
                            <div key={b} className="flex items-center gap-3">
                                <div className="w-5 h-5 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                                    <Check size={12} className="text-white" />
                                </div>
                                <span className="text-sm text-white/85">{b}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <p className="text-xs text-white/40">© 2026 EaseMyPrompt.ai</p>
            </div>

            {/* MOBILE HEADER — logo only */}
            <div className="md:hidden bg-accent px-6 py-8 flex items-center justify-center">
                <Link href="/" className="inline-flex items-center gap-2 font-bold text-lg text-white">
                    <div className="relative w-7 h-7 shrink-0">
                        <Image
                            src="/derek-logo.png"
                            alt="Derek"
                            fill
                            className="object-cover rounded-full ring-2 ring-white/40"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
                        />
                    </div>
                    <span>easemyprompt.ai</span>
                </Link>
            </div>

            {/* RIGHT PANEL — form */}
            <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
                <div className="w-full max-w-[420px]">
                    <h2 className="text-xl font-semibold text-text-primary">
                        {tab === "signin" ? "Welcome back" : "Create your account"}
                    </h2>
                    <p className="text-sm text-text-secondary mt-1 mb-6">
                        {tab === "signin" ? "Sign in to continue to your dashboard." : "Free to start. No credit card needed."}
                    </p>

                    {verify && (
                        <div className="p-3 mb-5 text-sm text-center border rounded-btn bg-accent/10 border-accent/20 text-accent">
                            Check your email for a sign-in link.
                        </div>
                    )}

                    <TabToggle tab={tab} onChange={setTab} />

                    {tab === "signin" ? (
                        <SignInForm onSwitchTab={() => setTab("signup")} />
                    ) : (
                        <SignUpForm onSwitchTab={() => setTab("signin")} />
                    )}
                </div>
            </div>
        </div>
    )
}

export default function LoginPage() {
    return (
        <React.Suspense fallback={<div className="min-h-screen bg-bg-base" />}>
            <LoginPageInner />
        </React.Suspense>
    )
}
