"use client"

import * as React from "react"
import { ArrowLeft, Loader2, MessageSquare, ClipboardList, Trash2, ChevronRight, Star, Check, Copy } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export const dynamic = 'force-dynamic'

// ── Prompt item inside a project ──────────────────────────────────────────────
function PromptItem({
  prompt,
  onDelete,
  onFavourite,
}: {
  prompt: { label: string; promptText: string; order: number }
  onDelete: () => void
  onFavourite: () => void
}) {
  const [confirm, setConfirm] = React.useState(false)
  const [copied, setCopied] = React.useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt.promptText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="group flex flex-col gap-3 p-4 rounded-xl bg-bg-panel border border-border hover:border-[#6c63ff]/30 transition-colors">
      <div className="flex items-start gap-3 w-full">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: "rgba(108,99,255,0.12)" }}>
          <ClipboardList size={15} style={{ color: "#6c63ff" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-primary truncate">{prompt.label}</p>
          <p className="text-xs text-text-secondary mt-1 line-clamp-2 leading-relaxed">{prompt.promptText}</p>
        </div>
        <button
          onClick={() => { if (!confirm) { setConfirm(true); return } onDelete() }}
          className={`p-1.5 rounded-lg transition-colors shrink-0 ${confirm ? "bg-red-500/20 text-red-400" : "opacity-0 group-hover:opacity-100 text-text-secondary hover:text-red-400 hover:bg-red-500/10"}`}
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1 border-t border-border">
        <button onClick={handleCopy} className="flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary transition-colors px-2 py-1 rounded-lg hover:bg-white/5">
          {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
          {copied ? "Copied" : "Copy"}
        </button>
        <button onClick={onFavourite} className="flex items-center gap-1 text-xs text-text-secondary hover:text-yellow-400 transition-colors px-2 py-1 rounded-lg hover:bg-yellow-400/5">
          <Star size={12} /> Add to Favourites
        </button>
      </div>
    </div>
  )
}

// ── Favourite Title Modal ─────────────────────────────────────────────────────
function FavModal({ prompt, onClose }: { prompt: any; onClose: () => void }) {
  const [title, setTitle] = React.useState(prompt?.label || "")
  const [loading, setLoading] = React.useState(false)
  const [done, setDone] = React.useState(false)

  const handleSave = async () => {
    if (!title.trim()) return
    setLoading(true)
    try {
      await fetch("/api/favourites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), promptText: prompt.promptText, source: "generated" }),
      })
      setDone(true)
      setTimeout(() => onClose(), 900)
    } catch { }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-[#1a1a2e] border border-[#2a2a4a] w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-[#2a2a4a]">
          <h2 className="text-base font-bold text-white flex items-center gap-2"><Star size={15} className="text-yellow-400 fill-yellow-400" /> Add to Favourites</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[#8b949e] hover:text-white hover:bg-white/10">✕</button>
        </div>
        <div className="p-5 space-y-4">
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => { if (e.key === "Enter") handleSave() }}
            placeholder="Give this prompt a title…" autoFocus
            className="w-full px-4 py-3 bg-[#0d0d1a] border border-[#2a2a4a] rounded-xl text-sm text-white placeholder:text-[#8b949e] focus:outline-none focus:border-[#6c63ff]" />
          <button onClick={handleSave} disabled={!title.trim() || loading || done}
            className="w-full py-3 rounded-full text-sm font-bold text-white disabled:opacity-40 hover:opacity-80"
            style={{ background: done ? "linear-gradient(135deg,#22c55e,#16a34a)" : "linear-gradient(135deg,#6c63ff,#5a52e0)" }}>
            {done ? "✓ Saved!" : loading ? "Saving..." : "Save to Favourites"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Project Detail Page ───────────────────────────────────────────────────
export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [project, setProject] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)
  const [notFound, setNotFound] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState<"chats" | "prompts">("chats")
  const [newChatInput, setNewChatInput] = React.useState("")
  const [chats, setChats] = React.useState<any[]>([])
  const [loadingChats, setLoadingChats] = React.useState(true)
  const [favPrompt, setFavPrompt] = React.useState<any>(null)

  React.useEffect(() => {
    fetch(`/api/projects/${params.id}`)
      .then(res => {
        if (res.status === 401 || res.status === 404) { setNotFound(true); return null }
        return res.json()
      })
      .then(data => { if (data) setProject(data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [params.id])

  React.useEffect(() => {
    if (project) {
      fetch(`/api/projects/${params.id}/chats`)
        .then(res => res.json())
        .then(data => setChats(Array.isArray(data) ? data : []))
        .catch(console.error)
        .finally(() => setLoadingChats(false))
    }
  }, [project, params.id])

  const handleDeletePrompt = async (index: number) => {
    const newPrompts = project.prompts.filter((_: any, i: number) => i !== index)
    try {
      const res = await fetch(`/api/projects/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompts: newPrompts }),
      })
      const updated = await res.json()
      setProject(updated)
    } catch (e) { console.error(e) }
  }

  const handleNewChat = () => {
    if (!newChatInput.trim()) return
    router.push(`/dashboard?prefillDerek=${encodeURIComponent(newChatInput)}&projectId=${params.id}`)
  }

  if (loading) return <div className="flex h-full bg-bg-base items-center justify-center"><Loader2 size={24} className="animate-spin text-[#6c63ff]" /></div>

  if (notFound || !project) {
    return (
      <div className="flex flex-col h-full bg-bg-base items-center justify-center gap-4 p-6 text-center">
        <p className="text-4xl">📂</p>
        <h2 className="text-xl font-bold text-text-primary">Project not found</h2>
        <p className="text-text-secondary text-sm">This project may have been deleted or you don&apos;t have access.</p>
        <Link href="/projects"><button className="mt-2 px-5 py-2 rounded-full text-sm font-semibold text-white" style={{ background: "#6c63ff" }}>Back to Projects</button></Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-bg-base overflow-y-auto">
      {/* Back arrow */}
      <div className="px-4 pt-4">
        <Link href="/projects">
          <button className="flex items-center gap-1.5 text-text-secondary hover:text-text-primary transition-colors text-sm">
            <ArrowLeft size={15} /> Projects
          </button>
        </Link>
      </div>

      {/* Project hero */}
      <div className="flex flex-col items-center pt-8 pb-6 px-4">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4 border" style={{ background: "rgba(108,99,255,0.12)", borderColor: "rgba(108,99,255,0.25)" }}>
          {project.emoji || "📁"}
        </div>
        <h1 className="text-2xl font-bold text-text-primary text-center">{project.name}</h1>
        {project.description && <p className="text-text-secondary text-sm mt-1 text-center max-w-xs">{project.description}</p>}
      </div>

      {/* New chat bar */}
      <div className="px-4 pb-5">
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border" style={{ background: "#161b22", borderColor: "#2a2a4a" }}>
          <button onClick={handleNewChat} className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 hover:opacity-80" style={{ background: "rgba(108,99,255,0.2)", border: "1px solid rgba(108,99,255,0.3)" }}>
            <span style={{ color: "#6c63ff", fontSize: 18, lineHeight: 1 }}>+</span>
          </button>
          <input type="text" value={newChatInput} onChange={e => setNewChatInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleNewChat() }}
            placeholder={`New chat in ${project.name}`}
            className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-secondary focus:outline-none" />
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 border-b border-border">
        <div className="flex gap-0">
          {(["chats", "prompts"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${activeTab === tab ? "border-[#6c63ff] text-white" : "border-transparent text-text-secondary hover:text-text-primary"}`}>
              {tab === "prompts" ? `Prompts (${project.prompts?.length || 0})` : "Chats"}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 px-4 py-6">

        {/* CHATS TAB */}
        {activeTab === "chats" && (
          <div>
            {loadingChats ? (
              <div className="flex justify-center py-10"><Loader2 className="animate-spin text-[#6c63ff]" /></div>
            ) : chats.length > 0 ? (
              <div className="space-y-3">
                {chats.map(chat => (
                  <Link key={chat._id} href={`/dashboard?id=${chat._id}&projectId=${params.id}`}>
                    <div className="group p-4 bg-bg-panel border border-border rounded-xl hover:border-[#6c63ff]/50 transition-colors flex items-center justify-between mb-3">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-[#6c63ff]/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          <MessageSquare size={18} className="text-[#6c63ff]" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-text-primary text-sm group-hover:text-[#6c63ff] transition-colors">{chat.title}</h3>
                          <p className="text-xs text-text-secondary mt-1">{new Date(chat.updatedAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                <svg width="72" height="72" viewBox="0 0 80 80" fill="none">
                  <circle cx="22" cy="16" r="1.5" fill="#6c63ff" opacity="0.6" /><circle cx="60" cy="20" r="1.5" fill="#6c63ff" opacity="0.6" />
                  <rect x="12" y="28" width="56" height="38" rx="6" fill="#6c63ff" opacity="0.12" />
                  <rect x="12" y="28" width="56" height="38" rx="6" stroke="#6c63ff" strokeWidth="1.8" />
                  <circle cx="33" cy="47" r="2" fill="#6c63ff" /><circle cx="40" cy="47" r="2" fill="#6c63ff" /><circle cx="47" cy="47" r="2" fill="#6c63ff" />
                </svg>
                <div><p className="text-text-primary font-semibold">No chats yet</p><p className="text-text-secondary text-sm mt-1">Chats in {project.name} will live here</p></div>
              </div>
            )}
          </div>
        )}

        {/* PROMPTS TAB */}
        {activeTab === "prompts" && (
          <div className="pb-10">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-text-secondary">{project.prompts?.length || 0} Derek-generated prompt{project.prompts?.length !== 1 ? "s" : ""}</p>
            </div>
            <div className="mb-4 flex items-start gap-3 bg-[#161b22] border border-[#2a2a4a] rounded-xl p-4">
              <span className="text-xl">💡</span>
              <p className="text-xs text-[#8b949e] leading-relaxed">
                Prompts are saved here when you click <strong className="text-white">Save to Project</strong> on Derek&apos;s messages in the chat. Start a new chat above to generate prompts!
              </p>
            </div>

            {project.prompts?.length > 0 ? (
              <div className="space-y-3">
                {project.prompts.map((p: any, i: number) => (
                  <PromptItem
                    key={i}
                    prompt={p}
                    onDelete={() => handleDeletePrompt(i)}
                    onFavourite={() => setFavPrompt(p)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(108,99,255,0.12)", border: "1px solid rgba(108,99,255,0.2)" }}>
                  <ClipboardList size={22} style={{ color: "#6c63ff" }} />
                </div>
                <div>
                  <p className="text-text-primary font-semibold text-sm">No prompts yet</p>
                  <p className="text-text-secondary text-xs mt-1">Use Derek&apos;s chat above and click &quot;Save to Project&quot; on responses</p>
                </div>
                <button onClick={() => { setNewChatInput("Help me with " + project.name); setActiveTab("chats") }}
                  className="mt-1 px-5 py-2 rounded-full text-sm font-semibold text-white" style={{ background: "linear-gradient(135deg,#6c63ff,#5a52e0)" }}>
                  Start a Chat
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Favourite Modal */}
      {favPrompt && <FavModal prompt={favPrompt} onClose={() => setFavPrompt(null)} />}
    </div>
  )
}
