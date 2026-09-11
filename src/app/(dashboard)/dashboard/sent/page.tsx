// ==================================================
// MailPilot — Sent Page
// ==================================================
// Emails carrying Gmail's SENT label. Previously, /api/sync only ever
// fetched INBOX messages, so this had no data source at all — sync now
// also pulls SENT (see fetchEmailsByLabel in lib/gmail.ts), so this is
// real synced data, not a mock.
//
// AI category/priority badges and the "Draft Reply" action are hidden
// here (showAiActions=false) — sync deliberately doesn't run
// categorize-email/extract-tasks against your own sent mail (see
// /api/sync), so those fields are always null for these rows, and
// "reply to something you already sent" doesn't make sense anyway.

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EmailListCard } from "@/components/dashboard/EmailListCard";
import { Card } from "@/components/ui/card";
import { Send } from "lucide-react";

export default async function SentPage() {
  const session = await auth();

  const emailAccount = session?.user?.email
    ? await prisma.emailAccount.findFirst({ where: { email: session.user.email } })
    : null;

  if (!emailAccount) {
    return (
      <div className="mx-auto max-w-3xl">
        <Card className="p-12 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-xl bg-sky-500/10">
            <Send size={24} className="text-sky-600 dark:text-sky-400" strokeWidth={1.5} />
          </div>
          <h2 className="mb-2 text-lg font-semibold">Connect your mailbox first</h2>
          <p className="text-sm text-muted-foreground">
            Head to the{" "}
            <a href="/dashboard" className="text-primary hover:underline">
              Inbox
            </a>{" "}
            to connect Gmail before viewing sent emails.
          </p>
        </Card>
      </div>
    );
  }

  const emails = await prisma.email.findMany({
    where: { emailAccountId: emailAccount.id, labels: { has: "SENT" } },
    orderBy: { receivedAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sent</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Emails you've sent, synced from Gmail
        </p>
      </div>

      <EmailListCard
        title="Sent"
        emails={emails}
        showAiActions={false}
        emptyState={{
          icon: <Send size={24} className="text-muted-foreground" strokeWidth={1.5} />,
          title: "No sent emails synced yet",
          description: 'Click "Sync Now" on the Inbox page to pull in your sent mail.',
        }}
      />
    </div>
  );
}
