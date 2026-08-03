"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { PromptCard } from "@/components/shared/PromptCard"

export const dynamic = 'force-dynamic'

export default function PromptBankPage() {
    const router = useRouter()
    const [search, setSearch] = React.useState("")
    const [category, setCategory] = React.useState("All")

    const [prompts, setPrompts] = React.useState<any[]>([])
    const [categories, setCategories] = React.useState<any[]>([])
    const [loading, setLoading] = React.useState(true)

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
                                onClick={() => router.push(`/prompts/${prompt._id}`)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 text-text-secondary">
                        No prompts found matching your criteria.
                    </div>
                )}
            </div>
        </div>
    )
}
