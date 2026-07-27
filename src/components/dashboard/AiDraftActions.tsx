"use client";

// ==================================================
// MailPilot — AI Draft Actions (Client Component)
// ==================================================
// Copy to clipboard + Discard button for draft cards.

import { useState } from "react";
import { Copy, Trash2, Check } from "lucide-react";
import { useRouter } from "next/navigation";

interface AiDraftActionsProps {
  draftId: string;
  body: string;
  subject: string;
}

export function AiDraftActions({ draftId, body, subject }: AiDraftActionsProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [discarding, setDiscarding] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleDiscard() {
    setDiscarding(true);
    try {
      await fetch(`/api/ai/drafts/${draftId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "discarded" }),
      });
      router.refresh();
    } catch {
      setDiscarding(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleCopy}
        className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 active:scale-[0.98]"
        style={{
          background: copied
            ? "linear-gradient(135deg, #059669, #10b981)"
            : "linear-gradient(135deg, #6366f1, #8b5cf6)",
          color: "white",
          boxShadow: copied
            ? "0 4px 12px rgba(5,150,105,0.3)"
            : "0 4px 12px rgba(99,102,241,0.3)",
        }}
      >
        {copied ? (
          <>
            <Check size={14} />
            Copied!
          </>
        ) : (
          <>
            <Copy size={14} />
            Copy Draft
          </>
        )}
      </button>

      <button
        onClick={handleDiscard}
        disabled={discarding}
        className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 active:scale-[0.98]"
        style={{
          backgroundColor: "rgba(239,68,68,0.08)",
          color: "#f87171",
          border: "1px solid rgba(239,68,68,0.15)",
        }}
      >
        <Trash2 size={14} />
        {discarding ? "Discarding..." : "Discard"}
      </button>
    </div>
  );
}
