import mongoose, { Schema, Document, Model } from "mongoose";

export type NotificationType = "prompt_approved" | "prompt_rejected";

export interface INotification extends Document {
    userId: mongoose.Types.ObjectId;
    type: NotificationType;
    title: string;
    message: string;
    listingId?: mongoose.Types.ObjectId;
    reason?: string; // set when type === "prompt_rejected"
    read: boolean;
    createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        type: { type: String, enum: ["prompt_approved", "prompt_rejected"], required: true },
        title: { type: String, required: true },
        message: { type: String, required: true },
        listingId: { type: Schema.Types.ObjectId, ref: "MarketplaceListing" },
        reason: { type: String },
        read: { type: Boolean, default: false },
    },
    { timestamps: true }
);

NotificationSchema.index({ userId: 1, createdAt: -1 });

export const Notification: Model<INotification> =
    mongoose.models.Notification || mongoose.model<INotification>("Notification", NotificationSchema);
