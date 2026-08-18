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
    slug?: string; // unique handle powering the public /[slug] prompt URL
    title: string;
    description?: string;
    category?: string;
    models: string[]; // compatible AI models, e.g. Claude, GPT-4, Gemini, Grok
    outputType: "Text" | "Image" | "Video" | "Code" | "Audio" | "Other";
    promptText: string;   // stored in full; only revealed after purchase
    previewSnippet?: string; // teaser visible before purchase
    price: number;        // in INR, 0-1000 (0 = free)
    isFree: boolean;
    status: "draft" | "pending_review" | "live" | "rejected";
    featured: boolean;      // admin-curated highlight on homepage/marketplace
    rating?: number;       // 0-5, placeholder until a real review system exists
    buyers: mongoose.Types.ObjectId[]; // userIds who have purchased
    sales: IListingSale[]; // per-purchase record for revenue/earnings history
    // Official, platform-authored content (formerly the standalone "Prompt
    // Bank"), merged into the marketplace grid — free, attributed to the
    // "EaseMyPrompt" system seller, no purchase flow.
    isOfficial: boolean;
    emoji?: string;
    isMega?: boolean;
    sampleOutput?: string;
    tags?: string[];
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
        slug: { type: String, unique: true, sparse: true, index: true },
        title: { type: String, required: true },
        description: { type: String },
        category: { type: String },
        models: { type: [String], default: [] },
        outputType: { type: String, enum: ["Text", "Image", "Video", "Code", "Audio", "Other"], default: "Text" },
        // Not `required` — drafts are allowed to save with just a title, so
        // these are filled in incrementally as the wizard progresses. Only
        // required once a listing leaves draft status (enforced in the route).
        promptText: { type: String, default: "" },
        previewSnippet: { type: String },
        price: { type: Number, min: 0, max: 1000, default: 0 },
        isFree: { type: Boolean, default: false },
        status: { type: String, enum: ["draft", "pending_review", "live", "rejected"], default: "live" },
        featured: { type: Boolean, default: false },
        rating: { type: Number, min: 0, max: 5 },
        buyers: [{ type: Schema.Types.ObjectId, ref: "User" }],
        sales: { type: [ListingSaleSchema], default: [] },
        isOfficial: { type: Boolean, default: false },
        emoji: { type: String },
        isMega: { type: Boolean, default: false },
        sampleOutput: { type: String },
        tags: { type: [String], default: [] },
    },
    { timestamps: true }
);

export const MarketplaceListing: Model<IMarketplaceListing> =
    mongoose.models.MarketplaceListing ||
    mongoose.model<IMarketplaceListing>("MarketplaceListing", MarketplaceListingSchema);
