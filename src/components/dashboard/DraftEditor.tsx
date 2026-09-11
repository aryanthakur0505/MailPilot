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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface DraftEditorProps {
  draftId: string;
  emailId: string;
  initialSubject: string;
  initialBody: string;
  initialTone: DraftTone;
  replyTo: string; // original sender email — shown for context
  replyToName: string; // original sender name
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
  const [tone, setTone] = useState<DraftTone>(initialTone);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [showSendConfirm, setShowSendConfirm] = useState(false);

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
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Unknown error");
    }
  }

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
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Unknown error");
    }
  }

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
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Unknown error");
    }
  }

  const isProcessing = ["saving", "regenerating", "sending"].includes(status);

  if (status === "sent") {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-8 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-emerald-500/15">
          <Check size={22} className="text-emerald-600 dark:text-emerald-400" />
        </div>
        <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Email sent!</p>
        <p className="text-xs text-muted-foreground">Sent to {replyToName || replyTo}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Reply-to context bar */}
      <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
        <Send size={11} />
        <span>
          Reply to <span className="text-foreground/80">{replyToName || replyTo}</span>
          {" · "}
          <span>{replyTo}</span>
        </span>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`subject-${draftId}`}>Subject</Label>
        <Input
          id={`subject-${draftId}`}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          disabled={isProcessing}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`body-${draftId}`}>Reply Body</Label>
        <Textarea
          id={`body-${draftId}`}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          disabled={isProcessing}
          rows={10}
          className="leading-relaxed"
        />
      </div>

      <ToneSelector value={tone} onChange={setTone} disabled={isProcessing} />

      {status === "error" && errorMsg && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertTriangle size={14} />
          {errorMsg}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" onClick={handleSave} disabled={isProcessing} className="gap-1.5">
          {status === "saving" ? (
            <Loader2 size={14} className="animate-spin" />
          ) : status === "saved" ? (
            <Check size={14} className="text-emerald-600 dark:text-emerald-400" />
          ) : (
            <Save size={14} />
          )}
          {status === "saved" ? "Saved" : "Save Edits"}
        </Button>

        <Button variant="outline" onClick={handleRegenerate} disabled={isProcessing} className="gap-1.5">
          {status === "regenerating" ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <RefreshCw size={14} />
          )}
          {status === "regenerating" ? "Regenerating..." : "Regenerate"}
        </Button>

        <Button variant="destructive" onClick={handleDiscard} disabled={isProcessing} className="gap-1.5">
          <Trash2 size={14} />
          Discard
        </Button>

        <div className="flex-1" />

        <Button onClick={() => setShowSendConfirm(true)} disabled={isProcessing} className="gap-2">
          {status === "sending" ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          {status === "sending" ? "Sending..." : "Send Email"}
        </Button>
      </div>

      {/* Send confirmation dialog */}
      <Dialog open={showSendConfirm} onOpenChange={setShowSendConfirm}>
        <DialogContent className="sm:max-w-md">
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Send size={20} />
          </div>
          <DialogHeader className="text-center">
            <DialogTitle className="text-center">Send this email?</DialogTitle>
            <DialogDescription className="text-center">
              This will send your reply to{" "}
              <span className="text-foreground/80">{replyToName || replyTo}</span>
              <br />
              Subject: {subject}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="-mx-0 -mb-0 border-0 bg-transparent p-0 sm:justify-center">
            <Button variant="outline" className="flex-1" onClick={() => setShowSendConfirm(false)}>
              Cancel
            </Button>
            <Button className="flex-1 gap-2" onClick={handleSend}>
              <Send size={14} />
              Yes, Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
