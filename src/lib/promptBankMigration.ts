import mongoose from "mongoose";
import { User } from "@/lib/models/User";
import { Prompt } from "@/lib/models/Prompt";
import { MarketplaceListing } from "@/lib/models/MarketplaceListing";
import { generateUniqueSlug } from "@/lib/slug";

const OFFICIAL_SELLER_EMAIL = "official@easemyprompt.ai";
const OFFICIAL_SELLER_NAME = "EaseMyPrompt";
const OFFICIAL_SELLER_USERNAME = "easemyprompt";

const OUTPUT_TYPE_MAP: Record<string, "Text" | "Image" | "Video"> = {
    text: "Text",
    image: "Image",
    video: "Video",
};

// The system "seller" behind merged Prompt Bank content — has no password,
// so it can never actually sign in. Its user id is only ever used as
// MarketplaceListing.sellerId for official, platform-authored prompts.
export async function getOrCreateOfficialSellerId(): Promise<mongoose.Types.ObjectId> {
    const existing = await User.findOne({ email: OFFICIAL_SELLER_EMAIL }).select("_id").lean();
    if (existing) return (existing as any)._id;

    const created = await User.create({
        email: OFFICIAL_SELLER_EMAIL,
        name: OFFICIAL_SELLER_NAME,
        username: OFFICIAL_SELLER_USERNAME,
        role: "user",
    });
    return created._id as mongoose.Types.ObjectId;
}

// One-time, idempotent migration: copies every legacy Prompt Bank document
// into MarketplaceListing (isOfficial: true), preserving the original _id so
// old /prompts/[id] links and any stored Favourite.sourceId keep resolving,
// then removes the migrated Prompt doc. Cheap no-op once the `prompts`
// collection is empty — safe to call from hot request paths.
export async function migratePromptBankIfNeeded(): Promise<void> {
    const hasLegacyPrompts = await Prompt.exists({});
    if (!hasLegacyPrompts) return;

    const officialSellerId = await getOrCreateOfficialSellerId();
    const legacyPrompts = await Prompt.find({}).lean();

    for (const p of legacyPrompts as any[]) {
        try {
            const slug = await generateUniqueSlug(p.title);
            await MarketplaceListing.create({
                _id: p._id,
                sellerId: officialSellerId,
                sellerName: OFFICIAL_SELLER_NAME,
                favouriteId: new mongoose.Types.ObjectId(),
                slug,
                title: p.title,
                description: p.description,
                category: p.category,
                models: [],
                outputType: OUTPUT_TYPE_MAP[p.type] || "Text",
                promptText: p.promptText,
                previewSnippet: p.description,
                price: 0,
                isFree: true,
                status: "live",
                buyers: [],
                sales: [],
                isOfficial: true,
                emoji: p.emoji,
                isMega: !!p.isMega,
                sampleOutput: p.sampleOutput,
                tags: Array.isArray(p.tags) ? p.tags : [],
                createdAt: p.createdAt,
            });
            await Prompt.deleteOne({ _id: p._id });
        } catch (error) {
            console.error("Prompt Bank migration failed for", p._id, error);
        }
    }
}
