import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { requireAdminApiSession } from "@/lib/adminSession";
import { logAdminAction } from "@/lib/adminActivityLog";
import connectToDatabase from "@/lib/db";
import { AdminUser } from "@/lib/models/AdminUser";

export const dynamic = "force-dynamic";

// PATCH /api/admin/settings/password — change the signed-in admin's own two
// login secrets. Requires both current values to verify identity first.
// body: { currentPassword, currentPassword2, newPassword, newPassword2 }
export async function PATCH(req: Request) {
    const adminSession = await requireAdminApiSession();
    if (!adminSession) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const { currentPassword, currentPassword2, newPassword, newPassword2 } = await req.json();

        if (!currentPassword || !currentPassword2 || !newPassword || !newPassword2) {
            return NextResponse.json({ error: "All four fields are required" }, { status: 400 });
        }
        if (newPassword.length < 8 || newPassword2.length < 8) {
            return NextResponse.json({ error: "New passwords must be at least 8 characters" }, { status: 400 });
        }
        if (newPassword === newPassword2) {
            return NextResponse.json({ error: "Password and Password 2 must be different secrets" }, { status: 400 });
        }

        await connectToDatabase();

        const admin = await AdminUser.findById(adminSession.adminId);
        if (!admin) {
            return NextResponse.json({ error: "Admin account not found" }, { status: 404 });
        }

        const [ok1, ok2] = await Promise.all([
            bcrypt.compare(currentPassword, admin.passwordHash),
            bcrypt.compare(currentPassword2, admin.password2Hash),
        ]);
        if (!ok1 || !ok2) {
            return NextResponse.json({ error: "Current password(s) are incorrect" }, { status: 401 });
        }

        const [newHash, newHash2] = await Promise.all([
            bcrypt.hash(newPassword, 12),
            bcrypt.hash(newPassword2, 12),
        ]);
        admin.passwordHash = newHash;
        admin.password2Hash = newHash2;
        await admin.save();

        await logAdminAction({
            admin: adminSession,
            action: "admin_password_change",
            targetType: "AdminUser",
            targetId: admin._id.toString(),
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Admin Password Change Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
