import { NextResponse } from "next/server";
import { requireAdminApiSession } from "@/lib/adminSession";
import { logAdminAction } from "@/lib/adminActivityLog";
import connectToDatabase from "@/lib/db";
import { MarketplaceListing } from "@/lib/models/MarketplaceListing";

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

// PATCH /api/admin/prompt-bank/[id] — update an official marketplace listing.
// Scoped to isOfficial:true so this admin tool can never touch a real
// user-submitted (paid) listing even if given the wrong id.
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    const adminSession = await requireAdminApiSession();
    if (!adminSession) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        await connectToDatabase();

        const body = await req.json();
        const { title, description, category, type, isMega, promptText, sampleOutput, emoji, tags } = body;

        const update: Record<string, unknown> = {};
        if (title !== undefined) update.title = String(title).trim();
        if (description !== undefined) {
            update.description = String(description).trim();
            update.previewSnippet = String(description).trim();
        }
        if (category !== undefined) update.category = String(category).trim();
        if (type !== undefined && OUTPUT_TYPE_MAP[type]) update.outputType = OUTPUT_TYPE_MAP[type];
        if (isMega !== undefined) update.isMega = !!isMega;
        if (promptText !== undefined) update.promptText = String(promptText).trim();
        if (sampleOutput !== undefined) update.sampleOutput = String(sampleOutput).trim();
        if (emoji !== undefined) update.emoji = String(emoji).trim() || "✨";
        if (Array.isArray(tags)) update.tags = tags.filter((t) => typeof t === "string" && t.trim()).map((t) => t.trim());

        const listing = await MarketplaceListing.findOneAndUpdate(
            { _id: params.id, isOfficial: true },
            update,
            { new: true }
        );
        if (!listing) {
            return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
        }

        await logAdminAction({
            admin: adminSession,
            action: "prompt_bank_update",
            targetType: "MarketplaceListing",
            targetId: listing._id.toString(),
            details: listing.title,
        });

        return NextResponse.json(toPromptRow(listing));
    } catch (error) {
        console.error("Admin Prompt Bank Update Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// DELETE /api/admin/prompt-bank/[id]
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    const adminSession = await requireAdminApiSession();
    if (!adminSession) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        await connectToDatabase();

        const listing = await MarketplaceListing.findOneAndDelete({ _id: params.id, isOfficial: true });
        if (!listing) {
            return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
        }

        await logAdminAction({
            admin: adminSession,
            action: "prompt_bank_delete",
            targetType: "MarketplaceListing",
            targetId: params.id,
            details: listing.title,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Admin Prompt Bank Delete Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
