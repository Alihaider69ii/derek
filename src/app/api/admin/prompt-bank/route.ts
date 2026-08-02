import { NextRequest, NextResponse } from "next/server";
import { requireAdminApiSession } from "@/lib/adminSession";
import { logAdminAction } from "@/lib/adminActivityLog";
import connectToDatabase from "@/lib/db";
import { Prompt } from "@/lib/models/Prompt";

export const dynamic = "force-dynamic";

// GET /api/admin/prompt-bank?q=&category= — list built-in prompts + a
// count-by-category breakdown.
export async function GET(req: NextRequest) {
    const adminSession = await requireAdminApiSession();
    if (!adminSession) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        await connectToDatabase();

        const { searchParams } = new URL(req.url);
        const q = searchParams.get("q")?.trim();
        const category = searchParams.get("category");

        const filter: Record<string, unknown> = {};
        if (q) filter.title = { $regex: q, $options: "i" };
        if (category) filter.category = category;

        const [prompts, categoryCounts] = await Promise.all([
            Prompt.find(filter).sort({ createdAt: -1 }).lean(),
            Prompt.aggregate([
                { $group: { _id: "$category", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
            ]),
        ]);

        return NextResponse.json({
            prompts,
            categoryCounts: (categoryCounts as any[]).map((c) => ({ category: c._id || "Uncategorized", count: c.count })),
        });
    } catch (error) {
        console.error("Admin Prompt Bank List Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// POST /api/admin/prompt-bank — create a built-in prompt.
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

        const prompt = await Prompt.create({
            title: title.trim(),
            description: description.trim(),
            category: category.trim(),
            type: ["text", "image", "video"].includes(type) ? type : "text",
            isMega: !!isMega,
            promptText: promptText.trim(),
            sampleOutput: sampleOutput.trim(),
            emoji: emoji?.trim() || "✨",
            tags: Array.isArray(tags) ? tags.filter((t) => typeof t === "string" && t.trim()).map((t) => t.trim()) : [],
        });

        await logAdminAction({
            admin: adminSession,
            action: "prompt_bank_create",
            targetType: "Prompt",
            targetId: prompt._id.toString(),
            details: prompt.title,
        });

        return NextResponse.json(prompt, { status: 201 });
    } catch (error) {
        console.error("Admin Prompt Bank Create Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
