import connectToDatabase from "@/lib/db";
import { AdminActivityLog } from "@/lib/models/AdminActivityLog";
import type { AdminSessionPayload } from "@/lib/adminAuth";

export async function logAdminAction(params: {
    admin: AdminSessionPayload;
    action: string;
    targetType?: string;
    targetId?: string;
    details?: string;
    ip?: string;
}): Promise<void> {
    try {
        await connectToDatabase();
        await AdminActivityLog.create({
            adminId: params.admin.adminId,
            adminEmail: params.admin.email,
            action: params.action,
            targetType: params.targetType,
            targetId: params.targetId,
            details: params.details,
            ip: params.ip,
        });
    } catch (error) {
        // Never let audit logging break the admin action it's logging.
        console.error("Failed to write AdminActivityLog entry:", error);
    }
}
