import mongoose, { Schema, Document, Model } from "mongoose";

export interface IListingSale {
    buyerId: mongoose.Types.ObjectId;
    price: number;
    purchasedAt: Date;
}

export interface IMarketplaceListing extends Document {
    sellerId: mongoose.Types.ObjectId;
    sellerName: string;
    favouriteId: mongoose.Types.ObjectId; // reference to the Favourite being sold
    title: string;
    description?: string;
    category?: string;
    models: string[]; // compatible AI models, e.g. Claude, GPT-4, Gemini, Grok
    promptText: string;   // stored in full; only revealed after purchase
    previewSnippet?: string; // teaser visible before purchase
    price: number;        // in INR, 0-1000 (0 = free)
    isFree: boolean;
    status: "draft" | "pending_review" | "live" | "rejected";
    rating?: number;       // 0-5, placeholder until a real review system exists
    buyers: mongoose.Types.ObjectId[]; // userIds who have purchased
    sales: IListingSale[]; // per-purchase record for revenue/earnings history
    createdAt: Date;
    updatedAt: Date;
}

const ListingSaleSchema = new Schema<IListingSale>(
    {
        buyerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        price: { type: Number, required: true },
        purchasedAt: { type: Date, default: Date.now },
    },
    { _id: false }
);

const MarketplaceListingSchema = new Schema<IMarketplaceListing>(
    {
        sellerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        sellerName: { type: String, required: true, default: "Anonymous" },
        favouriteId: { type: Schema.Types.ObjectId, ref: "Favourite", required: true },
        title: { type: String, required: true },
        description: { type: String },
        category: { type: String },
        models: { type: [String], default: [] },
        promptText: { type: String, required: true },
        previewSnippet: { type: String },
        price: { type: Number, required: true, min: 0, max: 1000 },
        isFree: { type: Boolean, default: false },
        status: { type: String, enum: ["draft", "pending_review", "live", "rejected"], default: "live" },
        rating: { type: Number, min: 0, max: 5 },
        buyers: [{ type: Schema.Types.ObjectId, ref: "User" }],
        sales: { type: [ListingSaleSchema], default: [] },
    },
    { timestamps: true }
);

export const MarketplaceListing: Model<IMarketplaceListing> =
    mongoose.models.MarketplaceListing ||
    mongoose.model<IMarketplaceListing>("MarketplaceListing", MarketplaceListingSchema);
