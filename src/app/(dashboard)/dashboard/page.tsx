// ==================================================
// MailPilot — Dashboard Home Page
// ==================================================
// Server component: fetches real emails from the database.
// Includes a client-side SyncButton to trigger Gmail sync.

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SyncButton } from "@/components/dashboard/SyncButton";
import { EmailListCard } from "@/components/dashboard/EmailListCard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Inbox,
  Brain,
  Sparkles,
  Star,
  Mail,
  CheckCircle2,
  ArrowRight,
  Zap,
  MessageSquare,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { cn } from "@/lib/utils";

export default async function DashboardPage() {
  const session = await auth();

  const emailAccount = session?.user?.email
    ? await prisma.emailAccount.findFirst({
        where: { email: session.user.email },
      })
    : null;

  const emails = emailAccount
    ? await prisma.email.findMany({
        where: { emailAccountId: emailAccount.id },
        orderBy: { receivedAt: "desc" },
        take: 50,
      })
    : [];

  const unreadCount = emails.filter((e) => !e.isRead).length;
  const starredCount = emails.filter((e) => e.isStarred).length;

  const [aiProcessedCount, aiDraftsCount] = session?.user?.id
    ? await Promise.all([
        prisma.email.count({
          where: {
            emailAccount: { userId: session.user.id },
            processedAt: { not: null },
          },
        }),
        prisma.aiDraft.count({
          where: { userId: session.user.id, status: "draft" },
        }),
      ])
    : [0, 0];

  const pendingTasks = session?.user?.id
    ? await prisma.task.findMany({
        where: { userId: session.user.id, completed: false },
        orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
        take: 5,
        include: { email: { select: { fromName: true, from: true } } },
      })
    : [];

  const stats = [
    {
      label: "Total Emails",
      value: emailAccount ? String(emails.length) : "—",
      description: emailAccount ? `${unreadCount} unread` : "Connect to view",
      icon: Inbox,
      className: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    },
    {
      label: "AI Processed",
      value: emailAccount ? String(aiProcessedCount) : "—",
      description: aiProcessedCount > 0 ? "emails analyzed" : "Awaiting worker",
      icon: Brain,
      className: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    },
    {
      label: "AI Drafts",
      value: emailAccount ? String(aiDraftsCount) : "—",
      description: aiDraftsCount > 0 ? "ready to copy" : "None yet",
      icon: Sparkles,
      className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Starred",
      value: emailAccount ? String(starredCount) : "—",
      description: "Important emails",
      icon: Star,
      className: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    },
  ];

  const firstName = session?.user?.name?.split(" ")[0] || "there";

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Hey, {firstName} 👋</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {emailAccount
              ? `Last synced ${
                  emailAccount.lastSyncedAt
                    ? formatDistanceToNow(emailAccount.lastSyncedAt, { addSuffix: true })
                    : "never"
                } · ${emails.length} emails`
              : "Connect your mailbox to start using AI email features"}
          </p>
        </div>
        <SyncButton hasAccount={!!emailAccount} />
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-5">
            <div className={cn("mb-4 flex size-10 items-center justify-center rounded-lg", stat.className)}>
              <stat.icon size={19} strokeWidth={1.8} />
            </div>
            <p className="text-2xl font-semibold tracking-tight tabular-nums">{stat.value}</p>
            <p className="mt-1 text-sm font-medium">{stat.label}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{stat.description}</p>
          </Card>
        ))}
      </div>

      {emails.length === 0 ? (
        <div className="grid gap-6 lg:grid-cols-5">
          {/* Onboarding card */}
          <Card className="lg:col-span-3 p-0">
            <div className="p-8">
              <div className="mb-6 flex size-14 items-center justify-center rounded-xl bg-primary/10">
                <Mail size={26} className="text-primary" strokeWidth={1.5} />
              </div>

              <h2 className="mb-2 text-xl font-semibold">Connect your mailbox</h2>
              <p className="mb-6 max-w-sm text-sm text-muted-foreground">
                Unlock AI-powered email management. Let MailPilot handle your
                inbox so you can focus on what matters.
              </p>

              <ul className="mb-8 space-y-3">
                {[
                  "Smart email organization & categorization",
                  "AI-generated reply drafts",
                  "Email insights & analytics",
                  "Automatic priority detection",
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
                      <CheckCircle2 size={12} className="text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
                    </div>
                    <span className="text-sm text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button className="flex-1 gap-2.5">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Connect Gmail
                </Button>
                <Button variant="outline" className="flex-1 gap-2.5">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M21.35 11.1H12.18V13.83H18.69C18.36 17.64 15.19 19.27 12.19 19.27C8.36 19.27 5 16.25 5 12C5 7.9 8.2 4.73 12.2 4.73C15.29 4.73 17.1 6.7 17.1 6.7L19 4.72C19 4.72 16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12C2.03 17.05 6.16 22 12.25 22C17.6 22 21.5 18.33 21.5 12.91C21.5 11.76 21.35 11.1 21.35 11.1Z" fill="#0078D4"/>
                  </svg>
                  Connect Outlook
                </Button>
              </div>
            </div>
          </Card>

          {/* Right column */}
          <div className="flex flex-col gap-6 lg:col-span-2">
            <Card className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold">AI Assistant</h3>
                <Badge variant="secondary" className="gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  Ready
                </Badge>
              </div>

              <div className="space-y-2">
                {[
                  { icon: AlertCircle, label: "Emails needing reply" },
                  { icon: MessageSquare, label: "Important threads" },
                  { icon: Zap, label: "Suggested actions" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2.5"
                  >
                    <div className="flex items-center gap-2.5">
                      <item.icon size={14} className="text-muted-foreground" strokeWidth={2} />
                      <span className="text-xs font-medium">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <span className="text-xs font-semibold tabular-nums">—</span>
                      <ChevronRight size={12} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold">Recent Activity</h3>
                <button className="flex items-center gap-1 text-xs text-primary hover:underline">
                  View all
                  <ArrowRight size={11} />
                </button>
              </div>

              <div className="space-y-3">
                {[
                  { icon: CheckCircle2, text: "Connect Gmail to see AI activity" },
                  { icon: Brain, text: "AI will categorize emails automatically" },
                  { icon: Sparkles, text: "Smart drafts will appear here" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-muted">
                      <item.icon size={11} className="text-muted-foreground" strokeWidth={2.5} />
                    </div>
                    <p className="flex-1 text-xs leading-relaxed text-muted-foreground">{item.text}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-5">
          {/* Email list */}
          <div className="lg:col-span-3">
            <EmailListCard
              title="Inbox"
              emails={emails}
              extraBadges={
                unreadCount > 0 && (
                  <Badge variant="secondary" className="text-emerald-600 dark:text-emerald-400">
                    {unreadCount} unread
                  </Badge>
                )
              }
              emptyState={{
                icon: <Inbox size={24} className="text-muted-foreground" strokeWidth={1.5} />,
                title: "No emails yet",
                description: "Sync your mailbox to see your inbox here.",
              }}
            />
          </div>

          {/* Right panel */}
          <div className="flex flex-col gap-6 lg:col-span-2">
            <Card className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold">AI Assistant</h3>
                <Badge variant="secondary" className="gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  Active
                </Badge>
              </div>

              <div className="space-y-2">
                {[
                  { icon: AlertCircle, label: "Need replies", value: String(unreadCount) },
                  { icon: MessageSquare, label: "Important threads", value: String(starredCount) },
                  { icon: Zap, label: "AI suggestions", value: "—" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <item.icon size={14} className="text-muted-foreground" strokeWidth={2} />
                      <span className="text-xs font-medium">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold tabular-nums">{item.value}</span>
                      <ChevronRight size={12} className="text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold">Pending Tasks</h3>
                <a href="/dashboard/tasks" className="flex items-center gap-1 text-xs text-primary hover:underline">
                  View all <ArrowRight size={11} />
                </a>
              </div>

              {pendingTasks.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted-foreground">
                  No pending tasks — great work! 🎉
                </p>
              ) : (
                <div className="space-y-2">
                  {pendingTasks.map((task) => (
                    <div key={task.id} className="flex items-start gap-2.5 rounded-lg bg-muted/50 px-3 py-2.5">
                      <div className="mt-0.5 size-3.5 shrink-0 rounded-full border-[1.5px] border-muted-foreground/40" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium">{task.title}</p>
                        {task.email && (
                          <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                            {task.email.fromName || task.email.from}
                          </p>
                        )}
                      </div>
                      {task.dueDate && (
                        <span className="shrink-0 text-[10px] font-medium text-muted-foreground">
                          {format(task.dueDate, "MMM d")}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
