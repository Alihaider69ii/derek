"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function AdminLoginPage() {
    const router = useRouter()
    const [email, setEmail] = React.useState("")
    const [password, setPassword] = React.useState("")
    const [password2, setPassword2] = React.useState("")
    const [loading, setLoading] = React.useState(false)
    const [error, setError] = React.useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email || !password || !password2) return
        setLoading(true)
        setError("")
        try {
            const res = await fetch("/api/admin/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password, password2 }),
            })
            const data = await res.json().catch(() => ({}))
            if (!res.ok) {
                setError(data?.error || "Invalid credentials.")
                return
            }
            router.push("/admin")
            router.refresh()
        } catch {
            setError("An unexpected error occurred.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-bg-base px-4">
            <div className="w-full max-w-sm">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-11 h-11 rounded-full bg-[#1A1D24] text-white flex items-center justify-center mb-3">
                        <ShieldCheck size={20} />
                    </div>
                    <h1 className="text-xl font-bold text-text-primary">Admin sign in</h1>
                    <p className="text-sm text-text-secondary mt-1">Restricted access</p>
                </div>

                <div className="rounded-card border border-border bg-bg-panel p-6">
                    {error && (
                        <div className="mb-4 p-3 text-sm text-center border rounded-btn bg-danger/10 border-danger/20 text-danger">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2 text-text-primary">Email</label>
                            <Input
                                type="email"
                                autoComplete="off"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2 text-text-primary">Password</label>
                            <Input
                                type="password"
                                autoComplete="off"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2 text-text-primary">Password 2</label>
                            <Input
                                type="password"
                                autoComplete="off"
                                value={password2}
                                onChange={(e) => setPassword2(e.target.value)}
                                required
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? "Signing in..." : "Sign in"}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    )
}
