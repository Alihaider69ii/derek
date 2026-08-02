import bcrypt from "bcryptjs";
import connectToDatabase from "@/lib/db";
import { AdminUser } from "@/lib/models/AdminUser";

// Node-only (mongoose + bcrypt) — deliberately kept out of adminAuth.ts so
// middleware's edge bundle never pulls in the DB driver.
export async function verifyAdminCredentials(
    email: string,
    password: string,
    password2: string
): Promise<{ adminId: string; email: string } | null> {
    await connectToDatabase();
    const admin = await AdminUser.findOne({ email: email.trim().toLowerCase() });
    if (!admin) return null;

    const [passwordOk, password2Ok] = await Promise.all([
        bcrypt.compare(password, admin.passwordHash),
        bcrypt.compare(password2, admin.password2Hash),
    ]);
    if (!passwordOk || !password2Ok) return null;

    admin.lastLoginAt = new Date();
    await admin.save();

    return { adminId: admin._id.toString(), email: admin.email };
}
