"use client"

import * as React from "react"
import { Plus, Settings, X, Lightbulb, Loader2, FolderKanban, Trash2, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export const dynamic = 'force-dynamic'

// Preset project templates matching the reference UI
const PRESETS = [
  { label: "Investing",  emoji: "💲", color: "#22c55e" },
  { label: "Homework",   emoji: "🎓", color: "#3b82f6" },
  { label: "Writing",    emoji: "✏️",  color: "#8b5cf6" },
  { label: "Travel",     emoji: "✈️",  color: "#f59e0b" },
  { label: "Marketing",  emoji: "📢", color: "#ec4899" },
  { label: "Coding",     emoji: "💻", color: "#06b6d4" },
]

// ── Create Project Modal ──────────────────────────────────────────────────────
function CreateProjectModal({
  onClose,
  onCreate,
}: {
  onClose: () => void
  onCreate: (project: any) => void
}) {
  const [name, setName] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState("")

  const applyPreset = (preset: (typeof PRESETS)[0]) => {
    setName(preset.label)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          emoji: PRESETS.find(p => p.label === name)?.emoji || "📁",
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to create project")
      onCreate(data)
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-bg-panel border border-border w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-2">
          <h2 className="text-lg font-semibold text-text-primary">Create project</h2>
          <div className="flex items-center gap-2">
            <button className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors">
              <Settings size={18} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-5 pb-5 space-y-4">
          {/* Project name input */}
          <div>
            <label className="text-sm text-text-secondary mb-2 block">Project name</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg">🙂</span>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Enter project name (e.g., AI Study Buddy)"
                autoFocus
                className="w-full pl-10 pr-4 py-3 bg-bg-input border border-border rounded-xl text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent transition-colors"
              />
            </div>
          </div>

          {/* Preset pills */}
          <div className="flex flex-wrap gap-2">
            {PRESETS.map(preset => (
              <button
                key={preset.label}
                type="button"
                onClick={() => applyPreset(preset)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-all ${
                  name === preset.label
                    ? "border-accent bg-accent/15 text-text-primary"
                    : "border-border text-text-secondary hover:border-accent/40 hover:text-text-primary"
                }`}
                style={name === preset.label ? { borderColor: preset.color, color: preset.color, background: `${preset.color}15` } : {}}
              >
                <span>{preset.emoji}</span>
                <span>{preset.label}</span>
              </button>
            ))}
          </div>

          {/* Info box */}
          <div className="flex gap-3 bg-bg-input border border-border rounded-xl p-4">
            <Lightbulb size={20} className="shrink-0 mt-0.5" style={{ color: "#D97706" }} />
            <p className="text-xs text-text-secondary leading-relaxed">
              Projects keep chats, files, and custom instructions in one place. Use them for ongoing work, or just to keep things tidy.
            </p>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          {/* Submit */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!name.trim() || loading}
              className="px-6 py-2.5 rounded-full text-sm font-semibold text-white transition-all disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-hover))" }}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : "Create project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Project Row Item ──────────────────────────────────────────────────────────
function ProjectItem({ project, onDelete }: { project: any; onDelete: (id: string) => void }) {
  const router = useRouter()
  const [confirmDelete, setConfirmDelete] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirmDelete) { setConfirmDelete(true); return }
    setDeleting(true)
    try {
      await fetch(`/api/projects/${project._id}`, { method: "DELETE" })
      onDelete(project._id)
    } finally {
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  return (
    <div
      onClick={() => router.push(`/projects/${project._id}`)}
      className="group flex items-center gap-4 px-4 py-3.5 rounded-xl cursor-pointer transition-colors hover:bg-bg-hover"
    >
      {/* Emoji icon */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
        style={{ background: "rgba(255,77,0,0.10)", border: "1px solid rgba(255,77,0,0.20)" }}
      >
        {project.emoji || "📁"}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-text-primary text-sm truncate">{project.name}</p>
        <p className="text-xs text-text-secondary mt-0.5">
          {project.prompts?.length || 0} prompt{project.prompts?.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Delete / Arrow */}
      <div className="flex items-center gap-1">
        <button
          onClick={handleDelete}
          disabled={deleting}
          className={`p-1.5 rounded-lg transition-colors ${
            confirmDelete
              ? "bg-red-500/20 text-red-400"
              : "opacity-0 group-hover:opacity-100 text-text-secondary hover:text-red-400 hover:bg-red-500/10"
          }`}
          title={confirmDelete ? "Confirm delete" : "Delete"}
        >
          {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
        </button>
        <ChevronRight size={16} className="text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ProjectsPage() {
  const { data: session, status } = useSession()
  const [projects, setProjects] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [showCreate, setShowCreate] = React.useState(false)

  React.useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/projects")
        .then(r => r.json())
        .then(d => { if (Array.isArray(d)) setProjects(d) })
        .catch(console.error)
        .finally(() => setLoading(false))
    } else if (status === "unauthenticated") {
      setLoading(false)
    }
  }, [status])

  const handleCreate = (project: any) => setProjects(prev => [project, ...prev])
  const handleDelete = (id: string) => setProjects(prev => prev.filter(p => p._id !== id))

  // ── Unauthenticated ────────────────────────────────────────────────────────
  if (status === "unauthenticated") {
    return (
      <div className="flex flex-col h-full bg-bg-base items-center justify-center p-6">
        <div className="text-center max-w-xs">
          <div className="text-5xl mb-4">📁</div>
          <h2 className="text-xl font-bold text-text-primary mb-2">Sign in to use Projects</h2>
          <p className="text-text-secondary text-sm mb-6 leading-relaxed">
            Projects keep your chats, prompts, and instructions organised in one place.
          </p>
          <Link href="/login">
            <button
              className="px-8 py-2.5 rounded-full text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-hover))" }}
            >
              Sign In
            </button>
          </Link>
        </div>
      </div>
    )
  }

  // ── Main Layout ────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-bg-base overflow-y-auto">

      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-8 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Projects</h1>
          <p className="text-text-secondary text-sm mt-0.5">Organise your prompts into focused workspaces</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white transition-opacity hover:opacity-80"
          style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-hover))" }}
        >
          <Plus size={16} /> New Project
        </button>
      </div>

      {/* Project list */}
      <div className="flex-1 px-4 pb-10">
        {loading ? (
          <div className="space-y-2 px-2 pt-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-bg-panel animate-pulse" />
            ))}
          </div>
        ) : projects.length > 0 ? (
          <div className="space-y-1">
            {projects.map(project => (
              <ProjectItem key={project._id} project={project} onDelete={handleDelete} />
            ))}
          </div>
        ) : (
          /* ── Empty state matching the reference ── */
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            {/* Purple folder illustration */}
            <div className="relative">
              <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Sparkles */}
                <circle cx="18" cy="20" r="1.5" fill="#FF4D00" opacity="0.6" />
                <circle cx="62" cy="18" r="1.5" fill="#FF4D00" opacity="0.6" />
                <circle cx="14" cy="55" r="1" fill="#FF4D00" opacity="0.4" />
                <circle cx="67" cy="52" r="1" fill="#FF4D00" opacity="0.4" />
                {/* Stars */}
                <path d="M22 14 L23 17 L26 18 L23 19 L22 22 L21 19 L18 18 L21 17Z" fill="#FF4D00" opacity="0.5" />
                <path d="M58 58 L59 61 L62 62 L59 63 L58 66 L57 63 L54 62 L57 61Z" fill="#FF4D00" opacity="0.5" />
                {/* Folder body */}
                <rect x="12" y="28" width="56" height="38" rx="6" fill="#FF4D00" opacity="0.15" />
                <rect x="12" y="28" width="56" height="38" rx="6" stroke="#FF4D00" strokeWidth="2" />
                {/* Folder tab */}
                <path d="M12 28 Q12 23 17 23 L32 23 Q35 23 37 26 L39 28Z" fill="#FF4D00" opacity="0.15" />
                <path d="M12 28 Q12 23 17 23 L32 23 Q35 23 37 26 L39 28" stroke="#FF4D00" strokeWidth="2" strokeLinejoin="round" />
                {/* Chat bubble */}
                <rect x="26" y="38" width="28" height="18" rx="5" fill="#FF4D00" opacity="0.30" />
                <circle cx="33" cy="47" r="2" fill="#FF4D00" />
                <circle cx="40" cy="47" r="2" fill="#FF4D00" />
                <circle cx="47" cy="47" r="2" fill="#FF4D00" />
              </svg>
            </div>
            <div>
              <p className="text-text-primary font-semibold text-base mb-1">No projects yet</p>
              <p className="text-text-secondary text-sm">Create a project to get started</p>
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="mt-2 px-6 py-2.5 rounded-full text-sm font-semibold text-white transition-opacity hover:opacity-80"
              style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-hover))" }}
            >
              Create project
            </button>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <CreateProjectModal
          onClose={() => setShowCreate(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  )
}
