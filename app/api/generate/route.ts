import { NextResponse } from "next/server";
import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { buildSystemPrompt, buildUserPrompt } from "@/lib/prompt";

export const runtime = "nodejs";

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "http://localhost:3000",
    "X-Title": process.env.OPENROUTER_SITE_NAME || "亲戚必问",
  },
});

export async function POST(req: Request) {
  try {
    const { question, politeness } = await req.json();
    if (!question || typeof politeness !== "number") {
      return NextResponse.json({ error: "请提供有效的问题和礼貌程度" }, { status: 400 });
    }

    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: buildSystemPrompt() },
      { role: "user",   content: buildUserPrompt(question, politeness) },
    ];

    const completion = await openai.chat.completions.create({
      model: "deepseek/deepseek-r1:free",
      messages,
      temperature: 0.8,
      top_p: 0.9,
    });

    const text = completion?.choices?.[0]?.message?.content ?? "";
    const lines = text
      .split(/\n+/)
      .map((s) => s.replace(/^\s*\d+[\.、)]\s*/, "").trim())
      .filter(Boolean)
      .slice(0, 3);

    if (lines.length === 0) {
      return NextResponse.json({ error: "生成回复失败，请重试" }, { status: 502 });
    }
    return NextResponse.json({ responses: lines });
  } catch (err: any) {
    return NextResponse.json(
      { error: `OpenRouter 调用失败：${err?.message || "Unknown error"}`, cause: String(err?.cause || "") },
      { status: 502 }
    );
  }
}
