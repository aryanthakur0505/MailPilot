"use client";

// ==================================================
// MailPilot — Draft Editor Component
// ==================================================
// Full inline editor for an AI-generated draft.
// Supports: edit body/subject, tone switch, regenerate,
// save edits, discard, and user-triggered send.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  RefreshCw,
  Send,
  Trash2,
  Save,
  Check,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { ToneSelector } from "./ToneSelector";
import type { DraftTone } from "@/lib/ai";

interface DraftEditorProps {
  draftId: string;
  emailId: string;
  initialSubject: string;
  initialBody: string;
  initialTone: DraftTone;
  replyTo: string;           // original sender email — shown for context
  replyToName: string;       // original sender name
}

type Status =
  | "idle"
  | "saving"
  | "saved"
  | "regenerating"
  | "sending"
  | "sent"
  | "error";

export function DraftEditor({
  draftId,
  emailId,
  initialSubject,
  initialBody,
  initialTone,
  replyTo,
  replyToName,
}: DraftEditorProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);
  const [tone, setTone] = useState<DraftTone>(initialTone as DraftTone);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [showSendConfirm, setShowSendConfirm] = useState(false);

  // ------------------------------------------------------------------
  // Save edits
  // ------------------------------------------------------------------
  async function handleSave() {
    setStatus("saving");
    setErrorMsg("");
    try {
      const res = await fetch(`/api/ai/drafts/${draftId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body, subject }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setStatus("error");
      setErrorMsg(message);
    }
  }

  // ------------------------------------------------------------------
  // Regenerate with selected tone
  // ------------------------------------------------------------------
  async function handleRegenerate() {
    setStatus("regenerating");
    setErrorMsg("");
    try {
      const res = await fetch(`/api/ai/drafts/${draftId}/regenerate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tone }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const { draft } = await res.json();
      setBody(draft.body);
      setSubject(draft.subject ?? subject);
      setStatus("idle");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setStatus("error");
      setErrorMsg(message);
    }
  }

  // ------------------------------------------------------------------
  // Discard draft
  // ------------------------------------------------------------------
  async function handleDiscard() {
    setStatus("saving");
    try {
      await fetch(`/api/ai/drafts/${draftId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "discarded" }),
      });
      startTransition(() => router.refresh());
    } catch {
      setStatus("error");
      setErrorMsg("Failed to discard draft.");
    }
  }

  // ------------------------------------------------------------------
  // Send email (user-confirmed)
  // ------------------------------------------------------------------
  async function handleSend() {
    setShowSendConfirm(false);
    setStatus("sending");
    setErrorMsg("");
    try {
      const res = await fetch(`/api/emails/${emailId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draftId }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setStatus("sent");
      setTimeout(() => {
        startTransition(() => router.refresh());
      }, 1500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setStatus("error");
      setErrorMsg(message);
    }
  }

  const isProcessing = ["saving", "regenerating", "sending"].includes(status);

  // ------------------------------------------------------------------
  // Sent state
  // ------------------------------------------------------------------
  if (status === "sent") {
    return (
      <div
        className="rounded-2xl p-8 flex flex-col items-center justify-center gap-3 text-center"
        style={{
          backgroundColor: "var(--bg-elevated)",
          border: "1px solid rgba(52,211,153,0.25)",
        }}
      >
        <div
          className="flex h-12 w-12 items-center justify-center rounded-full"
          style={{ background: "rgba(52,211,153,0.15)" }}
        >
          <Check size={22} style={{ color: "#34d399" }} />
        </div>
        <p className="text-sm font-semibold" style={{ color: "#34d399" }}>
          Email sent!
        </p>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Sent to {replyToName || replyTo}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Reply-to context bar */}
      <div
        className="flex items-center gap-2 text-xs rounded-lg px-3 py-2"
        style={{
          backgroundColor: "var(--bg-elevated)",
          color: "var(--text-muted)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <Send size={11} />
        <span>
          Reply to{" "}
          <span style={{ color: "var(--text-secondary)" }}>
            {replyToName || replyTo}
          </span>
          {" "}·{" "}
          <span style={{ color: "var(--text-faint)" }}>{replyTo}</span>
        </span>
      </div>

      {/* Subject */}
      <div>
        <label
          className="block text-xs font-medium mb-1.5"
          style={{ color: "var(--text-muted)" }}
        >
          Subject
        </label>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          disabled={isProcessing}
          className="w-full rounded-xl px-4 py-2.5 text-sm transition-all duration-200 outline-none"
          style={{
            backgroundColor: "var(--bg-elevated)",
            color: "var(--text-primary)",
            border: "1px solid var(--border-subtle)",
          }}
          onFocus={(e) =>
            (e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)")
          }
          onBlur={(e) =>
            (e.currentTarget.style.borderColor = "var(--border-subtle)")
          }
        />
      </div>

      {/* Body textarea */}
      <div>
        <label
          className="block text-xs font-medium mb-1.5"
          style={{ color: "var(--text-muted)" }}
        >
          Reply Body
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          disabled={isProcessing}
          rows={10}
          className="w-full rounded-xl px-4 py-3 text-sm leading-relaxed resize-y transition-all duration-200 outline-none"
          style={{
            backgroundColor: "var(--bg-elevated)",
            color: "var(--text-secondary)",
            border: "1px solid var(--border-subtle)",
            fontFamily: "inherit",
          }}
          onFocus={(e) =>
            (e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)")
          }
          onBlur={(e) =>
            (e.currentTarget.style.borderColor = "var(--border-subtle)")
          }
        />
      </div>

      {/* Tone selector */}
      <ToneSelector value={tone} onChange={setTone} disabled={isProcessing} />

      {/* Error banner */}
      {status === "error" && errorMsg && (
        <div
          className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm"
          style={{
            backgroundColor: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.2)",
            color: "#f87171",
          }}
        >
          <AlertTriangle size={14} />
          {errorMsg}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Save edits */}
        <button
          onClick={handleSave}
          disabled={isProcessing}
          className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-150 active:scale-[0.97] disabled:opacity-40"
          style={{
            backgroundColor: "var(--bg-elevated)",
            color: status === "saved" ? "#34d399" : "var(--text-secondary)",
            border: `1px solid ${status === "saved" ? "rgba(52,211,153,0.3)" : "var(--border-subtle)"}`,
          }}
        >
          {status === "saving" ? (
            <Loader2 size={14} className="animate-spin" />
          ) : status === "saved" ? (
            <Check size={14} />
          ) : (
            <Save size={14} />
          )}
          {status === "saved" ? "Saved" : "Save Edits"}
        </button>

        {/* Regenerate */}
        <button
          onClick={handleRegenerate}
          disabled={isProcessing}
          className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-150 active:scale-[0.97] disabled:opacity-40"
          style={{
            backgroundColor: "rgba(99,102,241,0.08)",
            color: "#818cf8",
            border: "1px solid rgba(99,102,241,0.2)",
          }}
        >
          {status === "regenerating" ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <RefreshCw size={14} />
          )}
          {status === "regenerating" ? "Regenerating..." : "Regenerate"}
        </button>

        {/* Discard */}
        <button
          onClick={handleDiscard}
          disabled={isProcessing}
          className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-150 active:scale-[0.97] disabled:opacity-40"
          style={{
            backgroundColor: "rgba(239,68,68,0.06)",
            color: "#f87171",
            border: "1px solid rgba(239,68,68,0.12)",
          }}
        >
          <Trash2 size={14} />
          Discard
        </button>

        {/* Send — spacer then right-aligned */}
        <div className="flex-1" />
        <button
          onClick={() => setShowSendConfirm(true)}
          disabled={isProcessing}
          className="flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition-all duration-150 active:scale-[0.97] disabled:opacity-40"
          style={{
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            color: "white",
            boxShadow: "0 4px 12px rgba(99,102,241,0.3)",
          }}
        >
          {status === "sending" ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Send size={14} />
          )}
          {status === "sending" ? "Sending..." : "Send Email"}
        </button>
      </div>

      {/* Send confirmation dialog */}
      {showSendConfirm && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50"
            style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
            onClick={() => setShowSendConfirm(false)}
          />
          {/* Dialog */}
          <div
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md rounded-2xl p-6 shadow-2xl"
            style={{
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            {/* Icon */}
            <div
              className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
            >
              <Send size={20} className="text-white" />
            </div>

            <h2
              className="text-center text-lg font-semibold mb-2"
              style={{ color: "var(--text-primary)" }}
            >
              Send this email?
            </h2>
            <p
              className="text-center text-sm mb-1"
              style={{ color: "var(--text-muted)" }}
            >
              This will send your reply to{" "}
              <span style={{ color: "var(--text-secondary)" }}>
                {replyToName || replyTo}
              </span>
            </p>
            <p
              className="text-center text-xs mb-6"
              style={{ color: "var(--text-faint)" }}
            >
              Subject: {subject}
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowSendConfirm(false)}
                className="flex-1 rounded-xl py-2.5 text-sm font-medium transition-all"
                style={{
                  backgroundColor: "var(--bg-elevated)",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all"
                style={{
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  color: "white",
                  boxShadow: "0 4px 12px rgba(99,102,241,0.3)",
                }}
              >
                <Send size={14} />
                Yes, Send
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
