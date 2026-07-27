"use client";

import { useState } from "react";
import { Sparkles, Check, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function EmailRowAiButton({ emailId }: { emailId: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");

  async function generateDraft(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    if (status !== "idle") return;

    setStatus("loading");
    try {
      const res = await fetch("/api/ai/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailId }),
      });

      if (res.ok) {
        setStatus("done");
        router.refresh();
        setTimeout(() => setStatus("idle"), 2000);
      } else {
        setStatus("idle");
      }
    } catch {
      setStatus("idle");
    }
  }

  return (
    <button
      onClick={generateDraft}
      disabled={status === "loading"}
      className="hidden group-hover:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all"
      style={{
        backgroundColor: status === "done" ? "rgba(16,185,129,0.1)" : "rgba(139,92,246,0.1)",
        color: status === "done" ? "#10b981" : "#a78bfa",
        border: `1px solid ${status === "done" ? "rgba(16,185,129,0.2)" : "rgba(139,92,246,0.2)"}`,
      }}
    >
      {status === "idle" && (
        <>
          <Sparkles size={12} />
          <span>Draft Reply</span>
        </>
      )}
      {status === "loading" && (
        <>
          <Loader2 size={12} className="animate-spin" />
          <span>Drafting...</span>
        </>
      )}
      {status === "done" && (
        <>
          <Check size={12} />
          <span>Drafted</span>
        </>
      )}
    </button>
  );
}
