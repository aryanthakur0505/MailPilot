"use client";

// ==================================================
// MailPilot — Tone Selector Component
// ==================================================
// Four-button toggle for selecting draft tone.

import { type DraftTone } from "@/lib/ai";

interface ToneSelectorProps {
  value: DraftTone;
  onChange: (tone: DraftTone) => void;
  disabled?: boolean;
}

const tones: { value: DraftTone; label: string; emoji: string }[] = [
  { value: "professional", label: "Professional", emoji: "💼" },
  { value: "friendly",     label: "Friendly",     emoji: "😊" },
  { value: "brief",        label: "Brief",         emoji: "⚡" },
  { value: "detailed",     label: "Detailed",      emoji: "📋" },
];

export function ToneSelector({ value, onChange, disabled }: ToneSelectorProps) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span
        className="text-xs font-medium mr-1"
        style={{ color: "var(--text-muted)" }}
      >
        Tone:
      </span>
      {tones.map((tone) => {
        const isActive = value === tone.value;
        return (
          <button
            key={tone.value}
            onClick={() => onChange(tone.value)}
            disabled={disabled}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97]"
            style={
              isActive
                ? {
                    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                    color: "white",
                    boxShadow: "0 2px 8px rgba(99,102,241,0.35)",
                  }
                : {
                    backgroundColor: "var(--bg-elevated)",
                    color: "var(--text-secondary)",
                    border: "1px solid var(--border-subtle)",
                  }
            }
          >
            <span>{tone.emoji}</span>
            {tone.label}
          </button>
        );
      })}
    </div>
  );
}
