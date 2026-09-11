"use client";

import { useState } from "react";
import { Sparkles, Check, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
    <Button
      variant="secondary"
      size="sm"
      onClick={generateDraft}
      disabled={status === "loading"}
      className={cn(
        "hidden gap-1.5 group-hover:flex",
        status === "done" && "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/15 dark:text-emerald-400"
      )}
    >
      {status === "idle" && (
        <>
          <Sparkles size={12} />
          Draft Reply
        </>
      )}
      {status === "loading" && (
        <>
          <Loader2 size={12} className="animate-spin" />
          Drafting...
        </>
      )}
      {status === "done" && (
        <>
          <Check size={12} />
          Drafted
        </>
      )}
    </Button>
  );
}
