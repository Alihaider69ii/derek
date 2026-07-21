"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import {
    Check, ChevronLeft, ChevronRight, Lock, User, IndianRupee,
    Loader2, Sparkles, FileCheck,
} from "lucide-react"

export const dynamic = 'force-dynamic'

const AI_MODELS = ["Claude", "GPT-4", "Gemini", "Grok"]
const STEPS = ["Basics", "The prompt", "Preview", "Submit"]

type FormData = {
    title: string
    description: string
    category: string
    models: string[]
    price: string
    isFree: boolean
    promptText: string
    previewSnippet: string
}

const initialForm: FormData = {
    title: "",
    description: "",
    category: "",
    models: [],
    price: "",
    isFree: false,
    promptText: "",
    previewSnippet: "",
}

function ProgressBar({ step }: { step: number }) {
    return (
        <div className="flex items-center w-full max-w-2xl mx-auto">
            {STEPS.map((label, i) => {
                const n = i + 1
                const done = n < step
                const active = n === step
                return (
                    <React.Fragment key={label}>
                        <div className="flex flex-col items-center gap-1.5 shrink-0">
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${done
                                    ? "bg-accent border-accent text-white"
                                    : active
                                        ? "border-accent text-accent bg-accent/10"
                                        : "border-border text-text-secondary bg-bg-panel"
                                    }`}
                            >
                                {done ? <Check size={14} /> : n}
                            </div>
                            <span className={`text-[0.65rem] font-medium hidden sm:block ${active ? "text-accent" : "text-text-secondary"}`}>
                                {label}
                            </span>
                        </div>
                        {n < STEPS.length && (
                            <div className={`flex-1 h-[2px] mx-1 sm:mx-2 rounded-full transition-colors ${done ? "bg-accent" : "bg-border"}`} />
                        )}
                    </React.Fragment>
                )
            })}
        </div>
    )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <label className="text-sm font-semibold text-text-primary">{label}</label>
            {children}
            {hint && <p className="text-xs text-text-secondary">{hint}</p>}
        </div>
    )
}

export default function ListAPromptPage() {
    const router = useRouter()
    const { data: session } = useSession()
    const [step, setStep] = React.useState(1)
    const [form, setForm] = React.useState<FormData>(initialForm)
    const [categories, setCategories] = React.useState<{ name: string; emoji: string }[]>([])
    const [currency, setCurrency] = React.useState<"$" | "₹">("₹")
    const [submitting, setSubmitting] = React.useState<"draft" | "review" | null>(null)
    const [result, setResult] = React.useState<"draft" | "review" | null>(null)
    const [error, setError] = React.useState("")

    React.useEffect(() => {
        fetch("/api/categories").then(r => r.json()).then(d => { if (Array.isArray(d)) setCategories(d) }).catch(console.error)
    }, [])

    const update = (patch: Partial<FormData>) => setForm(prev => ({ ...prev, ...patch }))

    const toggleModel = (m: string) => {
        setForm(prev => ({
            ...prev,
            models: prev.models.includes(m) ? prev.models.filter(x => x !== m) : [...prev.models, m],
        }))
    }

    const step1Valid = form.title.trim().length > 0 && (form.isFree || Number(form.price) > 0)
    const step2Valid = form.promptText.trim().length > 0

    const canContinue = step === 1 ? step1Valid : step === 2 ? step2Valid : true

    const goNext = () => setStep(s => Math.min(4, s + 1))
    const goBack = () => setStep(s => Math.max(1, s - 1))

    const submitListing = async (status: "draft" | "pending_review") => {
        setError("")
        setSubmitting(status === "draft" ? "draft" : "review")
        try {
            const res = await fetch("/api/marketplace", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: form.title,
                    description: form.description,
                    category: form.category,
                    models: form.models,
                    promptText: form.promptText,
                    previewSnippet: form.previewSnippet,
                    price: form.isFree ? 0 : Number(form.price),
                    isFree: form.isFree,
                    status,
                }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Failed to save listing")
            setResult(status === "draft" ? "draft" : "review")
        } catch (e: any) {
            setError(e.message || "Something went wrong")
        } finally {
            setSubmitting(null)
        }
    }

    if (result) {
        return (
            <div className="flex flex-col h-full bg-bg-base items-center justify-center px-6 text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-success/10 text-success mb-5">
                    <Check size={28} />
                </div>
                {result === "review" ? (
                    <>
                        <h1 className="text-xl font-bold text-text-primary mb-2">Submitted for review</h1>
                        <p className="text-text-secondary text-sm max-w-md">
                            Your prompt has been submitted for review. We&apos;ll notify you once it&apos;s approved.
                        </p>
                    </>
                ) : (
                    <>
                        <h1 className="text-xl font-bold text-text-primary mb-2">Saved as draft</h1>
                        <p className="text-text-secondary text-sm max-w-md">
                            Your prompt was saved as a draft. You can finish and submit it anytime from your dashboard.
                        </p>
                    </>
                )}
                <div className="flex items-center gap-3 mt-6">
                    <button
                        onClick={() => { setForm(initialForm); setStep(1); setResult(null) }}
                        className="px-5 py-2.5 rounded-full text-sm font-semibold border border-border text-text-primary hover:bg-bg-hover transition-colors"
                    >
                        List another prompt
                    </button>
                    <button
                        onClick={() => router.push("/dashboard")}
                        className="px-5 py-2.5 rounded-full text-sm font-semibold text-white bg-accent hover:bg-accent-hover transition-colors"
                    >
                        Go to dashboard
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full bg-bg-base overflow-y-auto">
            <div className="px-4 sm:px-6 pt-6 sm:pt-8 pb-4">
                <h1 className="text-2xl font-bold text-text-primary text-center sm:text-left">List a prompt</h1>
                <p className="text-text-secondary text-sm mt-0.5 text-center sm:text-left">Sell your best prompts on the marketplace</p>
            </div>

            <div className="px-4 sm:px-6 pb-6">
                <ProgressBar step={step} />
            </div>

            <div className="flex-1 px-4 sm:px-6 pb-10">
                <div className="max-w-2xl mx-auto rounded-card border border-border bg-bg-panel p-5 sm:p-8">
                    {/* STEP 1 — BASICS */}
                    {step === 1 && (
                        <div className="space-y-5">
                            <Field label="Prompt title">
                                <input
                                    value={form.title}
                                    onChange={e => update({ title: e.target.value })}
                                    placeholder="e.g. Viral LinkedIn Post Generator"
                                    className="w-full h-10 rounded-btn border border-border bg-bg-input px-3 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent/30"
                                />
                            </Field>

                            <Field label="Short description">
                                <textarea
                                    value={form.description}
                                    onChange={e => update({ description: e.target.value })}
                                    placeholder="A one or two line summary buyers will see in listings"
                                    rows={2}
                                    className="w-full rounded-btn border border-border bg-bg-input px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent/30 resize-none"
                                />
                            </Field>

                            <Field label="Category">
                                <select
                                    value={form.category}
                                    onChange={e => update({ category: e.target.value })}
                                    className="w-full h-10 rounded-btn border border-border bg-bg-input px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30"
                                >
                                    <option value="">Select a category</option>
                                    {categories.map(c => (
                                        <option key={c.name} value={c.name}>{c.emoji} {c.name}</option>
                                    ))}
                                </select>
                            </Field>

                            <Field label="Compatible AI models">
                                <div className="flex flex-wrap gap-2">
                                    {AI_MODELS.map(m => {
                                        const checked = form.models.includes(m)
                                        return (
                                            <button
                                                key={m}
                                                type="button"
                                                onClick={() => toggleModel(m)}
                                                className={`px-3.5 py-2 rounded-full text-xs font-semibold border transition-colors ${checked
                                                    ? "bg-accent/10 border-accent text-accent"
                                                    : "border-border text-text-secondary hover:bg-bg-hover"
                                                    }`}
                                            >
                                                {checked && <Check size={11} className="inline mr-1 -mt-0.5" />}
                                                {m}
                                            </button>
                                        )
                                    })}
                                </div>
                            </Field>

                            <Field label="Price">
                                <div className="flex items-center gap-3 flex-wrap">
                                    <div className="flex items-center rounded-btn border border-border overflow-hidden shrink-0">
                                        {(["₹", "$"] as const).map(c => (
                                            <button
                                                key={c}
                                                type="button"
                                                onClick={() => setCurrency(c)}
                                                className={`w-9 h-10 text-sm font-semibold transition-colors ${currency === c ? "bg-accent text-white" : "bg-bg-input text-text-secondary hover:bg-bg-hover"}`}
                                            >
                                                {c}
                                            </button>
                                        ))}
                                    </div>
                                    <input
                                        type="number"
                                        min={1}
                                        max={1000}
                                        disabled={form.isFree}
                                        value={form.price}
                                        onChange={e => update({ price: e.target.value })}
                                        placeholder="e.g. 199"
                                        className="flex-1 min-w-[120px] h-10 rounded-btn border border-border bg-bg-input px-3 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:opacity-50"
                                    />
                                    <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer shrink-0">
                                        <input
                                            type="checkbox"
                                            checked={form.isFree}
                                            onChange={e => update({ isFree: e.target.checked, price: e.target.checked ? "" : form.price })}
                                            className="w-4 h-4 rounded accent-accent"
                                        />
                                        or Free
                                    </label>
                                </div>
                            </Field>
                        </div>
                    )}

                    {/* STEP 2 — THE PROMPT */}
                    {step === 2 && (
                        <div className="space-y-5">
                            <Field label="Your prompt (buyers see this after purchase)">
                                <textarea
                                    value={form.promptText}
                                    onChange={e => update({ promptText: e.target.value })}
                                    placeholder="Paste or write the full prompt here..."
                                    rows={10}
                                    className="w-full rounded-btn border border-border bg-bg-input px-3 py-2.5 text-sm font-mono text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent/30 resize-none"
                                />
                            </Field>

                            <Field label="Preview snippet (teaser visible before purchase)" hint="Make it compelling — this is what convinces buyers to purchase.">
                                <textarea
                                    value={form.previewSnippet}
                                    onChange={e => update({ previewSnippet: e.target.value })}
                                    placeholder="A short teaser that hints at the value without giving it all away..."
                                    rows={3}
                                    className="w-full rounded-btn border border-border bg-bg-input px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent/30 resize-none"
                                />
                            </Field>
                        </div>
                    )}

                    {/* STEP 3 — PREVIEW */}
                    {step === 3 && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-text-secondary text-xs font-medium mb-1">
                                <Sparkles size={13} /> This is how your listing will appear on the marketplace
                            </div>

                            <div className="relative flex flex-col gap-4 p-5 rounded-2xl border border-border bg-bg-base overflow-hidden">
                                <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: "linear-gradient(90deg, var(--accent), var(--accent-2))" }} />
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-text-primary text-sm truncate">{form.title || "Untitled prompt"}</h3>
                                        <div className="flex items-center gap-1.5 mt-1">
                                            <User size={11} className="text-text-secondary" />
                                            <span className="text-[0.65rem] text-text-secondary">{session?.user?.name || "You"}</span>
                                        </div>
                                        {form.description && (
                                            <p className="text-xs text-text-secondary mt-2 line-clamp-2">{form.description}</p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0 bg-bg-input border border-border px-2.5 py-1 rounded-full">
                                        {form.isFree ? (
                                            <span className="text-accent2 font-bold text-sm">Free</span>
                                        ) : (
                                            <>
                                                <IndianRupee size={11} className="text-accent2" />
                                                <span className="text-accent2 font-bold text-sm">{form.price || 0}</span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {(form.category || form.models.length > 0) && (
                                    <div className="flex flex-wrap gap-1.5">
                                        {form.category && (
                                            <span className="text-[0.65rem] font-medium px-2 py-1 rounded-full bg-bg-input border border-border text-text-secondary">{form.category}</span>
                                        )}
                                        {form.models.map(m => (
                                            <span key={m} className="text-[0.65rem] font-medium px-2 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent">{m}</span>
                                        ))}
                                    </div>
                                )}

                                <div className="relative rounded-xl overflow-hidden border border-border">
                                    <div className="bg-bg-input p-4 text-xs font-mono text-text-secondary leading-relaxed min-h-[80px] blur-sm select-none">
                                        {form.previewSnippet || form.promptText || "Your preview snippet will appear here..."}
                                    </div>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/20 backdrop-blur-[1px]">
                                        <Lock size={18} className="text-text-secondary" />
                                        <span className="text-xs text-text-secondary font-medium">Purchase to reveal</span>
                                    </div>
                                </div>

                                <button
                                    disabled
                                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-bold text-white opacity-70 cursor-default"
                                    style={{ background: "linear-gradient(135deg,var(--accent),var(--accent-hover))" }}
                                >
                                    {form.isFree ? "Get for Free" : `Buy Now · ₹${form.price || 0}`}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 4 — SUBMIT */}
                    {step === 4 && (
                        <div className="space-y-5 text-center py-4">
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-accent/10 text-accent mx-auto">
                                <FileCheck size={26} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-text-primary">Ready to publish</h2>
                                <p className="text-text-secondary text-sm mt-1 max-w-sm mx-auto">
                                    Submit &quot;{form.title || "your prompt"}&quot; for review, or save it as a draft to finish later.
                                </p>
                            </div>
                            {error && <p className="text-sm text-danger">{error}</p>}
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <div className="max-w-2xl mx-auto flex items-center justify-between mt-5 gap-3">
                    <button
                        onClick={goBack}
                        disabled={step === 1}
                        className="flex items-center gap-1 px-4 py-2.5 rounded-full text-sm font-semibold text-text-secondary hover:bg-bg-hover disabled:opacity-0 disabled:pointer-events-none transition-colors"
                    >
                        <ChevronLeft size={16} /> Back
                    </button>

                    <div className="flex items-center gap-3">
                        {step < 4 ? (
                            <>
                                <button
                                    onClick={() => submitListing("draft")}
                                    disabled={submitting !== null}
                                    className="px-5 py-2.5 rounded-full text-sm font-semibold border border-border text-text-primary hover:bg-bg-hover disabled:opacity-50 transition-colors"
                                >
                                    {submitting === "draft" ? <Loader2 size={15} className="animate-spin" /> : "Save draft"}
                                </button>
                                <button
                                    onClick={goNext}
                                    disabled={!canContinue}
                                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-semibold text-white bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Continue <ChevronRight size={16} />
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={() => submitListing("draft")}
                                    disabled={submitting !== null}
                                    className="px-5 py-2.5 rounded-full text-sm font-semibold border border-border text-text-primary hover:bg-bg-hover disabled:opacity-50 transition-colors flex items-center gap-2"
                                >
                                    {submitting === "draft" && <Loader2 size={15} className="animate-spin" />}
                                    Save as draft
                                </button>
                                <button
                                    onClick={() => submitListing("pending_review")}
                                    disabled={submitting !== null}
                                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-semibold text-white bg-accent hover:bg-accent-hover disabled:opacity-50 transition-colors"
                                >
                                    {submitting === "review" && <Loader2 size={15} className="animate-spin" />}
                                    Submit for review
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
