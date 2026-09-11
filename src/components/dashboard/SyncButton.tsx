"use client";
// ==================================================
// MailPilot — Sync Button (Client Component)
// ==================================================
// Triggers POST /api/sync and refreshes the page on success.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SyncButtonProps {
  hasAccount: boolean;
}

type SyncState = "idle" | "syncing" | "success" | "error";

export function SyncButton({ hasAccount }: SyncButtonProps) {
  const router = useRouter();
  const [state, setState] = useState<SyncState>("idle");
  const [message, setMessage] = useState("");

  const handleSync = async () => {
    setState("syncing");
    setMessage("");

    try {
      const res = await fetch("/api/sync", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setState("error");
        setMessage(data.error ?? "Sync failed.");
        setTimeout(() => setState("idle"), 4000);
        return;
      }

      setState("success");
      setMessage(data.message ?? `Synced ${data.synced} emails.`);
      router.refresh();
      setTimeout(() => setState("idle"), 3000);
    } catch {
      setState("error");
      setMessage("Network error. Try again.");
      setTimeout(() => setState("idle"), 4000);
    }
  };

  const isLoading = state === "syncing";

  return (
    <div className="flex shrink-0 flex-col items-end gap-2">
      <Button
        onClick={handleSync}
        disabled={isLoading}
        className={cn(
          "gap-2",
          state === "success" && "bg-emerald-600 hover:bg-emerald-600/90",
          state === "error" && "bg-destructive hover:bg-destructive/90"
        )}
      >
        <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} strokeWidth={2.5} />
        {isLoading ? "Syncing…" : state === "success" ? "Synced!" : hasAccount ? "Sync Now" : "Connect Gmail"}
      </Button>

      {message && (
        <div
          className={cn(
            "animate-fade-up flex items-center gap-1.5 text-xs",
            state === "error" ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"
          )}
        >
          {state === "error" ? <AlertCircle size={11} /> : <CheckCircle size={11} />}
          <span>{message}</span>
        </div>
      )}
    </div>
  );
}
