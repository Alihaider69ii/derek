import { NextResponse } from "next/server";
import { requireAdminApiSession } from "@/lib/adminSession";
import connectToDatabase from "@/lib/db";
import { MarketplaceListing } from "@/lib/models/MarketplaceListing";

export const dynamic = "force-dynamic";

function csvCell(v: string | number) {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// GET /api/admin/marketplace/export-sales — every individual sale as a CSV
// row (one row per purchase, not per listing).
export async function GET() {
    const adminSession = await requireAdminApiSession();
    if (!adminSession) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        await connectToDatabase();

        const listings = await MarketplaceListing.find({ "sales.0": { $exists: true } })
            .select("title sellerName category sales")
            .lean();

        const header = ["Listing", "Seller", "Category", "Sale price (INR)", "Purchased at"];
        const rows: string[][] = [header];

        for (const l of listings as any[]) {
            for (const s of l.sales || []) {
                rows.push([
                    l.title,
                    l.sellerName,
                    l.category || "Uncategorized",
                    String(s.price ?? 0),
                    new Date(s.purchasedAt).toISOString(),
                ]);
            }
        }

        const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");

        return new NextResponse(csv, {
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": `attachment; filename="marketplace-sales-${new Date().toISOString().slice(0, 10)}.csv"`,
            },
        });
    } catch (error) {
        console.error("Admin Marketplace Export Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
