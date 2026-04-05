import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import { Project } from "@/lib/models/Project";
import mongoose from "mongoose";

export const dynamic = 'force-dynamic';

// GET all projects for the current user
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectToDatabase();
        const projects = await Project.find({ userId: (session.user as any).id })
            .sort({ updatedAt: -1 })
            .lean();

        return NextResponse.json(projects);
    } catch (error) {
        console.error("Fetch Projects Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// POST create a new project
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectToDatabase();
        const body = await request.json();
        const { name, description, emoji, tags } = body;

        if (!name?.trim()) {
            return NextResponse.json({ error: "Project name is required" }, { status: 400 });
        }

        const project = await Project.create({
            userId: new mongoose.Types.ObjectId((session.user as any).id),
            name: name.trim(),
            description: description?.trim() || "",
            emoji: emoji || "📁",
            tags: tags || [],
            prompts: [],
        });

        return NextResponse.json(project, { status: 201 });
    } catch (error) {
        console.error("Create Project Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
