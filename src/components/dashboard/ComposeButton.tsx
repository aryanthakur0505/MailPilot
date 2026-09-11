"use client";

// ==================================================
// MailPilot — Compose Button + Dialog
// ==================================================
// The Sidebar's "Compose" button never did anything — no dialog, no
// API route behind it. This wires it up: opens a To/Subject/Body
// dialog and sends via the new POST /api/emails/compose route.

import { useState } from "react";
import { PenSquare, Send, Loader2, Check, AlertTriangle } from "lucide-react";
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type Status = "idle" | "sending" | "sent" | "error";

export function ComposeButton({ collapsed = false }: { collapsed?: boolean }) {
  const [open, setOpen] = useState(false);
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  function reset() {
    setTo("");
    setSubject("");
    setBody("");
    setStatus("idle");
    setError("");
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError("");
    try {
      const res = await fetch("/api/emails/compose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, subject, body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send email");

      setStatus("sent");
      setTimeout(() => {
        setOpen(false);
        reset();
      }, 1200);
    } catch (err: unknown) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  const trigger = collapsed ? (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button size="icon" className="w-full" onClick={() => setOpen(true)}>
          <PenSquare />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right">Compose</TooltipContent>
    </Tooltip>
  ) : (
    <Button className="w-full gap-2" onClick={() => setOpen(true)}>
      <PenSquare className="size-4" />
      Compose
    </Button>
  );

  return (
    <>
      {trigger}

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) reset();
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New Email</DialogTitle>
            <DialogDescription>Sent directly via your connected Gmail account.</DialogDescription>
          </DialogHeader>

          {status === "sent" ? (
            <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-emerald-500/15">
                <Check size={22} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Sent!</p>
            </div>
          ) : (
            <form onSubmit={handleSend} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="compose-to">To</Label>
                <Input
                  id="compose-to"
                  type="email"
                  placeholder="someone@example.com"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  disabled={status === "sending"}
                  required
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="compose-subject">Subject</Label>
                <Input
                  id="compose-subject"
                  placeholder="Subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  disabled={status === "sending"}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="compose-body">Message</Label>
                <Textarea
                  id="compose-body"
                  placeholder="Write your message..."
                  rows={8}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  disabled={status === "sending"}
                  required
                  className="leading-relaxed"
                />
              </div>

              {status === "error" && error && (
                <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                  <AlertTriangle size={14} />
                  {error}
                </div>
              )}

              <DialogFooter className="-mx-0 -mb-0 border-0 bg-transparent p-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={status === "sending"}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={status === "sending"} className="gap-2">
                  {status === "sending" ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  {status === "sending" ? "Sending..." : "Send"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
