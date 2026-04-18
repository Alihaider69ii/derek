import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import { Chat } from "@/lib/models/Chat";
import { Project } from "@/lib/models/Project";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

// GET all chats for a specific project
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectToDatabase();

        // Verify project belongs to user
        const project = await Project.findOne({
            _id: params.id,
            userId: (session.user as any).id,
        }).lean();

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        const chats = await Chat.find({
            userId: (session.user as any).id,
            projectId: new mongoose.Types.ObjectId(params.id),
        })
            .select("_id title updatedAt createdAt")
            .sort({ updatedAt: -1 })
            .lean();

        return NextResponse.json(chats);
    } catch (error) {
        console.error("Fetch Project Chats Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// POST create a new project chat
export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectToDatabase();

        // Verify project belongs to user
        const project = await Project.findOne({
            _id: params.id,
            userId: (session.user as any).id,
        }).lean();

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        const body = await request.json();
        const { title } = body;

        const newChat = new Chat({
            userId: (session.user as any).id,
            projectId: new mongoose.Types.ObjectId(params.id),
            title: title || "New Chat",
            derekMessages: [],
            claudeMessages: [],
        });

        await newChat.save();
        return NextResponse.json(newChat, { status: 201 });
    } catch (error) {
        console.error("Create Project Chat Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
