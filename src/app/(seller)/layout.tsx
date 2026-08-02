import * as React from "react"
import { Suspense } from "react"
import { AppSidebar } from "@/components/layout/AppSidebar"

export default function SellerLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex h-screen bg-bg-base overflow-hidden">
            <Suspense fallback={<div>Loading sidebar...</div>}>
                <AppSidebar />
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
