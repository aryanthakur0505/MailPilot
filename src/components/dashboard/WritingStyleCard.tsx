"use client";

// ==================================================
// MailPilot — Writing Style Card (Phase 6)
// ==================================================
// Shows the user's AI-extracted writing style profile
// and provides a button to re-analyze from sent emails.

import { useState, useEffect } from "react";
import { Sparkles, RefreshCw, Loader2, User, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

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
          if (fresh.styleAnalyzedAt !== data?.styleAnalyzedAt) {
            setData(fresh);
            setAnalyzing(false);
            clearInterval(pollInterval);
          }
        }
      }, 5000);

      setTimeout(() => {
        clearInterval(pollInterval);
        if (analyzing) {
          setAnalyzing(false);
          fetchStyle();
        }
      }, 180_000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setAnalyzing(false);
    }
  }

  return (
    <Card className="p-6">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-violet-500/10">
            <User size={18} className="text-violet-600 dark:text-violet-400" strokeWidth={1.8} />
          </div>
          <div>
            <h2 className="text-sm font-semibold">My Writing Style</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Used to personalize AI-generated drafts
            </p>
          </div>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={handleAnalyze}
          disabled={analyzing || loading}
          className="gap-1.5"
        >
          {analyzing ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
          {analyzing ? "Analyzing..." : "Analyze Style"}
        </Button>
      </div>

      {loading && (
        <div className="space-y-2">
          <Skeleton className="h-3 w-[70%]" />
          <Skeleton className="h-3 w-[90%]" />
          <Skeleton className="h-3 w-[55%]" />
        </div>
      )}

      {!loading && analyzing && (
        <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
          <Loader2 size={14} className="shrink-0 animate-spin" />
          <span>
            Fetching your sent emails and analyzing your style...
            <br />
            <span className="text-xs text-muted-foreground">This takes about 30–60 seconds</span>
          </span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertTriangle size={14} />
          {error}
        </div>
      )}

      {!loading && !analyzing && data?.writingStyle && (
        <div className="space-y-3">
          <div className="rounded-lg border bg-muted/40 p-4 text-sm leading-relaxed text-foreground/90">
            <Sparkles size={13} className="-mt-0.5 mr-1.5 inline text-violet-500" />
            {data.writingStyle}
          </div>
          {data.styleAnalyzedAt && (
            <p className="text-xs text-muted-foreground">
              Last analyzed {formatDistanceToNow(new Date(data.styleAnalyzedAt), { addSuffix: true })}
            </p>
          )}
        </div>
      )}

      {!loading && !analyzing && !data?.writingStyle && (
        <div className="py-4 text-center">
          <p className="text-sm text-muted-foreground">No style profile yet.</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Click <span className="text-primary">Analyze Style</span> to let the AI study your
            writing from your sent emails.
          </p>
        </div>
      )}
    </Card>
  );
}
