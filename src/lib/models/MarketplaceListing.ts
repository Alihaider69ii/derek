import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMarketplaceListing extends Document {
    sellerId: mongoose.Types.ObjectId;
    sellerName: string;
    favouriteId: mongoose.Types.ObjectId; // reference to the Favourite being sold
    title: string;
    promptText: string;   // stored in full; only revealed after purchase
    price: number;        // in INR, 1–1000
    buyers: mongoose.Types.ObjectId[]; // userIds who have purchased
    createdAt: Date;
    updatedAt: Date;
}

const MarketplaceListingSchema = new Schema<IMarketplaceListing>(
    {
        sellerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        sellerName: { type: String, required: true, default: "Anonymous" },
        favouriteId: { type: Schema.Types.ObjectId, ref: "Favourite", required: true },
        title: { type: String, required: true },
        promptText: { type: String, required: true },
        price: { type: Number, required: true, min: 1, max: 1000 },
        buyers: [{ type: Schema.Types.ObjectId, ref: "User" }],
    },
    { timestamps: true }
);

export const MarketplaceListing: Model<IMarketplaceListing> =
    mongoose.models.MarketplaceListing ||
    mongoose.model<IMarketplaceListing>("MarketplaceListing", MarketplaceListingSchema);
