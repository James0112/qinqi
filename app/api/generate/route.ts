import { NextResponse } from "next/server";
import { buildSystemPrompt, buildUserPrompt } from "@/lib/prompt";

export const runtime = "nodejs"; // 在 Vercel 用 Node 运行时更稳

// 在文件顶部加一个小工具，确保 header 值是 ASCII
function asciiHeader(val: string | undefined, fallback: string) {
  if (!val) return fallback;
  // 删除所有非 ASCII 字符
  const ascii = val.replace(/[^\x00-\x7F]/g, "");
  return ascii || fallback;
}

// 小工具：带超时的 fetch
async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit & { timeoutMs?: number } = {}) {
  const { timeoutMs = 15000, ...rest } = init;
  const ac = new AbortController();
  const id = setTimeout(() => ac.abort(), timeoutMs);
  try {
    // @ts-ignore
    return await fetch(input, { ...rest, signal: ac.signal });
  } finally {
    clearTimeout(id);
  }
}

export async function GET() {
  // 健康探测，便于你直接访问 /api/generate 看是否正常返回 JSON
  const hasKey = Boolean(process.env.OPENROUTER_API_KEY);
  return NextResponse.json({
    ok: true,
    tip: "use POST to generate",
    OPENROUTER_API_KEY: hasKey ? "✅" : "❌",
  });
}

export async function POST(req: Request) {
  try {
    const { question, politeness } = await req.json();
    if (!question || typeof politeness !== "number") {
      return NextResponse.json({ error: "请提供有效的问题和礼貌程度" }, { status: 400 });
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json({ error: "服务端未读取到 OPENROUTER_API_KEY（请在 Vercel 环境变量里配置，并 Redeploy）" }, { status: 500 });
    }

    const resp = await fetchWithTimeout("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY!}`,
        // 这两个是可选头：必须用 ASCII
        "HTTP-Referer": asciiHeader(process.env.OPENROUTER_SITE_URL, "https://example.com"),
        "X-Title": asciiHeader(process.env.OPENROUTER_SITE_NAME, "Qinqi Ask"),
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-r1:free",
        messages: [
          { role: "system", content: buildSystemPrompt() },
          { role: "user",   content: buildUserPrompt(question, politeness) },
        ],
        temperature: 0.8,
        top_p: 0.9,
      }),
      timeoutMs: 20000,
      // Vercel 上默认 undici，保持默认即可；不指定 keep-alive，避免偶发连接复用问题
    });

    if (!resp.ok) {
      const txt = await resp.text().catch(() => "");
      return NextResponse.json({ error: `OpenRouter HTTP ${resp.status}`, detail: txt.slice(0, 500) }, { status: 502 });
    }

    const data = await resp.json();
    const text: string = data?.choices?.[0]?.message?.content || "";

    const lines = text
      .split(/\n+/)
      .map(s => s.replace(/^\s*\d+[\.、)]\s*/, "").trim())
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
