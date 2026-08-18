import { Suspense } from "react"
import { notFound } from "next/navigation"
import connectToDatabase from "@/lib/db"
import { MarketplaceListing } from "@/lib/models/MarketplaceListing"
import { User } from "@/lib/models/User"
import { RESERVED_HANDLES } from "@/lib/slug"
import { AppSidebar } from "@/components/layout/AppSidebar"
import { PublicTopBar } from "@/components/layout/PublicTopBar"
import { ListingDetailView } from "@/components/marketplace/ListingDetailView"
import { ProfileView } from "@/components/profile/ProfileView"

export const dynamic = "force-dynamic"

// Root-level handle resolver: usernames (/[username]) and prompt slugs
// (/[prompt-slug]) both live at the site root, Instagram-style, so a single
// dynamic segment here decides which one `handle` refers to and renders the
// matching page. Named routes (marketplace, dashboard, login, etc.) always
// win over this dynamic segment in Next.js, so they never reach this file —
// the reserved-word check below just guards against stray/system paths.
export default async function HandlePage({ params }: { params: { handle: string } }) {
    const handle = params.handle

    if (RESERVED_HANDLES.has(handle)) {
        notFound()
    }

    await connectToDatabase()

    const listing = await MarketplaceListing.findOne({ slug: handle }).select("_id").lean()
    if (listing) {
        return (
            <div className="flex h-screen bg-bg-base overflow-hidden">
                <Suspense fallback={<div>Loading sidebar...</div>}>
                    <AppSidebar />
                </Suspense>
                <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden pt-14 md:pt-0">
                    <ListingDetailView id={(listing as any)._id.toString()} />
                </main>
            </div>
        )
    }

    const user = await User.findOne({ username: handle }).select("_id").lean()
    if (user) {
        return (
            <div className="flex flex-col min-h-screen bg-bg-base">
                <PublicTopBar />
                <ProfileView id={(user as any)._id.toString()} />
            </div>
        )
    }

    notFound()
}
