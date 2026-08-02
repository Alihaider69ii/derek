import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logAiUsage } from '@/lib/aiUsageLog';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || '' });

type FilePayload =
    | { type: "text"; text: string }
    | { type: "image"; mediaType: string; base64: string }
    | { type: "document"; mediaType: string; base64: string; name: string }

function buildUserContent(message: string, file?: FilePayload): Anthropic.MessageParam["content"] {
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

    // PDF / docx / other document
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
    try {
        const session = await getServerSession(authOptions);
        const userId = (session?.user as any)?.id || null;
        const userEmail = session?.user?.email || null;

        const { message, model, history, file } = await req.json() as {
            message: string;
            model?: string;
            history: { role: string; content: string }[];
            file?: FilePayload;
        };

        if (!message) return NextResponse.json({ error: 'Message is required' }, { status: 400 });

        const selectedModel = model || 'claude-sonnet-4-6';

        const messages: Anthropic.MessageParam[] = [];

        if (Array.isArray(history)) {
            for (const msg of history) {
                if (msg.content && (msg.role === 'user' || msg.role === 'ai')) {
                    messages.push({ role: msg.role === 'user' ? 'user' : 'assistant', content: msg.content });
                }
            }
        }

        messages.push({ role: 'user', content: buildUserContent(message, file) as string });

        const stream = await anthropic.messages.stream({ model: selectedModel, max_tokens: 2048, messages });

        const readable = new ReadableStream({
            async start(controller) {
                const encoder = new TextEncoder();
                try {
                    for await (const chunk of stream) {
                        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
                            controller.enqueue(encoder.encode(chunk.delta.text));
                        }
                    }
                    const finalMessage = await stream.finalMessage();
                    await logAiUsage({
                        userId,
                        userEmail,
                        feature: "claude",
                        model: selectedModel,
                        inputTokens: finalMessage.usage?.input_tokens,
                        outputTokens: finalMessage.usage?.output_tokens,
                        success: true,
                    });
                } catch (err) {
                    await logAiUsage({
                        userId,
                        userEmail,
                        feature: "claude",
                        model: selectedModel,
                        success: false,
                        errorMessage: err instanceof Error ? err.message : String(err),
                    });
                } finally {
                    controller.close();
                }
            },
        });

        return new Response(readable, {
            headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
        });
    } catch (error: unknown) {
        console.error("Claude API Error:", error);
        return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
    }
}
