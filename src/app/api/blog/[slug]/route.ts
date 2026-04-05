import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import { BlogPost } from "@/lib/models/BlogPost";

export const dynamic = 'force-dynamic';

export async function GET(
    request: Request,
    { params }: { params: { slug: string } }
) {
    try {
        await connectToDatabase();
        const post = await BlogPost.findOne({ slug: params.slug, published: true }).lean();
        if (!post) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 });
        }
        return NextResponse.json(post);
    } catch (error) {
        console.error("Fetch Blog Post Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
