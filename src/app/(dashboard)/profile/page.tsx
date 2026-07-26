"use client"

import * as React from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export const dynamic = 'force-dynamic'

// /profile — redirects to the signed-in user's own profile page.
export default function OwnProfileRedirect() {
  const { data: session, status } = useSession()
  const router = useRouter()

  React.useEffect(() => {
    if (status === "unauthenticated") router.replace("/login")
    else if (status === "authenticated" && (session?.user as any)?.id) {
      router.replace(`/profile/${(session.user as any).id}`)
    }
  }, [status, session, router])

  return (
    <div className="flex h-full items-center justify-center bg-bg-base">
      <Loader2 size={24} className="animate-spin text-accent" />
    </div>
  )
}
