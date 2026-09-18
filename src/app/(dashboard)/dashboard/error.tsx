"use client";

// ==================================================
// MailPilot — Dashboard Error Boundary
// ==================================================
// Applies to every /dashboard/* route — previously there was none
// anywhere in the app, so a thrown Server Component (a DB hiccup, a
// bad query) fell through to Next's generic unstyled error page
// instead of something that fits the app and offers a way back.

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[dashboard]", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg py-16">
      <Card className="p-8 text-center">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-xl bg-destructive/10">
          <AlertTriangle size={24} className="text-destructive" strokeWidth={1.5} />
        </div>
        <h2 className="mb-2 text-lg font-semibold">Something went wrong</h2>
        <p className="mb-6 text-sm text-muted-foreground">
          {error.message || "An unexpected error occurred while loading this page."}
        </p>
        <Button onClick={reset} className="gap-2">
          <RefreshCw size={14} />
          Try again
        </Button>
      </Card>
    </div>
  );
}
