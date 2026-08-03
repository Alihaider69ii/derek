import { NextResponse } from "next/server";
import { getAdminSettings } from "@/lib/adminSettings";

export const dynamic = "force-dynamic";

// GET /api/system/status — public, unauthenticated. Just enough for the
// client-side maintenance banner; never exposes anything else from settings.
export async function GET() {
    try {
        const settings = await getAdminSettings();
        return NextResponse.json({
            maintenanceMode: settings.maintenanceMode,
            maintenanceMessage: settings.maintenanceMessage,
        });
    } catch (error) {
        console.error("System Status Error:", error);
        return NextResponse.json({ maintenanceMode: false }, { status: 200 });
    }
}
