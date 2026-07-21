"use client"

import * as React from "react"
import { Search, X, Copy, Send, Check, Star } from "lucide-react"
import { useSession } from "next-auth/react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { PromptCard } from "@/components/shared/PromptCard"
import { Badge } from "@/components/ui/badge"
import { ProtectedContent } from "@/components/shared/ProtectedContent"
import { embedZeroWidthWatermark } from "@/lib/protection"

export const dynamic = 'force-dynamic'

export default function PromptBankPage() {
    const { data: session } = useSession()
    const [search, setSearch] = React.useState("")
    const [category, setCategory] = React.useState("All")
    
    const [prompts, setPrompts] = React.useState<any[]>([])
    const [categories, setCategories] = React.useState<any[]>([])
    const [loading, setLoading] = React.useState(true)

    const [selectedPrompt, setSelectedPrompt] = React.useState<any>(null)
    const [copied, setCopied] = React.useState(false)
    const [showFavModal, setShowFavModal] = React.useState(false)
    const [favTitle, setFavTitle] = React.useState("")
    const [favSaved, setFavSaved] = React.useState(false)
    const [favLoading, setFavLoading] = React.useState(false)

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                const [promptsRes, catsRes] = await Promise.all([
                    fetch("/api/prompts"),
                    fetch("/api/categories")
                ])
                const promptsData = await promptsRes.json()
                const catsData = await catsRes.json()
                
                if (Array.isArray(promptsData)) setPrompts(promptsData)
                if (Array.isArray(catsData)) setCategories(catsData)
            } catch (err) {
                console.error("Failed to fetch prompt bank data", err)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    const filteredPrompts = prompts.filter(p => {
        const query = search.toLowerCase()
        const matchesSearch = p.title?.toLowerCase().includes(query) ||
            p.description?.toLowerCase().includes(query) ||
            p.tags?.some((t: string) => t.toLowerCase().includes(query));
        const matchesCat = category === "All" || p.category === category;
        return matchesSearch && matchesCat;
    })

    const handleCopy = () => {
        if (!selectedPrompt) return;
        const raw = selectedPrompt.promptText || selectedPrompt.body;
        const watermarkId = session?.user?.email || "anonymous";
        navigator.clipboard.writeText(embedZeroWidthWatermark(raw, watermarkId));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    const handleFavourite = async () => {
        if (!selectedPrompt || !favTitle.trim()) return
        setFavLoading(true)
        try {
            await fetch("/api/favourites", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: favTitle.trim(),
                    promptText: selectedPrompt.promptText || selectedPrompt.body,
                    source: "bank",
                    sourceId: selectedPrompt._id,
                }),
            })
            setFavSaved(true)
            setTimeout(() => { setShowFavModal(false); setFavSaved(false); setFavTitle("") }, 900)
        } catch { }
        finally { setFavLoading(false) }
    }

    const sendToChat = (ai: "derek" | "claude") => {
        if (!selectedPrompt) return;
        const text = encodeURIComponent(selectedPrompt.promptText || selectedPrompt.body);
        window.location.href = `/chat?prefill${ai === 'derek' ? 'Derek' : 'Claude'}=${text}`;
    }

    return (
        <div className="flex flex-col h-full bg-bg-base overflow-y-auto p-6 lg:p-10 relative">
            <div className="max-w-6xl w-full mx-auto">

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
                                <div className="w-1.5 h-8 bg-accent rounded-full" />
                                Prompt Bank
                            </h1>
                            <span className="bg-bg-hover text-text-secondary text-xs px-2.5 py-1 rounded-full border border-border mt-1">
                                {filteredPrompts.length} prompts
                            </span>
                        </div>
                        <p className="text-text-secondary">Discover, use, and modify high-quality prompts.</p>
                    </div>

                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                        <Input
                            className="pl-10 text-text-primary bg-bg-input"
                            placeholder="Search prompts, tags, categories..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex overflow-x-auto gap-2 pb-6 mb-6 border-b border-border hide-scrollbar">
                    <button
                        onClick={() => setCategory('All')}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${category === 'All' ? 'bg-accent text-white' : 'bg-bg-hover text-text-secondary hover:bg-bg-panel hover:text-text-primary'}`}
                    >
                        All
                    </button>
                    {categories.map((cat) => (
                        <button
                            key={cat._id}
                            onClick={() => setCategory(cat.name)}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap flex items-center gap-2 transition-colors ${category === cat.name ? 'bg-accent text-white' : 'bg-bg-hover text-text-secondary hover:bg-bg-panel hover:text-text-primary'}`}
                        >
                            <span>{cat.emoji}</span> {cat.name}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="text-center py-20 text-text-secondary">Loading prompts...</div>
                ) : filteredPrompts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
                        {filteredPrompts.map((prompt) => (
                            <PromptCard
                                key={prompt._id}
                                {...prompt}
                                className="w-full"
                                onClick={() => {
                                    if (prompt.isMega) {
                                        window.location.href = `/prompts/${prompt._id}`
                                    } else {
                                        setSelectedPrompt(prompt)
                                    }
                                }}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 text-text-secondary">
                        No prompts found matching your criteria.
                    </div>
                )}
            </div>

            {/* PROMPT DETAIL MODAL */}
            {selectedPrompt && !selectedPrompt.isMega && (
                <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-bg-panel border border-border w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        
                        <div className="p-6 border-b border-border flex items-start justify-between gap-4">
                            <div className="flex items-start gap-4">
                                <span className="text-4xl">{selectedPrompt.emoji}</span>
                                <div>
                                    <h2 className="text-xl font-bold text-text-primary mb-2 line-clamp-1">{selectedPrompt.title}</h2>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Badge variant="secondary" className="bg-bg-hover">{selectedPrompt.category}</Badge>
                                        {selectedPrompt.tags?.map((t: string) => (
                                            <span key={t} className="text-[0.65rem] border border-border px-2 py-0.5 rounded-full text-text-secondary">#{t}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" className="shrink-0 text-text-secondary" onClick={() => setSelectedPrompt(null)}>
                                <X size={20} />
                            </Button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6 hide-scrollbar">
                            <div>
                                <h3 className="text-sm font-semibold text-text-primary mb-3">Prompt Body</h3>
                                <div className="bg-bg-base border border-border rounded-xl p-4 max-h-[300px] overflow-y-auto hide-scrollbar">
                                    <ProtectedContent
                                        text={selectedPrompt.promptText || selectedPrompt.body}
                                        className="text-sm text-text-primary whitespace-pre-wrap font-mono leading-relaxed"
                                    />
                                </div>
                            </div>

                            {selectedPrompt.sampleOutput && (
                                <div>
                                    <h3 className="text-sm font-semibold text-text-secondary mb-3">Sample Output Expected</h3>
                                    {(!selectedPrompt.outputType || selectedPrompt.outputType === "text") && (
                                        <div className="bg-bg-hover rounded-xl p-4 text-sm text-text-secondary italic">
                                            {selectedPrompt.sampleOutput}
                                        </div>
                                    )}
                                    {selectedPrompt.outputType === "image" && (
                                        <div className="bg-bg-hover rounded-xl overflow-hidden flex items-center justify-center max-h-[300px]">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={selectedPrompt.sampleOutput} alt="Sample Output" className="max-w-full max-h-[300px] object-contain rounded-xl" />
                                        </div>
                                    )}
                                    {selectedPrompt.outputType === "video" && (
                                        <div className="bg-black rounded-xl overflow-hidden flex items-center justify-center max-h-[300px]">
                                            <video src={selectedPrompt.sampleOutput} controls className="max-w-full max-h-[300px] object-contain rounded-xl" />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-border bg-bg-base/50 flex flex-col sm:flex-row gap-3">
                            <Button 
                                variant="outline" 
                                className="flex-1 border-border text-text-primary hover:bg-bg-hover"
                                onClick={handleCopy}
                            >
                                {copied ? <Check size={16} className="mr-2 text-green-500" /> : <Copy size={16} className="mr-2" />}
                                {copied ? "Copied!" : "Copy Prompt"}
                            </Button>
                            <Button
                                variant="outline"
                                className="flex-1 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
                                onClick={() => { setFavTitle(selectedPrompt?.title || ""); setShowFavModal(true) }}
                            >
                                <Star size={16} className="mr-2" /> Add to Favourites
                            </Button>
                            <Button 
                                className="flex-1 bg-accent text-white hover:bg-accent-hover"
                                onClick={() => sendToChat('derek')}
                            >
                                <Send size={16} className="mr-2" />
                                Send to Derek
                            </Button>
                            <Button 
                                className="flex-1 bg-white text-black hover:bg-neutral-200"
                                onClick={() => sendToChat('claude')}
                            >
                                <Send size={16} className="mr-2" />
                                Send to Claude
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* FAVOURITE TITLE MODAL */}
            {showFavModal && selectedPrompt && (
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
