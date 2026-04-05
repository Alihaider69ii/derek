import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import { BlogPost } from "@/lib/models/BlogPost";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await connectToDatabase();
        const posts = await BlogPost.find({ published: true })
            .sort({ publishedAt: -1 })
            .select("-content") // don't send full content in list
            .lean();
        return NextResponse.json(posts);
    } catch (error) {
        console.error("Fetch Blog Posts Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
