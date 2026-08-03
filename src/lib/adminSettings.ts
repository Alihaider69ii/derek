import connectToDatabase from "@/lib/db";
import { AdminSettings, IAdminSettings } from "@/lib/models/AdminSettings";

// There's always exactly one settings document. Created lazily on first
// read so no seed script/migration is needed.
export async function getAdminSettings(): Promise<IAdminSettings> {
    await connectToDatabase();
    let settings = await AdminSettings.findOne({});
    if (!settings) {
        settings = await AdminSettings.create({});
    }
    return settings;
}
