import * as React from "react"
import { cn } from "@/lib/utils"

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-2xl border border-[oklch(0.92_0.01_120)] bg-white shadow-sm", className)} {...props} />
}
