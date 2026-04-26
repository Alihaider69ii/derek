import mongoose, { Schema, Document, Model } from "mongoose";

export interface IFavourite extends Document {
    userId: mongoose.Types.ObjectId;
    title: string;          // user-given title
    promptText: string;     // actual prompt content
    source: "bank" | "generated"; // "bank" = from Prompt Bank, "generated" = from Derek chat
    sourceId?: string;      // optional: original prompt bank id
    createdAt: Date;
    updatedAt: Date;
}

const FavouriteSchema = new Schema<IFavourite>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        title: { type: String, required: true },
        promptText: { type: String, required: true },
        source: { type: String, enum: ["bank", "generated"], required: true },
        sourceId: { type: String },
    },
    { timestamps: true }
);

export const Favourite: Model<IFavourite> =
    mongoose.models.Favourite || mongoose.model<IFavourite>("Favourite", FavouriteSchema);
