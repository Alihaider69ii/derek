"use client"

import * as React from "react"
import { Search, Clock, Calendar, Tag, BookOpen, ArrowRight, Rss } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export const dynamic = 'force-dynamic'

const CATEGORY_COLORS: Record<string, string> = {
    "Prompt Engineering": "#6c63ff",
    "AI Tips": "#e05252",
    "Tutorials": "#f59e0b",
    "Case Studies": "#3fb950",
    "News": "#06b6d4",
    "General": "#8b949e",
}

function BlogCard({ post }: { post: any }) {
    const color = CATEGORY_COLORS[post.category] || CATEGORY_COLORS["General"]
    const date = post.publishedAt
        ? new Date(post.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        : "—"

    return (
        <Link href={`/blog/${post.slug}`} className="group block">
            <article
                className="h-full bg-bg-panel border border-border rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:border-[#6c63ff]/50 hover:shadow-[0_0_30px_rgba(108,99,255,0.1)] hover:-translate-y-1"
            >
                {/* Cover image or gradient placeholder */}
                {post.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={post.coverImage}
                        alt={post.title}
                        className="w-full h-44 object-cover"
                    />
                ) : (
                    <div
                        className="w-full h-44 flex items-center justify-center"
                        style={{ background: `linear-gradient(135deg, ${color}18 0%, #161b22 100%)` }}
                    >
                        <BookOpen size={36} style={{ color: `${color}80` }} />
                    </div>
                )}

                <div className="p-5 flex flex-col flex-1">
                    {/* Category + Read time */}
                    <div className="flex items-center gap-2 mb-3">
                        <span
                            className="text-[0.65rem] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
                            style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}
                        >
                            {post.category}
                        </span>
                        <span className="flex items-center gap-1 text-[0.65rem] text-text-secondary">
                            <Clock size={10} /> {post.readTime || 5} min read
                        </span>
                    </div>

                    {/* Title */}
                    <h2 className="text-base font-bold text-text-primary mb-2 leading-snug line-clamp-2 group-hover:text-accent transition-colors">
                        {post.title}
                    </h2>

                    {/* Excerpt */}
                    <p className="text-sm text-text-secondary leading-relaxed line-clamp-3 flex-1 mb-4">
                        {post.excerpt}
                    </p>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-border">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-[0.6rem] font-bold text-accent">
                                {post.author?.[0] || "D"}
                            </div>
                            <span className="text-xs text-text-secondary truncate max-w-[100px]">{post.author || "Derek Team"}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-text-secondary">
                            <Calendar size={11} />
                            {date}
                        </div>
                    </div>
                </div>
            </article>
        </Link>
    )
}

function EmptyBlog() {
    return (
        <div className="col-span-full flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center">
                <Rss size={28} className="text-accent/60" />
            </div>
            <div className="text-center">
                <p className="text-text-primary font-semibold mb-1">No posts yet</p>
                <p className="text-text-secondary text-sm">Blog posts will appear here once published.</p>
            </div>
        </div>
    )
}

export default function BlogPage() {
    const [posts, setPosts] = React.useState<any[]>([])
    const [loading, setLoading] = React.useState(true)
    const [search, setSearch] = React.useState("")
    const [activeCategory, setActiveCategory] = React.useState("All")

    React.useEffect(() => {
        fetch("/api/blog")
            .then(res => res.json())
            .then(data => { if (Array.isArray(data)) setPosts(data) })
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    const allCategories = ["All", ...Array.from(new Set(posts.map(p => p.category).filter(Boolean)))]

    const filtered = posts.filter(p => {
        const q = search.toLowerCase()
        const matchSearch = !q || p.title?.toLowerCase().includes(q) || p.excerpt?.toLowerCase().includes(q) || p.tags?.some((t: string) => t.toLowerCase().includes(q))
        const matchCat = activeCategory === "All" || p.category === activeCategory
        return matchSearch && matchCat
    })

    return (
        <div className="flex flex-col h-full bg-bg-base overflow-y-auto p-6 lg:p-10">
            <div className="max-w-6xl w-full mx-auto">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
                                <div className="w-1.5 h-8 bg-accent rounded-full" />
                                Blog
                            </h1>
                            <span className="bg-bg-hover text-text-secondary text-xs px-2.5 py-1 rounded-full border border-border mt-1">
                                {filtered.length} articles
                            </span>
                        </div>
                        <p className="text-text-secondary">
                            Prompt engineering tips, AI tutorials, and platform updates.
                        </p>
                    </div>
                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={16} />
                        <Input
                            className="pl-9 bg-bg-input text-text-primary"
                            placeholder="Search articles..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* Category tabs */}
                {allCategories.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-4 mb-8 border-b border-border hide-scrollbar">
                        {allCategories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeCategory === cat
                                    ? 'bg-accent text-white'
                                    : 'bg-bg-hover text-text-secondary hover:bg-bg-panel hover:text-text-primary'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                )}

                {/* Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="h-80 bg-bg-panel border border-border rounded-2xl animate-pulse" />
                        ))}
                    </div>
                ) : filtered.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
                        {filtered.map(post => (
                            <BlogCard key={post._id} post={post} />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1">
                        <EmptyBlog />
                    </div>
                )}
            </div>
        </div>
    )
}
