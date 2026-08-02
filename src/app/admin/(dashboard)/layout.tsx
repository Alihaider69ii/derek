import * as React from "react"
import { Suspense } from "react"
import { redirect } from "next/navigation"
import { getAdminSession } from "@/lib/adminSession"
import { AdminSidebar } from "@/components/layout/AdminSidebar"

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const adminSession = await getAdminSession()
    if (!adminSession) {
        redirect("/admin/login")
    }

    return (
        <div className="flex h-screen bg-bg-base overflow-hidden">
            <Suspense fallback={<div>Loading sidebar...</div>}>
                <AdminSidebar />
            </Suspense>

            <main className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto pt-14 md:pt-0">
                {children}
            </main>

            <style dangerouslySetInnerHTML={{
                __html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
        </div>
    )
}
