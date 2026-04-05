import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBlogPost extends Document {
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    category: string;
    tags: string[];
    author: string;
    authorAvatar?: string;
    coverImage?: string;
    readTime: number; // minutes
    published: boolean;
    publishedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const BlogPostSchema = new Schema<IBlogPost>(
    {
        title: { type: String, required: true },
        slug: { type: String, required: true, unique: true },
        excerpt: { type: String, required: true },
        content: { type: String, required: true },
        category: { type: String, required: true, default: "General" },
        tags: [{ type: String }],
        author: { type: String, required: true, default: "Derek Team" },
        authorAvatar: { type: String },
        coverImage: { type: String },
        readTime: { type: Number, default: 5 },
        published: { type: Boolean, default: false },
        publishedAt: { type: Date },
    },
    { timestamps: true }
);

export const BlogPost: Model<IBlogPost> =
    mongoose.models.BlogPost || mongoose.model<IBlogPost>("BlogPost", BlogPostSchema);
