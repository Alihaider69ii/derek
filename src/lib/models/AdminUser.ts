import mongoose, { Schema, Document, Model } from "mongoose";

// Fully separate from the regular User model / NextAuth. Requires TWO
// independent password secrets — both must verify for login to succeed.
export interface IAdminUser extends Document {
    email: string;
    passwordHash: string;
    password2Hash: string;
    name?: string;
    lastLoginAt?: Date;
    createdAt: Date;
}

const AdminUserSchema = new Schema<IAdminUser>(
    {
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        passwordHash: { type: String, required: true },
        password2Hash: { type: String, required: true },
        name: { type: String },
        lastLoginAt: { type: Date },
    },
    { timestamps: true }
);

export const AdminUser: Model<IAdminUser> =
    mongoose.models.AdminUser || mongoose.model<IAdminUser>("AdminUser", AdminUserSchema);
