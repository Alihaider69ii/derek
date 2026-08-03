import mongoose, { Schema, Document, Model } from "mongoose";

export type PayoutStatus = "pending" | "approved" | "paid" | "rejected";

export interface IPayout extends Document {
    sellerId: mongoose.Types.ObjectId;
    sellerName?: string;
    sellerEmail?: string;
    amount: number;
    payoutDetails?: string; // seller-provided UPI/bank info snapshot at request time
    status: PayoutStatus;
    adminNote?: string;
    processedAt?: Date;
    processedBy?: string; // admin email
    createdAt: Date;
    updatedAt: Date;
}

const PayoutSchema = new Schema<IPayout>(
    {
        sellerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        sellerName: { type: String },
        sellerEmail: { type: String },
        amount: { type: Number, required: true, min: 1 },
        payoutDetails: { type: String },
        status: { type: String, enum: ["pending", "approved", "paid", "rejected"], default: "pending" },
        adminNote: { type: String },
        processedAt: { type: Date },
        processedBy: { type: String },
    },
    { timestamps: true }
);

PayoutSchema.index({ status: 1, createdAt: -1 });
PayoutSchema.index({ sellerId: 1, createdAt: -1 });

export const Payout: Model<IPayout> =
    mongoose.models.Payout || mongoose.model<IPayout>("Payout", PayoutSchema);
