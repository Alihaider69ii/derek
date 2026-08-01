import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import { MarketplaceListing } from "@/lib/models/MarketplaceListing";
import { Notification } from "@/lib/models/Notification";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

type ActivityItem = {
    id: string;
    type: "listed" | "sale" | "approved" | "rejected";
    message: string;
    date: string;
};

// GET /api/dashboard/activity — last 5 events across the seller's listings:
// prompts created, sales, and admin approve/reject notifications.
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        await connectToDatabase();
        const sellerId = new mongoose.Types.ObjectId((session.user as any).id);

        const [listings, notifications] = await Promise.all([
            MarketplaceListing.find({ sellerId }).select("title status createdAt sales").lean(),
            Notification.find({ userId: sellerId }).sort({ createdAt: -1 }).limit(10).lean(),
        ]);

        const items: ActivityItem[] = [];

        for (const l of listings as any[]) {
            items.push({
                id: `listed-${l._id}`,
                type: "listed",
                message: `"${l.title}" was ${l.status === "draft" ? "saved as a draft" : "submitted"}`,
                date: l.createdAt,
            });
            for (const s of l.sales || []) {
                items.push({
                    id: `sale-${l._id}-${s.purchasedAt}`,
                    type: "sale",
                    message: `"${l.title}" sold for ₹${s.price}`,
                    date: s.purchasedAt,
                });
            }
        }

        for (const n of notifications as any[]) {
            items.push({
                id: `notif-${n._id}`,
                type: n.type === "prompt_approved" ? "approved" : "rejected",
                message: n.title,
                date: n.createdAt,
            });
        }

        items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return NextResponse.json(items.slice(0, 5));
    } catch (error) {
        console.error("Dashboard Activity Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
