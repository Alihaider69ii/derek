"use client"

import * as React from "react"
import { Clock, ArrowLeft, BookOpen, Tag, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export const dynamic = 'force-dynamic'

export default function BlogPostPage({ params }: { params: { slug: string } }) {
    const [post, setPost] = React.useState<any>(null)
    const [loading, setLoading] = React.useState(true)
    const [notFound, setNotFound] = React.useState(false)

    React.useEffect(() => {
        fetch(`/api/blog/${params.slug}`)
            .then(res => {
                if (res.status === 404) { setNotFound(true); return null }
                return res.json()
            })
            .then(data => { if (data) setPost(data) })
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [params.slug])

    if (loading) {
        return (
            <div className="flex flex-col h-full bg-bg-base overflow-y-auto p-6 lg:p-10">
                <div className="max-w-3xl w-full mx-auto space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-6 bg-bg-panel rounded animate-pulse" style={{ width: `${80 - i * 10}%` }} />
                    ))}
                </div>
            </div>
        )
    }

    if (notFound || !post) {
        return (
            <div className="flex flex-col h-full bg-bg-base overflow-y-auto p-6 lg:p-10 items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 rounded-2xl bg-bg-panel border border-border flex items-center justify-center mx-auto mb-4">
                        <BookOpen size={28} className="text-text-secondary" />
                    </div>
                    <h1 className="text-2xl font-bold text-text-primary mb-2">Post not found</h1>
                    <p className="text-text-secondary mb-6">This article doesn&apos;t exist or has been unpublished.</p>
                    <Link href="/blog">
                        <Button variant="outline"><ArrowLeft size={16} className="mr-2" /> Back to Blog</Button>
                    </Link>
                </div>
            </div>
        )
    }

    const date = post.publishedAt
        ? new Date(post.publishedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
        : ""

    return (
        <div className="flex flex-col h-full bg-bg-base overflow-y-auto">
            {/* Hero */}
            <div
                className="w-full px-6 py-16 border-b border-border"
                style={{ background: "linear-gradient(180deg, var(--bg-panel) 0%, var(--bg-base) 100%)" }}
            >
                <div className="max-w-3xl mx-auto">
                    <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors mb-8">
                        <ArrowLeft size={14} /> Back to Blog
                    </Link>
                    <div className="flex items-center gap-3 mb-4">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-accent/15 text-accent border border-accent/25 uppercase tracking-wider">
                            {post.category}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-text-secondary">
                            <Clock size={11} /> {post.readTime || 5} min read
                        </span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-4 leading-tight">
                        {post.title}
                    </h1>
                    <p className="text-text-secondary text-lg leading-relaxed mb-6">{post.excerpt}</p>
                    <div className="flex items-center gap-4 text-sm text-text-secondary">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-xs font-bold text-accent">
                                {post.author?.[0] || "D"}
                            </div>
                            <span>{post.author || "Derek Team"}</span>
                        </div>
                        <span>·</span>
                        <span>{date}</span>
                    </div>
                </div>
            </div>

            {/* Cover Image */}
            {post.coverImage && (
                <div className="w-full max-w-3xl mx-auto px-6 -mt-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={post.coverImage} alt={post.title} className="w-full rounded-2xl border border-border object-cover max-h-[400px]" />
                </div>
            )}

            {/* Content */}
            <article className="max-w-3xl mx-auto px-6 py-10 w-full">
                <div
                    className="prose prose-invert prose-sm md:prose-base max-w-none text-text-primary leading-relaxed"
                    style={{ color: "var(--text-primary)" }}
                    dangerouslySetInnerHTML={{ __html: post.content?.replace(/\n/g, '<br/>') || "" }}
                />

                {/* Tags */}
                {post.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-10 pt-6 border-t border-border">
                        <Tag size={14} className="text-text-secondary mt-0.5" />
                        {post.tags.map((tag: string) => (
                            <span key={tag} className="text-xs border border-border px-2.5 py-1 rounded-full text-text-secondary hover:text-text-primary hover:border-accent/40 transition-colors cursor-default">
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}

                {/* Back link */}
                <div className="mt-12 pt-8 border-t border-border flex items-center gap-4">
                    <Link href="/blog">
                        <Button variant="outline" className="border-border text-text-primary hover:bg-bg-hover">
                            <ArrowLeft size={16} className="mr-2" /> All Articles
                        </Button>
                    </Link>
                </div>
            </article>
        </div>
    )
}
