// ==================================================
// MailPilot — Starred Page
// ==================================================
// Filtered view of the same Email data as Inbox — isStarred is synced
// directly from Gmail's STARRED label (see /api/sync), so this is a
// real filter over real data, not a separate feature.

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EmailListCard } from "@/components/dashboard/EmailListCard";
import { Card } from "@/components/ui/card";
import { Star } from "lucide-react";

export default async function StarredPage() {
  const session = await auth();

  const emailAccount = session?.user?.email
    ? await prisma.emailAccount.findFirst({ where: { email: session.user.email } })
    : null;

  if (!emailAccount) {
    return (
      <div className="mx-auto max-w-3xl">
        <Card className="p-12 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-xl bg-amber-500/10">
            <Star size={24} className="text-amber-600 dark:text-amber-400" strokeWidth={1.5} />
          </div>
          <h2 className="mb-2 text-lg font-semibold">Connect your mailbox first</h2>
          <p className="text-sm text-muted-foreground">
            Head to the{" "}
            <a href="/dashboard" className="text-primary hover:underline">
              Inbox
            </a>{" "}
            to connect Gmail before viewing starred emails.
          </p>
        </Card>
      </div>
    );
  }

  const emails = await prisma.email.findMany({
    where: { emailAccountId: emailAccount.id, isStarred: true },
    orderBy: { receivedAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Starred</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Emails you've starred in Gmail, synced here for quick access
        </p>
      </div>

      <EmailListCard
        title="Starred"
        emails={emails}
        emptyState={{
          icon: <Star size={24} className="text-muted-foreground" strokeWidth={1.5} />,
          title: "No starred emails",
          description: "Star an email in Gmail, then sync, and it'll show up here.",
        }}
      />
    </div>
  );
}
