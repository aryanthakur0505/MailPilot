// ==================================================
// MailPilot — AI Drafts Page
// ==================================================
// Lists all AI-generated reply drafts with copy + discard actions.

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDistanceToNow } from "date-fns";
import {
  Sparkles,
  Copy,
  Trash2,
  Mail,
  CheckCircle2,
  Clock,
  Inbox,
} from "lucide-react";
import { AiDraftActions } from "@/components/dashboard/AiDraftActions";

export default async function AiDraftsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const drafts = await prisma.aiDraft.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      email: {
        select: {
          subject: true,
          from: true,
          fromName: true,
          receivedAt: true,
        },
      },
    },
  });

  const activeDrafts = drafts.filter((d) => d.status === "draft");
  const discardedDrafts = drafts.filter((d) => d.status === "discarded");

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            AI Drafts
          </h1>
          <p className="mt-1.5 text-sm" style={{ color: "var(--text-muted)" }}>
            AI-generated reply drafts ready for your review
          </p>
        </div>
        <div
          className="flex items-center gap-1.5 text-xs font-medium rounded-full px-3 py-1.5"
          style={{
            backgroundColor: "rgba(139, 92, 246, 0.08)",
            color: "#a78bfa",
            border: "1px solid rgba(139, 92, 246, 0.15)",
          }}
        >
          <Sparkles size={12} />
          {activeDrafts.length} ready
        </div>
      </div>

      {/* Empty state */}
      {drafts.length === 0 && (
        <div
          className="rounded-2xl p-12 text-center"
          style={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <div
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{
              background: "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(99,102,241,0.1))",
              border: "1px solid rgba(139,92,246,0.2)",
            }}
          >
            <Sparkles size={24} style={{ color: "#a78bfa" }} strokeWidth={1.5} />
          </div>
          <h2
            className="text-lg font-semibold mb-2"
            style={{ color: "var(--text-primary)" }}
          >
            No drafts yet
          </h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Click on an email in your inbox and hit &quot;Generate Draft&quot; to create an AI reply.
          </p>
        </div>
      )}

      {/* Active Drafts */}
      {activeDrafts.length > 0 && (
        <div className="space-y-4">
          <h2
            className="text-xs font-semibold uppercase tracking-[0.1em]"
            style={{ color: "var(--text-muted)" }}
          >
            Ready · {activeDrafts.length}
          </h2>
          {activeDrafts.map((draft) => (
            <div
              key={draft.id}
              className="rounded-2xl overflow-hidden"
              style={{
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              {/* Top bar */}
              <div
                className="h-0.5 w-full"
                style={{
                  background: "linear-gradient(90deg, #8b5cf6, #6366f1)",
                }}
              />

              <div className="p-5">
                {/* Source email */}
                <div
                  className="flex items-center gap-2 mb-3 text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  <Mail size={11} />
                  <span>
                    Reply to{" "}
                    <span style={{ color: "var(--text-secondary)" }}>
                      {draft.email.fromName || draft.email.from}
                    </span>{" "}
                    ·{" "}
                    {formatDistanceToNow(draft.createdAt, { addSuffix: true })}
                  </span>
                </div>

                {/* Subject */}
                <p
                  className="text-sm font-semibold mb-3"
                  style={{ color: "var(--text-primary)" }}
                >
                  {draft.subject}
                </p>

                {/* Body preview */}
                <div
                  className="rounded-xl p-4 text-sm leading-relaxed mb-4"
                  style={{
                    backgroundColor: "var(--bg-elevated)",
                    color: "var(--text-secondary)",
                    border: "1px solid var(--border-subtle)",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {draft.body}
                </div>

                {/* Actions */}
                <AiDraftActions draftId={draft.id} body={draft.body} subject={draft.subject ?? ""} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Discarded Drafts */}
      {discardedDrafts.length > 0 && (
        <div className="space-y-3">
          <h2
            className="text-xs font-semibold uppercase tracking-[0.1em]"
            style={{ color: "var(--text-muted)" }}
          >
            Discarded · {discardedDrafts.length}
          </h2>
          {discardedDrafts.map((draft) => (
            <div
              key={draft.id}
              className="rounded-xl px-4 py-3 flex items-center gap-3"
              style={{
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--border-subtle)",
                opacity: 0.5,
              }}
            >
              <Trash2 size={14} style={{ color: "var(--text-faint)" }} />
              <span className="text-sm truncate" style={{ color: "var(--text-muted)" }}>
                {draft.subject}
              </span>
              <span className="ml-auto text-xs shrink-0" style={{ color: "var(--text-faint)" }}>
                {formatDistanceToNow(draft.createdAt, { addSuffix: true })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
