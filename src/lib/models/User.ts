import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPromptForSale {
    projectId: mongoose.Types.ObjectId;
    promptIndex: number;
    label: string;
    promptText: string;
    submittedAt: Date;
}

export interface IUser extends Document {
    email: string;
    password?: string;
    name?: string;
    image?: string;
    bio?: string;
    emailVerified?: Date;
    plan: "Free" | "Pro";
    trialUses: number;
    promptsForSale: IPromptForSale[]; // prompts user wants to sell
    role: "user" | "admin";
    suspended: boolean;
    lastActiveAt?: Date;
    createdAt: Date;
}

const PromptForSaleSchema = new Schema<IPromptForSale>(
    {
        projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
        promptIndex: { type: Number, required: true },
        label: { type: String, required: true },
        promptText: { type: String, required: true },
        submittedAt: { type: Date, default: Date.now },
    },
    { _id: false }
);

const UserSchema = new Schema<IUser>(
    {
        email: { type: String, required: true, unique: true },
        password: { type: String },
        name: { type: String },
        image: { type: String },
        bio: { type: String, maxlength: 280 },
        emailVerified: { type: Date },
        plan: { type: String, enum: ["Free", "Pro"], default: "Free" },
        trialUses: { type: Number, default: 0 },
        promptsForSale: { type: [PromptForSaleSchema], default: [] },
        role: { type: String, enum: ["user", "admin"], default: "user" },
        suspended: { type: Boolean, default: false },
        lastActiveAt: { type: Date },
    },
    { timestamps: true }
);

export const User: Model<IUser> =
    mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
