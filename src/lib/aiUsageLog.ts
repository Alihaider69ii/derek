import connectToDatabase from "@/lib/db";
import { AiUsageLog } from "@/lib/models/AiUsageLog";

export async function logAiUsage(params: {
    userId?: string | null;
    userEmail?: string | null;
    feature: "derek" | "claude";
    model: string;
    inputTokens?: number;
    outputTokens?: number;
    success?: boolean;
    errorMessage?: string;
}): Promise<void> {
    try {
        await connectToDatabase();
        await AiUsageLog.create({
            userId: params.userId || undefined,
            userEmail: params.userEmail || undefined,
            feature: params.feature,
            aiModel: params.model,
            inputTokens: params.inputTokens || 0,
            outputTokens: params.outputTokens || 0,
            success: params.success ?? true,
            errorMessage: params.errorMessage,
        });
    } catch (error) {
        // Never let usage logging break the chat response it's logging.
        console.error("Failed to write AiUsageLog entry:", error);
    }
}
