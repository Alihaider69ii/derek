import mongoose, { Schema, Document, Model } from "mongoose";

// Append-only audit trail for every admin-panel mutation — who, what, when.
export interface IAdminActivityLog extends Document {
    adminId: mongoose.Types.ObjectId;
    adminEmail: string;
    action: string;
    targetType?: string;
    targetId?: string;
    details?: string;
    ip?: string;
    createdAt: Date;
}

const AdminActivityLogSchema = new Schema<IAdminActivityLog>(
    {
        adminId: { type: Schema.Types.ObjectId, ref: "AdminUser", required: true },
        adminEmail: { type: String, required: true },
        action: { type: String, required: true },
        targetType: { type: String },
        targetId: { type: String },
        details: { type: String },
        ip: { type: String },
    },
    { timestamps: { createdAt: true, updatedAt: false } }
);

AdminActivityLogSchema.index({ createdAt: -1 });
AdminActivityLogSchema.index({ adminId: 1, createdAt: -1 });

export const AdminActivityLog: Model<IAdminActivityLog> =
    mongoose.models.AdminActivityLog ||
    mongoose.model<IAdminActivityLog>("AdminActivityLog", AdminActivityLogSchema);
