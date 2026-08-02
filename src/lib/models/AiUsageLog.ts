import mongoose, { Schema, Document, Model } from "mongoose";

// One entry per AI API call. userId is nullable — the chat is usable by
// guests (see SplitChat's guestMode), so not every call is attributable to
// a signed-in user.
export interface IAiUsageLog extends Document {
    userId?: mongoose.Types.ObjectId;
    userEmail?: string;
    feature: "derek" | "claude";
    aiModel: string;
    inputTokens: number;
    outputTokens: number;
    success: boolean;
    errorMessage?: string;
    createdAt: Date;
}

const AiUsageLogSchema = new Schema<IAiUsageLog>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User" },
        userEmail: { type: String },
        feature: { type: String, enum: ["derek", "claude"], required: true },
        aiModel: { type: String, required: true },
        inputTokens: { type: Number, default: 0 },
        outputTokens: { type: Number, default: 0 },
        success: { type: Boolean, default: true },
        errorMessage: { type: String },
    },
    { timestamps: { createdAt: true, updatedAt: false } }
);

AiUsageLogSchema.index({ createdAt: -1 });
AiUsageLogSchema.index({ userId: 1, createdAt: -1 });

export const AiUsageLog: Model<IAiUsageLog> =
    mongoose.models.AiUsageLog || mongoose.model<IAiUsageLog>("AiUsageLog", AiUsageLogSchema);
