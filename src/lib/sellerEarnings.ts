import mongoose from "mongoose";
import connectToDatabase from "@/lib/db";
import { MarketplaceListing } from "@/lib/models/MarketplaceListing";
import { Payout } from "@/lib/models/Payout";
import { getAdminSettings } from "@/lib/adminSettings";

// Sellers are paid gross sale price minus the platform commission (admin-
// configurable, see /admin/settings). "Total revenue" figures shown to
// admins elsewhere (overview, marketplace, sales CSV) stay gross — they're
// a record of what buyers actually paid, not what the seller nets.
export async function getCommissionNetFactor(): Promise<number> {
    const settings = await getAdminSettings();
    return 1 - settings.commissionPct / 100;
}

// Available balance = lifetime net earnings (after commission) minus
// anything already claimed via a pending/approved/paid payout request
// (rejected requests don't count against the balance).
export async function getSellerAvailableBalance(sellerId: mongoose.Types.ObjectId) {
    await connectToDatabase();

    const [listings, netFactor] = await Promise.all([
        MarketplaceListing.find({ sellerId }).select("sales buyers price").lean(),
        getCommissionNetFactor(),
    ]);
    let grossEarned = 0;
    for (const l of listings as any[]) {
        const sales = Array.isArray(l.sales) ? l.sales : [];
        if (sales.length > 0) {
            for (const s of sales) grossEarned += s.price;
        } else if (Array.isArray(l.buyers) && l.buyers.length > 0) {
            grossEarned += l.buyers.length * l.price;
        }
    }
    const totalEarned = Math.round(grossEarned * netFactor);

    const [claimedAgg] = await Payout.aggregate([
        { $match: { sellerId, status: { $in: ["pending", "approved", "paid"] } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const alreadyClaimed = claimedAgg?.total || 0;

    return { totalEarned, alreadyClaimed, available: Math.max(0, totalEarned - alreadyClaimed) };
}
