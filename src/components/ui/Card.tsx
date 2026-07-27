// ==================================================
// MailPilot — Card Component (Premium)
// ==================================================

import { ReactNode, CSSProperties } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  style?: CSSProperties;
}

export function Card({
  children,
  className = "",
  hover = false,
  glow = false,
  style,
}: CardProps) {
  return (
    <div
      className={`
        stat-card-shimmer relative rounded-2xl p-6 overflow-hidden
        bg-[var(--bg-card)] border border-[var(--border-subtle)]
        transition-all duration-200
        ${hover ? "hover:-translate-y-[2px] hover:border-[var(--border-default)] hover:bg-[var(--bg-card-hover)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.4),0_1px_3px_rgba(0,0,0,0.3),0_0_0_1px_rgba(99,102,241,0.06)]" : ""}
        ${glow ? "shadow-[0_0_40px_rgba(99,102,241,0.08)]" : ""}
        ${className}
      `}
      style={style}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mb-4 flex items-center justify-between ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h3
      className={`text-base font-semibold ${className}`}
      style={{ color: "var(--text-primary)" }}
    >
      {children}
    </h3>
  );
}

export function CardDescription({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={`text-sm ${className}`}
      style={{ color: "var(--text-muted)" }}
    >
      {children}
    </p>
  );
}
