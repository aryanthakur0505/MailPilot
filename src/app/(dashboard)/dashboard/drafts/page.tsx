// ==================================================
// MailPilot — Drafts Page (real Gmail drafts)
// ==================================================
// IMPORTANT distinction from /dashboard/ai-drafts:
//   /dashboard/ai-drafts = MailPilot's own AI-generated reply drafts
//   /dashboard/drafts    = actual unsent drafts sitting in Gmail
//
// Sync now also pulls messages carrying Gmail's DRAFT label (see
// fetchEmailsByLabel in lib/gmail.ts) via the same messages.list/get
// flow used for Inbox/Sent, rather than integrating Gmail's separate
// Drafts API — sufficient to view draft content with the existing
// ParsedEmail shape. Editing/sending a draft in place through Gmail's
// dedicated Drafts endpoints would be a separate feature.

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EmailListCard } from "@/components/dashboard/EmailListCard";
import { Card } from "@/components/ui/card";
import { FileEdit } from "lucide-react";

export default async function DraftsPage() {
  const session = await auth();

  const emailAccount = session?.user?.email
    ? await prisma.emailAccount.findFirst({ where: { email: session.user.email } })
    : null;

  if (!emailAccount) {
    return (
      <div className="mx-auto max-w-3xl">
        <Card className="p-12 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-xl bg-violet-500/10">
            <FileEdit size={24} className="text-violet-600 dark:text-violet-400" strokeWidth={1.5} />
          </div>
          <h2 className="mb-2 text-lg font-semibold">Connect your mailbox first</h2>
          <p className="text-sm text-muted-foreground">
            Head to the{" "}
            <a href="/dashboard" className="text-primary hover:underline">
              Inbox
            </a>{" "}
            to connect Gmail before viewing drafts.
          </p>
        </Card>
      </div>
    );
  }

  const emails = await prisma.email.findMany({
    where: { emailAccountId: emailAccount.id, labels: { has: "DRAFT" } },
    orderBy: { receivedAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Drafts</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Unsent drafts sitting in Gmail — for MailPilot's own AI-generated
          replies, see{" "}
          <a href="/dashboard/ai-drafts" className="text-primary hover:underline">
            AI Drafts
          </a>{" "}
          instead
        </p>
      </div>

      <EmailListCard
        title="Drafts"
        emails={emails}
        showAiActions={false}
        emptyState={{
          icon: <FileEdit size={24} className="text-muted-foreground" strokeWidth={1.5} />,
          title: "No drafts synced yet",
          description: 'Save a draft in Gmail, click "Sync Now" on the Inbox page, and it\'ll show up here.',
        }}
      />
    </div>
  );
}
