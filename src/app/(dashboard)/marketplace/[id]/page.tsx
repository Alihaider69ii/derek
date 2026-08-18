import { redirect, notFound } from "next/navigation"
import mongoose from "mongoose"
import connectToDatabase from "@/lib/db"
import { MarketplaceListing } from "@/lib/models/MarketplaceListing"
import { ensureListingSlug } from "@/lib/slug"

export const dynamic = "force-dynamic"

// Legacy id-based URL — kept working by redirecting to the clean, public
// /[slug] URL (see src/app/[handle]/page.tsx for the actual detail page).
export default async function LegacyMarketplaceDetailRedirect({ params }: { params: { id: string } }) {
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
        notFound()
    }
    await connectToDatabase()
    const listing = await MarketplaceListing.findById(params.id).select("_id slug title").lean()
    if (!listing) {
        notFound()
    }
    const slug = await ensureListingSlug(listing as any)
    redirect(`/${slug}`)
}
