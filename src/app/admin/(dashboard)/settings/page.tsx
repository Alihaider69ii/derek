"use client"

import * as React from "react"
import { Check, Loader2, ShieldCheck } from "lucide-react"

export const dynamic = "force-dynamic"

type PlatformSettings = {
    siteName: string
    supportEmail: string
    payoutThreshold: number
}

const DEFAULT_SETTINGS: PlatformSettings = {
    siteName: "EaseMyPrompt.ai",
    supportEmail: "support@easemyprompt.ai",
    payoutThreshold: 1000,
}

export default function AdminSettingsPage() {
    const [settings, setSettings] = React.useState<PlatformSettings>(DEFAULT_SETTINGS)
    const [saved, setSaved] = React.useState(false)
    const [saving, setSaving] = React.useState(false)

    const save = (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setSaved(false)
        // No backend-configurable settings table exists yet — this persists
        // locally so the admin's changes survive a refresh in the meantime.
        window.localStorage.setItem("admin-platform-settings", JSON.stringify(settings))
        setTimeout(() => {
            setSaving(false)
            setSaved(true)
        }, 400)
    }

    React.useEffect(() => {
        const raw = window.localStorage.getItem("admin-platform-settings")
        if (raw) {
            try { setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(raw) }) } catch { }
        }
    }, [])

    return (
        <div className="flex flex-col h-full bg-bg-base overflow-y-auto">
            <div className="px-4 sm:px-6 pt-6 sm:pt-8 pb-6">
                <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
                <p className="text-text-secondary text-sm mt-0.5">Platform-wide configuration</p>
            </div>

            <div className="px-4 sm:px-6 pb-10">
                <div className="max-w-lg rounded-card border border-border bg-bg-panel p-5 sm:p-6">
                    <div className="flex items-center gap-2 mb-5">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-accent/10 text-accent">
                            <ShieldCheck size={16} />
                        </div>
                        <h3 className="text-sm font-semibold text-text-primary">General</h3>
                    </div>

                    <form onSubmit={save} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-text-primary">Site name</label>
                            <input
                                value={settings.siteName}
                                onChange={e => setSettings(s => ({ ...s, siteName: e.target.value }))}
                                className="w-full h-10 rounded-btn border border-border bg-bg-input px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-text-primary">Support email</label>
                            <input
                                type="email"
                                value={settings.supportEmail}
                                onChange={e => setSettings(s => ({ ...s, supportEmail: e.target.value }))}
                                className="w-full h-10 rounded-btn border border-border bg-bg-input px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-text-primary">Minimum payout threshold (₹)</label>
                            <input
                                type="number"
                                min={0}
                                value={settings.payoutThreshold}
                                onChange={e => setSettings(s => ({ ...s, payoutThreshold: Number(e.target.value) }))}
                                className="w-full h-10 rounded-btn border border-border bg-bg-input px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30"
                            />
                        </div>

                        {saved && <p className="text-sm text-success">Saved.</p>}
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold text-white bg-accent hover:bg-accent-hover disabled:opacity-50 transition-colors"
                        >
                            {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                            Save changes
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
