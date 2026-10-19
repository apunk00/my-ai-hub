import { NextResponse } from "next/server";
import { OpenRouter } from "@openrouter/sdk";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

const openrouter = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

const MAX_MESSAGE_LENGTH = 2000;

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "1 m"),
  prefix: "chat",
});

export async function POST(req: Request) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    const { success } = await ratelimit.limit(ip);
    if (!success) {
      return NextResponse.json(
        { error: "Masyadong maraming request. Subukan ulit mamaya." },
        { status: 429 }
      );
    }

    const { message, model } = await req.json();

    if (typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: "Walang mensahe." }, { status: 400 });
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
