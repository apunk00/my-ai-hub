import { NextResponse } from "next/server";
import { OpenRouter } from "@openrouter/sdk";

const openrouter = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;
const MAX_MESSAGE_LENGTH = 2000;

const requestLog = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (requestLog.get(ip) || []).filter(
    (t) => now - t < RATE_WINDOW_MS
  );
  if (timestamps.length >= RATE_LIMIT) {
    requestLog.set(ip, timestamps);
    return true;
  }
  timestamps.push(now);
  requestLog.set(ip, timestamps);
  return false;
}

export async function POST(req: Request) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Masyadong maraming request. Subukan ulit mamaya." },
        { status: 429 }
      );
    }

    const { message, model } = await req.json();

    if (typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { error: "Walang mensahe." },
        { status: 400 }
      );
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: `Masyadong mahaba ang mensahe (max ${MAX_MESSAGE_LENGTH} characters).` },
        { status: 400 }
      );
    }

    const completion = await openrouter.chat.send({
      chatRequest: {
        model: model || "meta-llama/llama-3.3-70b-instruct",
        messages: [{ role: "user", content: message }],
        stream: false,
      },
    });

    if (!("choices" in completion)) {
      throw new Error("Hindi inaasahang stream response mula sa OpenRouter.");
    }

    const reply = completion.choices?.[0]?.message?.content || "Walang sagot mula sa modelo.";
    return NextResponse.json({ reply });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Nagkaroon ng problema sa pag-request." },
      { status: 500 }
    );
  }
}
