// ==================================================
// MailPilot — Logo Component
// ==================================================

import { Mail } from "lucide-react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

const sizes = {
  sm: { icon: 16, text: "text-base", container: "p-1.5" },
  md: { icon: 18, text: "text-[15px]", container: "p-2" },
  lg: { icon: 24, text: "text-xl", container: "p-2.5" },
};

export function Logo({ size = "md", showText = true }: LogoProps) {
  const s = sizes[size];

  return (
    <div className="flex items-center gap-2.5">
      {/* Logo mark */}
      <div
        className={`relative flex items-center justify-center rounded-xl ${s.container}`}
        style={{
          background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
          boxShadow:
            "0 4px 12px rgba(99, 102, 241, 0.35), inset 0 1px 0 rgba(255,255,255,0.15)",
        }}
      >
        <Mail size={s.icon} className="text-white" strokeWidth={2} />
        {/* Online indicator dot */}
        <div
          className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full"
          style={{
            backgroundColor: "#34d399",
            boxShadow: "0 0 6px rgba(52, 211, 153, 0.8)",
            border: "1.5px solid var(--bg-surface)",
          }}
        />
      </div>

      {showText && (
        <div>
          <span
            className={`${s.text} font-bold tracking-tight`}
            style={{
              background: "linear-gradient(135deg, #ffffff 0%, #94a3b8 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            MailPilot
          </span>
        </div>
      )}
    </div>
  );
}
