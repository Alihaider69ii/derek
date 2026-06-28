"use client"

import * as React from "react"
import { Search, Clock, Calendar, BookOpen, Rss, ArrowLeft, ArrowRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { Navbar } from "@/components/shared/Navbar"

export const dynamic = 'force-dynamic'

// ── Category colours ──────────────────────────────────────────────────────────
const CATEGORY_COLORS: Record<string, string> = {
    "Prompt Engineering": "#FF4D00",
    "AI Tips":            "#e05252",
    "Tutorials":          "#f59e0b",
    "Case Studies":       "#00A67E",
    "News":               "#0047FF",
    "General":            "#7A6F62",
}

// ── Blog Card ─────────────────────────────────────────────────────────────────
function BlogCard({ post, index }: { post: any; index: number }) {
    const color = CATEGORY_COLORS[post.category] || CATEGORY_COLORS["General"]
    const date = post.publishedAt
        ? new Date(post.publishedAt).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
          })
        : "—"
    const isFeature = index === 0

    if (isFeature) {
        // First post gets a wide feature card
        return (
            <Link href={`/blog/${post.slug}`} className="group block col-span-full">
                <article className="relative bg-bg-panel border border-border rounded-2xl overflow-hidden flex flex-col md:flex-row transition-all duration-300 hover:border-accent/50 hover:shadow-[0_8px_40px_rgba(255,77,0,0.12)] hover:-translate-y-0.5">
                    {/* Accent bar */}
                    <div className="absolute top-0 left-0 w-full h-[3px]" style={{ background: "linear-gradient(90deg, var(--accent), var(--accent-2))" }} />

                    {/* Image / placeholder */}
                    {post.coverImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={post.coverImage}
                            alt={post.title}
                            className="w-full md:w-[420px] md:min-h-[280px] object-cover flex-shrink-0"
                        />
                    ) : (
                        <div
                            className="w-full md:w-[420px] min-h-[200px] md:min-h-[280px] flex items-center justify-center flex-shrink-0"
                            style={{ background: `linear-gradient(135deg, ${color}18 0%, var(--bg-base) 100%)` }}
                        >
                            <BookOpen size={52} style={{ color: `${color}60` }} />
                        </div>
                    )}

                    {/* Content */}
                    <div className="p-7 flex flex-col justify-center flex-1 gap-4">
                        <div className="flex items-center gap-3">
                            <span
                                className="text-[0.7rem] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider"
                                style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}
                            >
                                {post.category}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-text-secondary">
                                <Clock size={12} /> {post.readTime || 5} min read
                            </span>
                            <span className="hidden sm:flex items-center gap-1 text-xs text-text-secondary">
                                <Calendar size={12} /> {date}
                            </span>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold text-text-primary leading-snug group-hover:text-accent transition-colors line-clamp-2">
                            {post.title}
                        </h2>
                        <p className="text-base text-text-secondary leading-relaxed line-clamp-3">
                            {post.excerpt}
                        </p>
                        <div className="flex items-center gap-3 pt-2">
                            <div className="w-8 h-8 rounded-full bg-accent/15 border border-accent/20 flex items-center justify-center text-sm font-bold text-accent">
                                {post.author?.[0] || "D"}
                            </div>
                            <span className="text-sm font-medium text-text-secondary">{post.author || "Derek Team"}</span>
                            <span className="ml-auto flex items-center gap-1 text-sm font-semibold text-accent group-hover:gap-2 transition-all">
                                Read article <ArrowRight size={14} />
                            </span>
                        </div>
                    </div>
                </article>
            </Link>
        )
    }

    return (
        <Link href={`/blog/${post.slug}`} className="group block">
            <article className="h-full bg-bg-panel border border-border rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:border-accent/50 hover:shadow-[0_6px_30px_rgba(255,77,0,0.10)] hover:-translate-y-1">
                {post.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={post.coverImage} alt={post.title} className="w-full h-44 object-cover" />
                ) : (
                    <div
                        className="w-full h-44 flex items-center justify-center"
                        style={{ background: `linear-gradient(135deg, ${color}15 0%, var(--bg-panel) 100%)` }}
                    >
                        <BookOpen size={34} style={{ color: `${color}70` }} />
                    </div>
                )}
                <div className="p-5 flex flex-col flex-1">
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
                    <h2 className="text-base font-bold text-text-primary mb-2 leading-snug line-clamp-2 group-hover:text-accent transition-colors">
                        {post.title}
                    </h2>
                    <p className="text-sm text-text-secondary leading-relaxed line-clamp-3 flex-1 mb-4">
                        {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between pt-3 border-t border-border">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-accent/15 flex items-center justify-center text-[0.6rem] font-bold text-accent">
                                {post.author?.[0] || "D"}
                            </div>
                            <span className="text-xs text-text-secondary truncate max-w-[100px]">{post.author || "Derek Team"}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-text-secondary">
                            <Calendar size={11} /> {date}
                        </div>
                    </div>
                </div>
            </article>
        </Link>
    )
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyBlog() {
    return (
        <div className="col-span-full flex flex-col items-center justify-center py-28 gap-5">
            <div className="w-20 h-20 rounded-3xl bg-accent/10 border border-accent/20 flex items-center justify-center">
                <Rss size={34} className="text-accent/50" />
            </div>
            <div className="text-center">
                <p className="text-text-primary font-semibold text-lg mb-1">No posts found</p>
                <p className="text-text-secondary text-sm">Try a different search or check back later.</p>
            </div>
            <Link
                href="/"
                className="flex items-center gap-2 text-sm font-medium text-accent hover:text-accent-hover transition-colors"
            >
                <ArrowLeft size={14} /> Back to Home
            </Link>
        </div>
    )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AllBlogsPage() {
    const [posts, setPosts] = React.useState<any[]>([])
    const [loading, setLoading] = React.useState(true)
    const [search, setSearch] = React.useState("")
    const [activeCategory, setActiveCategory] = React.useState("All")

    React.useEffect(() => {
        fetch("/api/blog")
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    // Sort newest → oldest
                    const sorted = [...data].sort(
                        (a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime()
                    )
                    setPosts(sorted)
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    const allCategories = ["All", ...Array.from(new Set(posts.map(p => p.category).filter(Boolean)))]

    const filtered = posts.filter(p => {
        const q = search.toLowerCase()
        const matchSearch =
            !q ||
            p.title?.toLowerCase().includes(q) ||
            p.excerpt?.toLowerCase().includes(q) ||
            p.tags?.some((t: string) => t.toLowerCase().includes(q))
        const matchCat = activeCategory === "All" || p.category === activeCategory
        return matchSearch && matchCat
    })

    return (
        <div className="min-h-screen animated-bg flex flex-col">
            <Navbar />

            <main className="flex-1">
                {/* ── Page Hero ── */}
                <section className="pt-16 pb-10 px-4 border-b border-border bg-bg-panel/40">
                    <div className="container mx-auto max-w-6xl">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Link
                                        href="/"
                                        className="flex items-center gap-1 text-xs text-text-secondary hover:text-accent transition-colors"
                                    >
                                        <ArrowLeft size={12} /> Home
                                    </Link>
                                    <span className="text-text-secondary/40 text-xs">/</span>
                                    <span className="text-xs text-text-secondary">Blog</span>
                                </div>
                                <p className="text-xs uppercase tracking-widest text-accent font-semibold mb-2">
                                    Insights & Updates
                                </p>
                                <h1 className="text-4xl md:text-5xl font-bold text-text-primary leading-tight">
                                    All Articles
                                </h1>
                                <p className="text-text-secondary mt-3 text-lg max-w-xl">
                                    Prompt engineering tips, AI tutorials, and platform updates — sorted newest first.
                                </p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <div className="relative w-full md:w-80">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={16} />
                                    <Input
                                        className="pl-9 bg-bg-input border-border text-text-primary placeholder:text-text-secondary rounded-full"
                                        placeholder="Search articles..."
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                    />
                                </div>
                                <span className="text-xs text-text-secondary">
                                    {loading ? "Loading…" : `${filtered.length} article${filtered.length !== 1 ? "s" : ""}`}
                                </span>
                            </div>
                        </div>

                        {/* Category filter */}
                        {allCategories.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto pb-1 mt-8 hide-scrollbar">
                                {allCategories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setActiveCategory(cat)}
                                        className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                                            activeCategory === cat
                                                ? "bg-accent text-white shadow-md"
                                                : "bg-bg-hover text-text-secondary hover:bg-bg-panel hover:text-text-primary border border-border"
                                        }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                {/* ── Grid ── */}
                <section className="py-14 px-4">
                    <div className="container mx-auto max-w-6xl">
                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[...Array(6)].map((_, i) => (
                                    <div
                                        key={i}
                                        className={`bg-bg-panel border border-border rounded-2xl animate-pulse ${i === 0 ? "col-span-full h-64" : "h-80"}`}
                                    />
                                ))}
                            </div>
                        ) : filtered.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
                                {filtered.map((post, i) => (
                                    <BlogCard key={post._id || i} post={post} index={i} />
                                ))}
                            </div>
                        ) : (
                            <EmptyBlog />
                        )}
                    </div>
                </section>
            </main>

            {/* ── Footer ── */}
            <footer className="bg-bg-panel/80 border-t border-border py-8 px-4">
                <div className="container mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-4">
                    <Link href="/" className="font-bold text-lg">
                        <span className="text-text-primary">easemyprompt</span>
                        <span className="text-accent">.ai</span>
                    </Link>
                    <p className="text-xs text-text-secondary">
                        © {new Date().getFullYear()} easemyprompt.ai. All rights reserved.
                    </p>
                    <Link href="/" className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-accent transition-colors">
                        <ArrowLeft size={13} /> Back to Home
                    </Link>
                </div>
            </footer>
        </div>
    )
}
