import * as React from "react"
import { cn } from "@/lib/utils"

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[100px] w-full rounded-xl border border-[oklch(0.92_0.01_120)] bg-white px-3 py-2 text-sm",
          "placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.55_0.15_145)]",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"
export { Textarea }
