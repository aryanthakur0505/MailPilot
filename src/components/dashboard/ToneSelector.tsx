"use client";

// ==================================================
// MailPilot — Tone Selector Component
// ==================================================
// Four-button toggle for selecting draft tone.

import { type DraftTone } from "@/lib/ai";
import { Button } from "@/components/ui/button";

interface ToneSelectorProps {
  value: DraftTone;
  onChange: (tone: DraftTone) => void;
  disabled?: boolean;
}

const tones: { value: DraftTone; label: string; emoji: string }[] = [
  { value: "professional", label: "Professional", emoji: "💼" },
  { value: "friendly", label: "Friendly", emoji: "😊" },
  { value: "brief", label: "Brief", emoji: "⚡" },
  { value: "detailed", label: "Detailed", emoji: "📋" },
];

export function ToneSelector({ value, onChange, disabled }: ToneSelectorProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 text-xs font-medium text-muted-foreground">Tone:</span>
      {tones.map((tone) => (
        <Button
          key={tone.value}
          type="button"
          size="sm"
          variant={value === tone.value ? "default" : "outline"}
          disabled={disabled}
          onClick={() => onChange(tone.value)}
          className="gap-1.5"
        >
          <span>{tone.emoji}</span>
          {tone.label}
        </Button>
      ))}
    </div>
  );
}
