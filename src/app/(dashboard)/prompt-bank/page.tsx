import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

// Prompt Bank was merged into the unified Marketplace — official prompts
// now show up there (filterable, same as everything else) with an
// "Official" badge instead of living on their own separate page.
export default function LegacyPromptBankRedirect() {
    redirect("/marketplace")
}
