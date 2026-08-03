import { NextResponse } from "next/server";
import { requireAdminApiSession } from "@/lib/adminSession";
import { logAdminAction } from "@/lib/adminActivityLog";
import { getAdminSettings } from "@/lib/adminSettings";

export const dynamic = "force-dynamic";

// GET /api/admin/settings — current platform settings (created on first read).
export async function GET() {
    const adminSession = await requireAdminApiSession();
    if (!adminSession) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    try {
        const settings = await getAdminSettings();
        return NextResponse.json(settings);
    } catch (error) {
        console.error("Admin Settings Get Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// PATCH /api/admin/settings — update commission/maintenance/feature flags.
// body: { commissionPct?, maintenanceMode?, maintenanceMessage?, featureFlags?: { signupsEnabled?, marketplaceEnabled? } }
export async function PATCH(req: Request) {
    const adminSession = await requireAdminApiSession();
    if (!adminSession) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    try {
        const body = await req.json();
        const settings = await getAdminSettings();

        if (body.commissionPct !== undefined) {
            const pct = Number(body.commissionPct);
            if (Number.isNaN(pct) || pct < 0 || pct > 100) {
                return NextResponse.json({ error: "Commission must be between 0 and 100" }, { status: 400 });
            }
            settings.commissionPct = pct;
        }
        if (body.maintenanceMode !== undefined) settings.maintenanceMode = !!body.maintenanceMode;
        if (body.maintenanceMessage !== undefined) settings.maintenanceMessage = String(body.maintenanceMessage).slice(0, 300);
        if (body.featureFlags?.signupsEnabled !== undefined) settings.featureFlags.signupsEnabled = !!body.featureFlags.signupsEnabled;
        if (body.featureFlags?.marketplaceEnabled !== undefined) settings.featureFlags.marketplaceEnabled = !!body.featureFlags.marketplaceEnabled;

        settings.updatedBy = adminSession.email;
        await settings.save();

        await logAdminAction({
            admin: adminSession,
            action: "settings_update",
            targetType: "AdminSettings",
            details: JSON.stringify(body),
        });

        return NextResponse.json(settings);
    } catch (error) {
        console.error("Admin Settings Update Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
