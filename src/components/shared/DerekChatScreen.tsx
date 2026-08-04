"use client"

import * as React from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import {
    Copy, Check, RefreshCw, Tag, ArrowUp, Sparkles, ShoppingBag,
    Loader2, Lock,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { parseStructuredPrompt, deriveBuildTitle, type StructuredPrompt } from "@/lib/derekPromptParser"

// ── Guest usage (no Mongo doc to track against, so it's local-only) ────────
const GUEST_LIMIT = 3
const GUEST_KEY = "emp_derek_screen2_guest_uses"

function getGuestUses(): number {
    try { return parseInt(localStorage.getItem(GUEST_KEY) || "0", 10) || 0 } catch { return 0 }
}
function incrGuestUses() {
    try { localStorage.setItem(GUEST_KEY, String(getGuestUses() + 1)) } catch { }
}

// ── Types ────────────────────────────────────────────────────────────────
interface Message {
    role: "user" | "ai"
    content: string
    streaming?: boolean
    mode?: "job1" | "job2"
    favouriteId?: string | null
}

interface Build {
    _id: string
    title: string
    promptText: string
    status: "active" | "listed" | "draft"
    createdAt: string
}

interface CategoryChip { name: string; emoji: string }

// ── Derek avatar + online dot ───────────────────────────────────────────
function DerekAvatar({ size = 40 }: { size?: number }) {
    const [imgErr, setImgErr] = React.useState(false)
    return (
        <div className="relative shrink-0" style={{ width: size, height: size }}>
            {imgErr ? (
                <div
                    className="w-full h-full rounded-full flex items-center justify-center font-bold text-white"
                    style={{ background: "linear-gradient(135deg, #1a3a8f, #2E5BFF)", fontSize: size * 0.4 }}
                >
                    D
                </div>
            ) : (
                <Image
                    src="/derek/derek1.jpeg"
                    alt="Derek"
                    fill
                    style={{ objectFit: "cover", objectPosition: "center 15%", borderRadius: "50%", border: "2px solid rgba(46,91,255,0.35)" }}
                    onError={() => setImgErr(true)}
                />
            )}
            <span
                className="absolute bottom-0 right-0 rounded-full border-2 border-bg-panel"
                style={{ width: size * 0.28, height: size * 0.28, background: "#22c55e" }}
            />
        </div>
    )
}

// ── Structured prompt colors (spec) ─────────────────────────────────────
const SECTION_STYLES: Record<keyof StructuredPrompt, { label: string; bg: string; border: string; text: string }> = {
    role: { label: "ROLE", bg: "#E3EEFF", border: "#B9D3FF", text: "#1D3E9E" },
    task: { label: "TASK", bg: "#DFFAF9", border: "#AEEDE9", text: "#0E6E68" },
    format: { label: "FORMAT", bg: "#FEF6D8", border: "#F6E4A0", text: "#8A6A0B" },
    constraints: { label: "CONSTRAINTS", bg: "#FCE3E5", border: "#F6BCC1", text: "#9E2635" },
}

function StructuredPromptCards({
    structured,
    rawText,
    favouriteId,
    onRefine,
    disabled,
}: {
    structured: StructuredPrompt
    rawText: string
    favouriteId?: string | null
    onRefine: () => void
    disabled?: boolean
}) {
    const router = useRouter()
    const [copied, setCopied] = React.useState(false)

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(rawText.trim())
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch { }
    }

    const handleListForSale = () => {
        const title = deriveBuildTitle(structured, "Untitled prompt")
        try {
            localStorage.setItem("derek_wizard_prefill", JSON.stringify({
                title,
                promptText: rawText.trim(),
                favouriteId: favouriteId || undefined,
            }))
        } catch { }
        router.push("/dashboard/prompts?new=1")
    }

    return (
        <div className="flex flex-col gap-2.5 max-w-[600px] w-full">
            {(Object.keys(SECTION_STYLES) as (keyof StructuredPrompt)[]).map((key) => {
                const style = SECTION_STYLES[key]
                const value = structured[key]
                if (!value) return null
                return (
                    <div
                        key={key}
                        className="rounded-xl px-4 py-3 border"
                        style={{ background: style.bg, borderColor: style.border }}
                    >
                        <div
                            className="text-[0.65rem] font-bold tracking-widest mb-1"
                            style={{ color: style.text }}
                        >
                            {style.label}
                        </div>
                        <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: "#1A1D24" }}>
                            {value}
                        </p>
                    </div>
                )
            })}

            <div className="flex flex-wrap items-center gap-2 mt-1">
                <button
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold border border-border bg-bg-panel text-text-primary hover:bg-bg-hover transition-colors"
                >
                    {copied ? <Check size={13} className="text-success" /> : <Copy size={13} />}
                    {copied ? "Copied" : "Copy prompt"}
                </button>
                <button
                    onClick={onRefine}
                    disabled={disabled}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold border border-border bg-bg-panel text-text-primary hover:bg-bg-hover transition-colors disabled:opacity-50"
                >
                    <RefreshCw size={13} /> Refine further
                </button>
                <button
                    onClick={handleListForSale}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold text-white bg-accent hover:bg-accent-hover transition-colors"
                >
                    <ShoppingBag size={13} /> List for sale
                </button>
            </div>
        </div>
    )
}

// ── Status badge for the right panel ────────────────────────────────────
function StatusBadge({ status }: { status: Build["status"] }) {
    if (status === "listed") {
        return <span className="text-[0.65rem] font-semibold px-2 py-0.5 rounded-full bg-success/10 text-success border border-success/20">Listed</span>
    }
    if (status === "draft") {
        return <span className="text-[0.65rem] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 border border-amber-500/20">Draft</span>
    }
    return <span className="text-[0.65rem] font-semibold px-2 py-0.5 rounded-full bg-bg-hover text-text-secondary border border-border">Active</span>
}

// ── Main component ──────────────────────────────────────────────────────
export function DerekChatScreen() {
    const { status: sessionStatus } = useSession()
    const isAuthenticated = sessionStatus === "authenticated"

    const [messages, setMessages] = React.useState<Message[]>([])
    const [input, setInput] = React.useState("")
    const [streaming, setStreaming] = React.useState(false)
    const [usesLeft, setUsesLeft] = React.useState<number | null>(null)
    const [plan, setPlan] = React.useState<"Free" | "Pro" | "guest">("guest")
    const [limitReached, setLimitReached] = React.useState(false)
    const [builds, setBuilds] = React.useState<Build[]>([])
    const [categories, setCategories] = React.useState<CategoryChip[]>([])
    const scrollRef = React.useRef<HTMLDivElement>(null)
    const inputRef = React.useRef<HTMLTextAreaElement>(null)

    const refreshUsage = React.useCallback(async () => {
        if (!isAuthenticated) {
            const used = getGuestUses()
            setPlan("guest")
            setUsesLeft(Math.max(0, GUEST_LIMIT - used))
            return
        }
        try {
            const res = await fetch("/api/chat/derek/usage")
            const data = await res.json()
            if (data.authenticated) {
                setPlan(data.plan)
                setUsesLeft(data.usesLeft)
            }
        } catch { }
    }, [isAuthenticated])

    const refreshBuilds = React.useCallback(async () => {
        if (!isAuthenticated) return
        try {
            const res = await fetch("/api/dashboard/derek-builds")
            const data = await res.json()
            if (Array.isArray(data)) setBuilds(data)
        } catch { }
    }, [isAuthenticated])

    React.useEffect(() => { refreshUsage() }, [refreshUsage])
    React.useEffect(() => { refreshBuilds() }, [refreshBuilds])
    React.useEffect(() => {
        fetch("/api/categories").then(r => r.json()).then(d => { if (Array.isArray(d)) setCategories(d.slice(0, 8)) }).catch(() => { })
    }, [])

    React.useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }, [messages])

    const blocked = plan !== "Pro" && (usesLeft ?? 1) <= 0

    const send = async (text: string) => {
        if (!text.trim() || streaming) return
        if (blocked) { setLimitReached(true); return }

        const history = messages.map(m => ({ role: m.role, content: m.content }))
        const userMsg: Message = { role: "user", content: text }
        setMessages(prev => [...prev, userMsg, { role: "ai", content: "", streaming: true }])
        setInput("")
        setStreaming(true)

        try {
            const res = await fetch("/api/chat/derek", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: text, history }),
            })

            if (res.status === 403) {
                setLimitReached(true)
                setUsesLeft(0)
                setMessages(prev => prev.slice(0, -1))
                return
            }
            if (!res.ok || !res.body) throw new Error("Failed to reach Derek")

            const reader = res.body.getReader()
            const decoder = new TextDecoder()
            let raw = ""
            let done = false
            while (!done) {
                const { value, done: doneReading } = await reader.read()
                done = doneReading
                if (value) raw += decoder.decode(value, { stream: !done })

                // The last chunk of the stream is a NUL-separated JSON blob
                // (mode + saved-build id) — never show it, even mid-stream.
                const nulIdx = raw.indexOf("\u0000")
                const visible = nulIdx >= 0 ? raw.slice(0, nulIdx) : raw
                setMessages(prev => {
                    const next = [...prev]
                    next[next.length - 1] = { ...next[next.length - 1], content: visible, streaming: !done }
                    return next
                })
            }

            const nulIdx = raw.indexOf("\u0000")
            const visible = nulIdx >= 0 ? raw.slice(0, nulIdx) : raw
            let meta: { mode?: "job1" | "job2"; favouriteId?: string | null } = {}
            if (nulIdx >= 0) {
                try { meta = JSON.parse(raw.slice(nulIdx + 1)) } catch { }
            }
            setMessages(prev => {
                const next = [...prev]
                next[next.length - 1] = { role: "ai", content: visible, mode: meta.mode, favouriteId: meta.favouriteId, streaming: false }
                return next
            })

            if (!isAuthenticated) incrGuestUses()
            await refreshUsage()
            if (meta.mode === "job1") await refreshBuilds()
        } catch (e) {
            console.error(e)
            setMessages(prev => prev.slice(0, -1))
        } finally {
            setStreaming(false)
        }
    }

    const handleRefine = () => {
        send("Please refine this prompt further — make it even more specific, detailed, and effective.")
    }

    const handleSuggestionClick = (cat: CategoryChip) => {
        const starter = `I want a prompt for ${cat.name.toLowerCase()}`
        setInput(starter)
        inputRef.current?.focus()
    }

    return (
        <div className="flex flex-col md:flex-row w-full h-full min-h-0 gap-4">
            {/* LEFT PANEL — chat */}
            <div className="flex-1 min-w-0 flex flex-col rounded-xl border border-border bg-bg-panel overflow-hidden">
                <div className="px-5 py-3.5 border-b border-border flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <DerekAvatar size={40} />
                        <div>
                            <div className="flex items-center gap-1.5">
                                <h2 className="text-sm font-bold text-text-primary">Derek</h2>
                                <span className="text-[0.65rem] font-medium text-success">Online</span>
                            </div>
                            <p className="text-[0.7rem] text-text-secondary">Prompt engineer &amp; platform assistant</p>
                        </div>
                    </div>
                    <span
                        className={cn(
                            "text-xs font-medium px-2.5 py-1 rounded-full border shrink-0",
                            blocked
                                ? "bg-danger/10 text-danger border-danger/30"
                                : "bg-accent/10 text-accent border-accent/25"
                        )}
                    >
                        {plan === "Pro" ? "Unlimited" : blocked ? "Limit reached" : `${usesLeft ?? "—"} free uses left`}
                    </span>
                </div>

                {limitReached && (
                    <div className="mx-4 mt-3 px-4 py-3 rounded-lg text-xs bg-accent/10 border border-accent/25 text-text-primary flex items-center gap-2">
                        <Lock size={14} className="text-accent shrink-0" />
                        <span>
                            You&apos;ve used your free Derek chats.{" "}
                            <strong>Upgrade options are coming soon</strong> — thanks for your patience.
                        </span>
                    </div>
                )}

                <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-5 hide-scrollbar">
                    {messages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center gap-3 text-center px-6">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-accent/10 border border-accent/25">
                                <Sparkles size={20} className="text-accent" />
                            </div>
                            <p className="text-text-secondary text-sm max-w-sm">
                                Describe an idea and I&apos;ll engineer it into a perfect prompt — or ask me anything about EaseMyPrompt.ai.
                            </p>
                        </div>
                    )}

                    {messages.map((msg, idx) => {
                        const structured = !msg.streaming && msg.role === "ai" ? parseStructuredPrompt(msg.content) : null

                        if (msg.role === "user") {
                            return (
                                <div key={idx} className="flex justify-end">
                                    <div className="max-w-[80%] rounded-[14px_14px_2px_14px] bg-bg-hover px-4 py-2.5 text-sm text-text-primary whitespace-pre-wrap">
                                        {msg.content}
                                    </div>
                                </div>
                            )
                        }

                        return (
                            <div key={idx} className="flex items-start gap-3">
                                <div className="mt-0.5"><DerekAvatar size={30} /></div>
                                {msg.streaming ? (
                                    <div className="max-w-[80%] rounded-[14px_14px_14px_2px] border border-accent/20 bg-accent/5 px-4 py-2.5 text-sm text-text-primary whitespace-pre-wrap">
                                        {msg.content || <Loader2 size={14} className="animate-spin text-accent" />}
                                    </div>
                                ) : structured ? (
                                    <StructuredPromptCards
                                        structured={structured}
                                        rawText={msg.content}
                                        favouriteId={msg.favouriteId}
                                        disabled={streaming}
                                        onRefine={handleRefine}
                                    />
                                ) : (
                                    <div className="max-w-[80%] rounded-[14px_14px_14px_2px] border border-border bg-bg-base px-4 py-2.5 text-sm text-text-primary whitespace-pre-wrap">
                                        {msg.content}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>

                <div className="p-4 border-t border-border shrink-0">
                    <div className="relative flex items-end gap-2">
                        <textarea
                            ref={inputRef}
                            rows={1}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault()
                                    send(input)
                                }
                            }}
                            disabled={blocked}
                            placeholder={blocked ? "Free uses used up — upgrade coming soon" : "Describe a prompt idea, or ask about the platform…"}
                            className="flex-1 resize-none max-h-32 rounded-2xl border border-border bg-bg-input px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:opacity-60"
                        />
                        <button
                            onClick={() => send(input)}
                            disabled={blocked || !input.trim() || streaming}
                            className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center shrink-0 hover:bg-accent-hover disabled:opacity-40 transition-colors"
                        >
                            {streaming ? <Loader2 size={16} className="animate-spin" /> : <ArrowUp size={16} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* RIGHT PANEL — recent builds + suggestions */}
            <div className="hidden md:flex w-[300px] shrink-0 flex-col gap-4 overflow-y-auto hide-scrollbar">
                <div className="rounded-xl border border-border bg-bg-panel p-4">
                    <h3 className="text-sm font-bold text-text-primary mb-3">Your prompts — Recent builds</h3>
                    {!isAuthenticated ? (
                        <p className="text-xs text-text-secondary">Log in to save and track your Derek-built prompts.</p>
                    ) : builds.length === 0 ? (
                        <p className="text-xs text-text-secondary">Nothing built yet — ask Derek for a prompt to get started.</p>
                    ) : (
                        <div className="space-y-2">
                            {builds.map(b => (
                                <div key={b._id} className="flex items-start justify-between gap-2 px-3 py-2.5 rounded-lg border border-border bg-bg-base">
                                    <span className="text-xs text-text-primary font-medium line-clamp-2">{b.title}</span>
                                    <StatusBadge status={b.status} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="rounded-xl border border-border bg-bg-panel p-4">
                    <h3 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-1.5">
                        <Tag size={14} className="text-accent" /> Suggestions
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {categories.map(cat => (
                            <button
                                key={cat.name}
                                onClick={() => handleSuggestionClick(cat)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border border-border bg-bg-base text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors"
                            >
                                <span>{cat.emoji}</span> {cat.name}
                            </button>
                        ))}
                        {categories.length === 0 && (
                            <p className="text-xs text-text-secondary">No categories yet.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
