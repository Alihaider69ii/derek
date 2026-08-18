"use client"

import * as React from "react"
import { Plus, Pencil, Trash2, Search, X, BookOpen } from "lucide-react"

export const dynamic = "force-dynamic"

type PromptRow = {
    _id: string
    title: string
    description: string
    category: string
    type: "text" | "image" | "video"
    isMega: boolean
    promptText: string
    sampleOutput: string
    emoji: string
    tags: string[]
    createdAt: string
}

type FormState = {
    title: string
    description: string
    category: string
    type: "text" | "image" | "video"
    isMega: boolean
    promptText: string
    sampleOutput: string
    emoji: string
    tags: string
}

const EMPTY_FORM: FormState = {
    title: "", description: "", category: "", type: "text", isMega: false,
    promptText: "", sampleOutput: "", emoji: "✨", tags: "",
}

function PromptForm({
    initial, onCancel, onSave, saving,
}: { initial: FormState; onCancel: () => void; onSave: (form: FormState) => void; saving: boolean }) {
    const [form, setForm] = React.useState<FormState>(initial)
    const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }))

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl bg-bg-panel border border-border rounded-card p-6 max-h-[85vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-text-primary">{initial.title ? "Edit prompt" : "Add prompt"}</h3>
                    <button onClick={onCancel} className="p-1 rounded-btn text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <form
                    onSubmit={(e) => { e.preventDefault(); onSave(form) }}
                    className="space-y-4"
                >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-text-primary">Title</label>
                            <input required value={form.title} onChange={(e) => set("title", e.target.value)}
                                className="w-full h-10 rounded-btn border border-border bg-bg-input px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-text-primary">Category</label>
                            <input required value={form.category} onChange={(e) => set("category", e.target.value)}
                                className="w-full h-10 rounded-btn border border-border bg-bg-input px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30" />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-text-primary">Description</label>
                        <input required value={form.description} onChange={(e) => set("description", e.target.value)}
                            className="w-full h-10 rounded-btn border border-border bg-bg-input px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30" />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 items-end">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-text-primary">Type</label>
                            <select value={form.type} onChange={(e) => set("type", e.target.value as FormState["type"])}
                                className="w-full h-10 rounded-btn border border-border bg-bg-input px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30">
                                <option value="text">Text</option>
                                <option value="image">Image</option>
                                <option value="video">Video</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-text-primary">Emoji</label>
                            <input value={form.emoji} onChange={(e) => set("emoji", e.target.value)}
                                className="w-full h-10 rounded-btn border border-border bg-bg-input px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30" />
                        </div>
                        <div className="col-span-2 flex items-center gap-2 h-10">
                            <input id="isMega" type="checkbox" checked={form.isMega} onChange={(e) => set("isMega", e.target.checked)} className="w-4 h-4" />
                            <label htmlFor="isMega" className="text-sm font-medium text-text-primary">Mega prompt</label>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-text-primary">Tags (comma-separated)</label>
                        <input value={form.tags} onChange={(e) => set("tags", e.target.value)}
                            placeholder="marketing, seo, copywriting"
                            className="w-full h-10 rounded-btn border border-border bg-bg-input px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30" />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-text-primary">Prompt text</label>
                        <textarea required value={form.promptText} onChange={(e) => set("promptText", e.target.value)}
                            className="w-full h-32 rounded-btn border border-border bg-bg-input px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30" />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-text-primary">Sample output</label>
                        <textarea required value={form.sampleOutput} onChange={(e) => set("sampleOutput", e.target.value)}
                            className="w-full h-24 rounded-btn border border-border bg-bg-input px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30" />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-btn text-sm font-medium text-text-secondary hover:bg-bg-hover transition-colors">
                            Cancel
                        </button>
                        <button type="submit" disabled={saving} className="px-4 py-2 rounded-btn text-sm font-semibold text-white bg-accent hover:bg-accent-hover disabled:opacity-50 transition-colors">
                            {saving ? "Saving..." : "Save prompt"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default function AdminPromptBankPage() {
    const [prompts, setPrompts] = React.useState<PromptRow[]>([])
    const [categoryCounts, setCategoryCounts] = React.useState<{ category: string; count: number }[]>([])
    const [loading, setLoading] = React.useState(true)
    const [q, setQ] = React.useState("")
    const [category, setCategory] = React.useState("")
    const [editing, setEditing] = React.useState<PromptRow | "new" | null>(null)
    const [saving, setSaving] = React.useState(false)
    const [deleteTarget, setDeleteTarget] = React.useState<PromptRow | null>(null)
    const [error, setError] = React.useState("")

    const load = React.useCallback((opts: { q: string; category: string }) => {
        setLoading(true)
        const params = new URLSearchParams()
        if (opts.q) params.set("q", opts.q)
        if (opts.category) params.set("category", opts.category)

        fetch(`/api/admin/prompt-bank?${params.toString()}`)
            .then((r) => r.json())
            .then((data) => {
                if (data?.error) return
                setPrompts(data.prompts || [])
                setCategoryCounts(data.categoryCounts || [])
            })
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    React.useEffect(() => { load({ q: "", category: "" }) }, [load])

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault()
        load({ q, category })
    }

    const save = async (form: FormState) => {
        setSaving(true)
        setError("")
        try {
            const payload = { ...form, tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean) }
            const isNew = editing === "new"
            const url = isNew ? "/api/admin/prompt-bank" : `/api/admin/prompt-bank/${(editing as PromptRow)._id}`
            const res = await fetch(url, {
                method: isNew ? "POST" : "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })
            const data = await res.json()
            if (!res.ok) {
                setError(data.error || "Save failed")
                return
            }
            setEditing(null)
            load({ q, category })
        } finally {
            setSaving(false)
        }
    }

    const confirmDelete = async () => {
        if (!deleteTarget) return
        setSaving(true)
        try {
            await fetch(`/api/admin/prompt-bank/${deleteTarget._id}`, { method: "DELETE" })
            setDeleteTarget(null)
            load({ q, category })
        } finally {
            setSaving(false)
        }
    }

    const toFormState = (p: PromptRow): FormState => ({
        title: p.title, description: p.description, category: p.category, type: p.type,
        isMega: p.isMega, promptText: p.promptText, sampleOutput: p.sampleOutput,
        emoji: p.emoji, tags: (p.tags || []).join(", "),
    })

    return (
        <div className="flex flex-col h-full bg-bg-base overflow-y-auto">
            <div className="px-4 sm:px-6 pt-6 sm:pt-8 pb-6 flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Prompt Bank</h1>
                    <p className="text-text-secondary text-sm mt-0.5">Official, free prompts — shown in the Marketplace with an &ldquo;Official&rdquo; badge</p>
                </div>
                <button
                    onClick={() => setEditing("new")}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold text-white bg-accent hover:bg-accent-hover transition-colors"
                >
                    <Plus size={15} /> Add prompt
                </button>
            </div>

            <div className="px-4 sm:px-6 pb-10 space-y-4">
                {categoryCounts.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {categoryCounts.map((c) => (
                            <button
                                key={c.category}
                                onClick={() => { const next = category === c.category ? "" : c.category; setCategory(next); load({ q, category: next }) }}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[0.7rem] font-semibold border transition-colors ${category === c.category ? "bg-accent/10 text-accent border-accent/20" : "bg-bg-hover text-text-secondary border-border hover:text-text-primary"}`}
                            >
                                {c.category} · {c.count}
                            </button>
                        ))}
                    </div>
                )}

                <form onSubmit={handleFilter} className="flex gap-3">
                    <div className="relative flex-1 max-w-md">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                        <input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Search by title"
                            className="w-full h-10 rounded-btn border border-border bg-bg-input pl-9 pr-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30"
                        />
                    </div>
                    <button type="submit" className="h-10 px-5 rounded-full text-sm font-bold text-white bg-accent hover:bg-accent-hover transition-colors">
                        Filter
                    </button>
                </form>

                {error && (
                    <div className="p-3 text-sm text-center border rounded-btn bg-danger/10 border-danger/20 text-danger">{error}</div>
                )}

                <div className="rounded-card border border-border bg-bg-panel overflow-hidden">
                    {loading ? (
                        <div className="p-5 space-y-3">
                            {[...Array(5)].map((_, i) => <div key={i} className="h-14 rounded-btn bg-bg-hover animate-pulse" />)}
                        </div>
                    ) : prompts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-5">
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-accent/10 text-accent">
                                <BookOpen size={24} />
                            </div>
                            <p className="text-text-primary font-semibold">No prompts found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-[0.7rem] uppercase tracking-wider text-text-secondary">
                                        <th className="px-5 py-3 font-semibold">Prompt</th>
                                        <th className="px-5 py-3 font-semibold">Category</th>
                                        <th className="px-5 py-3 font-semibold">Type</th>
                                        <th className="px-5 py-3 font-semibold">Mega</th>
                                        <th className="px-5 py-3 font-semibold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {prompts.map((p) => (
                                        <tr key={p._id} className="border-t border-border hover:bg-bg-hover/50 transition-colors">
                                            <td className="px-5 py-3.5">
                                                <p className="font-medium text-text-primary truncate max-w-[280px]">{p.emoji} {p.title}</p>
                                                <p className="text-xs text-text-secondary truncate max-w-[280px]">{p.description}</p>
                                            </td>
                                            <td className="px-5 py-3.5 text-text-secondary">{p.category}</td>
                                            <td className="px-5 py-3.5 text-text-secondary capitalize">{p.type}</td>
                                            <td className="px-5 py-3.5 text-text-secondary">{p.isMega ? "Yes" : "—"}</td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => setEditing(p)}
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-btn text-xs font-semibold border border-border text-text-primary hover:bg-bg-hover transition-colors"
                                                    >
                                                        <Pencil size={13} /> Edit
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteTarget(p)}
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-btn text-xs font-semibold text-white bg-danger hover:bg-danger/90 transition-colors"
                                                    >
                                                        <Trash2 size={13} /> Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {editing && (
                <PromptForm
                    initial={editing === "new" ? EMPTY_FORM : toFormState(editing)}
                    onCancel={() => setEditing(null)}
                    onSave={save}
                    saving={saving}
                />
            )}

            {deleteTarget && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-sm bg-bg-panel border border-border rounded-card p-6">
                        <h3 className="text-lg font-semibold text-text-primary">Delete prompt</h3>
                        <p className="text-sm text-text-secondary mt-1 mb-5">
                            Delete <span className="font-medium text-text-primary">&ldquo;{deleteTarget.title}&rdquo;</span>? This can&apos;t be undone.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 rounded-btn text-sm font-medium text-text-secondary hover:bg-bg-hover transition-colors">
                                Cancel
                            </button>
                            <button onClick={confirmDelete} disabled={saving} className="px-4 py-2 rounded-btn text-sm font-semibold text-white bg-danger hover:bg-danger/90 disabled:opacity-50 transition-colors">
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
