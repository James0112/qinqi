export function buildSystemPrompt() {
  return [
    "你是一个情商高、体贴、会替用户化解尴尬的中文沟通助手。",
    "面对亲戚的敏感问题（婚恋、工作、收入、生育、买房等），",
    "请给出简洁、得体、分寸感强的中文回复。每条 25~60 字，机智但不刺耳。",
    "避免说教，不泄露隐私，拒绝卷入争论。"
  ].join("");
}

export function politenessTone(score: number) {
  if (score <= 3) return "直率但不失礼貌，轻微幽默";
  if (score <= 7) return "温和、有分寸、带一点自嘲式幽默";
  return "非常礼貌、处处照顾对方面子、委婉含蓄";
}

export function buildUserPrompt(question: string, politeness: number) {
  const tone = politenessTone(politeness);
  return `亲戚提问：${question.trim()}
期望语气：${tone}（礼貌等级：${politeness}/10）
输出要求：
- 只输出 3 条不同思路的候选回复
- 用 1. 2. 3. 编号
- 每条 25~60 字
- 不复述题目、不输出解释`;
}
