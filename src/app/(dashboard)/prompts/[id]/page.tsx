import { redirect, notFound } from "next/navigation"
import mongoose from "mongoose"
import connectToDatabase from "@/lib/db"
import { MarketplaceListing } from "@/lib/models/MarketplaceListing"
import { migratePromptBankIfNeeded } from "@/lib/promptBankMigration"
import { ensureListingSlug } from "@/lib/slug"

export const dynamic = "force-dynamic"

// Legacy Prompt Bank item URL. Prompt Bank was merged into the unified
// Marketplace — every prompt was migrated into MarketplaceListing with the
// same _id preserved, so this keeps resolving to the same content at its
// new public /[slug] URL instead of breaking old bookmarks/links.
export default async function LegacyPromptDetailRedirect({ params }: { params: { id: string } }) {
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
        notFound()
    }
    await connectToDatabase()
    await migratePromptBankIfNeeded()

    const listing = await MarketplaceListing.findById(params.id).select("_id slug title").lean()
    if (!listing) {
        notFound()
    }
    const slug = await ensureListingSlug(listing as any)
    redirect(`/${slug}`)
}
