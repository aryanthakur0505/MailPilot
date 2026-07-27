// ==================================================
// MailPilot — Button Component (Premium)
// ==================================================

import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
  isLoading?: boolean;
}

const variants: Record<string, { base: string; style: React.CSSProperties }> = {
  primary: {
    base: "text-white font-semibold",
    style: {
      background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
      boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
    },
  },
  secondary: {
    base: "font-medium",
    style: {
      backgroundColor: "var(--bg-elevated)",
      color: "var(--text-secondary)",
      border: "1px solid var(--border-default)",
    },
  },
  ghost: {
    base: "font-medium",
    style: {
      color: "var(--text-muted)",
      backgroundColor: "transparent",
    },
  },
  danger: {
    base: "font-medium",
    style: {
      backgroundColor: "rgba(248, 113, 113, 0.08)",
      color: "#f87171",
      border: "1px solid rgba(248, 113, 113, 0.15)",
    },
  },
};

const sizeStyles: Record<string, string> = {
  sm: "px-3 py-1.5 text-xs rounded-lg",
  md: "px-4 py-2.5 text-sm rounded-xl",
  lg: "px-6 py-3 text-base rounded-xl",
};

export function Button({
  variant = "primary",
  size = "md",
  children,
  isLoading,
  disabled,
  className = "",
  style,
  ...props
}: ButtonProps) {
  const v = variants[variant];

  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2
        transition-all duration-200 ease-out
        disabled:opacity-50 disabled:cursor-not-allowed
        active:scale-[0.97]
        ${v.base}
        ${sizeStyles[size]}
        ${className}
      `}
      style={{ ...v.style, ...style }}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle
            cx="12" cy="12" r="10"
            stroke="currentColor" strokeWidth="3"
            className="opacity-25"
          />
          <path
            d="M4 12a8 8 0 018-8"
            stroke="currentColor" strokeWidth="3"
            strokeLinecap="round"
            className="opacity-75"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
