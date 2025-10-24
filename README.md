# 亲戚必问（本地运行）

技术栈：Next.js (App Router) + TypeScript + TailwindCSS + shadcn 风格 UI（无数据库）

## 快速开始

```bash
pnpm i
# 或 npm i / yarn

# 配置环境变量
cp .env.local.sample .env.local
# 打开 .env.local，把 OPENROUTER_API_KEY= 填上你的 Key

# 本地运行
pnpm dev
# 打开 http://localhost:3000
```

## 环境变量

在 `.env.local` 中：

```
OPENROUTER_API_KEY=your_key_here
OPENROUTER_SITE_URL=http://localhost:3000
OPENROUTER_SITE_NAME=亲戚必问
```

> 注意：不要把 Key 放到前端代码。你本次在聊天中贴出的 Key 建议在 OpenRouter 控制台**立即重置**。

## 目录

- `app/page.tsx`：前端页面，输入问题、选择礼貌程度、生成 3 条回复。
- `app/api/generate/route.ts`：服务端调用 OpenRouter，并返回结构化结果。
- `lib/prompt.ts`：提示词拼装。
- `components/ui/*`：轻量的 shadcn 风格组件（Button/Slider/Textarea/Card）。

## 说明

- 默认使用 `deepseek/deepseek-r1:free`，如遇到限流，可更换非 free 型号或稍后再试。
- 若要部署到 Vercel，请在项目 Settings → Environment Variables 设置同名变量即可。
