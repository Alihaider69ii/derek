import mongoose, { Schema, Document, Model } from "mongoose";

// Singleton document (there is always exactly one) — platform-wide config
// the admin panel can change at runtime without a redeploy.
export interface IAdminSettings extends Document {
    commissionPct: number; // platform fee taken from seller earnings, 0-100
    maintenanceMode: boolean;
    maintenanceMessage: string;
    featureFlags: {
        signupsEnabled: boolean;
        marketplaceEnabled: boolean;
    };
    updatedBy?: string; // admin email
    updatedAt: Date;
}

const AdminSettingsSchema = new Schema<IAdminSettings>(
    {
        commissionPct: { type: Number, default: 20, min: 0, max: 100 },
        maintenanceMode: { type: Boolean, default: false },
        maintenanceMessage: { type: String, default: "We're down for scheduled maintenance — back shortly." },
        featureFlags: {
            signupsEnabled: { type: Boolean, default: true },
            marketplaceEnabled: { type: Boolean, default: true },
        },
        updatedBy: { type: String },
    },
    { timestamps: true }
);

export const AdminSettings: Model<IAdminSettings> =
    mongoose.models.AdminSettings || mongoose.model<IAdminSettings>("AdminSettings", AdminSettingsSchema);
