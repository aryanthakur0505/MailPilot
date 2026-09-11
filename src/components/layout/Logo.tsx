// ==================================================
// MailPilot — Logo Component
// ==================================================

import { Mail } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

const sizes = {
  sm: { icon: 14, box: "size-6 rounded-md", text: "text-sm" },
  md: { icon: 16, box: "size-7 rounded-lg", text: "text-[15px]" },
  lg: { icon: 20, box: "size-9 rounded-lg", text: "text-xl" },
};

export function Logo({ size = "md", showText = true, className }: LogoProps) {
  const s = sizes[size];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          "flex shrink-0 items-center justify-center bg-primary text-primary-foreground",
          s.box
        )}
      >
        <Mail size={s.icon} strokeWidth={2} />
      </div>
      {showText && (
        <span className={cn("font-heading font-semibold tracking-tight", s.text)}>
          MailPilot
        </span>
      )}
    </div>
  );
}
