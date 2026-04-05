"use client"

import * as React from "react"
import { ArrowLeft, Plus, Mic, BarChart2, Loader2, MessageSquare, ClipboardList, Trash2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export const dynamic = 'force-dynamic'

// ── Prompt item inside a project ──────────────────────────────────────────────
function PromptItem({
  prompt,
  onDelete,
}: {
  prompt: { label: string; promptText: string; order: number }
  onDelete: () => void
}) {
  const [confirm, setConfirm] = React.useState(false)

  return (
    <div className="group flex items-start gap-3 p-4 rounded-xl bg-bg-panel border border-border hover:border-[#6c63ff]/30 transition-colors">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: "rgba(108,99,255,0.12)" }}
      >
        <ClipboardList size={15} style={{ color: "#6c63ff" }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary truncate">{prompt.label}</p>
        <p className="text-xs text-text-secondary mt-1 line-clamp-2 leading-relaxed">{prompt.promptText}</p>
      </div>
      <button
        onClick={() => { if (!confirm) { setConfirm(true); return } onDelete() }}
        className={`p-1.5 rounded-lg transition-colors shrink-0 ${
          confirm
            ? "bg-red-500/20 text-red-400"
            : "opacity-0 group-hover:opacity-100 text-text-secondary hover:text-red-400 hover:bg-red-500/10"
        }`}
      >
        <Trash2 size={13} />
      </button>
    </div>
  )
}

// ── Add Prompt Modal ──────────────────────────────────────────────────────────
function AddPromptModal({
  onClose,
  onAdd,
}: {
  onClose: () => void
  onAdd: (label: string, promptText: string) => void
}) {
  const [label, setLabel] = React.useState("")
  const [promptText, setPromptText] = React.useState("")
  const [loading, setLoading] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!label.trim() || !promptText.trim()) return
    setLoading(true)
    onAdd(label.trim(), promptText.trim())
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-[#1a1a2e] border border-[#2a2a4a] w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 className="text-base font-semibold text-white">Add Prompt</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-text-secondary hover:text-white hover:bg-white/10">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 pb-5 space-y-3">
          <input
            type="text"
            value={label}
            onChange={e => setLabel(e.target.value)}
            placeholder="Prompt label (e.g. Cold email template)"
            autoFocus
            className="w-full px-4 py-3 bg-[#0d0d1a] border border-[#2a2a4a] rounded-xl text-sm text-white placeholder:text-text-secondary focus:outline-none focus:border-[#6c63ff]"
          />
          <textarea
            value={promptText}
            onChange={e => setPromptText(e.target.value)}
            placeholder="Enter your prompt text..."
            rows={5}
            className="w-full px-4 py-3 bg-[#0d0d1a] border border-[#2a2a4a] rounded-xl text-sm text-white placeholder:text-text-secondary focus:outline-none focus:border-[#6c63ff] resize-none"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!label.trim() || !promptText.trim() || loading}
              className="px-6 py-2.5 rounded-full text-sm font-semibold text-white disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, #6c63ff, #5a52e0)" }}
            >
              Add Prompt
            </button>
          </div>
        </form>
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
  const [showAddPrompt, setShowAddPrompt] = React.useState(false)
  const [savingPrompt, setSavingPrompt] = React.useState(false)

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

  const handleAddPrompt = async (label: string, promptText: string) => {
    setSavingPrompt(true)
    try {
      const newPrompts = [...(project.prompts || []), { label, promptText, order: project.prompts?.length || 0 }]
      const res = await fetch(`/api/projects/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompts: newPrompts }),
      })
      const updated = await res.json()
      setProject(updated)
    } catch (e) { console.error(e) }
    finally { setSavingPrompt(false) }
  }

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
    const text = encodeURIComponent(newChatInput)
    router.push(`/dashboard?prefillDerek=${text}`)
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex h-full bg-bg-base items-center justify-center">
        <Loader2 size={24} className="animate-spin text-[#6c63ff]" />
      </div>
    )
  }

  // ── Not found ──────────────────────────────────────────────────────────────
  if (notFound || !project) {
    return (
      <div className="flex flex-col h-full bg-bg-base items-center justify-center gap-4 p-6 text-center">
        <p className="text-4xl">📂</p>
        <h2 className="text-xl font-bold text-text-primary">Project not found</h2>
        <p className="text-text-secondary text-sm">This project may have been deleted or you don&apos;t have access.</p>
        <Link href="/projects">
          <button className="mt-2 px-5 py-2 rounded-full text-sm font-semibold text-white" style={{ background: "#6c63ff" }}>
            Back to Projects
          </button>
        </Link>
      </div>
    )
  }

  // ── Main ───────────────────────────────────────────────────────────────────
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

      {/* Project hero — emoji + name */}
      <div className="flex flex-col items-center pt-8 pb-6 px-4">
        {/* Large emoji circle */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4 border"
          style={{ background: "rgba(108,99,255,0.12)", borderColor: "rgba(108,99,255,0.25)" }}
        >
          {project.emoji || "📁"}
        </div>
        <h1 className="text-2xl font-bold text-text-primary text-center">{project.name}</h1>
        {project.description && (
          <p className="text-text-secondary text-sm mt-1 text-center max-w-xs">{project.description}</p>
        )}
      </div>

      {/* "New chat in X" input bar */}
      <div className="px-4 pb-5">
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-2xl border"
          style={{ background: "#161b22", borderColor: "#2a2a4a" }}
        >
          <button
            onClick={handleNewChat}
            className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 hover:opacity-80 transition-opacity"
            style={{ background: "rgba(108,99,255,0.2)", border: "1px solid rgba(108,99,255,0.3)" }}
          >
            <Plus size={14} style={{ color: "#6c63ff" }} />
          </button>
          <input
            type="text"
            value={newChatInput}
            onChange={e => setNewChatInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleNewChat() }}
            placeholder={`New chat in ${project.name}`}
            className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-secondary focus:outline-none"
          />
          <div className="flex items-center gap-2 text-text-secondary">
            <button className="hover:text-text-primary transition-colors" title="Voice input">
              <Mic size={17} />
            </button>
            <button className="hover:text-text-primary transition-colors" title="Advanced">
              <BarChart2 size={17} />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs: Chats | Prompts */}
      <div className="px-4 border-b border-border">
        <div className="flex gap-0">
          {(["chats", "prompts"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                activeTab === tab
                  ? "border-[#6c63ff] text-white"
                  : "border-transparent text-text-secondary hover:text-text-primary"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 px-4 py-6">

        {/* ── CHATS TAB ── */}
        {activeTab === "chats" && (
          <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
            {/* Purple animated folder icon */}
            <div className="relative">
              <svg width="72" height="72" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="22" cy="16" r="1.5" fill="#6c63ff" opacity="0.6" />
                <circle cx="60" cy="20" r="1.5" fill="#6c63ff" opacity="0.6" />
                <circle cx="14" cy="56" r="1" fill="#6c63ff" opacity="0.4" />
                <circle cx="67" cy="52" r="1" fill="#6c63ff" opacity="0.4" />
                <path d="M22 14 L23 17 L26 18 L23 19 L22 22 L21 19 L18 18 L21 17Z" fill="#6c63ff" opacity="0.6" />
                <path d="M60 56 L61 59 L64 60 L61 61 L60 64 L59 61 L56 60 L59 59Z" fill="#6c63ff" opacity="0.5" />
                <rect x="12" y="28" width="56" height="38" rx="6" fill="#6c63ff" opacity="0.12" />
                <rect x="12" y="28" width="56" height="38" rx="6" stroke="#6c63ff" strokeWidth="1.8" />
                <path d="M12 28 Q12 23 17 23 L32 23 Q35 23 37 26 L39 28Z" fill="#6c63ff" opacity="0.12" />
                <path d="M12 28 Q12 23 17 23 L32 23 Q35 23 37 26 L39 28" stroke="#6c63ff" strokeWidth="1.8" strokeLinejoin="round" />
                <rect x="26" y="37" width="28" height="20" rx="5" fill="#6c63ff" opacity="0.25" />
                <circle cx="33" cy="47" r="2" fill="#6c63ff" />
                <circle cx="40" cy="47" r="2" fill="#6c63ff" />
                <circle cx="47" cy="47" r="2" fill="#6c63ff" />
              </svg>
            </div>
            <div>
              <p className="text-text-primary font-semibold">No chats yet</p>
              <p className="text-text-secondary text-sm mt-1">Chats in {project.name} will live here</p>
            </div>
          </div>
        )}

        {/* ── PROMPTS TAB ── */}
        {activeTab === "prompts" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-text-secondary">
                {project.prompts?.length || 0} saved prompt{project.prompts?.length !== 1 ? "s" : ""}
              </p>
              <button
                onClick={() => setShowAddPrompt(true)}
                className="flex items-center gap-1.5 text-xs font-semibold text-[#6c63ff] hover:opacity-80 transition-opacity"
              >
                <Plus size={14} /> Add Prompt
              </button>
            </div>

            {project.prompts?.length > 0 ? (
              <div className="space-y-3">
                {project.prompts.map((p: any, i: number) => (
                  <PromptItem
                    key={i}
                    prompt={p}
                    onDelete={() => handleDeletePrompt(i)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: "rgba(108,99,255,0.12)", border: "1px solid rgba(108,99,255,0.2)" }}
                >
                  <ClipboardList size={22} style={{ color: "#6c63ff" }} />
                </div>
                <div>
                  <p className="text-text-primary font-semibold text-sm">No prompts yet</p>
                  <p className="text-text-secondary text-xs mt-1">Save reusable prompts to this project</p>
                </div>
                <button
                  onClick={() => setShowAddPrompt(true)}
                  className="mt-1 px-5 py-2 rounded-full text-sm font-semibold text-white"
                  style={{ background: "linear-gradient(135deg, #6c63ff, #5a52e0)" }}
                >
                  Add first prompt
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Prompt Modal */}
      {showAddPrompt && (
        <AddPromptModal
          onClose={() => setShowAddPrompt(false)}
          onAdd={handleAddPrompt}
        />
      )}
    </div>
  )
}
