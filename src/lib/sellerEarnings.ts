import mongoose from "mongoose";
import connectToDatabase from "@/lib/db";
import { MarketplaceListing } from "@/lib/models/MarketplaceListing";
import { Payout } from "@/lib/models/Payout";

// Available balance = lifetime sales revenue minus anything already claimed
// via a pending/approved/paid payout request (rejected requests don't count
// against the balance).
export async function getSellerAvailableBalance(sellerId: mongoose.Types.ObjectId) {
    await connectToDatabase();

    const listings = await MarketplaceListing.find({ sellerId }).select("sales buyers price").lean();
    let totalEarned = 0;
    for (const l of listings as any[]) {
        const sales = Array.isArray(l.sales) ? l.sales : [];
        if (sales.length > 0) {
            for (const s of sales) totalEarned += s.price;
        } else if (Array.isArray(l.buyers) && l.buyers.length > 0) {
            totalEarned += l.buyers.length * l.price;
        }
    }

    const [claimedAgg] = await Payout.aggregate([
        { $match: { sellerId, status: { $in: ["pending", "approved", "paid"] } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const alreadyClaimed = claimedAgg?.total || 0;

    return { totalEarned, alreadyClaimed, available: Math.max(0, totalEarned - alreadyClaimed) };
}
