"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface FreeTierModalProps {
    isOpen: boolean;
    onClose: () => void;
    isGuest?: boolean; // true = not logged in (2 free limit), false = logged in (3hr cooldown)
}

export function FreeTierModal({ isOpen, onClose, isGuest = true }: FreeTierModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            <div className="relative bg-bg-panel border border-border rounded-card p-8 max-w-[420px] w-full mx-4 shadow-xl animate-in slide-in-from-bottom-4 fade-in duration-200">
                {/* Accent top bar */}
                <div className="absolute top-0 left-0 w-full h-1 rounded-t-card bg-gradient-to-r from-accent to-accent-hover" />

                {isGuest ? (
                    <>
                        <div className="text-3xl mb-3">🔒</div>
                        <h2 className="text-xl font-semibold text-text-primary mb-2">
                            You've used your 2 free chats
                        </h2>
                        <p className="text-text-secondary mb-2 text-sm leading-relaxed">
                            Guest users get <strong className="text-text-primary">2 free chats</strong> per session with Derek and Claude.
                        </p>
                        <p className="text-text-secondary mb-6 text-sm leading-relaxed">
                            Sign up for free to unlock <strong className="text-text-primary">3 chats every 3 hours</strong> and access your entire chat history.
                        </p>
                        <div className="flex gap-3">
                            <Link href="/signup" className="flex-1">
                                <Button className="w-full">Sign Up Free</Button>
                            </Link>
                            <Link href="/login" className="flex-1">
                                <Button variant="outline" className="w-full">Login</Button>
                            </Link>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="text-3xl mb-3">⏳</div>
                        <h2 className="text-xl font-semibold text-text-primary mb-2">
                            3 chats used — come back soon!
                        </h2>
                        <p className="text-text-secondary mb-6 text-sm leading-relaxed">
                            You've used your <strong className="text-text-primary">3 free chats</strong> for this window.
                            Your next 3 chats will unlock automatically in <strong className="text-text-primary">3 hours</strong>.
                            Check back later! 🚀
                        </p>
                        <Button onClick={onClose} className="w-full">Got it</Button>
                    </>
                )}
            </div>
        </div>
    )
}
