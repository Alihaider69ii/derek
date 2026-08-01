"use client"

import * as React from "react"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { ArrowLeft, Mail, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function ForgotPasswordPage() {
    const [email, setEmail] = React.useState("")
    const [loading, setLoading] = React.useState(false)
    const [sent, setSent] = React.useState(false)
    const [error, setError] = React.useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email) return
        setLoading(true)
        setError("")
        try {
            const res = await signIn("email", { email, redirect: false, callbackUrl: "/marketplace" })
            if (res?.error) {
                setError("Couldn't send the sign-in link. Please try again.")
            } else {
                setSent(true)
            }
        } catch {
            setError("Couldn't send the sign-in link. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-bg-base p-4">
            <div className="w-full max-w-[420px] bg-bg-panel border border-border rounded-xl p-8 shadow-xl">
                <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary mb-6">
                    <ArrowLeft size={14} /> Back to sign in
                </Link>

                {sent ? (
                    <div className="text-center py-4">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-accent/10 text-accent mx-auto mb-4">
                            <Mail size={24} />
                        </div>
                        <h1 className="text-xl font-semibold text-text-primary">Check your inbox</h1>
                        <p className="text-sm text-text-secondary mt-2">
                            We sent a secure sign-in link to <span className="text-text-primary font-medium">{email}</span>. Open it to get back into your account — no password needed.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="mb-6">
                            <h1 className="text-xl font-semibold text-text-primary">Reset your password</h1>
                            <p className="text-sm text-text-secondary mt-2">
                                Enter your email and we&apos;ll send you a secure link to sign in — you can set a new password from your account settings afterwards.
                            </p>
                        </div>

                        {error && (
                            <div className="p-3 mb-5 text-sm text-center border rounded-btn bg-danger/10 border-danger/20 text-danger">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2 text-text-primary">Email address</label>
                                <Input
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? <Loader2 size={15} className="animate-spin" /> : "Send sign-in link"}
                            </Button>
                        </form>
                    </>
                )}
            </div>
        </div>
    )
}
