"use client";
// ==================================================
// MailPilot — Sync Button (Client Component)
// ==================================================
// Triggers POST /api/sync and refreshes the page on success.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, CheckCircle, AlertCircle } from "lucide-react";

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
      // Refresh server component data
      router.refresh();
      setTimeout(() => setState("idle"), 3000);
    } catch {
      setState("error");
      setMessage("Network error. Try again.");
      setTimeout(() => setState("idle"), 4000);
    }
  };

  const isLoading = state === "syncing";
  const isSuccess = state === "success";
  const isError = state === "error";

  return (
    <div className="flex flex-col items-end gap-2 shrink-0">
      <button
        onClick={handleSync}
        disabled={isLoading}
        className="inline-flex items-center gap-2 text-sm font-semibold rounded-xl px-4 py-2.5 transition-all duration-200 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          background: isSuccess
            ? "linear-gradient(135deg, #059669, #34d399)"
            : isError
            ? "linear-gradient(135deg, #dc2626, #f87171)"
            : "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
          color: "white",
          boxShadow: isSuccess
            ? "0 4px 12px rgba(52, 211, 153, 0.3)"
            : isError
            ? "0 4px 12px rgba(248, 113, 113, 0.3)"
            : "0 4px 12px rgba(99, 102, 241, 0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
        }}
        onMouseEnter={(e) => {
          if (!isLoading) {
            (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = isSuccess
              ? "0 6px 18px rgba(52, 211, 153, 0.45)"
              : isError
              ? "0 6px 18px rgba(248, 113, 113, 0.45)"
              : "0 6px 20px rgba(99, 102, 241, 0.45), inset 0 1px 0 rgba(255,255,255,0.1)";
          }
        }}
        onMouseLeave={(e) => {
          if (!isLoading) {
            (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = isSuccess
              ? "0 4px 12px rgba(52, 211, 153, 0.3)"
              : isError
              ? "0 4px 12px rgba(248, 113, 113, 0.3)"
              : "0 4px 12px rgba(99, 102, 241, 0.3), inset 0 1px 0 rgba(255,255,255,0.1)";
          }
        }}
      >
        <RefreshCw
          size={14}
          className={isLoading ? "animate-spin" : ""}
          strokeWidth={2.5}
        />
        {isLoading
          ? "Syncing…"
          : isSuccess
          ? "Synced!"
          : hasAccount
          ? "Sync Now"
          : "Connect Gmail"}
      </button>

      {/* Status message */}
      {message && (
        <div
          className="flex items-center gap-1.5 text-xs animate-fade-in"
          style={{ color: state === "error" ? "#f87171" : "#34d399" }}
        >
          {state === "error" ? (
            <AlertCircle size={11} />
          ) : (
            <CheckCircle size={11} />
          )}
          <span>{message}</span>
        </div>
      )}
    </div>
  );
}
