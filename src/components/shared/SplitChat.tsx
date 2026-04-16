"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Copy, Check, Paperclip, Cpu, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter, useSearchParams } from "next/navigation"
import { Dropdown } from "@/components/ui/dropdown"
import { FreeTierModal } from "@/components/shared/FreeTierModal"
import { useSession } from "next-auth/react"
import Image from "next/image"

const CHAT_LIMIT = 3
const COOLDOWN_HOURS = 3
const DEREK_KEY = "emp_derek_timestamps"
const CLAUDE_KEY = "emp_claude_timestamps"

const ALLOWED_TYPES = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "video/mp4",
    "image/jpeg",
    "image/png",
    "image/jpg",
    "text/plain",
]
const ALLOWED_EXT = ".pdf,.docx,.mp4,.jpg,.png,.jpeg,.txt"

// ── Thinking indicator ──────────────────────────────────────────────────────
function ThinkingIndicator({ words, color }: { words: string[]; color: string }) {
    const [idx, setIdx] = React.useState(0)
    const [visible, setVisible] = React.useState(true)

    React.useEffect(() => {
        const fade = setInterval(() => {
            setVisible(false)
            setTimeout(() => {
                setIdx(i => (i + 1) % words.length)
                setVisible(true)
            }, 300)
        }, 1400)
        return () => clearInterval(fade)
    }, [words.length])

    return (
        <div className="flex items-center gap-2 text-sm italic" style={{ color }}>
            <span style={{ opacity: visible ? 1 : 0, transition: "opacity 0.3s ease", fontFamily: "monospace" }}>
                {words[idx]}
            </span>
            <span className="flex gap-1">
                {[0, 1, 2].map(i => (
                    <span key={i} style={{
                        width: 5, height: 5, borderRadius: "50%",
                        backgroundColor: color, display: "inline-block",
                        animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                    }} />
                ))}
            </span>
            <style>{`@keyframes bounce { 0%,80%,100%{transform:translateY(0);opacity:.4} 40%{transform:translateY(-5px);opacity:1} }`}</style>
        </div>
    )
}

// ── Copy button ─────────────────────────────────────────────────────────────
function extractCopyableText(text: string): string {
    if (!text) return "";
    
    // 1. Try to extract content between "STRUCTURED PROMPT:" and "PRO TIP:"
    const promptMatch = text.match(/(?:\*\*STRUCTURED PROMPT:\*\*|STRUCTURED PROMPT:)\s*([\s\S]*?)(?=(?:\*\*PRO\s*TIP:\*\*|PRO\s*TIP:)|$)/i);
    if (promptMatch && promptMatch[1].trim()) {
        return promptMatch[1].trim();
    }
    
    // Fallback: return full text if no known separators are found
    return text.trim();
}

function CopyButton({ text, color }: { text: string; color: string }) {
    const [copied, setCopied] = React.useState(false)
    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(extractCopyableText(text))
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch {}
    }
    return (
        <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary transition-colors mt-1 ml-1 select-none"
            title="Smart Copy: Copies only the essential relevant content"
        >
            {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
            {copied ? "Copied" : "Smart Copy"}
        </button>
    )
}

// ── File helpers ────────────────────────────────────────────────────────────
async function readFileAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve((reader.result as string).split(",")[1])
        reader.onerror = reject
        reader.readAsDataURL(file)
    })
}

async function readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsText(file)
    })
}

async function buildFilePayload(file: File): Promise<{ type: "text"; text: string } | { type: "image"; mediaType: string; base64: string } | { type: "document"; mediaType: string; base64: string; name: string }> {
    const isText = file.type === "text/plain" || file.name.endsWith(".txt")
    const isImage = file.type.startsWith("image/")
    if (isText) {
        const text = await readFileAsText(file)
        return { type: "text", text: `[Attached file: ${file.name}]\n${text}` }
    }
    if (isImage) {
        const base64 = await readFileAsBase64(file)
        return { type: "image", mediaType: file.type, base64 }
    }
    const base64 = await readFileAsBase64(file)
    return { type: "document", mediaType: file.type, base64, name: file.name }
}

// ── Types ───────────────────────────────────────────────────────────────────
interface Message { role: "user" | "ai"; content: string }
interface SplitChatProps { guestMode?: boolean }

// ── File badge ──────────────────────────────────────────────────────────────
function FileBadge({ file, onRemove }: { file: File; onRemove: () => void }) {
    return (
        <div className="flex items-center gap-1 bg-accent/10 border border-accent/20 rounded px-2 py-0.5 text-xs text-accent max-w-[180px]">
            <Paperclip size={11} className="shrink-0" />
            <span className="truncate">{file.name}</span>
            <button onClick={onRemove} className="ml-1 text-text-secondary hover:text-red-400">✕</button>
        </div>
    )
}

// ── Panel Header ────────────────────────────────────────────────────────────
function PanelHeader({
    type,
    badge,
    subtitle,
    children,
}: {
    type: "derek" | "claude"
    badge: string
    subtitle: string
    children?: React.ReactNode
}) {
    const isDerek = type === "derek"
    return (
        <div
            className="px-5 py-4 border-b border-border flex items-center justify-between shrink-0"
            style={{
                background: isDerek
                    ? "linear-gradient(135deg, #0a1128 0%, #151b3d 100%)"
                    : "linear-gradient(135deg, #0d1117 0%, #0f1824 100%)",
                borderColor: isDerek ? "#1e2d40" : "#1e2d40",
            }}
        >
            <div className="flex items-center gap-3">
                {/* Avatar */}
                {isDerek ? (
                    <div className="relative w-12 h-12 shrink-0">
                        <Image
                            src="/derek-logo.png"
                            alt="Derek"
                            fill
                            className="object-cover rounded-full ring-2"
                            style={{ ringColor: "#3b82f6" } as React.CSSProperties}
                            onError={(e) => {
                                // Fallback if image not found
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                    parent.innerHTML = '<div style="width:36px;height:36px;border-radius:50%;background:#e05252;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;color:white">D</div>';
                                }
                            }}
                        />
                    </div>
                ) : (
                    <div className="relative w-12 h-12 shrink-0">
                        <Image
                            src="/claude-avatar.png"
                            alt="Claude"
                            fill
                            className="object-cover rounded-full ring-2"
                            style={{ ringColor: "#6c63ff" } as React.CSSProperties}
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                    parent.innerHTML = '<div style="width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg, #6c63ff, #4f46e5);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:16px;color:white">C</div>';
                                }
                            }}
                        />
                    </div>
                )}
                <div>
                    <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold" style={{ color: isDerek ? "#60a5fa" : "#a5b4fc" }}>
                            {isDerek ? "Derek" : "Claude"}
                        </h3>
                        <span
                            className="text-[0.6rem] font-bold px-1.5 py-0.5 rounded uppercase tracking-widest hidden sm:inline-block"
                            style={{
                                background: isDerek ? "rgba(59,130,246,0.15)" : "rgba(108,99,255,0.15)",
                                color: isDerek ? "#60a5fa" : "#6c63ff",
                                border: `1px solid ${isDerek ? "rgba(59,130,246,0.3)" : "rgba(108,99,255,0.3)"}`,
                            }}
                        >
                            {badge}
                        </span>
                    </div>
                    <p className="text-[0.7rem] mt-0.5" style={{ color: isDerek ? "#94a3b8" : "#5a7090" }}>
                        {subtitle}
                    </p>
                </div>
            </div>
            {children}
        </div>
    )
}

// ── Main Component ───────────────────────────────────────────────────────────
export function SplitChat({ guestMode = false }: SplitChatProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const chatId = searchParams.get('id')
    const { data: session, status } = useSession()

    const [derekMessages, setDerekMessages] = React.useState<Message[]>([])
    const [claudeMessages, setClaudeMessages] = React.useState<Message[]>([])
    const [derekInput, setDerekInput] = React.useState("")
    const [claudeInput, setClaudeInput] = React.useState("")
    const [selectedModel, setSelectedModel] = React.useState("claude-sonnet-4-6")
    const [isDerekStreaming, setIsDerekStreaming] = React.useState(false)
    const [isClaudeStreaming, setIsClaudeStreaming] = React.useState(false)
    const [derekTimestamps, setDerekTimestamps] = React.useState<number[]>([])
    const [claudeTimestamps, setClaudeTimestamps] = React.useState<number[]>([])
    const [showLimitModal, setShowLimitModal] = React.useState(false)
    const [remainingTime, setRemainingTime] = React.useState<string | null>(null)

    // File state
    const [derekFile, setDerekFile] = React.useState<File | null>(null)
    const [claudeFile, setClaudeFile] = React.useState<File | null>(null)
    const derekFileRef = React.useRef<HTMLInputElement>(null)
    const claudeFileRef = React.useRef<HTMLInputElement>(null)

    // Scroll refs
    const derekScrollRef = React.useRef<HTMLDivElement>(null)
    const claudeScrollRef = React.useRef<HTMLDivElement>(null)

    // Auto-scroll
    React.useEffect(() => {
        if (derekScrollRef.current) derekScrollRef.current.scrollTop = derekScrollRef.current.scrollHeight
    }, [derekMessages])
    React.useEffect(() => {
        if (claudeScrollRef.current) claudeScrollRef.current.scrollTop = claudeScrollRef.current.scrollHeight
    }, [claudeMessages])

    React.useEffect(() => {
        const dTimestamps = JSON.parse(localStorage.getItem(DEREK_KEY) || "[]")
        const cTimestamps = JSON.parse(localStorage.getItem(CLAUDE_KEY) || "[]")
        setDerekTimestamps(dTimestamps)
        setClaudeTimestamps(cTimestamps)
    }, [])

    const getRemainingChats = (timestamps: number[]) => {
        const now = Date.now()
        const activeChats = timestamps.filter(t => now - t < COOLDOWN_HOURS * 60 * 60 * 1000)
        return Math.max(0, CHAT_LIMIT - activeChats.length)
    }

    const getTimeToWait = (timestamps: number[]) => {
        if (timestamps.length < CHAT_LIMIT) return null
        const now = Date.now()
        const oldestEntry = Math.min(...timestamps)
        const diff = (COOLDOWN_HOURS * 60 * 60 * 1000) - (now - oldestEntry)
        if (diff <= 0) return null
        const h = Math.floor(diff / (1000 * 60 * 60))
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        return `${h}h ${m}m`
    }

    const canSendDerek = getRemainingChats(derekTimestamps) > 0
    const canSendClaude = getRemainingChats(claudeTimestamps) > 0

    const recordDerekUse = () => {
        const now = Date.now()
        const valid = derekTimestamps.filter(t => now - t < COOLDOWN_HOURS * 60 * 60 * 1000)
        const updated = [...valid, now]
        setDerekTimestamps(updated)
        localStorage.setItem(DEREK_KEY, JSON.stringify(updated))
    }

    const recordClaudeUse = () => {
        const now = Date.now()
        const valid = claudeTimestamps.filter(t => now - t < COOLDOWN_HOURS * 60 * 60 * 1000)
        const updated = [...valid, now]
        setClaudeTimestamps(updated)
        localStorage.setItem(CLAUDE_KEY, JSON.stringify(updated))
    }

    React.useEffect(() => {
        if (chatId) {
            fetch(`/api/chats/${chatId}`)
                .then(res => res.json())
                .then(data => {
                    if (data && !data.error) {
                        setDerekMessages(data.derekMessages || [])
                        setClaudeMessages(data.claudeMessages || [])
                    }
                })
                .catch(err => console.error(err))
        } else {
            setDerekMessages([])
            setClaudeMessages([])
        }

        const pd = searchParams.get('prefillDerek')
        const pc = searchParams.get('prefillClaude')
        let shouldClean = false
        const currentUrl = new URL(window.location.href)
        if (pd) { setDerekInput(pd); currentUrl.searchParams.delete('prefillDerek'); shouldClean = true }
        if (pc) { setClaudeInput(pc); currentUrl.searchParams.delete('prefillClaude'); shouldClean = true }

        const verified = searchParams.get('verified')
        if (verified === 'true') {
            alert("Verification successful!");
            currentUrl.searchParams.delete('verified');
            shouldClean = true;
        }

        if (shouldClean) router.replace(currentUrl.pathname + currentUrl.search, { scroll: false })
    }, [chatId, searchParams, router])

    const saveChat = async (dM: Message[], cM: Message[]) => {
        const clean = (msgs: Message[]) => msgs.filter(m => m.content.trim().length > 0)
        try {
            const res = await fetch("/api/chats", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: chatId, derekMessages: clean(dM), claudeMessages: clean(cM) })
            })
            const data = await res.json()
            if (data._id && !chatId) router.replace(`/dashboard?id=${data._id}`)
        } catch (e) { console.error("Failed to save chat", e) }
    }

    const sendToClaude = async (message: string, history: Message[], file?: File | null) => {
        const newContext = [...history, { role: "user" as const, content: message }]
        setClaudeMessages(newContext)
        setIsClaudeStreaming(true)
        let streamingMsgs = [...newContext, { role: "ai" as const, content: "" }]

        try {
            setClaudeMessages(streamingMsgs)
            let body: Record<string, unknown> = { message, model: selectedModel, history }
            if (file) {
                const payload = await buildFilePayload(file)
                body = { ...body, file: payload }
            }

            const res = await fetch("/api/chat/claude", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            })

            if (!res.ok) throw new Error("Failed to fetch")
            const reader = res.body?.getReader()
            const decoder = new TextDecoder()
            let done = false
            while (!done && reader) {
                const { value, done: doneReading } = await reader.read()
                done = doneReading
                streamingMsgs = [...streamingMsgs]
                streamingMsgs[streamingMsgs.length - 1].content += decoder.decode(value)
                setClaudeMessages(streamingMsgs)
            }
            await saveChat(derekMessages, streamingMsgs)
        } catch (e) {
            console.error(e)
            if (streamingMsgs[streamingMsgs.length - 1]?.role === "ai" && streamingMsgs[streamingMsgs.length - 1].content === "")
                setClaudeMessages(streamingMsgs.slice(0, -1))
        } finally {
            setIsClaudeStreaming(false)
        }
    }

    const handleSendDerek = async () => {
        if (!derekInput.trim() || isDerekStreaming) return
        if (!canSendDerek) { setShowLimitModal(true); return }

        const userMsg = derekInput
        const newContext = [...derekMessages, { role: "user" as const, content: userMsg }]
        setDerekMessages(newContext)
        setDerekInput("")
        setIsDerekStreaming(true)
        const fileToSend = derekFile
        setDerekFile(null)

        let streamingMsgs = [...newContext, { role: "ai" as const, content: "" }]

        try {
            setDerekMessages(streamingMsgs)
            let body: Record<string, unknown> = { message: userMsg, history: derekMessages }
            if (fileToSend) {
                const payload = await buildFilePayload(fileToSend)
                body = { ...body, file: payload }
            }

            const res = await fetch("/api/chat/derek", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            })

            if (!res.ok) throw new Error("Failed to fetch")
            const text = await res.text()
            streamingMsgs[streamingMsgs.length - 1].content = text
            setDerekMessages(streamingMsgs)
            recordDerekUse()
        } catch (e) {
            console.error(e)
            if (streamingMsgs[streamingMsgs.length - 1]?.role === "ai" && streamingMsgs[streamingMsgs.length - 1].content === "")
                setDerekMessages(streamingMsgs.slice(0, -1))
        } finally {
            setIsDerekStreaming(false)
        }
    }

    const handleSendClaude = async () => {
        if (!claudeInput.trim() || isClaudeStreaming) return
        if (!canSendClaude) { setShowLimitModal(true); return }
        const fileToSend = claudeFile
        setClaudeFile(null)
        recordClaudeUse()
        await sendToClaude(claudeInput, claudeMessages, fileToSend)
        setClaudeInput("")
    }

    // ── Render message list ─────────────────────────────────────────────────
    const renderMessages = (
        messages: Message[],
        isStreaming: boolean,
        type: "derek" | "claude",
        thinkingWords: string[],
        scrollRef: React.RefObject<HTMLDivElement>,
        emptyText: string
    ) => {
        const isDerek = type === "derek"
        const accentColor = isDerek ? "#3b82f6" : "#6c63ff"
        const aiMsgBg = isDerek ? "rgba(59,130,246,0.07)" : "rgba(108,99,255,0.07)"
        const aiMsgBorder = isDerek ? "rgba(59,130,246,0.15)" : "rgba(108,99,255,0.15)"

        return (
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-5 space-y-4 hide-scrollbar"
                style={{ WebkitOverflowScrolling: "touch" }}
            >
                {messages.map((msg, idx) => (
                    <div key={idx} className={cn("flex flex-col w-full", msg.role === "user" ? "items-end" : "items-start")}>
                        <div className="flex items-start gap-3 max-w-[85%]">
                            {msg.role === "ai" && (
                                <div
                                    className="relative w-8 h-8 shrink-0 mt-1"
                                >
                                    <Image
                                        src={isDerek ? "/derek-logo.png" : "/claude-avatar.png"}
                                        alt={isDerek ? "Derek" : "Claude"}
                                        fill
                                        className="object-cover rounded-full"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.style.display = 'none';
                                            const parent = target.parentElement;
                                            if (parent) {
                                                parent.innerHTML = `<div style="width:32px;height:32px;border-radius:50%;background:${accentColor};display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;color:white">${isDerek ? 'D' : 'C'}</div>`;
                                            }
                                        }}
                                    />
                                </div>
                            )}
                            <div
                                className={cn(
                                    "p-3 text-text-primary text-sm whitespace-pre-wrap font-chat",
                                    msg.role === "user"
                                        ? "bg-bg-hover rounded-[12px_12px_2px_12px]"
                                        : "rounded-[12px_12px_12px_2px] border",
                                    isStreaming && idx === messages.length - 1 && msg.role === "ai" && msg.content !== "" ? "streaming-cursor" : ""
                                )}
                                style={msg.role === "ai" ? { background: aiMsgBg, borderColor: aiMsgBorder } : {}}
                            >
                                {isStreaming && idx === messages.length - 1 && msg.role === "ai" && msg.content === ""
                                    ? <ThinkingIndicator words={thinkingWords} color={accentColor} />
                                    : msg.content
                                }
                            </div>
                        </div>
                        {msg.role === "ai" && msg.content && !(isStreaming && idx === messages.length - 1) && (
                            <div className="ml-11">
                                <CopyButton text={msg.content} color={accentColor} />
                            </div>
                        )}
                    </div>
                ))}
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center gap-3 text-center px-4">
                        <div
                            className="w-12 h-12 rounded-full flex items-center justify-center"
                            style={{ background: `${accentColor}18`, border: `1px solid ${accentColor}30` }}
                        >
                            {isDerek
                                ? <Cpu size={22} style={{ color: accentColor }} />
                                : <Sparkles size={22} style={{ color: accentColor }} />
                            }
                        </div>
                        <p className="text-text-secondary text-sm">{emptyText}</p>
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="flex flex-col md:flex-row w-full h-[600px] md:h-full border border-border rounded-xl overflow-hidden bg-bg-base">
            <FreeTierModal isOpen={showLimitModal} onClose={() => setShowLimitModal(false)} />

            {/* LEFT PANEL — DEREK (Prompt Engine) */}
            <div className="flex-1 flex flex-col border-b md:border-b-0 md:border-r relative min-w-0 overflow-hidden" style={{ borderColor: "#1e2d40" }}>
                <PanelHeader type="derek" badge="Prompt Engine" subtitle="Structures your idea into a perfect prompt">
                    <div className="flex flex-col items-end gap-1">
                        <span className={cn("text-[0.65rem] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter",
                            getRemainingChats(derekTimestamps) === 0
                                ? "bg-red-500/10 text-red-400 border border-red-500/30"
                                : "bg-blue-500/10 text-blue-400 border border-blue-500/30"
                        )}>
                            {getRemainingChats(derekTimestamps)} chats left
                        </span>
                        {getRemainingChats(derekTimestamps) === 0 && (
                            <span className="text-[0.6rem] text-text-secondary">Wait {getTimeToWait(derekTimestamps)}</span>
                        )}
                    </div>
                </PanelHeader>

                {renderMessages(
                    derekMessages,
                    isDerekStreaming,
                    "derek",
                    ["Structuring...", "Crafting prompt...", "Engineering...", "Refining...", "Almost ready..."],
                    derekScrollRef,
                    "Describe your idea and Derek will engineer a perfect, structured prompt."
                )}

                <div className="p-4 border-t shrink-0" style={{ borderColor: "#1e2d40", background: "#080c1a" }}>
                    {derekFile && (
                        <div className="mb-2">
                            <FileBadge file={derekFile} onRemove={() => setDerekFile(null)} />
                        </div>
                    )}
                    <div className="relative flex items-center">
                        <input
                            ref={derekFileRef}
                            type="file"
                            accept={ALLOWED_EXT}
                            className="hidden"
                            onChange={e => setDerekFile(e.target.files?.[0] ?? null)}
                        />
                        <div className="absolute -top-10 left-10 pointer-events-none animate-bounce delay-700 bg-blue-600/10 border border-blue-500/20 px-3 py-1.5 rounded-lg flex items-center gap-2">
                           <Cpu size={14} className="text-blue-400" />
                           <span className="text-[0.7rem] font-medium text-blue-300">Ask me anything here, I’ll generate customized prompt in second</span>
                        </div>
                        <Input
                            className="pl-10 pr-12 w-full"
                            style={{ background: "#0d1326", borderColor: "#1e2d40", color: "#e6edf3" }}
                            placeholder="Describe your idea to Derek…"
                            value={derekInput}
                            onChange={(e) => setDerekInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") handleSendDerek() }}
                        />
                        <Button
                            size="icon"
                            className="absolute right-1 w-8 h-8 rounded flex items-center justify-center text-white"
                            style={{ background: "#3b82f6" }}
                            onClick={handleSendDerek}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
                        </Button>
                    </div>
                </div>
            </div>

            {/* RIGHT PANEL — CLAUDE (Response Generator) */}
            <div className="flex-1 flex flex-col bg-bg-base relative min-w-0 overflow-hidden">
                <PanelHeader type="claude" badge="Response Area" subtitle="Generates your final AI response">
                    <div className="flex items-center gap-2">
                        <div className="flex flex-col items-end gap-1">
                            <span className={cn("text-[0.65rem] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter",
                                getRemainingChats(claudeTimestamps) === 0
                                    ? "bg-red-500/10 text-red-400 border border-red-500/30"
                                    : "bg-accent/10 text-accent border border-accent/30"
                            )}>
                                {getRemainingChats(claudeTimestamps)} chats left
                            </span>
                            {getRemainingChats(claudeTimestamps) === 0 && (
                                <span className="text-[0.6rem] text-text-secondary">Wait {getTimeToWait(claudeTimestamps)}</span>
                            )}
                        </div>
                        <Dropdown
                            value={selectedModel}
                            onChange={setSelectedModel}
                            options={[
                                { label: "Claude Sonnet 4.6", value: "claude-sonnet-4-6" },
                                { label: "Claude 3 Haiku", value: "claude-3-haiku-20240307" },
                                { label: "Claude 3 Opus", value: "claude-3-opus-20240229" },
                            ]}
                        />
                    </div>
                </PanelHeader>

                {renderMessages(
                    claudeMessages,
                    isClaudeStreaming,
                    "claude",
                    ["Thinking...", "Generating...", "Processing...", "Composing...", "Almost there..."],
                    claudeScrollRef,
                    "Paste Derek's engineered prompt here to generate your final response."
                )}

                <div className="p-4 border-t border-border bg-bg-base shrink-0">
                    {claudeFile && (
                        <div className="mb-2">
                            <FileBadge file={claudeFile} onRemove={() => setClaudeFile(null)} />
                        </div>
                    )}
                    <div className="relative flex items-center">
                        <input
                            ref={claudeFileRef}
                            type="file"
                            accept={ALLOWED_EXT}
                            className="hidden"
                            onChange={e => setClaudeFile(e.target.files?.[0] ?? null)}
                        />
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute left-1 text-text-secondary hover:text-accent"
                            onClick={() => claudeFileRef.current?.click()}
                            title="Attach file"
                        >
                            <Paperclip size={18} />
                        </Button>
                        <Input
                            className="pl-10 pr-12 w-full"
                            placeholder="Paste Derek's prompt or type directly…"
                            value={claudeInput}
                            onChange={(e) => setClaudeInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") handleSendClaude() }}
                        />
                        <Button
                            size="icon"
                            className="absolute right-1 w-8 h-8 rounded bg-accent text-white hover:bg-accent-hover flex items-center justify-center"
                            onClick={handleSendClaude}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
