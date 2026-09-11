// ==================================================
// MailPilot — Categories Page
// ==================================================
// Browse the inbox filtered by the AI-assigned category. Categories are
// exactly the 7 values the classifier can produce (see EmailCategory in
// lib/ai.ts / CATEGORY_META in lib/email-display.ts) — not invented,
// not hardcoded separately from what the app actually assigns.

import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EmailListCard } from "@/components/dashboard/EmailListCard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FolderOpen } from "lucide-react";
import { CATEGORY_META, categoryBadgeClass } from "@/lib/email-display";
import { cn } from "@/lib/utils";
import type { EmailCategory } from "@/lib/ai";

const ALL_CATEGORIES = Object.keys(CATEGORY_META) as EmailCategory[];

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category: rawCategory } = await searchParams;
  const selectedCategory = ALL_CATEGORIES.includes(rawCategory as EmailCategory)
    ? (rawCategory as EmailCategory)
    : null;

  const session = await auth();
  const emailAccount = session?.user?.email
    ? await prisma.emailAccount.findFirst({ where: { email: session.user.email } })
    : null;

  if (!emailAccount) {
    return (
      <div className="mx-auto max-w-3xl">
        <Card className="p-12 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-xl bg-indigo-500/10">
            <FolderOpen size={24} className="text-indigo-600 dark:text-indigo-400" strokeWidth={1.5} />
          </div>
          <h2 className="mb-2 text-lg font-semibold">Connect your mailbox first</h2>
          <p className="text-sm text-muted-foreground">
            Head to the{" "}
            <a href="/dashboard" className="text-primary hover:underline">
              Inbox
            </a>{" "}
            to connect Gmail before browsing by category.
          </p>
        </Card>
      </div>
    );
  }

  // Count per category, and the filtered list for whichever is selected —
  // two queries, same emailAccountId scope as everywhere else.
  const [counts, emails] = await Promise.all([
    prisma.email.groupBy({
      by: ["category"],
      where: { emailAccountId: emailAccount.id, category: { not: null } },
      _count: { _all: true },
    }),
    prisma.email.findMany({
      where: {
        emailAccountId: emailAccount.id,
        category: selectedCategory ?? { not: null },
      },
      orderBy: { receivedAt: "desc" },
    }),
  ]);

  const countByCategory = new Map(counts.map((c) => [c.category, c._count._all]));

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Categories</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Browse your inbox by the category AI assigned each email
        </p>
      </div>

      {/* Category selector */}
      <div className="flex flex-wrap gap-2">
        <Link href="/dashboard/categories">
          <Badge
            variant={selectedCategory === null ? "default" : "secondary"}
            className="cursor-pointer px-3 py-1.5 text-xs"
          >
            All ({counts.reduce((sum, c) => sum + c._count._all, 0)})
          </Badge>
        </Link>
        {ALL_CATEGORIES.map((cat) => {
          const meta = CATEGORY_META[cat];
          const count = countByCategory.get(cat) ?? 0;
          const active = selectedCategory === cat;
          return (
            <Link key={cat} href={`/dashboard/categories?category=${cat}`}>
              <span
                className={cn(
                  "inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  active ? "bg-primary text-primary-foreground" : categoryBadgeClass(cat)
                )}
              >
                {meta.label} ({count})
              </span>
            </Link>
          );
        })}
      </div>

      <EmailListCard
        title={selectedCategory ? CATEGORY_META[selectedCategory].label : "All categorized emails"}
        emails={emails}
        emptyState={{
          icon: <FolderOpen size={24} className="text-muted-foreground" strokeWidth={1.5} />,
          title: selectedCategory ? `No ${CATEGORY_META[selectedCategory].label.toLowerCase()} emails` : "No categorized emails yet",
          description: "The AI worker categorizes emails shortly after each sync — check back in a moment.",
        }}
      />
    </div>
  );
}
