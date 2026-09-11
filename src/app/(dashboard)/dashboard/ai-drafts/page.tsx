// ==================================================
// MailPilot — AI Drafts Page
// ==================================================
// Lists all AI-generated reply drafts.
// Each draft is rendered with the full DraftEditor:
// edit body, switch tone, regenerate, send.

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDistanceToNow } from "date-fns";
import { Sparkles, Trash2, Mail } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DraftEditor } from "@/components/dashboard/DraftEditor";
import type { DraftTone } from "@/lib/ai";

export default async function AiDraftsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const drafts = await prisma.aiDraft.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      email: {
        select: {
          id: true,
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
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">AI Drafts</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Review, edit, and send your AI-generated replies
          </p>
        </div>
        <Badge variant="secondary" className="gap-1.5 text-violet-600 dark:text-violet-400">
          <Sparkles size={12} />
          {activeDrafts.length} ready
        </Badge>
      </div>

      {drafts.length === 0 && (
        <Card className="p-12 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-xl bg-violet-500/10">
            <Sparkles size={24} className="text-violet-600 dark:text-violet-400" strokeWidth={1.5} />
          </div>
          <h2 className="mb-2 text-lg font-semibold">No drafts yet</h2>
          <p className="text-sm text-muted-foreground">
            Open an email in your inbox and click{" "}
            <span className="text-violet-600 dark:text-violet-400">&quot;Draft Reply&quot;</span>{" "}
            to create a reply.
          </p>
        </Card>
      )}

      {activeDrafts.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Ready to Review · {activeDrafts.length}
          </h2>

          {activeDrafts.map((draft) => (
            <Card key={draft.id} className="p-6">
              <div className="mb-5 flex items-center gap-2 text-xs text-muted-foreground">
                <Mail size={11} />
                <span>
                  In reply to{" "}
                  <span className="text-foreground/80">{draft.email.fromName || draft.email.from}</span>
                  {" · "}
                  <span>{draft.email.subject}</span>
                  {" · "}
                  {formatDistanceToNow(draft.createdAt, { addSuffix: true })}
                </span>
              </div>

              <DraftEditor
                draftId={draft.id}
                emailId={draft.email.id}
                initialSubject={draft.subject ?? `Re: ${draft.email.subject ?? ""}`}
                initialBody={draft.body}
                initialTone={(draft.tone as DraftTone) ?? "professional"}
                replyTo={draft.email.from}
                replyToName={draft.email.fromName ?? ""}
              />
            </Card>
          ))}
        </div>
      )}

      {discardedDrafts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Discarded / Sent · {discardedDrafts.length}
          </h2>
          {discardedDrafts.map((draft) => (
            <Card key={draft.id} className="flex flex-row items-center gap-3 px-4 py-3 opacity-45">
              <Trash2 size={13} className="text-muted-foreground" />
              <span className="truncate text-sm text-muted-foreground">{draft.subject}</span>
              <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                {formatDistanceToNow(draft.createdAt, { addSuffix: true })}
              </span>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
