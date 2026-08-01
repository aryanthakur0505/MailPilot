// ==================================================
// MailPilot — Settings Page (Phase 6)
// ==================================================
// Hosts user preference panels including
// the Phase 6 Writing Style analyzer.

import { auth } from "@/lib/auth";
import { WritingStyleCard } from "@/components/dashboard/WritingStyleCard";
import { Settings } from "lucide-react";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{
            background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))",
            border: "1px solid rgba(99,102,241,0.2)",
          }}
        >
          <Settings size={18} style={{ color: "#818cf8" }} strokeWidth={1.8} />
        </div>
        <div>
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Settings
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            Customize how MailPilot works for you
          </p>
        </div>
      </div>

      {/* Phase 6 — Writing Style */}
      <section className="space-y-3">
        <h2
          className="text-xs font-semibold uppercase tracking-[0.1em]"
          style={{ color: "var(--text-muted)" }}
        >
          AI Personalization
        </h2>
        <WritingStyleCard />
      </section>

      {/* Account info */}
      <section className="space-y-3">
        <h2
          className="text-xs font-semibold uppercase tracking-[0.1em]"
          style={{ color: "var(--text-muted)" }}
        >
          Account
        </h2>
        <div
          className="rounded-2xl p-5"
          style={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <div className="flex items-center gap-4">
            {session.user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={session.user.image}
                alt="Avatar"
                className="h-12 w-12 rounded-full"
              />
            ) : (
              <div
                className="h-12 w-12 rounded-full flex items-center justify-center text-sm font-bold"
                style={{ backgroundColor: "rgba(99,102,241,0.15)", color: "#818cf8" }}
              >
                {session.user.name?.[0]?.toUpperCase() ?? "?"}
              </div>
            )}
            <div>
              <p
                className="text-sm font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                {session.user.name}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                {session.user.email}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
