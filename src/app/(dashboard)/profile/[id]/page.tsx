import { redirect, notFound } from "next/navigation"
import mongoose from "mongoose"
import connectToDatabase from "@/lib/db"
import { User } from "@/lib/models/User"
import { ensureUserUsername } from "@/lib/slug"

export const dynamic = "force-dynamic"

// Legacy id-based URL — kept working by redirecting to the clean, public
// /[username] URL (see src/app/[handle]/page.tsx for the actual profile page).
export default async function LegacyProfileRedirect({ params }: { params: { id: string } }) {
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
        notFound()
    }
    await connectToDatabase()
    const user = await User.findById(params.id).select("_id username name").lean()
    if (!user) {
        notFound()
    }
    const username = await ensureUserUsername(user as any)
    redirect(`/${username}`)
}
