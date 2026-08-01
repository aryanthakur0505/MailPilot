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
        "Hi! I can answer questions about your emails. Try asking something like: *\"What's my flight number?\"* or *\"Did anyone send me a receipt from Amazon?\"*",
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
          content:
            err instanceof Error ? err.message : "Something went wrong. Try again.",
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
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-2xl transition-all duration-200 active:scale-95"
        style={{
          background: isOpen
            ? "rgba(30,27,42,0.95)"
            : "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
          boxShadow: isOpen
            ? "0 8px 32px rgba(0,0,0,0.4)"
            : "0 8px 32px rgba(99,102,241,0.5)",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
        aria-label="Open chat"
      >
        {isOpen ? (
          <X size={22} style={{ color: "var(--text-muted)" }} />
        ) : (
          <MessageCircle size={22} color="white" />
        )}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-6 z-50 flex flex-col rounded-2xl shadow-2xl overflow-hidden"
          style={{
            width: "380px",
            height: "520px",
            backgroundColor: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-3 px-4 py-3 shrink-0"
            style={{
              background: "linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.08))",
              borderBottom: "1px solid var(--border-subtle)",
            }}
          >
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              }}
            >
              <Sparkles size={15} color="white" />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                Ask your inbox
              </p>
              <p className="text-[10px]" style={{ color: "var(--text-faint)" }}>
                Powered by semantic search
              </p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                {/* Avatar */}
                <div
                  className="h-7 w-7 shrink-0 rounded-full flex items-center justify-center mt-0.5"
                  style={{
                    backgroundColor:
                      msg.role === "user"
                        ? "rgba(99,102,241,0.15)"
                        : "rgba(139,92,246,0.12)",
                  }}
                >
                  {msg.role === "user" ? (
                    <User size={13} style={{ color: "#818cf8" }} />
                  ) : (
                    <Bot size={13} style={{ color: "#a78bfa" }} />
                  )}
                </div>

                <div className={`flex flex-col gap-1.5 ${msg.role === "user" ? "items-end" : "items-start"}`}>
                  {/* Bubble */}
                  <div
                    className="rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed max-w-[280px]"
                    style={
                      msg.role === "user"
                        ? {
                            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                            color: "white",
                          }
                        : {
                            backgroundColor: msg.error
                              ? "rgba(239,68,68,0.06)"
                              : "var(--bg-card)",
                            color: msg.error ? "#f87171" : "var(--text-secondary)",
                            border: `1px solid ${msg.error ? "rgba(239,68,68,0.12)" : "var(--border-subtle)"}`,
                          }
                    }
                  >
                    {msg.content}
                  </div>

                  {/* Sources */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="space-y-1 w-full max-w-[280px]">
                      <p className="text-[10px] font-medium px-1" style={{ color: "var(--text-faint)" }}>
                        Based on {msg.sources.length} email{msg.sources.length > 1 ? "s" : ""}:
                      </p>
                      {msg.sources.map((src) => (
                        <div
                          key={src.id}
                          className="rounded-xl px-3 py-2 flex items-center gap-2 text-[11px]"
                          style={{
                            backgroundColor: "var(--bg-elevated)",
                            border: "1px solid var(--border-subtle)",
                          }}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="truncate font-medium" style={{ color: "var(--text-secondary)" }}>
                              {src.subject || "(no subject)"}
                            </p>
                            <p className="truncate" style={{ color: "var(--text-faint)" }}>
                              {src.from} · {format(new Date(src.receivedAt), "MMM d")}
                            </p>
                          </div>
                          <ExternalLink size={11} style={{ color: "var(--text-faint)", flexShrink: 0 }} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {loading && (
              <div className="flex gap-2.5">
                <div
                  className="h-7 w-7 shrink-0 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "rgba(139,92,246,0.12)" }}
                >
                  <Bot size={13} style={{ color: "#a78bfa" }} />
                </div>
                <div
                  className="rounded-2xl px-3.5 py-2.5"
                  style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
                >
                  <Loader2 size={15} className="animate-spin" style={{ color: "var(--text-faint)" }} />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div
            className="shrink-0 px-3 py-3"
            style={{ borderTop: "1px solid var(--border-subtle)" }}
          >
            <div
              className="flex items-center gap-2 rounded-xl px-3.5 py-2.5"
              style={{
                backgroundColor: "var(--bg-elevated)",
                border: "1px solid var(--border-default)",
              }}
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about your emails…"
                disabled={loading}
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: "var(--text-primary)" }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all active:scale-95 disabled:opacity-30"
                style={{
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                }}
              >
                <Send size={13} color="white" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
