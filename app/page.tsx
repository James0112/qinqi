"use client"
import * as React from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Card } from "@/components/ui/card"

export default function Page() {
  const [question, setQuestion] = React.useState("阿姨问：什么时候结婚呀？")
  const [politeness, setPoliteness] = React.useState<number[]>([7])
  const [replies, setReplies] = React.useState<string[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string>("")

  async function handleGenerate() {
    if (!question.trim()) return
    setLoading(true); setError(""); setReplies([])
    try {
      const r = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, politeness: politeness[0] }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data?.error || "生成失败")
      setReplies(data.responses || [])
    } catch (e:any) {
      setError(e?.message || "网络错误")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[oklch(0.97_0.008_120)]">
      <div className="mx-auto max-w-2xl px-4 py-8 md:py-12">
        <div className="text-center mb-8 md:mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-[oklch(0.55_0.15_145)] rounded-2xl mb-4 shadow-lg">
            <span className="text-white text-2xl">问</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">亲戚必问</h1>
          <p className="text-neutral-500 text-sm md:text-base">春节聚会，轻松应对亲戚提问</p>
        </div>

        <Card className="p-6 md:p-8 mb-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">亲戚的提问</label>
              <Textarea value={question} onChange={(e)=>setQuestion(e.target.value)} placeholder="例如：什么时候结婚啊？工资多少啊？" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium">礼貌程度</label>
                <span className="text-2xl font-bold text-[oklch(0.55_0.15_145)]">{politeness[0]}</span>
              </div>
              <Slider min={1} max={10} step={1} value={politeness} onValueChange={setPoliteness} />
              <div className="flex justify-between text-xs text-neutral-500 mt-2">
                <span>直接</span><span>委婉</span>
              </div>
            </div>

            <Button className="w-full h-12 text-base" onClick={handleGenerate} disabled={loading || !question.trim()}>
              {loading ? "生成中…" : "开始回应"}
            </Button>
          </div>
        </Card>

        {error && <div className="text-sm text-red-600">{error}</div>}

        {replies.length > 0 && (
          <Card className="p-6 md:p-8 space-y-3">
            {replies.map((t,i)=>(
              <div key={i} className="p-3 rounded-xl bg-neutral-50 border text-sm leading-relaxed">
                <span className="mr-2 text-neutral-400">{i+1}.</span>{t}
              </div>
            ))}
          </Card>
        )}

        <div className="text-center mt-12 text-xs text-neutral-400">
          仅供娱乐参考，请根据实际情况灵活应对
        </div>
      </div>
    </main>
  )
}
