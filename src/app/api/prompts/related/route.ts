import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import { Prompt } from "@/lib/models/Prompt";

export const dynamic = "force-dynamic";

// Category keywords map to help with fuzzy matching
const CATEGORY_KEYWORDS: Record<string, string[]> = {
    "investing": ["Investing", "Finance", "Marketing", "Copywriting"],
    "finance": ["Investing", "Finance", "Marketing"],
    "homework": ["Writing", "Coding"],
    "writing": ["Writing", "Copywriting"],
    "travel": ["Writing", "Marketing"],
    "marketing": ["Marketing", "Copywriting", "Writing"],
    "coding": ["Coding"],
    "copywriting": ["Copywriting", "Marketing", "Writing"],
    "image": ["Image Generation"],
    "design": ["Image Generation"],
    "social media": ["Marketing", "Copywriting", "Writing"],
};

function getRelatedCategories(projectName: string): string[] {
    const lower = projectName.toLowerCase();
    for (const [key, cats] of Object.entries(CATEGORY_KEYWORDS)) {
        if (lower.includes(key)) return cats;
    }
    // Fallback: try to match the project name directly as a category
    return [projectName];
}

// GET /api/prompts/related?projectName=Investing
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const projectName = searchParams.get("projectName") || "";

        await connectToDatabase();

        const relatedCategories = getRelatedCategories(projectName);

        const prompts = await Prompt.find({
            category: { $in: relatedCategories },
        })
            .select("_id title description category emoji isMega promptText trendingScore popularScore")
            .sort({ popularScore: -1, trendingScore: -1 })
            .limit(12)
            .lean();

        return NextResponse.json(prompts);
    } catch (error) {
        console.error("Related Prompts Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
