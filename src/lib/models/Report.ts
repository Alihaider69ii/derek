import mongoose, { Schema, Document, Model } from "mongoose";

export type ReportReason = "spam" | "inappropriate" | "copyright" | "misleading" | "other";
export type ReportStatus = "open" | "dismissed" | "actioned";

export interface IReport extends Document {
    listingId: mongoose.Types.ObjectId;
    listingTitle: string; // snapshot at report time, survives listing deletion
    reporterId: mongoose.Types.ObjectId;
    reporterName?: string;
    reason: ReportReason;
    details?: string;
    status: ReportStatus;
    reviewedAt?: Date;
    reviewedBy?: string; // admin email
    createdAt: Date;
}

const ReportSchema = new Schema<IReport>(
    {
        listingId: { type: Schema.Types.ObjectId, ref: "MarketplaceListing", required: true },
        listingTitle: { type: String, required: true },
        reporterId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        reporterName: { type: String },
        reason: { type: String, enum: ["spam", "inappropriate", "copyright", "misleading", "other"], required: true },
        details: { type: String },
        status: { type: String, enum: ["open", "dismissed", "actioned"], default: "open" },
        reviewedAt: { type: Date },
        reviewedBy: { type: String },
    },
    { timestamps: { createdAt: true, updatedAt: false } }
);

ReportSchema.index({ status: 1, createdAt: -1 });
ReportSchema.index({ listingId: 1, reporterId: 1 });

export const Report: Model<IReport> =
    mongoose.models.Report || mongoose.model<IReport>("Report", ReportSchema);
