import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import { Favourite } from "@/lib/models/Favourite";
import mongoose from "mongoose";

export const dynamic = 'force-dynamic';

// GET all favourites for the current user
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        await connectToDatabase();
        const favs = await Favourite.find({ userId: (session.user as any).id })
            .sort({ createdAt: -1 })
            .lean();
        return NextResponse.json(favs);
    } catch (error) {
        console.error("Fetch Favourites Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// POST create a new favourite
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        await connectToDatabase();
        const body = await request.json();
        const { title, promptText, source, sourceId } = body;
        if (!title?.trim() || !promptText?.trim() || !source) {
            return NextResponse.json({ error: "title, promptText and source are required" }, { status: 400 });
        }
        if (!["bank", "generated"].includes(source)) {
            return NextResponse.json({ error: "source must be 'bank' or 'generated'" }, { status: 400 });
        }
        const fav = await Favourite.create({
            userId: new mongoose.Types.ObjectId((session.user as any).id),
            title: title.trim(),
            promptText: promptText.trim(),
            source,
            sourceId: sourceId || undefined,
        });
        return NextResponse.json(fav, { status: 201 });
    } catch (error) {
        console.error("Create Favourite Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
