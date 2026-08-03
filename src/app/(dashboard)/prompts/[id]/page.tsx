"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { ArrowLeft, Copy, Send, Check, Star, Sparkles, Layers, CalendarDays } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ProtectedContent } from "@/components/shared/ProtectedContent"
import { embedZeroWidthWatermark } from "@/lib/protection"

// This page is the detail view for EVERY Prompt Bank item — id-driven, so
// any prompt added later (Mongo import or the admin Prompt Bank page) opens
// here automatically with no per-prompt wiring needed.
export const dynamic = 'force-dynamic'

type PromptDoc = {
    _id: string
    title: string
    description: string
    category: string
    // Older seed data was written with `outputType`; the current schema
    // (and the admin Prompt Bank form) writes `type`. Both exist in the DB,
    // so the detail page has to read either — see resolveOutputType below.
    type?: "text" | "image" | "video"
    outputType?: "text" | "image" | "video"
    isMega: boolean
    promptText: string
    sampleOutput: string
    emoji: string
    tags: string[]
    createdAt: string
}

function resolveOutputType(p: PromptDoc): "text" | "image" | "video" {
    return p.type || p.outputType || "text"
}

function formatDate(d: string) {
    return new Date(d).toLocaleDateString("en-IN", { month: "short", year: "numeric" })
}

export default function PromptDetailPage() {
    const params = useParams()
    const router = useRouter()
    const { data: session } = useSession()

    const [prompt, setPrompt] = React.useState<PromptDoc | null>(null)
    const [loading, setLoading] = React.useState(true)
    const [copied, setCopied] = React.useState(false)

    const [showFavModal, setShowFavModal] = React.useState(false)
    const [favTitle, setFavTitle] = React.useState("")
    const [favSaved, setFavSaved] = React.useState(false)
    const [favLoading, setFavLoading] = React.useState(false)

    React.useEffect(() => {
        const fetchPrompt = async () => {
            try {
                const res = await fetch(`/api/prompts/${params.id}`)
                if (res.ok) {
                    const data = await res.json()
                    setPrompt(data)
                }
            } catch (err) {
                console.error("Failed to load prompt", err)
            } finally {
                setLoading(false)
            }
        }
        if (params.id) fetchPrompt()
    }, [params.id])

    const watermarkId = session?.user?.email || "anonymous"

    const handleCopy = () => {
        if (!prompt) return
        navigator.clipboard.writeText(embedZeroWidthWatermark(prompt.promptText, watermarkId))
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const sendToChat = (ai: "derek" | "claude") => {
        if (!prompt) return
        const text = encodeURIComponent(embedZeroWidthWatermark(prompt.promptText, watermarkId))
        router.push(`/chat?prefill${ai === 'derek' ? 'Derek' : 'Claude'}=${text}`)
    }

    const handleFavourite = async () => {
        if (!prompt || !favTitle.trim()) return
        setFavLoading(true)
        try {
            await fetch("/api/favourites", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: favTitle.trim(),
                    promptText: prompt.promptText,
                    source: "bank",
                    sourceId: prompt._id,
                }),
            })
            setFavSaved(true)
            setTimeout(() => { setShowFavModal(false); setFavSaved(false); setFavTitle("") }, 900)
        } catch { }
        finally { setFavLoading(false) }
    }

    if (loading) {
        return <div className="flex items-center justify-center h-full bg-bg-base text-text-secondary">Loading prompt...</div>
    }

    if (!prompt) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-bg-base text-text-secondary gap-4">
                <p>Failed to locate this prompt.</p>
                <button onClick={() => router.push('/prompt-bank')} className="px-5 py-2.5 rounded-full text-sm font-semibold text-white bg-accent hover:bg-accent-hover transition-colors">
                    Back to Prompt Bank
                </button>
            </div>
        )
    }

    const ActionCard = () => (
        <div className="rounded-card border border-border bg-bg-panel p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-accent mb-1">Free · Included in Prompt Bank</p>
            <p className="text-xs text-text-secondary mb-4">No purchase required · Use instantly</p>

            <button
                onClick={() => sendToChat('derek')}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-full text-sm font-bold text-white hover:opacity-90 transition-opacity mb-2.5"
                style={{ background: "linear-gradient(135deg,var(--accent),var(--accent-hover))" }}
            >
                <Sparkles size={15} /> Use this prompt with Derek
            </button>
            <button
                onClick={() => sendToChat('claude')}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-bold text-black bg-white border border-border hover:bg-neutral-100 transition-colors mb-2.5"
            >
                <Send size={14} /> Send to Claude
            </button>
            <button
                onClick={handleCopy}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-semibold border border-border text-text-primary hover:bg-bg-hover transition-colors mb-2.5"
            >
                {copied ? <Check size={15} className="text-success" /> : <Copy size={15} />}
                {copied ? "Copied!" : "Copy prompt"}
            </button>
            <button
                onClick={() => { setFavTitle(prompt.title); setShowFavModal(true) }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-semibold border border-yellow-500/30 text-yellow-600 hover:bg-yellow-500/10 transition-colors"
            >
                <Star size={14} /> Add to Favourites
            </button>
        </div>
    )

    return (
        <div className="flex flex-col h-full bg-bg-base overflow-y-auto">
            {/* Header — desktop */}
            <div className="hidden lg:flex sticky top-0 z-10 bg-bg-base/90 backdrop-blur-md border-b border-border px-6 py-3 items-center justify-between">
                <Link href="/prompt-bank" className="flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
                    <ArrowLeft size={16} /> Prompt Bank
                </Link>
            </div>

            {/* Header — mobile: back button + logo */}
            <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-bg-base">
                <button onClick={() => router.push("/prompt-bank")} className="flex items-center gap-1.5 text-sm font-semibold text-accent">
                    <ArrowLeft size={16} /> Back
                </button>
                <div className="flex items-center gap-1.5 font-bold text-sm">
                    <div className="relative w-5 h-5 shrink-0">
                        <Image src="/derek-logo.png" alt="Derek" fill className="object-cover rounded-full ring-1 ring-[#e05252]/40" />
                    </div>
                    <span className="text-text-primary">easemyprompt<span className="text-accent">.ai</span></span>
                </div>
                <span className="w-12" />
            </div>

            <div className="max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 pb-16">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
                    {/* ── LEFT COLUMN ─────────────────────────────────── */}
                    <div className="min-w-0 lg:border-r lg:border-border lg:pr-8">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="text-5xl bg-bg-panel p-3 rounded-2xl border border-border shadow-sm shrink-0">{prompt.emoji}</span>
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                    {prompt.isMega && <Badge variant="mega">Mega Prompt</Badge>}
                                    <Badge variant="secondary" className="bg-bg-hover">{prompt.category}</Badge>
                                </div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-text-primary leading-tight">{prompt.title}</h1>
                            </div>
                        </div>

                        {/* Action card — mobile only, right after title */}
                        <div className="lg:hidden mb-6">
                            <ActionCard />
                        </div>

                        <div className="h-px bg-border mb-6" />

                        <h2 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-2.5">About this prompt</h2>
                        <p className="text-sm text-text-secondary leading-relaxed mb-6">{prompt.description}</p>

                        <h2 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-2.5">What you get</h2>
                        <ul className="space-y-2 mb-6">
                            {[
                                "Full structured prompt with role, task, format, constraints",
                                "Works with Derek & Claude out of the box",
                                "Instant access — no purchase required",
                                "Free to use, forever",
                            ].map(item => (
                                <li key={item} className="flex items-start gap-2.5 text-sm text-text-primary">
                                    <span className="w-4 h-4 rounded-full bg-success/10 text-success flex items-center justify-center shrink-0 mt-0.5">
                                        <Check size={11} strokeWidth={3} />
                                    </span>
                                    {item}
                                </li>
                            ))}
                        </ul>

                        {prompt.tags?.length > 0 && (
                            <div className="flex flex-wrap items-center gap-2 mb-6">
                                {prompt.tags.map((t) => (
                                    <span key={t} className="text-xs border border-border px-2.5 py-1 rounded-full text-text-secondary">#{t}</span>
                                ))}
                            </div>
                        )}

                        <h2 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-2.5">Full prompt</h2>
                        <div className="rounded-xl border border-border overflow-hidden mb-8">
                            <ProtectedContent
                                text={prompt.promptText}
                                className="text-sm text-text-primary font-mono whitespace-pre-wrap leading-relaxed"
                                wrapperClassName="bg-bg-input p-4 max-h-[500px] overflow-y-auto block"
                            />
                        </div>

                        {prompt.sampleOutput && (
                            <div>
                                <h2 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-2.5">Expected output pattern</h2>
                                {resolveOutputType(prompt) === "text" && (
                                    <div className="bg-bg-hover rounded-xl p-5 text-sm text-text-secondary italic whitespace-pre-wrap leading-relaxed border border-border/50">
                                        {prompt.sampleOutput}
                                    </div>
                                )}
                                {resolveOutputType(prompt) === "image" && (
                                    <div className="bg-bg-hover rounded-xl overflow-hidden flex items-center justify-center max-h-[500px] border border-border/50 p-4">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={prompt.sampleOutput} alt="Sample Output" className="max-w-full max-h-[420px] object-contain rounded-xl" />
                                    </div>
                                )}
                                {resolveOutputType(prompt) === "video" && (
                                    <div className="bg-black rounded-xl overflow-hidden flex items-center justify-center max-h-[500px] border border-border/50">
                                        <video src={prompt.sampleOutput} controls className="max-w-full max-h-[500px] object-contain rounded-xl" />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* ── RIGHT COLUMN (sticky on desktop) ────────────────── */}
                    <div className="hidden lg:block">
                        <div className="sticky top-20 space-y-4">
                            <ActionCard />

                            <div className="rounded-card border border-border bg-bg-panel p-5">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-3">Prompt details</h3>
                                <div className="grid grid-cols-2 gap-y-3 gap-x-3">
                                    <div>
                                        <p className="text-[0.65rem] text-text-secondary flex items-center gap-1"><Layers size={10} /> Category</p>
                                        <p className="text-sm font-semibold text-text-primary">{prompt.category}</p>
                                    </div>
                                    <div>
                                        <p className="text-[0.65rem] text-text-secondary">Output type</p>
                                        <p className="text-sm font-semibold text-text-primary capitalize">{resolveOutputType(prompt)}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-[0.65rem] text-text-secondary flex items-center gap-1"><CalendarDays size={10} /> Added</p>
                                        <p className="text-sm font-semibold text-text-primary">{formatDate(prompt.createdAt)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Prompt details — mobile, after content */}
                <div className="lg:hidden mt-6">
                    <div className="rounded-card border border-border bg-bg-panel p-5">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-3">Prompt details</h3>
                        <div className="grid grid-cols-2 gap-y-3 gap-x-3">
                            <div>
                                <p className="text-[0.65rem] text-text-secondary">Category</p>
                                <p className="text-sm font-semibold text-text-primary">{prompt.category}</p>
                            </div>
                            <div>
                                <p className="text-[0.65rem] text-text-secondary">Output type</p>
                                <p className="text-sm font-semibold text-text-primary capitalize">{resolveOutputType(prompt)}</p>
                            </div>
                            <div className="col-span-2">
                                <p className="text-[0.65rem] text-text-secondary">Added</p>
                                <p className="text-sm font-semibold text-text-primary">{formatDate(prompt.createdAt)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* FAVOURITE TITLE MODAL */}
            {showFavModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={e => { if (e.target === e.currentTarget) setShowFavModal(false) }}>
                    <div className="bg-bg-panel border border-border w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border">
                            <h2 className="text-base font-bold text-text-primary flex items-center gap-2"><Star size={15} className="text-yellow-400 fill-yellow-400" /> Add to Favourites</h2>
                            <button onClick={() => setShowFavModal(false)} className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-hover">✕</button>
                        </div>
                        <div className="p-5 space-y-4">
                            <input
                                type="text" value={favTitle} onChange={e => setFavTitle(e.target.value)}
                                onKeyDown={e => { if (e.key === "Enter") handleFavourite() }}
                                placeholder="Give this prompt a title…" autoFocus
                                className="w-full px-4 py-3 bg-bg-input border border-border rounded-xl text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent"
                            />
                            <button onClick={handleFavourite} disabled={!favTitle.trim() || favLoading || favSaved}
                                className="w-full py-3 rounded-full text-sm font-bold text-white disabled:opacity-40 hover:opacity-80"
                                style={{ background: favSaved ? "linear-gradient(135deg,#22c55e,#16a34a)" : "linear-gradient(135deg,var(--accent),var(--accent-hover))" }}>
                                {favSaved ? "✓ Saved!" : favLoading ? "Saving..." : "Save to Favourites"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
