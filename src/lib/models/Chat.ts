import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMessage {
    role: "user" | "ai";
    content: string;
    timestamp: Date;
}

export interface IChat extends Document {
    userId: mongoose.Types.ObjectId;
    projectId?: mongoose.Types.ObjectId; // optional — if set, chat belongs to a project
    title: string;
    derekMessages: IMessage[];
    claudeMessages: IMessage[];
    createdAt: Date;
    updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
    {
        role: { type: String, enum: ["user", "ai"], required: true },
        content: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
    },
    { _id: false }
);

const ChatSchema = new Schema<IChat>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        projectId: { type: Schema.Types.ObjectId, ref: "Project", default: null },
        title: { type: String, default: "New Chat" },
        derekMessages: { type: [MessageSchema], default: [] },
        claudeMessages: { type: [MessageSchema], default: [] },
    },
    { timestamps: true }
);

export const Chat: Model<IChat> =
    mongoose.models.Chat || mongoose.model<IChat>("Chat", ChatSchema);
