import { NextResponse } from "next/server";
import { OpenRouter } from "@openrouter/sdk";

const openrouter = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { message, model } = await req.json();

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
