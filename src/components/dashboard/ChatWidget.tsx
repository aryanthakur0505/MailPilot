"use client";

// ==================================================
// MailPilot — Chat Widget (Phase 8)
// ==================================================
// Floating action button that opens a chat window.
// Sends queries to /api/chat which runs the RAG pipeline.

import { useState, useRef, useEffect } from "react";
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  Bot,
  User,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Source {
  id: string;
  subject: string | null;
  from: string;
  receivedAt: string;
  similarity: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  error?: boolean;
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! I can answer questions about your emails. Try asking something like: \"What's my flight number?\" or \"Did anyone send me a receipt from Amazon?\"",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      inputRef.current?.focus();
    }
  }, [isOpen, messages]);

  async function handleSend() {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: userMessage }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to get answer");

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.answer,
          sources: data.sources?.length > 0 ? data.sources : undefined,
        },
      ]);
    } catch (err: unknown) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: err instanceof Error ? err.message : "Something went wrong. Try again.",
          error: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <>
      {/* Floating action button */}
      <Button
        onClick={() => setIsOpen((o) => !o)}
        size="icon"
        className="fixed right-6 bottom-6 z-50 size-14 rounded-full shadow-lg"
        variant={isOpen ? "secondary" : "default"}
        aria-label="Open chat"
      >
        {isOpen ? <X className="size-5!" /> : <MessageCircle className="size-5!" />}
      </Button>

      {isOpen && (
        <div className="fixed right-6 bottom-24 z-50 flex h-[520px] w-[380px] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-xl border bg-popover shadow-2xl">
          {/* Header */}
          <div className="flex shrink-0 items-center gap-3 border-b bg-primary/5 px-4 py-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles size={15} />
            </div>
            <div>
              <p className="text-sm font-semibold">Ask your inbox</p>
              <p className="text-[10px] text-muted-foreground">Powered by semantic search</p>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 px-4 py-3">
            <div className="space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={cn("flex gap-2.5", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
                  <div
                    className={cn(
                      "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full",
                      msg.role === "user" ? "bg-primary/15" : "bg-violet-500/15"
                    )}
                  >
                    {msg.role === "user" ? (
                      <User size={13} className="text-primary" />
                    ) : (
                      <Bot size={13} className="text-violet-600 dark:text-violet-400" />
                    )}
                  </div>

                  <div className={cn("flex max-w-[280px] flex-col gap-1.5", msg.role === "user" ? "items-end" : "items-start")}>
                    <div
                      className={cn(
                        "rounded-xl px-3.5 py-2.5 text-sm leading-relaxed",
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : msg.error
                            ? "border border-destructive/20 bg-destructive/5 text-destructive"
                            : "border bg-muted/40"
                      )}
                    >
                      {msg.content}
                    </div>

                    {msg.sources && msg.sources.length > 0 && (
                      <div className="w-full space-y-1">
                        <p className="px-1 text-[10px] font-medium text-muted-foreground">
                          Based on {msg.sources.length} email{msg.sources.length > 1 ? "s" : ""}:
                        </p>
                        {msg.sources.map((src) => (
                          <div key={src.id} className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-[11px]">
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-medium">{src.subject || "(no subject)"}</p>
                              <p className="truncate text-muted-foreground">
                                {src.from} · {format(new Date(src.receivedAt), "MMM d")}
                              </p>
                            </div>
                            <ExternalLink size={11} className="shrink-0 text-muted-foreground" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex gap-2.5">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-violet-500/15">
                    <Bot size={13} className="text-violet-600 dark:text-violet-400" />
                  </div>
                  <div className="rounded-xl border bg-muted/40 px-3.5 py-2.5">
                    <Loader2 size={15} className="animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="flex shrink-0 items-center gap-2 border-t p-3">
            <Input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about your emails…"
              disabled={loading}
              className="flex-1"
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              size="icon"
              className="shrink-0"
            >
              <Send size={14} />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
