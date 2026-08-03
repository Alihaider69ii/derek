import mongoose, { Schema, Document, Model } from "mongoose";

// One doc per unique visitor session (deduped client-side via cookie) — the
// "visitors" stage of the admin conversion funnel. Started tracking in
// Phase 6, so historical traffic before this isn't represented.
export interface IVisit extends Document {
    visitorId: string;
    createdAt: Date;
}

const VisitSchema = new Schema<IVisit>(
    { visitorId: { type: String, required: true, index: true } },
    { timestamps: { createdAt: true, updatedAt: false } }
);

VisitSchema.index({ createdAt: -1 });

export const Visit: Model<IVisit> =
    mongoose.models.Visit || mongoose.model<IVisit>("Visit", VisitSchema);
