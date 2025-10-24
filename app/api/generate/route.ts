// app/api/generate/route.ts
import { NextResponse } from "next/server";
import { buildSystemPrompt, buildUserPrompt } from "@/lib/prompt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// 可按需调整靠近你或 OpenRouter 的区域，留空也没问题
export const preferredRegion: string[] = ["hkg1", "sin1", "pdx1"];

/** 将 header 值转为 ASCII，避免 ByteString 错误 */
function asciiHeader(val: string | undefined, fallback: string) {
  if (!val) return fallback;
  const ascii = val.replace(/[^\x00-\x7F]/g, "");
  return ascii || fallback;
}

/** 带超时的 fetch */
async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit & { timeoutMs?: number } = {}
) {
  const { timeoutMs = 30_000, ...rest } = init;
  const ac = new AbortController();
  const id = setTimeout(() => ac.abort(), timeoutMs);
  try {
    // @ts-ignore: undici in Vercel supports signal
    return await fetch(input, { ...rest, signal: ac.signal });
  } finally {
    clearTimeout(id);
  }
}

/** 指数退避重试（处理 429/5xx） */
async function callOpenRouter(body: any, tries = 3) {
  let lastTxt = "";
  for (let i = 0; i < tries; i++) {
    const resp = await fetchWithTimeout("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY!}`,
        "HTTP-Referer": asciiHeader(process.env.OPENROUTER_SITE_URL, "https://example.com"),
        "X-Title": asciiHeader(process.env.OPENROUTER_SITE_NAME, "Qinqi Ask"),
      },
      body: JSON.stringify(body),
      timeoutMs: 30_000,
      cache: "no-store",
    });

    if (resp.ok) {
      return await resp.json();
    }

    lastTxt = await resp.text().catch(() => "");

    // 429 或 5xx：退避重试
    if (resp.status === 429 || (resp.status >= 500 && resp.status <= 599)) {
      const backoff = Math.min(2000, 500 * 2 ** i) + Math.floor(Math.random() * 250);
      await new Promise((r) => setTimeout(r, backoff));
      continue;
    }

    // 其它错误直接抛出
    throw new Error(`OpenRouter HTTP ${resp.status} ${lastTxt.slice(0, 800)}`);
  }
  throw new Error(`OpenRouter HTTP 429/5xx after retries: ${lastTxt.slice(0, 800)}`);
}

/** 健康检查：GET /api/generate */
export async function GET() {
  return NextResponse.json({
    ok: true,
    tip: "use POST to generate",
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY ? "✅" : "❌",
  });
}

/** 生成回复：POST /api/generate  */
export async function POST(req: Request) {
  try {
    const { question, politeness } = await req.json();
    if (!question || typeof politeness !== "number") {
      return NextResponse.json({ error: "请提供有效的问题和礼貌程度" }, { status: 400 });
    }
    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: "服务端未读取到 OPENROUTER_API_KEY（请在 Vercel 环境变量里配置，并 Redeploy）" },
        { status: 500 }
      );
    }

    // 模型兜底列表：优先使用 free，失败再试后备模型
    const models =
      (process.env.OPENROUTER_MODELS &&
        process.env.OPENROUTER_MODELS.split(",").map((s) => s.trim()).filter(Boolean)) ||
      ["deepseek/deepseek-r1:free", "deepseek/deepseek-chat", "gpt-4o-mini"];

    let data: any | null = null;
    let lastErr: any = null;

    for (const model of models) {
      try {
        data = await callOpenRouter(
          {
            model,
            messages: [
              { role: "system", content: buildSystemPrompt() },
              { role: "user", content: buildUserPrompt(question, politeness) },
            ],
            temperature: 0.8,
            top_p: 0.9,
          },
          3 // 重试次数
        );
        break; // 成功则退出循环
      } catch (e) {
        lastErr = e;
        // 试下一个模型
        continue;
      }
    }

    if (!data) {
      return NextResponse.json(
        { error: "OpenRouter 调用失败（多次限流/故障）", detail: String(lastErr?.message || "") },
        { status: 502 }
      );
    }

    const text: string = data?.choices?.[0]?.message?.content || "";

    // 解析出 3 条
    const lines = text
      .split(/\n+/)
      .map((s) => s.replace(/^\s*\d+[\.、)]\s*/, "").trim())
      .filter(Boolean)
      .slice(0, 3);

    if (lines.length === 0) {
      return NextResponse.json({ error: "生成回复失败（返回内容为空）" }, { status: 502 });
    }

    return NextResponse.json({ responses: lines });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: `OpenRouter 调用失败：${err?.message || "Unknown error"}`,
        cause: String(err?.cause || ""),
      },
      { status: 502 }
    );
  }
}
