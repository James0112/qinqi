import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "亲戚必问 - 春节聚会应对神器",
  description: "用AI帮你巧妙回应亲戚的各种提问",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-white text-neutral-900">{children}</body>
    </html>
  );
}
