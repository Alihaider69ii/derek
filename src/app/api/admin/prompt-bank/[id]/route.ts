import { NextResponse } from "next/server";
import { requireAdminApiSession } from "@/lib/adminSession";
import { logAdminAction } from "@/lib/adminActivityLog";
import connectToDatabase from "@/lib/db";
import { Prompt } from "@/lib/models/Prompt";

export const dynamic = "force-dynamic";

// PATCH /api/admin/prompt-bank/[id] — update a built-in prompt.
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
        if (description !== undefined) update.description = String(description).trim();
        if (category !== undefined) update.category = String(category).trim();
        if (type !== undefined && ["text", "image", "video"].includes(type)) update.type = type;
        if (isMega !== undefined) update.isMega = !!isMega;
        if (promptText !== undefined) update.promptText = String(promptText).trim();
        if (sampleOutput !== undefined) update.sampleOutput = String(sampleOutput).trim();
        if (emoji !== undefined) update.emoji = String(emoji).trim() || "✨";
        if (Array.isArray(tags)) update.tags = tags.filter((t) => typeof t === "string" && t.trim()).map((t) => t.trim());

        const prompt = await Prompt.findByIdAndUpdate(params.id, update, { new: true });
        if (!prompt) {
            return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
        }

        await logAdminAction({
            admin: adminSession,
            action: "prompt_bank_update",
            targetType: "Prompt",
            targetId: prompt._id.toString(),
            details: prompt.title,
        });

        return NextResponse.json(prompt);
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

        const prompt = await Prompt.findByIdAndDelete(params.id);
        if (!prompt) {
            return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
        }

        await logAdminAction({
            admin: adminSession,
            action: "prompt_bank_delete",
            targetType: "Prompt",
            targetId: params.id,
            details: prompt.title,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Admin Prompt Bank Delete Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
