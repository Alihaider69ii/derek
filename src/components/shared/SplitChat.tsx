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

// ── Rate limiting (3 free chats, then 3hr cooldown) ─────────────────────────
const DEREK_TS_KEY = "emp_derek_timestamps"
const CLAUDE_TS_KEY = "emp_claude_timestamps"
const FREE_LIMIT = 3
const COOLDOWN_MS = 3 * 60 * 60 * 1000 // 3 hours

function getTimestamps(key: string): number[] {
    try { return JSON.parse(localStorage.getItem(key) ?? "[]") } catch { return [] }
}

function saveTimestamps(key: string, ts: number[]) {
    localStorage.setItem(key, JSON.stringify(ts))
}

/** Remove timestamps older than 3 hours, return remaining list */
function pruneOld(ts: number[]): number[] {
    const cutoff = Date.now() - COOLDOWN_MS
    return ts.filter(t => t > cutoff)
}

function canSendNow(key: string): boolean {
    const ts = pruneOld(getTimestamps(key))
    return ts.length < FREE_LIMIT
}

function recordSend(key: string) {
    const ts = pruneOld(getTimestamps(key))
    ts.push(Date.now())
    saveTimestamps(key, ts)
}

/** Returns ms until next slot opens, or 0 if already can send */
function msUntilNextSlot(key: string): number {
    const ts = pruneOld(getTimestamps(key))
    if (ts.length < FREE_LIMIT) return 0
    const oldest = Math.min(...ts)
    return Math.max(0, oldest + COOLDOWN_MS - Date.now())
}

function formatCountdown(ms: number): string {
    const h = Math.floor(ms / 3600000)
    const m = Math.floor((ms % 3600000) / 60000)
    const s = Math.floor((ms % 60000) / 1000)
    return `${h}h ${m}m ${s}s`
}

// ── Derek color theme ────────────────────────────────────────────────────────
const DEREK_GRADIENT_BG = "linear-gradient(135deg, #070d1f 0%, #0f1e3d 100%)"
const DEREK_BORDER_COLOR = "#1e3a6e"
const DEREK_ACCENT = "#3b82f6"       // blue-500
const DEREK_ACCENT_SOFT = "rgba(59,130,246,0.10)"
const DEREK_ACCENT_BORDER = "rgba(59,130,246,0.20)"
const DEREK_FOOTER_BG = "#060c1a"
const DEREK_INPUT_BG = "#0a1428"
const DEREK_INPUT_BORDER = "#1e3a6e"
const DEREK_TEXT_DIM = "#5a7ab0"

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

// ── Thinking indicator ───────────────────────────────────────────────────────
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

// ── Copy button ──────────────────────────────────────────────────────────────
function extractCopyableText(text: string): string {
    if (!text) return "";
    const promptMatch = text.match(/(?:\*\*STRUCTURED PROMPT:\*\*|STRUCTURED PROMPT:)\s*([\s\S]*?)(?=(?:\*\*PRO\s*TIP:\*\*|PRO\s*TIP:)|$)/i);
    if (promptMatch && promptMatch[1].trim()) return promptMatch[1].trim();
    return text.trim();
}

function CopyButton({ text, color }: { text: string; color: string }) {
    const [copied, setCopied] = React.useState(false)
    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(extractCopyableText(text))
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch { }
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

// ── File helpers ─────────────────────────────────────────────────────────────
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

// ── Types ────────────────────────────────────────────────────────────────────
interface Message { role: "user" | "ai"; content: string }
interface SplitChatProps { guestMode?: boolean }

// ── File badge ───────────────────────────────────────────────────────────────
function FileBadge({ file, onRemove }: { file: File; onRemove: () => void }) {
    return (
        <div className="flex items-center gap-1 bg-accent/10 border border-accent/20 rounded px-2 py-0.5 text-xs text-accent max-w-[180px]">
            <Paperclip size={11} className="shrink-0" />
            <span className="truncate">{file.name}</span>
            <button onClick={onRemove} className="ml-1 text-text-secondary hover:text-red-400">✕</button>
        </div>
    )
}

// ── Derek Avatar (small) ─────────────────────────────────────────────────────
function DerekAvatar({ size = 32 }: { size?: number }) {
    const [imgErr, setImgErr] = React.useState(false)
    if (imgErr) {
        return (
            <div style={{
                width: size, height: size, borderRadius: "50%",
                background: `linear-gradient(135deg, #1e3a6e, ${DEREK_ACCENT})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 700, fontSize: size * 0.4, color: "white", flexShrink: 0
            }}>D</div>
        )
    }
    return (
        <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
            <Image
                src="/derek-logo.png"
                alt="Derek"
                fill
                style={{ objectFit: "cover", borderRadius: "50%", border: `2px solid ${DEREK_ACCENT}50` }}
                onError={() => setImgErr(true)}
            />
        </div>
    )
}

// ── Claude Avatar (small) ────────────────────────────────────────────────────
function ClaudeAvatar({ size = 32 }: { size?: number }) {
    return (
        <div style={{
            width: size, height: size, borderRadius: "50%",
            background: "linear-gradient(135deg, #6c63ff, #4f46e5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: size * 0.38, fontWeight: 800, color: "white", flexShrink: 0,
            border: "2px solid rgba(108,99,255,0.4)",
            letterSpacing: "-0.02em"
        }}>
            {/* Claude stylised "C" icon */}
            <svg width={size * 0.52} height={size * 0.52} viewBox="0 0 24 24" fill="none">
                <path d="M20 12a8 8 0 1 1-4.343-7.1" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
        </div>
    )
}

// ── Panel Header ─────────────────────────────────────────────────────────────
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
                    ? DEREK_GRADIENT_BG
                    : "linear-gradient(135deg, #0d1117 0%, #0f1824 100%)",
                borderColor: isDerek ? DEREK_BORDER_COLOR : "#1e2d40",
            }}
        >
            <div className="flex items-center gap-3">
                {/* Avatar */}
                {isDerek ? (
                    <DerekAvatar size={44} />
                ) : (
                    <ClaudeAvatar size={44} />
                )}
                <div>
                    <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold" style={{ color: isDerek ? DEREK_ACCENT : "#a5b4fc" }}>
                            {isDerek ? "Derek" : "Claude"}
                        </h3>
                        <span
                            className="text-[0.6rem] font-bold px-1.5 py-0.5 rounded uppercase tracking-widest hidden sm:inline-block"
                            style={{
                                background: isDerek ? DEREK_ACCENT_SOFT : "rgba(108,99,255,0.15)",
                                color: isDerek ? DEREK_ACCENT : "#6c63ff",
                                border: `1px solid ${isDerek ? DEREK_ACCENT_BORDER : "rgba(108,99,255,0.3)"}`,
                            }}
                        >
                            {badge}
                        </span>
                    </div>
                    <p className="text-[0.7rem] mt-0.5" style={{ color: isDerek ? DEREK_TEXT_DIM : "#5a7090" }}>
                        {subtitle}
                    </p>
                </div>
            </div>
            {children}
        </div>
    )
}

// ── Cooldown Banner ──────────────────────────────────────────────────────────
function CooldownBanner({ tsKey, color }: { tsKey: string; color: string }) {
    const [remaining, setRemaining] = React.useState(() => msUntilNextSlot(tsKey))

    React.useEffect(() => {
        if (remaining <= 0) return
        const id = setInterval(() => {
            const ms = msUntilNextSlot(tsKey)
            setRemaining(ms)
            if (ms <= 0) clearInterval(id)
        }, 1000)
        return () => clearInterval(id)
    }, [tsKey, remaining])

    if (remaining <= 0) return null
    return (
        <div className="mx-4 my-2 px-4 py-2 rounded-lg text-xs text-center font-medium"
            style={{ background: `${color}18`, border: `1px solid ${color}40`, color }}>
            ⏳ You've used your 3 free chats. Next slot opens in <strong>{formatCountdown(remaining)}</strong>
        </div>
    )
}

// ── Main Component ────────────────────────────────────────────────────────────
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
    const [showLimitModal, setShowLimitModal] = React.useState(false)
    const [, forceUpdate] = React.useState(0)

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
        if (!canSendNow(DEREK_TS_KEY)) { setShowLimitModal(true); return }

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
            recordSend(DEREK_TS_KEY)
            forceUpdate(n => n + 1)
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
        if (!canSendNow(CLAUDE_TS_KEY)) { setShowLimitModal(true); return }
        const fileToSend = claudeFile
        setClaudeFile(null)
        recordSend(CLAUDE_TS_KEY)
        forceUpdate(n => n + 1)
        await sendToClaude(claudeInput, claudeMessages, fileToSend)
        setClaudeInput("")
    }

    // ── Render message list ──────────────────────────────────────────────────
    const renderMessages = (
        messages: Message[],
        isStreaming: boolean,
        type: "derek" | "claude",
        thinkingWords: string[],
        scrollRef: React.RefObject<HTMLDivElement>,
        emptyText: string
    ) => {
        const isDerek = type === "derek"
        const accentColor = isDerek ? DEREK_ACCENT : "#6c63ff"
        const aiMsgBg = isDerek ? DEREK_ACCENT_SOFT : "rgba(108,99,255,0.07)"
        const aiMsgBorder = isDerek ? DEREK_ACCENT_BORDER : "rgba(108,99,255,0.15)"

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
                                isDerek
                                    ? <div className="mt-1"><DerekAvatar size={32} /></div>
                                    : <div className="mt-1"><ClaudeAvatar size={32} /></div>
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

    const derekBlocked = !canSendNow(DEREK_TS_KEY)
    const claudeBlocked = !canSendNow(CLAUDE_TS_KEY)

    return (
        <div className="flex flex-col md:flex-row w-full h-[600px] md:h-full border border-border rounded-xl overflow-hidden bg-bg-base">
            <FreeTierModal isOpen={showLimitModal} onClose={() => setShowLimitModal(false)} />

            {/* LEFT PANEL — DEREK (Prompt Engine) */}
            <div className="flex-1 flex flex-col border-b md:border-b-0 md:border-r relative min-w-0 overflow-hidden" style={{ borderColor: DEREK_BORDER_COLOR }}>
                <PanelHeader type="derek" badge="Prompt Engine" subtitle="Structures your idea into a perfect prompt">
                    <span className={cn("text-xs font-medium px-2 py-1 rounded-full")}
                        style={derekBlocked
                            ? { background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" }
                            : { background: DEREK_ACCENT_SOFT, color: DEREK_ACCENT, border: `1px solid ${DEREK_ACCENT_BORDER}` }
                        }>
                        {derekBlocked ? "Limit reached" : `${FREE_LIMIT - pruneOld(getTimestamps(DEREK_TS_KEY)).length} free left`}
                    </span>
                </PanelHeader>

                {derekBlocked && <CooldownBanner tsKey={DEREK_TS_KEY} color={DEREK_ACCENT} />}

                {renderMessages(
                    derekMessages,
                    isDerekStreaming,
                    "derek",
                    ["Structuring...", "Crafting prompt...", "Engineering...", "Refining...", "Almost ready..."],
                    derekScrollRef,
                    "Describe your idea and Derek will engineer a perfect, structured prompt."
                )}

                <div className="p-4 border-t shrink-0" style={{ borderColor: DEREK_BORDER_COLOR, background: DEREK_FOOTER_BG }}>
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
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute left-1"
                            style={{ color: DEREK_TEXT_DIM }}
                            onClick={() => derekFileRef.current?.click()}
                            title="Attach file"
                        >
                            <Paperclip size={18} />
                        </Button>
                        <div className="relative flex-1">
                            <Input
                                className="pl-10 pr-12 w-full"
                                style={{ background: DEREK_INPUT_BG, borderColor: DEREK_INPUT_BORDER, color: "#e6edf3" }}
                                placeholder={derekInput ? "" : "Ask me anything here, I'll generate customized prompt in seconds…"}
                                value={derekInput}
                                onChange={(e) => setDerekInput(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") handleSendDerek() }}
                                disabled={derekBlocked}
                            />
                            {/* Floating placeholder icon */}
                            {!derekInput && (
                                <span className="pointer-events-none absolute right-12 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-40" style={{ color: DEREK_TEXT_DIM }}>
                                    <Cpu size={13} />
                                </span>
                            )}
                        </div>
                        <Button
                            size="icon"
                            className="absolute right-1 w-8 h-8 rounded flex items-center justify-center text-white"
                            style={{ background: derekBlocked ? "#374151" : DEREK_ACCENT }}
                            onClick={handleSendDerek}
                            disabled={derekBlocked}
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
                        <span className={cn("text-xs font-medium px-2 py-1 rounded-full")}
                            style={claudeBlocked
                                ? { background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" }
                                : { background: "rgba(108,99,255,0.1)", color: "#6c63ff", border: "1px solid rgba(108,99,255,0.3)" }
                            }>
                            {claudeBlocked ? "Limit reached" : `${FREE_LIMIT - pruneOld(getTimestamps(CLAUDE_TS_KEY)).length} free left`}
                        </span>
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

                {claudeBlocked && <CooldownBanner tsKey={CLAUDE_TS_KEY} color="#6c63ff" />}

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
                            disabled={claudeBlocked}
                        />
                        <Button
                            size="icon"
                            className="absolute right-1 w-8 h-8 rounded bg-accent text-white hover:bg-accent-hover flex items-center justify-center"
                            style={claudeBlocked ? { background: "#374151" } : {}}
                            onClick={handleSendClaude}
                            disabled={claudeBlocked}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
