import connectToDatabase from "@/lib/db";
import { ApiErrorLog } from "@/lib/models/ApiErrorLog";

// Never throws — logging a failure must never cause a second failure.
export async function logApiError(route: string, error: unknown): Promise<void> {
    try {
        await connectToDatabase();
        const message = error instanceof Error ? error.message : String(error);
        const stack = error instanceof Error ? error.stack?.slice(0, 2000) : undefined;
        await ApiErrorLog.create({ route, message, stack });
    } catch (loggingError) {
        console.error("Failed to write ApiErrorLog entry:", loggingError);
    }
}
