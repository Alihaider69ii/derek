import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import { MarketplaceListing } from "@/lib/models/MarketplaceListing";
import { migratePromptBankIfNeeded } from "@/lib/promptBankMigration";

export const dynamic = 'force-dynamic';

// Powers the homepage marquee — official (formerly "Prompt Bank") listings
// now live in MarketplaceListing alongside user-submitted ones.
export async function GET() {
    try {
        await connectToDatabase();
        await migratePromptBankIfNeeded();

        const listings = await MarketplaceListing.find({ isOfficial: true, status: "live" })
            .select("_id title description category emoji isMega promptText sampleOutput")
            .sort({ featured: -1, createdAt: -1 })
            .limit(10)
            .lean();

        return NextResponse.json(listings);
    } catch (error) {
        console.error("Fetch Popular Prompts Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
