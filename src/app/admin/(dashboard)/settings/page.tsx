"use client"

import * as React from "react"
import { Check, Loader2, Percent, AlertTriangle, ToggleLeft, KeyRound } from "lucide-react"

export const dynamic = "force-dynamic"

type Settings = {
    commissionPct: number
    maintenanceMode: boolean
    maintenanceMessage: string
    featureFlags: { signupsEnabled: boolean; marketplaceEnabled: boolean }
}

function SectionCard({
    icon, title, subtitle, children,
}: { icon: React.ReactNode; title: string; subtitle: string; children: React.ReactNode }) {
    return (
        <div className="rounded-card border border-border bg-bg-panel p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-accent/10 text-accent shrink-0">{icon}</div>
                <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
            </div>
            <p className="text-xs text-text-secondary mb-5">{subtitle}</p>
            {children}
        </div>
    )
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
    return (
        <button
            type="button"
            onClick={() => onChange(!checked)}
            className="flex items-center justify-between w-full py-2"
        >
            <span className="text-sm text-text-primary">{label}</span>
            <span className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${checked ? "bg-accent" : "bg-bg-hover border border-border"}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`} />
            </span>
        </button>
    )
}

export default function AdminSettingsPage() {
    const [settings, setSettings] = React.useState<Settings | null>(null)
    const [loading, setLoading] = React.useState(true)
    const [saving, setSaving] = React.useState(false)
    const [saved, setSaved] = React.useState(false)
    const [error, setError] = React.useState("")

    const [pwForm, setPwForm] = React.useState({ currentPassword: "", currentPassword2: "", newPassword: "", newPassword2: "" })
    const [pwSaving, setPwSaving] = React.useState(false)
    const [pwError, setPwError] = React.useState("")
    const [pwSaved, setPwSaved] = React.useState(false)

    React.useEffect(() => {
        fetch("/api/admin/settings")
            .then((r) => r.json())
            .then((data) => { if (!data?.error) setSettings(data) })
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    const save = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!settings) return
        setSaving(true)
        setError("")
        setSaved(false)
        try {
            const res = await fetch("/api/admin/settings", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(settings),
            })
            const data = await res.json()
            if (!res.ok) { setError(data?.error || "Something went wrong"); return }
            setSettings(data)
            setSaved(true)
        } finally {
            setSaving(false)
        }
    }

    const changePassword = async (e: React.FormEvent) => {
        e.preventDefault()
        setPwError("")
        setPwSaved(false)
        setPwSaving(true)
        try {
            const res = await fetch("/api/admin/settings/password", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(pwForm),
            })
            const data = await res.json()
            if (!res.ok) { setPwError(data?.error || "Something went wrong"); return }
            setPwSaved(true)
            setPwForm({ currentPassword: "", currentPassword2: "", newPassword: "", newPassword2: "" })
        } finally {
            setPwSaving(false)
        }
    }

    if (loading || !settings) {
        return (
            <div className="flex flex-col h-full bg-bg-base overflow-y-auto">
                <div className="px-4 sm:px-6 pt-6 sm:pt-8 pb-6">
                    <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
                </div>
                <div className="px-4 sm:px-6 pb-10 max-w-lg space-y-4">
                    {[...Array(3)].map((_, i) => <div key={i} className="h-40 rounded-card bg-bg-hover animate-pulse" />)}
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full bg-bg-base overflow-y-auto">
            <div className="px-4 sm:px-6 pt-6 sm:pt-8 pb-6">
                <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
                <p className="text-text-secondary text-sm mt-0.5">Platform-wide configuration</p>
            </div>

            <div className="px-4 sm:px-6 pb-10 max-w-lg space-y-4">
                <form onSubmit={save} className="space-y-4">
                    <SectionCard icon={<Percent size={16} />} title="Platform fee" subtitle="Commission taken from every sale before a seller can withdraw it.">
                        <div className="flex items-center gap-3">
                            <input
                                type="number" min={0} max={100} value={settings.commissionPct}
                                onChange={(e) => setSettings((s) => s && ({ ...s, commissionPct: Number(e.target.value) }))}
                                className="w-24 h-10 rounded-btn border border-border bg-bg-input px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30"
                            />
                            <span className="text-sm text-text-secondary">% commission — sellers keep {100 - settings.commissionPct}%</span>
                        </div>
                    </SectionCard>

                    <SectionCard icon={<AlertTriangle size={16} />} title="Maintenance mode" subtitle="Shows a site-wide banner and blocks new signups/purchases. Admin pages are never affected.">
                        <Toggle checked={settings.maintenanceMode} onChange={(v) => setSettings((s) => s && ({ ...s, maintenanceMode: v }))} label="Enable maintenance mode" />
                        <textarea
                            value={settings.maintenanceMessage}
                            onChange={(e) => setSettings((s) => s && ({ ...s, maintenanceMessage: e.target.value }))}
                            className="w-full mt-2 h-16 rounded-btn border border-border bg-bg-input px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30"
                        />
                    </SectionCard>

                    <SectionCard icon={<ToggleLeft size={16} />} title="Feature flags" subtitle="Turn off parts of the product without a deploy.">
                        <Toggle
                            checked={settings.featureFlags.signupsEnabled}
                            onChange={(v) => setSettings((s) => s && ({ ...s, featureFlags: { ...s.featureFlags, signupsEnabled: v } }))}
                            label="New email/password signups"
                        />
                        <Toggle
                            checked={settings.featureFlags.marketplaceEnabled}
                            onChange={(v) => setSettings((s) => s && ({ ...s, featureFlags: { ...s.featureFlags, marketplaceEnabled: v } }))}
                            label="Marketplace purchases"
                        />
                    </SectionCard>

                    {error && <p className="text-sm text-danger">{error}</p>}
                    {saved && <p className="text-sm text-success">Saved.</p>}
                    <button
                        type="submit" disabled={saving}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold text-white bg-accent hover:bg-accent-hover disabled:opacity-50 transition-colors"
                    >
                        {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                        Save changes
                    </button>
                </form>

                <SectionCard icon={<KeyRound size={16} />} title="Admin account" subtitle="Change your two login secrets. Both are required to verify your identity first.">
                    <form onSubmit={changePassword} className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-medium text-text-secondary">Current password</label>
                                <input
                                    type="password" value={pwForm.currentPassword}
                                    onChange={(e) => setPwForm((f) => ({ ...f, currentPassword: e.target.value }))}
                                    className="w-full mt-1 h-10 rounded-btn border border-border bg-bg-input px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-text-secondary">Current password 2</label>
                                <input
                                    type="password" value={pwForm.currentPassword2}
                                    onChange={(e) => setPwForm((f) => ({ ...f, currentPassword2: e.target.value }))}
                                    className="w-full mt-1 h-10 rounded-btn border border-border bg-bg-input px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-medium text-text-secondary">New password</label>
                                <input
                                    type="password" value={pwForm.newPassword}
                                    onChange={(e) => setPwForm((f) => ({ ...f, newPassword: e.target.value }))}
                                    className="w-full mt-1 h-10 rounded-btn border border-border bg-bg-input px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-text-secondary">New password 2</label>
                                <input
                                    type="password" value={pwForm.newPassword2}
                                    onChange={(e) => setPwForm((f) => ({ ...f, newPassword2: e.target.value }))}
                                    className="w-full mt-1 h-10 rounded-btn border border-border bg-bg-input px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30"
                                />
                            </div>
                        </div>
                        {pwError && <p className="text-sm text-danger">{pwError}</p>}
                        {pwSaved && <p className="text-sm text-success">Password changed.</p>}
                        <button
                            type="submit" disabled={pwSaving}
                            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold text-white bg-accent hover:bg-accent-hover disabled:opacity-50 transition-colors"
                        >
                            {pwSaving ? <Loader2 size={15} className="animate-spin" /> : <KeyRound size={15} />}
                            Change password
                        </button>
                    </form>
                </SectionCard>
            </div>
        </div>
    )
}
