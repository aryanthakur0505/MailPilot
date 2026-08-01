"use client";

// ==================================================
// MailPilot — Writing Style Card (Phase 6)
// ==================================================
// Shows the user's AI-extracted writing style profile
// and provides a button to re-analyze from sent emails.

import { useState, useEffect } from "react";
import { Sparkles, RefreshCw, Loader2, User, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface StyleData {
  writingStyle: string | null;
  styleAnalyzedAt: string | null;
}

export function WritingStyleCard() {
  const [data, setData] = useState<StyleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");

  async function fetchStyle() {
    try {
      const res = await fetch("/api/ai/style/analyze");
      if (res.ok) setData(await res.json());
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStyle();
  }, []);

  async function handleAnalyze() {
    setAnalyzing(true);
    setError("");
    try {
      const res = await fetch("/api/ai/style/analyze", { method: "POST" });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Failed to start analysis");
      }
      // Poll for the result — style analysis takes ~30–60s in the worker
      const pollInterval = setInterval(async () => {
        const pollRes = await fetch("/api/ai/style/analyze");
        if (pollRes.ok) {
          const fresh: StyleData = await pollRes.json();
          // If styleAnalyzedAt changed we have a fresh result
          if (fresh.styleAnalyzedAt !== data?.styleAnalyzedAt) {
            setData(fresh);
            setAnalyzing(false);
            clearInterval(pollInterval);
          }
        }
      }, 5000); // poll every 5 seconds

      // Safety timeout after 3 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        if (analyzing) {
          setAnalyzing(false);
          fetchStyle(); // fetch whatever we have
        }
      }, 180_000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setAnalyzing(false);
    }
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border-subtle)",
      }}
    >
      {/* Gradient top bar */}
      <div
        className="h-0.5 w-full"
        style={{ background: "linear-gradient(90deg, #8b5cf6, #6366f1)" }}
      />

      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{
                background: "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(99,102,241,0.1))",
                border: "1px solid rgba(139,92,246,0.2)",
              }}
            >
              <User size={18} style={{ color: "#a78bfa" }} strokeWidth={1.8} />
            </div>
            <div>
              <h2
                className="text-sm font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                My Writing Style
              </h2>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                Used to personalize AI-generated drafts
              </p>
            </div>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={analyzing || loading}
            className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-all duration-150 active:scale-[0.97] disabled:opacity-40"
            style={{
              backgroundColor: "rgba(99,102,241,0.08)",
              color: "#818cf8",
              border: "1px solid rgba(99,102,241,0.15)",
            }}
          >
            {analyzing ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <RefreshCw size={12} />
            )}
            {analyzing ? "Analyzing..." : "Analyze Style"}
          </button>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-2">
            {[70, 90, 55].map((w) => (
              <div
                key={w}
                className="h-3 rounded animate-pulse"
                style={{
                  width: `${w}%`,
                  backgroundColor: "var(--bg-elevated)",
                }}
              />
            ))}
          </div>
        )}

        {/* Analyzing in-progress banner */}
        {!loading && analyzing && (
          <div
            className="rounded-xl px-4 py-3 flex items-center gap-3 text-sm"
            style={{
              backgroundColor: "rgba(99,102,241,0.06)",
              border: "1px solid rgba(99,102,241,0.12)",
              color: "#818cf8",
            }}
          >
            <Loader2 size={14} className="animate-spin shrink-0" />
            <span>
              Fetching your sent emails and analyzing your style...
              <br />
              <span className="text-xs" style={{ color: "var(--text-faint)" }}>
                This takes about 30–60 seconds
              </span>
            </span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            className="rounded-xl px-4 py-3 flex items-center gap-2 text-sm"
            style={{
              backgroundColor: "rgba(239,68,68,0.06)",
              border: "1px solid rgba(239,68,68,0.12)",
              color: "#f87171",
            }}
          >
            <AlertTriangle size={14} />
            {error}
          </div>
        )}

        {/* Style profile */}
        {!loading && !analyzing && data?.writingStyle && (
          <div className="space-y-3">
            <div
              className="rounded-xl p-4 text-sm leading-relaxed"
              style={{
                backgroundColor: "var(--bg-elevated)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <Sparkles
                size={13}
                className="inline mr-1.5 -mt-0.5"
                style={{ color: "#a78bfa" }}
              />
              {data.writingStyle}
            </div>
            {data.styleAnalyzedAt && (
              <p className="text-xs" style={{ color: "var(--text-faint)" }}>
                Last analyzed{" "}
                {formatDistanceToNow(new Date(data.styleAnalyzedAt), { addSuffix: true })}
              </p>
            )}
          </div>
        )}

        {/* Empty state */}
        {!loading && !analyzing && !data?.writingStyle && (
          <div className="text-center py-4">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              No style profile yet.
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-faint)" }}>
              Click{" "}
              <span style={{ color: "#818cf8" }}>Analyze Style</span> to let the AI
              study your writing from your sent emails.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
