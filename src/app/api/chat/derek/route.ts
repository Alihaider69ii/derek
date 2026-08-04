import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logAiUsage } from '@/lib/aiUsageLog';
import { logApiError } from '@/lib/apiErrorLog';
import { buildDerekSystemPrompt } from '@/lib/derekSystemPrompt';
import { parseStructuredPrompt, deriveBuildTitle } from '@/lib/derekPromptParser';
import connectToDatabase from '@/lib/db';
import { User } from '@/lib/models/User';
import { Favourite } from '@/lib/models/Favourite';

// DeepSeek exposes an OpenAI-compatible Responses API — same SDK, different
// base URL/model. See platform.deepseek.com → API Keys for the key itself.
const DEEPSEEK_MODEL = 'deepseek-v4-flash';
const deepseek = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY || '',
    baseURL: 'https://api.deepseek.com',
});

// Lifetime free Derek uses for a Free-plan account before upgrade is
// required. Pro plan is unlimited. (Payment/upgrade flow isn't built yet —
// see FREE_LIMIT_REACHED handling below.)
const FREE_LIMIT = 5;

// Invisible separator between the visible reply and a trailing JSON blob
// (mode + saved-build id) — lets the client know how to render the message
// without needing a second round-trip, while streaming stays a plain text
// body. U+0000 never appears in normal model output, so splitting on it
// client-side is safe.
const META_SEPARATOR = '\u0000';

type FilePayload =
    | { type: 'text'; text: string }
    | { type: 'image'; mediaType: string; base64: string }
    | { type: 'document'; mediaType: string; base64: string; name: string };

// DeepSeek's Responses API here is used as plain text input, so binary
// attachments are best-effort: we can't hand DeepSeek image/doc bytes, but
// we still tell it an attachment exists so it doesn't ignore user intent.
function buildUserMessage(message: string, file?: FilePayload): string {
    if (!file) return message;
    if (file.type === 'text') return `${file.text}\n\n---\nUser instruction: ${message}`;
    if (file.type === 'document') return `[User attached a file: ${file.name} — content not readable by this model]\n\n${message}`;
    return `[User attached an image — content not readable by this model]\n\n${message}`;
}

export async function POST(req: Request) {
    let userId: string | null = null;
    let userEmail: string | null = null;
    try {
        const session = await getServerSession(authOptions);
        userId = (session?.user as any)?.id || null;
        userEmail = session?.user?.email || null;

        if (!process.env.DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY.includes('your_deepseek_key_here')) {
            return new Response(
                'Derek is unavailable because the DeepSeek API key is missing.\n\nSet DEEPSEEK_API_KEY in your .env (get one at platform.deepseek.com → API Keys) and restart the dev server.',
                { status: 200, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
            );
        }

        const { message, history, file } = await req.json() as {
            message: string;
            history: { role: string; content: string }[];
            file?: FilePayload;
        };

        if (!message) return NextResponse.json({ error: 'Message is required' }, { status: 400 });

        await connectToDatabase();

        // Server-side enforcement of the free-use cap for logged-in Free
        // accounts. Guests are capped client-side only (no user doc to
        // track usage against) — same pattern the rest of the app uses.
        let plan: 'Free' | 'Pro' = 'Free';
        if (userId) {
            const userDoc = await User.findById(userId).select('plan trialUses').lean();
            plan = (userDoc?.plan as 'Free' | 'Pro') || 'Free';
            const trialUses = userDoc?.trialUses ?? 0;
            if (plan === 'Free' && trialUses >= FREE_LIMIT) {
                return NextResponse.json(
                    { error: 'limit_reached', usesLeft: 0, limit: FREE_LIMIT, message: 'Upgrade options are coming soon — free Derek uses are limited for now.' },
                    { status: 403 }
                );
            }
        }

        const systemPrompt = await buildDerekSystemPrompt();

        const inputItems: { role: 'user' | 'assistant'; content: string }[] = [];
        if (Array.isArray(history)) {
            for (const msg of history) {
                if (msg.content && (msg.role === 'user' || msg.role === 'ai')) {
                    inputItems.push({ role: msg.role === 'user' ? 'user' : 'assistant', content: msg.content });
                }
            }
        }
        inputItems.push({ role: 'user', content: buildUserMessage(message, file) });

        const stream = await deepseek.responses.create({
            model: DEEPSEEK_MODEL,
            instructions: systemPrompt,
            input: inputItems,
            stream: true,
        });

        const readable = new ReadableStream({
            async start(controller) {
                const encoder = new TextEncoder();
                let fullText = '';
                try {
                    for await (const event of stream) {
                        if (event.type === 'response.output_text.delta') {
                            const delta = event.delta ?? '';
                            fullText += delta;
                            controller.enqueue(encoder.encode(delta));
                        }
                    }

                    await logAiUsage({
                        userId,
                        userEmail,
                        feature: 'derek',
                        model: DEEPSEEK_MODEL,
                        success: true,
                    });

                    const structured = parseStructuredPrompt(fullText);
                    let savedBuildId: string | null = null;

                    if (userId) {
                        if (plan === 'Free') {
                            await User.findByIdAndUpdate(userId, { $inc: { trialUses: 1 } });
                        }
                        if (structured) {
                            const title = deriveBuildTitle(structured, message);
                            const fav = await Favourite.create({
                                userId,
                                title,
                                promptText: fullText.trim(),
                                source: 'generated',
                            });
                            savedBuildId = fav._id.toString();
                        }
                    }

                    const meta = JSON.stringify({ mode: structured ? 'job1' : 'job2', favouriteId: savedBuildId });
                    controller.enqueue(encoder.encode(`${META_SEPARATOR}${meta}`));
                } catch (err) {
                    await logApiError('/api/chat/derek', err);
                    await logAiUsage({
                        userId,
                        userEmail,
                        feature: 'derek',
                        model: DEEPSEEK_MODEL,
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
        console.error('Derek API Error:', error);
        await logApiError('/api/chat/derek', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        await logAiUsage({
            userId,
            userEmail,
            feature: 'derek',
            model: DEEPSEEK_MODEL,
            success: false,
            errorMessage: message,
        });
        const lowerMessage = message.toLowerCase();
        const status = (error as any)?.status;
        if (lowerMessage.includes('api key') || status === 401) {
            return new Response(
                'Derek is unavailable because the DeepSeek API key is invalid.\n\nSet DEEPSEEK_API_KEY in your .env and restart the dev server.',
                { status: 200, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
            );
        }
        if (lowerMessage.includes('insufficient balance') || status === 402) {
            return new Response(
                "Derek is temporarily unavailable — the DeepSeek account has run out of balance.\n\nAdd funds at platform.deepseek.com and try again.",
                { status: 200, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
            );
        }
        if (status === 429 || lowerMessage.includes('rate limit')) {
            return new Response(
                "Derek is getting a lot of requests right now — please try again in a moment.",
                { status: 200, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
            );
        }
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
