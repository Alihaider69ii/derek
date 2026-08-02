import { NextResponse } from "next/server";
import { requireAdminApiSession } from "@/lib/adminSession";
import { logAdminAction } from "@/lib/adminActivityLog";
import connectToDatabase from "@/lib/db";
import { User } from "@/lib/models/User";

export const dynamic = "force-dynamic";

const ACTIONS = ["make_admin", "remove_admin", "suspend", "unsuspend"] as const;
type Action = (typeof ACTIONS)[number];

// PATCH /api/admin/users/[id] — body: { action: "make_admin" | "remove_admin" | "suspend" | "unsuspend" }
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    const adminSession = await requireAdminApiSession();
    if (!adminSession) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const { action } = (await req.json()) as { action: Action };
        if (!ACTIONS.includes(action)) {
            return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }

        await connectToDatabase();

        const update =
            action === "make_admin" ? { role: "admin" } :
                action === "remove_admin" ? { role: "user" } :
                    action === "suspend" ? { suspended: true } :
                        { suspended: false };

        const user = await User.findByIdAndUpdate(params.id, update, { new: true }).select("name email role suspended");
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        await logAdminAction({
            admin: adminSession,
            action,
            targetType: "User",
            targetId: user._id.toString(),
            details: user.email,
        });

        return NextResponse.json({ success: true, user });
    } catch (error) {
        console.error("Admin User Action Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
