"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Copy, Send, Check } from "lucide-react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ProtectedContent } from "@/components/shared/ProtectedContent"
import { embedZeroWidthWatermark } from "@/lib/protection"

export default function MegaPromptPage() {
    const params = useParams()
    const router = useRouter()
    const { data: session } = useSession()

    const [prompt, setPrompt] = React.useState<any>(null)
    const [loading, setLoading] = React.useState(true)
    const [copied, setCopied] = React.useState(false)

    React.useEffect(() => {
        const fetchPrompt = async () => {
            try {
                const res = await fetch(`/api/prompts/${params.id}`)
                if (res.ok) {
                    const data = await res.json()
                    setPrompt(data)
                }
            } catch (err) {
                console.error("Failed to load Mega Prompt", err)
            } finally {
                setLoading(false)
            }
        }
        if (params.id) {
            fetchPrompt()
        }
    }, [params.id])

    const watermarkId = session?.user?.email || "anonymous"

    const handleCopy = () => {
        if (!prompt) return;
        const raw = prompt.promptText || prompt.body;
        navigator.clipboard.writeText(embedZeroWidthWatermark(raw, watermarkId));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    const sendToChat = (ai: "derek" | "claude") => {
        if (!prompt) return;
        const raw = prompt.promptText || prompt.body;
        const text = encodeURIComponent(embedZeroWidthWatermark(raw, watermarkId));
        window.location.href = `/dashboard?prefill${ai === 'derek' ? 'Derek' : 'Claude'}=${text}`;
    }

    if (loading) {
        return <div className="flex items-center justify-center h-full bg-bg-base text-text-secondary">Loading Mega Prompt...</div>
    }

    if (!prompt) {
        return <div className="flex flex-col items-center justify-center h-full bg-bg-base text-text-secondary">
            <p className="mb-4">Failed to locate this Mega Prompt.</p>
            <Button onClick={() => router.push('/prompt-bank')}>Back to Prompt Bank</Button>
        </div>
    }

    return (
        <div className="flex flex-col h-full bg-bg-base overflow-y-auto">
            {/* Header / Nav */}
            <div className="sticky top-0 z-10 bg-bg-base/80 backdrop-blur-md border-b border-border p-4 lg:px-10 flex items-center justify-between">
                <Button variant="ghost" className="text-text-secondary hover:text-text-primary" onClick={() => router.push('/prompt-bank')}>
                    <ArrowLeft size={18} className="mr-2" />
                    Back to Prompt Bank
                </Button>
                <div className="flex items-center gap-3">
                    <Button 
                        variant="outline" 
                        className="border-border text-text-primary hover:bg-bg-hover"
                        onClick={handleCopy}
                    >
                        {copied ? <Check size={16} className="mr-2 text-green-500" /> : <Copy size={16} className="mr-2" />}
                        {copied ? "Copied!" : "Copy Full Prompt"}
                    </Button>
                    <Button 
                        className="bg-accent text-white hover:bg-accent-hover hidden sm:flex"
                        onClick={() => sendToChat('derek')}
                    >
                        <Send size={16} className="mr-2" />
                        Send to Derek
                    </Button>
                    <Button 
                        className="bg-white text-black hover:bg-neutral-200 hidden sm:flex"
                        onClick={() => sendToChat('claude')}
                    >
                        <Send size={16} className="mr-2" />
                        Send to Claude
                    </Button>
                </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 max-w-4xl w-full mx-auto p-6 lg:p-10 pb-32">
                <div className="mb-8 border-b border-border pb-8">
                    <div className="flex items-center gap-4 mb-4">
                        <span className="text-6xl bg-bg-panel p-4 rounded-2xl border border-border shadow-sm">{prompt.emoji}</span>
                        <div>
                            <Badge variant="mega" className="mb-2">MEGA PROMPT</Badge>
                            <h1 className="text-3xl lg:text-4xl font-bold text-text-primary line-clamp-2">{prompt.title}</h1>
                        </div>
                    </div>
                    <p className="text-text-secondary text-lg leading-relaxed">{prompt.description}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-4">
                        <Badge variant="secondary" className="bg-bg-hover text-sm px-3 py-1">{prompt.category}</Badge>
                        {prompt.tags?.map((t: string) => (
                            <span key={t} className="text-xs border border-border px-2.5 py-1 rounded-full text-text-secondary">#{t}</span>
                        ))}
                    </div>
                </div>

                <div className="space-y-8">
                    <div>
                        <h2 className="text-xl font-semibold text-text-primary mb-4 flex items-center gap-2">
                            <div className="w-1 h-6 bg-accent rounded-full" />
                            Comprehensive Prompt
                        </h2>
                        <div className="bg-bg-panel border border-border rounded-2xl p-6 md:p-8 shadow-sm">
                            <ProtectedContent
                                text={prompt.promptText || prompt.body}
                                className="text-base text-text-primary whitespace-pre-wrap font-mono leading-relaxed"
                            />
                        </div>
                    </div>

                    {prompt.sampleOutput && (
                        <div>
                            <h2 className="text-xl font-semibold text-text-primary mb-4 flex items-center gap-2">
                                <div className="w-1 h-6 bg-accent/50 rounded-full" />
                                Expected Output Pattern
                            </h2>
                            {(!prompt.outputType || prompt.outputType === "text") && (
                                <div className="bg-bg-hover rounded-2xl p-6 md:p-8 text-base text-text-secondary italic whitespace-pre-wrap leading-relaxed border border-border/50">
                                    {prompt.sampleOutput}
                                </div>
                            )}
                            {prompt.outputType === "image" && (
                                <div className="bg-bg-hover rounded-2xl overflow-hidden flex items-center justify-center max-h-[600px] border border-border/50 p-4">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={prompt.sampleOutput} alt="Sample Output" className="max-w-full max-h-[500px] object-contain rounded-xl" />
                                </div>
                            )}
                            {prompt.outputType === "video" && (
                                <div className="bg-black rounded-2xl overflow-hidden flex items-center justify-center max-h-[600px] border border-border/50">
                                    <video src={prompt.sampleOutput} controls className="max-w-full max-h-[600px] object-contain rounded-xl" />
                                </div>
                            )}
                        </div>
                    )}
                </div>
                
                {/* Mobile Action Buttons (sticky bottom) */}
                <div className="fixed bottom-0 left-0 right-0 p-4 border-t border-border bg-bg-base/90 backdrop-blur-md sm:hidden flex gap-3 z-20">
                    <Button className="flex-1 bg-accent text-white" onClick={() => sendToChat('derek')}>
                        Derek
                    </Button>
                    <Button className="flex-1 bg-white text-black" onClick={() => sendToChat('claude')}>
                        Claude
                    </Button>
                </div>
            </div>
        </div>
    )
}
