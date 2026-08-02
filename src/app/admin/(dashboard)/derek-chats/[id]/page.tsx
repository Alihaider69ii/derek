"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Bot, User as UserIcon } from "lucide-react"

export const dynamic = "force-dynamic"

type Message = { role: "user" | "ai"; content: string; timestamp: string }

type ChatDetail = {
    _id: string
    title: string
    createdAt: string
    updatedAt: string
    userName: string
    userEmail: string
    derekMessages: Message[]
    claudeMessages: Message[]
}

function Bubble({ message }: { message: Message }) {
    const isUser = message.role === "user"
    return (
        <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
            <div className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center ${isUser ? "bg-accent/10 text-accent" : "bg-bg-hover text-text-secondary"}`}>
                {isUser ? <UserIcon size={14} /> : <Bot size={14} />}
            </div>
            <div className={`max-w-[75%] rounded-card px-4 py-2.5 text-sm whitespace-pre-wrap ${isUser ? "bg-accent text-white" : "bg-bg-hover text-text-primary"}`}>
                {message.content}
                <div className={`text-[0.65rem] mt-1 ${isUser ? "text-white/70" : "text-text-secondary"}`}>
                    {message.timestamp ? new Date(message.timestamp).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : ""}
                </div>
            </div>
        </div>
    )
}

export default function AdminDerekChatDetailPage() {
    const params = useParams<{ id: string }>()
    const router = useRouter()
    const [chat, setChat] = React.useState<ChatDetail | null>(null)
    const [loading, setLoading] = React.useState(true)
    const [error, setError] = React.useState("")

    React.useEffect(() => {
        fetch(`/api/admin/derek-chats/${params.id}`)
            .then((r) => r.json())
            .then((data) => {
                if (data?.error) { setError(data.error); return }
                setChat(data)
            })
            .catch(() => setError("Failed to load conversation"))
            .finally(() => setLoading(false))
    }, [params.id])

    return (
        <div className="flex flex-col h-full bg-bg-base overflow-y-auto">
            <div className="px-4 sm:px-6 pt-6 sm:pt-8 pb-6">
                <button
                    onClick={() => router.push("/admin/derek-chats")}
                    className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors mb-3"
                >
                    <ArrowLeft size={15} /> Back to Derek Chats
                </button>
                {chat && (
                    <>
                        <h1 className="text-2xl font-bold text-text-primary">{chat.title}</h1>
                        <p className="text-text-secondary text-sm mt-0.5">{chat.userName} · {chat.userEmail}</p>
                    </>
                )}
            </div>

            <div className="px-4 sm:px-6 pb-10">
                {loading ? (
                    <div className="space-y-3">
                        {[...Array(4)].map((_, i) => <div key={i} className="h-16 rounded-card bg-bg-hover animate-pulse" />)}
                    </div>
                ) : error ? (
                    <div className="p-4 text-sm text-center border rounded-btn bg-danger/10 border-danger/20 text-danger">{error}</div>
                ) : !chat ? null : (
                    <div className="max-w-3xl space-y-6">
                        <div>
                            <h3 className="text-sm font-semibold text-text-primary mb-3">Derek conversation</h3>
                            {chat.derekMessages.length === 0 ? (
                                <p className="text-sm text-text-secondary">No Derek messages in this chat</p>
                            ) : (
                                <div className="rounded-card border border-border bg-bg-panel p-5 space-y-4">
                                    {chat.derekMessages.map((m, i) => <Bubble key={i} message={m} />)}
                                </div>
                            )}
                        </div>

                        {chat.claudeMessages.length > 0 && (
                            <div>
                                <h3 className="text-sm font-semibold text-text-primary mb-3">Claude conversation (same chat)</h3>
                                <div className="rounded-card border border-border bg-bg-panel p-5 space-y-4">
                                    {chat.claudeMessages.map((m, i) => <Bubble key={i} message={m} />)}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
