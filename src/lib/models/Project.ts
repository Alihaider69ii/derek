import mongoose, { Schema, Document, Model } from "mongoose";

export interface IProjectPrompt {
    label: string;
    promptText: string;
    order: number;
}

export interface IProject extends Document {
    userId: mongoose.Types.ObjectId;
    name: string;
    description: string;
    emoji: string;
    prompts: IProjectPrompt[];
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
}

const ProjectPromptSchema = new Schema<IProjectPrompt>(
    {
        label: { type: String, required: true },
        promptText: { type: String, required: true },
        order: { type: Number, default: 0 },
    },
    { _id: false }
);

const ProjectSchema = new Schema<IProject>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        name: { type: String, required: true },
        description: { type: String, default: "" },
        emoji: { type: String, default: "📁" },
        prompts: { type: [ProjectPromptSchema], default: [] },
        tags: [{ type: String }],
    },
    { timestamps: true }
);

export const Project: Model<IProject> =
    mongoose.models.Project || mongoose.model<IProject>("Project", ProjectSchema);
