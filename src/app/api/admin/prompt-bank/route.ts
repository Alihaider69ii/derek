import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { requireAdminApiSession } from "@/lib/adminSession";
import { logAdminAction } from "@/lib/adminActivityLog";
import connectToDatabase from "@/lib/db";
import { MarketplaceListing } from "@/lib/models/MarketplaceListing";
import { getOrCreateOfficialSellerId, migratePromptBankIfNeeded } from "@/lib/promptBankMigration";
import { generateUniqueSlug } from "@/lib/slug";

export const dynamic = "force-dynamic";

const OUTPUT_TYPE_MAP: Record<string, "Text" | "Image" | "Video"> = {
    text: "Text",
    image: "Image",
    video: "Video",
};
const TYPE_FROM_OUTPUT: Record<string, "text" | "image" | "video"> = {
    Text: "text",
    Image: "image",
    Video: "video",
};

function toPromptRow(l: any) {
    return {
        _id: l._id,
        title: l.title,
        description: l.description || "",
        category: l.category || "",
        type: TYPE_FROM_OUTPUT[l.outputType] || "text",
        isMega: !!l.isMega,
        promptText: l.promptText || "",
        sampleOutput: l.sampleOutput || "",
        emoji: l.emoji || "✨",
        tags: l.tags || [],
        createdAt: l.createdAt,
    };
}

// GET /api/admin/prompt-bank?q=&category= — list official (formerly "Prompt
// Bank") marketplace listings + a count-by-category breakdown. These are
// regular MarketplaceListing docs with isOfficial: true — merged into the
// same collection/grid the public marketplace reads from.
export async function GET(req: NextRequest) {
    const adminSession = await requireAdminApiSession();
    if (!adminSession) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        await connectToDatabase();
        await migratePromptBankIfNeeded();

        const { searchParams } = new URL(req.url);
        const q = searchParams.get("q")?.trim();
        const category = searchParams.get("category");

        const filter: Record<string, unknown> = { isOfficial: true };
        if (q) filter.title = { $regex: q, $options: "i" };
        if (category) filter.category = category;

        const [listings, categoryCounts] = await Promise.all([
            MarketplaceListing.find(filter).sort({ createdAt: -1 }).lean(),
            MarketplaceListing.aggregate([
                { $match: { isOfficial: true } },
                { $group: { _id: "$category", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
            ]),
        ]);

        return NextResponse.json({
            prompts: listings.map(toPromptRow),
            categoryCounts: (categoryCounts as any[]).map((c) => ({ category: c._id || "Uncategorized", count: c.count })),
        });
    } catch (error) {
        console.error("Admin Prompt Bank List Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// POST /api/admin/prompt-bank — create an official (free, EaseMyPrompt-
// authored) marketplace listing.
export async function POST(req: NextRequest) {
    const adminSession = await requireAdminApiSession();
    if (!adminSession) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        await connectToDatabase();

        const body = await req.json();
        const { title, description, category, type, isMega, promptText, sampleOutput, emoji, tags } = body;

        if (!title?.trim() || !description?.trim() || !category?.trim() || !promptText?.trim() || !sampleOutput?.trim()) {
            return NextResponse.json(
                { error: "title, description, category, promptText and sampleOutput are required" },
                { status: 400 }
            );
        }

        const officialSellerId = await getOrCreateOfficialSellerId();
        const slug = await generateUniqueSlug(title.trim());

        const listing = await MarketplaceListing.create({
            sellerId: officialSellerId,
            sellerName: "EaseMyPrompt",
            favouriteId: new mongoose.Types.ObjectId(),
            slug,
            title: title.trim(),
            description: description.trim(),
            category: category.trim(),
            models: [],
            outputType: OUTPUT_TYPE_MAP[type] || "Text",
            promptText: promptText.trim(),
            previewSnippet: description.trim(),
            price: 0,
            isFree: true,
            status: "live",
            buyers: [],
            sales: [],
            isOfficial: true,
            isMega: !!isMega,
            sampleOutput: sampleOutput.trim(),
            emoji: emoji?.trim() || "✨",
            tags: Array.isArray(tags) ? tags.filter((t) => typeof t === "string" && t.trim()).map((t) => t.trim()) : [],
        });

        await logAdminAction({
            admin: adminSession,
            action: "prompt_bank_create",
            targetType: "MarketplaceListing",
            targetId: listing._id.toString(),
            details: listing.title,
        });

        return NextResponse.json(toPromptRow(listing), { status: 201 });
    } catch (error) {
        console.error("Admin Prompt Bank Create Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
