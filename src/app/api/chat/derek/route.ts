import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logAiUsage } from '@/lib/aiUsageLog';
import { logApiError } from '@/lib/apiErrorLog';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || '' });

const DEREK_SYSTEM_PROMPT = `You are Derek, a professional prompt engineer and AI communication strategist working for EaseMyPrompt.ai.

Your job is to take any layman, vague, or poorly worded input from a user and transform it into a clear, structured, highly effective AI prompt that will get the best possible results from any LLM.

Your personality: Professional but warm and friendly. Knowledgeable but never condescending. You make users feel like they have a skilled expert helping them communicate with AI effectively.

How you respond:
1. Briefly acknowledge what the user wants (1 sentence max)
2. Output a clearly labeled **STRUCTURED PROMPT:** section
3. The structured prompt must include: Role/Context, Task, Format/Output, Tone, Constraints
4. After the prompt, add a short **PRO TIP:** on how to get even better results.

Always be concise. Get to the structured output quickly.

You are NOT a general-purpose AI. If asked anything unrelated to prompt engineering, politely redirect:
"I'm Derek, your prompt engineer! Ask me to structure any idea you have into a powerful AI prompt."`;

type FilePayload =
    | { type: "text"; text: string }
    | { type: "image"; mediaType: string; base64: string }
    | { type: "document"; mediaType: string; base64: string; name: string }

function buildAnthropicContent(message: string, file?: FilePayload): Anthropic.MessageParam["content"] {
    if (!file) return message;

    if (file.type === "text") {
        return `${file.text}\n\n---\nUser instruction: ${message}`;
    }

    if (file.type === "image") {
        return [
            {
                type: "image" as const,
                source: {
                    type: "base64" as const,
                    media_type: file.mediaType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
                    data: file.base64,
                },
            },
            { type: "text" as const, text: message },
        ];
    }

    // document (pdf, docx, mp4 etc.) — send as base64 document block if supported, else fallback to text note
    return [
        {
            type: "document" as const,
            source: {
                type: "base64" as const,
                media_type: file.mediaType as "application/pdf",
                data: file.base64,
            },
        } as unknown as Anthropic.TextBlockParam,
        { type: "text" as const, text: message },
    ];
}

export async function POST(req: Request) {
    let userId: string | null = null;
    let userEmail: string | null = null;
    try {
        const session = await getServerSession(authOptions);
        userId = (session?.user as any)?.id || null;
        userEmail = session?.user?.email || null;

        if (!process.env.ANTHROPIC_API_KEY) {
            return new Response(
                "Derek is unavailable because the Anthropic API key is missing or invalid.\n\nSet ANTHROPIC_API_KEY in your .env and restart the dev server.",
                { status: 200, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
            );
        }

        const { message, history, file } = await req.json() as { message: string; history: { role: string; content: string }[]; file?: FilePayload };

        if (!message) return NextResponse.json({ error: 'Message is required' }, { status: 400 });

        const messages: Anthropic.MessageParam[] = [];

        if (Array.isArray(history)) {
            for (const msg of history) {
                if (msg.content && (msg.role === 'user' || msg.role === 'ai')) {
                    messages.push({ role: msg.role === 'user' ? 'user' : 'assistant', content: msg.content });
                }
            }
        }

        messages.push({ role: 'user', content: buildAnthropicContent(message, file) as string });

        const stream = await anthropic.messages.stream({
            model: 'claude-sonnet-4-6',
            max_tokens: 1500,
            system: DEREK_SYSTEM_PROMPT,
            messages,
        });

        const finalMessage = await stream.finalMessage();
        const textBlock = (finalMessage.content ?? []).find(b => b.type === "text") as Anthropic.TextBlock | undefined;
        const text = textBlock?.text ?? "";

        await logAiUsage({
            userId,
            userEmail,
            feature: "derek",
            model: 'claude-sonnet-4-6',
            inputTokens: finalMessage.usage?.input_tokens,
            outputTokens: finalMessage.usage?.output_tokens,
            success: true,
        });

        return new Response(text, {
            headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
        });
    } catch (error: unknown) {
        console.error("Derek API Error:", error);
        await logApiError("/api/chat/derek", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        await logAiUsage({
            userId,
            userEmail,
            feature: "derek",
            model: 'claude-sonnet-4-6',
            success: false,
            errorMessage: message,
        });
        if (message.toLowerCase().includes("invalid x-api-key") || (error as any)?.status === 401) {
            return new Response(
                "Derek is unavailable because the Anthropic API key is invalid.\n\nSet ANTHROPIC_API_KEY in your .env and restart the dev server.",
                { status: 200, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
            );
        }
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
