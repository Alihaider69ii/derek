import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import { MarketplaceListing } from "@/lib/models/MarketplaceListing";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

const ALLOWED_STATUSES = ["draft", "pending_review", "live"];
const ALLOWED_OUTPUT_TYPES = ["Text", "Image", "Video", "Code", "Audio"];

// GET /api/marketplace/[id] — owner-only full listing fetch, used to
// pre-fill the listing wizard when a seller resumes editing a draft.
export async function GET(_request: Request, { params }: { params: { id: string } }) {
    try {
        if (!mongoose.Types.ObjectId.isValid(params.id)) {
            return NextResponse.json({ error: "Invalid listing id" }, { status: 400 });
        }
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        await connectToDatabase();

        const listing = await MarketplaceListing.findById(params.id).lean();
        if (!listing) {
            return NextResponse.json({ error: "Listing not found" }, { status: 404 });
        }
        if ((listing as any).sellerId.toString() !== (session.user as any).id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        return NextResponse.json(listing);
    } catch (error) {
        console.error("Fetch Listing Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// PATCH /api/marketplace/[id] — owner-only: update an existing listing
// (used by "Continue editing" on drafts/rejected prompts).
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
    try {
        if (!mongoose.Types.ObjectId.isValid(params.id)) {
            return NextResponse.json({ error: "Invalid listing id" }, { status: 400 });
        }
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        await connectToDatabase();

        const listing = await MarketplaceListing.findById(params.id);
        if (!listing) {
            return NextResponse.json({ error: "Listing not found" }, { status: 404 });
        }
        if (listing.sellerId.toString() !== (session.user as any).id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json();
        const {
            title, promptText, price, isFree, description, category,
            models, previewSnippet, status, outputType,
        } = body;

        if (title !== undefined) listing.title = String(title).trim();
        if (promptText !== undefined) listing.promptText = String(promptText).trim();
        if (description !== undefined) listing.description = String(description).trim();
        if (category !== undefined) listing.category = String(category).trim();
        if (previewSnippet !== undefined) listing.previewSnippet = String(previewSnippet).trim();
        if (Array.isArray(models)) listing.models = models;
        if (ALLOWED_OUTPUT_TYPES.includes(outputType)) listing.outputType = outputType;

        if (isFree !== undefined) {
            const free = !!isFree;
            listing.isFree = free;
            listing.price = free ? 0 : Number(price);
        } else if (price !== undefined) {
            listing.price = Number(price);
        }

        if (ALLOWED_STATUSES.includes(status)) listing.status = status;

        await listing.save();
        return NextResponse.json(listing);
    } catch (error) {
        console.error("Update Listing Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
