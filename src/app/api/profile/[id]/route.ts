import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import { User } from "@/lib/models/User";
import { MarketplaceListing } from "@/lib/models/MarketplaceListing";
import { placeholderRating, handleFromName } from "@/lib/utils";
import mongoose from "mongoose";

export const dynamic = 'force-dynamic';

// GET /api/profile/[id] — public seller profile: bio, stats, live listings.
// Accepts ?category= to filter the returned listings grid.
export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        if (!mongoose.Types.ObjectId.isValid(params.id)) {
            return NextResponse.json({ error: "Invalid profile id" }, { status: 400 });
        }
        await connectToDatabase();

        const [user, allListings] = await Promise.all([
            User.findById(params.id).lean(),
            MarketplaceListing.find({ sellerId: new mongoose.Types.ObjectId(params.id) }).lean(),
        ]);

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const session = await getServerSession(authOptions);
        const isOwner = (session?.user as any)?.id === params.id;

        const liveListings = (allListings as any[]).filter(l => l.status === "live" || l.status === undefined);

        let totalSales = 0;
        const ratings: number[] = [];
        for (const l of allListings as any[]) {
            const sales = Array.isArray(l.sales) ? l.sales.length : (l.buyers?.length || 0);
            totalSales += sales;
            ratings.push(typeof l.rating === "number" ? l.rating : placeholderRating(l._id.toString()));
        }
        const avgRating = ratings.length
            ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
            : null;

        const categories = Array.from(new Set(liveListings.map(l => l.category).filter(Boolean))) as string[];

        const { searchParams } = new URL(request.url);
        const categoryFilter = searchParams.get("category");
        const gridListings = (categoryFilter ? liveListings.filter(l => l.category === categoryFilter) : liveListings)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map((l: any) => ({
                _id: l._id,
                title: l.title,
                category: l.category || null,
                previewSnippet: l.previewSnippet || l.description || null,
                price: l.price,
                isFree: !!l.isFree,
                rating: typeof l.rating === "number" ? l.rating : placeholderRating(l._id.toString()),
                salesCount: Array.isArray(l.sales) ? l.sales.length : (l.buyers?.length || 0),
            }));

        const name = (user as any).name || "Anonymous";
        return NextResponse.json({
            id: (user as any)._id,
            name,
            handle: handleFromName(name, (user as any)._id.toString()),
            bio: (user as any).bio || "",
            plan: (user as any).plan || "Free",
            sellerLabel: (user as any).plan === "Pro" ? "Pro seller" : liveListings.length > 0 ? "Seller" : "Member",
            isOwner,
            joinedAt: (user as any).createdAt,
            stats: {
                prompts: liveListings.length,
                sales: totalSales,
                rating: avgRating,
            },
            categories,
            listings: gridListings,
        });
    } catch (error) {
        console.error("Fetch Profile Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// PATCH /api/profile/[id] — owner-only: update display name / bio.
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || (session.user as any).id !== params.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        await connectToDatabase();
        const body = await request.json();
        const update: { name?: string; bio?: string } = {};
        if (typeof body.name === "string") update.name = body.name.trim().slice(0, 80);
        if (typeof body.bio === "string") update.bio = body.bio.trim().slice(0, 280);

        const user = await User.findByIdAndUpdate(params.id, update, { new: true }).lean();
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }
        return NextResponse.json({ name: (user as any).name, bio: (user as any).bio || "" });
    } catch (error) {
        console.error("Update Profile Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
