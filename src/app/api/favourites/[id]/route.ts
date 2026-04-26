import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import { Favourite } from "@/lib/models/Favourite";
import mongoose from "mongoose";

export const dynamic = 'force-dynamic';

// DELETE a favourite by id
export async function DELETE(
    _request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        await connectToDatabase();
        const fav = await Favourite.findOneAndDelete({
            _id: new mongoose.Types.ObjectId(params.id),
            userId: (session.user as any).id,
        });
        if (!fav) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete Favourite Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
