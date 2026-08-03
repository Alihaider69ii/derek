import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import { Payout } from "@/lib/models/Payout";
import { getSellerAvailableBalance } from "@/lib/sellerEarnings";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

// GET the signed-in seller's own payout requests, most recent first.
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
        await connectToDatabase();
        const sellerId = new mongoose.Types.ObjectId((session.user as any).id);
        const requests = await Payout.find({ sellerId }).sort({ createdAt: -1 }).limit(20).lean();
        return NextResponse.json(requests.map((p: any) => ({
            _id: p._id,
            amount: p.amount,
            status: p.status,
            adminNote: p.adminNote || null,
            createdAt: p.createdAt,
            processedAt: p.processedAt || null,
        })));
    } catch (error) {
        console.error("Seller Payout List Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// POST — request a withdrawal for up to the seller's current available balance.
export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
        const body = await request.json();
        const amount = Number(body?.amount);
        const payoutDetails = typeof body?.payoutDetails === "string" ? body.payoutDetails.trim().slice(0, 300) : "";

        if (!amount || amount <= 0) {
            return NextResponse.json({ error: "Enter a valid amount" }, { status: 400 });
        }
        if (!payoutDetails) {
            return NextResponse.json({ error: "Payout details (UPI ID or bank info) are required" }, { status: 400 });
        }

        const sellerId = new mongoose.Types.ObjectId((session.user as any).id);
        const { available } = await getSellerAvailableBalance(sellerId);
        if (amount > available) {
            return NextResponse.json({ error: `Amount exceeds available balance (₹${available})` }, { status: 400 });
        }

        const payout = await Payout.create({
            sellerId,
            sellerName: session.user.name || "Anonymous",
            sellerEmail: session.user.email || undefined,
            amount,
            payoutDetails,
            status: "pending",
        });

        return NextResponse.json({ success: true, payout }, { status: 201 });
    } catch (error) {
        console.error("Seller Payout Request Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
