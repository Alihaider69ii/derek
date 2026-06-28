"use client"

import * as React from "react"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function SignupPage() {
    const [firstName, setFirstName] = React.useState("")
    const [lastName, setLastName] = React.useState("")
    const [email, setEmail] = React.useState("")
    const [password, setPassword] = React.useState("")
    const [confirmPassword, setConfirmPassword] = React.useState("")
    const [loading, setLoading] = React.useState(false)
    const [message, setMessage] = React.useState("")

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email || !password || !firstName) return
        if (password !== confirmPassword) {
            setMessage("Passwords do not match.")
            return
        }
        setLoading(true)
        setMessage("")

        try {
            const regRes = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ firstName, lastName, email, password })
            })
            const regData = await regRes.json()
            if (!regRes.ok) {
                setMessage(regData.error || "Registration failed.")
                setLoading(false)
                return
            }

            const res = await signIn("email", { email, redirect: false, callbackUrl: "/marketplace" })
            if (res?.error) {
                setMessage("Failed to send magic link. Please try again.")
            } else {
                setMessage("Success! Verification link sent to your email.")
                setFirstName("")
                setLastName("")
                setEmail("")
                setPassword("")
                setConfirmPassword("")
            }
        } catch (err) {
            setMessage("An unexpected error occurred.")
        } finally {
            setLoading(false)
        }
    }

    const handleGoogleSignUp = () => {
        signIn("google", { callbackUrl: "/marketplace" })
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-bg-base p-4">
            <div className="w-full max-w-[420px] bg-bg-panel border border-border rounded-xl p-8 shadow-xl">
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-1 font-bold text-2xl mb-2">
                        <span className="text-text-primary">EaseMyPrompt</span>
                        <span className="text-accent">.ai</span>
                    </Link>
                    <h1 className="text-xl font-semibold text-text-primary mt-4">Create your account</h1>
                    <p className="text-sm text-text-secondary mt-2">Start engineering prompts like a pro.</p>
                </div>

                {message && (
                    <div className="p-3 mb-6 text-sm text-center border rounded-btn bg-accent/10 border-accent/20 text-accent">
                        {message}
                    </div>
                )}

                <div className="space-y-4">
                    <Button onClick={handleGoogleSignUp} variant="outline" className="w-full bg-bg-input text-text-primary border-border hover:bg-bg-hover">
                        <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Sign up with Google
                    </Button>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-border"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-bg-panel text-text-secondary">Or continue with email</span>
                        </div>
                    </div>

                    <form onSubmit={handleSignUp} className="space-y-4">
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="block text-sm font-medium mb-2 text-text-primary">First Name</label>
                                <Input type="text" placeholder="John" value={firstName} onChange={e => setFirstName(e.target.value)} required />
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-medium mb-2 text-text-primary">Last Name</label>
                                <Input type="text" placeholder="Doe" value={lastName} onChange={e => setLastName(e.target.value)} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2 text-text-primary">Email address</label>
                            <Input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2 text-text-primary">Password</label>
                            <Input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2 text-text-primary">Confirm Password</label>
                            <Input type="password" placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={8} />
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? "Sending..." : "Send Magic Link"}
                        </Button>
                    </form>
                    
                    <p className="text-center text-sm text-text-secondary mt-6">
                        Already have an account? <Link href="/login" className="text-accent hover:underline">Log in</Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
