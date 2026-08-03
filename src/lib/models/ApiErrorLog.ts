import mongoose, { Schema, Document, Model } from "mongoose";

// Best-effort capture of server-side failures across key API routes — not
// exhaustive (see logApiError for which routes are wired up).
export interface IApiErrorLog extends Document {
    route: string;
    message: string;
    stack?: string;
    createdAt: Date;
}

const ApiErrorLogSchema = new Schema<IApiErrorLog>(
    {
        route: { type: String, required: true },
        message: { type: String, required: true },
        stack: { type: String },
    },
    { timestamps: { createdAt: true, updatedAt: false } }
);

ApiErrorLogSchema.index({ createdAt: -1 });

export const ApiErrorLog: Model<IApiErrorLog> =
    mongoose.models.ApiErrorLog || mongoose.model<IApiErrorLog>("ApiErrorLog", ApiErrorLogSchema);
