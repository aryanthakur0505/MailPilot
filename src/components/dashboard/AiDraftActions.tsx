"use client";

// ==================================================
// MailPilot — AI Draft Actions (Client Component)
// ==================================================
// Copy to clipboard + Discard button for draft cards.

import { useState } from "react";
import { Copy, Trash2, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

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
      <Button
        onClick={handleCopy}
        className={copied ? "gap-2 bg-emerald-600 hover:bg-emerald-600/90" : "gap-2"}
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
      </Button>

      <Button variant="destructive" onClick={handleDiscard} disabled={discarding} className="gap-2">
        <Trash2 size={14} />
        {discarding ? "Discarding..." : "Discard"}
      </Button>
    </div>
  );
}
