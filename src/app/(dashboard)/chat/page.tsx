import { Suspense } from "react"
import { SplitChat } from "@/components/shared/SplitChat"

export const dynamic = 'force-dynamic'

export default function ChatPage() {
    return (
        <div className="flex flex-col h-full bg-bg-base overflow-hidden">
            <div className="flex-1 min-h-0 p-4">
                <Suspense fallback={<div>Loading...</div>}>
                    <SplitChat />
                </Suspense>
            </div>
        </div>
    )
}
