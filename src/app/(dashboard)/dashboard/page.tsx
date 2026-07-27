// ==================================================
// MailPilot — Dashboard Home Page
// ==================================================
// Server component: fetches real emails from the database.
// Includes a client-side SyncButton to trigger Gmail sync.

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SyncButton } from "@/components/dashboard/SyncButton";
import { Card } from "@/components/ui/Card";
import {
  Inbox,
  Brain,
  Sparkles,
  Star,
  Circle,
  Mail,
  CheckCircle2,
  ArrowRight,
  Zap,
  Clock,
  TrendingUp,
  MessageSquare,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { EmailRowAiButton } from "@/components/dashboard/EmailRowAiButton";

// -----------------------------------------------------------------------
// Helper: generate avatar initials + color from a name/email
// -----------------------------------------------------------------------
function getAvatar(name: string, email: string) {
  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : email.slice(0, 2).toUpperCase();

  const colors = [
    { bg: "#312e81", text: "#818cf8" }, // indigo
    { bg: "#2e1065", text: "#a78bfa" }, // violet
    { bg: "#064e3b", text: "#34d399" }, // emerald
    { bg: "#451a03", text: "#fbbf24" }, // amber
    { bg: "#4c0519", text: "#f87171" }, // rose
    { bg: "#0c4a6e", text: "#38bdf8" }, // sky
    { bg: "#500724", text: "#f9a8d4" }, // pink
    { bg: "#134e4a", text: "#2dd4bf" }, // teal
  ];
  const colorIndex =
    (name.charCodeAt(0) || email.charCodeAt(0) || 0) % colors.length;
  return { initials, ...colors[colorIndex] };
}

// -----------------------------------------------------------------------
// Page (Server Component — fetches data directly)
// -----------------------------------------------------------------------
// Helper: get category badge colors
function getCategoryBadge(category: string | null) {
  switch (category) {
    case "urgent":
      return { bg: "rgba(239, 68, 68, 0.1)", text: "#ef4444", border: "rgba(239, 68, 68, 0.2)" };
    case "work":
      return { bg: "rgba(59, 130, 246, 0.1)", text: "#3b82f6", border: "rgba(59, 130, 246, 0.2)" };
    case "newsletter":
      return { bg: "rgba(245, 158, 11, 0.1)", text: "#f59e0b", border: "rgba(245, 158, 11, 0.2)" };
    case "personal":
      return { bg: "rgba(16, 185, 129, 0.1)", text: "#10b981", border: "rgba(16, 185, 129, 0.2)" };
    case "social":
      return { bg: "rgba(236, 72, 153, 0.1)", text: "#ec4899", border: "rgba(236, 72, 153, 0.2)" };
    default:
      return { bg: "var(--bg-elevated)", text: "var(--text-muted)", border: "var(--border-subtle)" };
  }
}

export default async function DashboardPage() {
  const session = await auth();

  // Fetch EmailAccount for this user
  const emailAccount = session?.user?.email
    ? await prisma.emailAccount.findFirst({
        where: { email: session.user.email },
      })
    : null;

  // Fetch emails, most recent first
  const emails = emailAccount
    ? await prisma.email.findMany({
        where: { emailAccountId: emailAccount.id },
        orderBy: { receivedAt: "desc" },
        take: 50,
      })
    : [];

  const unreadCount = emails.filter((e) => !e.isRead).length;
  const starredCount = emails.filter((e) => e.isStarred).length;

  // Phase 3: AI stats
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

  const stats = [
    {
      label: "Total Emails",
      value: emailAccount ? String(emails.length) : "—",
      description: emailAccount ? `${unreadCount} unread` : "Connect to view",
      icon: Inbox,
      trend: null,
      iconBg: "rgba(56, 189, 248, 0.1)",
      iconColor: "#38bdf8",
      accentColor: "#38bdf8",
    },
    {
      label: "AI Processed",
      value: emailAccount ? String(aiProcessedCount) : "—",
      description: aiProcessedCount > 0 ? "emails analyzed" : "Awaiting worker",
      icon: Brain,
      trend: null,
      iconBg: "rgba(139, 92, 246, 0.1)",
      iconColor: "#a78bfa",
      accentColor: "#a78bfa",
    },
    {
      label: "AI Drafts",
      value: emailAccount ? String(aiDraftsCount) : "—",
      description: aiDraftsCount > 0 ? "ready to copy" : "None yet",
      icon: Sparkles,
      trend: null,
      iconBg: "rgba(52, 211, 153, 0.1)",
      iconColor: "#34d399",
      accentColor: "#34d399",
    },
    {
      label: "Starred",
      value: emailAccount ? String(starredCount) : "—",
      description: "Important emails",
      icon: Star,
      trend: null,
      iconBg: "rgba(251, 191, 36, 0.1)",
      iconColor: "#fbbf24",
      accentColor: "#fbbf24",
    },
  ];

  const firstName = session?.user?.name?.split(" ")[0] || "there";

  return (
    <div className="max-w-7xl mx-auto space-y-8">

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
            Hey, {firstName} 👋
          </h1>
          <p className="mt-1.5 text-sm" style={{ color: "var(--text-muted)" }}>
            {emailAccount
              ? `Last synced ${emailAccount.lastSyncedAt
                  ? formatDistanceToNow(emailAccount.lastSyncedAt, { addSuffix: true })
                  : "never"} · ${emails.length} emails`
              : "Connect your mailbox to start using AI email features"}
          </p>
        </div>
        <SyncButton hasAccount={!!emailAccount} />
      </div>

      {/* ── Stats Row ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className={`animate-fade-up delay-${(i + 1) * 75}`}
            style={{ opacity: 0 }}
          >
            <Card hover>
              {/* Top row: icon + trend */}
              <div className="flex items-start justify-between mb-4">
                <div
                  className="flex items-center justify-center rounded-xl"
                  style={{
                    width: "44px",
                    height: "44px",
                    backgroundColor: stat.iconBg,
                    border: `1px solid ${stat.iconColor}20`,
                  }}
                >
                  <stat.icon size={20} style={{ color: stat.iconColor }} strokeWidth={1.8} />
                </div>
                {stat.trend && (
                  <span
                    className="flex items-center gap-1 text-xs font-medium rounded-full px-2 py-1"
                    style={{
                      backgroundColor: "rgba(52, 211, 153, 0.1)",
                      color: "#34d399",
                    }}
                  >
                    <TrendingUp size={11} />
                    {stat.trend}
                  </span>
                )}
              </div>

              {/* Number */}
              <p
                className="text-3xl font-bold tabular-nums tracking-tight"
                style={{ color: "var(--text-primary)" }}
              >
                {stat.value}
              </p>

              {/* Label + description */}
              <p className="mt-1 text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                {stat.label}
              </p>
              <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
                {stat.description}
              </p>

              {/* Bottom accent line */}
              <div
                className="absolute bottom-0 left-0 right-0 h-px"
                style={{
                  background: `linear-gradient(90deg, ${stat.accentColor}30 0%, transparent 60%)`,
                }}
              />
            </Card>
          </div>
        ))}
      </div>

      {/* ── Main Content: Email list OR Onboarding ── */}
      {emails.length === 0 ? (
        <div className="grid gap-6 lg:grid-cols-5">

          {/* Onboarding card — large left */}
          <div className="lg:col-span-3 animate-fade-up delay-300" style={{ opacity: 0 }}>
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              {/* Top gradient band */}
              <div
                className="h-1.5 w-full"
                style={{
                  background: "linear-gradient(90deg, #6366f1, #8b5cf6, #a78bfa)",
                }}
              />

              <div className="p-8">
                {/* Icon */}
                <div
                  className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl"
                  style={{
                    background: "linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%)",
                    border: "1px solid rgba(99, 102, 241, 0.2)",
                  }}
                >
                  <Mail size={28} style={{ color: "var(--indigo-400)" }} strokeWidth={1.5} />
                </div>

                {/* Headline */}
                <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
                  Connect your mailbox
                </h2>
                <p className="text-sm mb-6 max-w-sm" style={{ color: "var(--text-muted)" }}>
                  Unlock AI-powered email management. Let MailPilot handle your
                  inbox so you can focus on what matters.
                </p>

                {/* Feature checklist */}
                <ul className="space-y-3 mb-8">
                  {[
                    "Smart email organization & categorization",
                    "AI-generated reply drafts",
                    "Email insights & analytics",
                    "Automatic priority detection",
                  ].map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <div
                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                        style={{
                          backgroundColor: "rgba(52, 211, 153, 0.1)",
                          border: "1px solid rgba(52, 211, 153, 0.2)",
                        }}
                      >
                        <CheckCircle2 size={12} style={{ color: "#34d399" }} strokeWidth={2.5} />
                      </div>
                      <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    className="flex items-center justify-center gap-2.5 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200 active:scale-[0.98] flex-1 shadow-[0_4px_14px_rgba(99,102,241,0.35)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.5)] hover:-translate-y-[1px]"
                    style={{
                      background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                      color: "white",
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Connect Gmail
                  </button>

                  <button
                    className="flex items-center justify-center gap-2.5 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200 active:scale-[0.98] flex-1 bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-default)] hover:bg-[rgba(255,255,255,0.05)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)]"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M21.35 11.1H12.18V13.83H18.69C18.36 17.64 15.19 19.27 12.19 19.27C8.36 19.27 5 16.25 5 12C5 7.9 8.2 4.73 12.2 4.73C15.29 4.73 17.1 6.7 17.1 6.7L19 4.72C19 4.72 16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12C2.03 17.05 6.16 22 12.25 22C17.6 22 21.5 18.33 21.5 12.91C21.5 11.76 21.35 11.1 21.35 11.1Z" fill="#0078D4"/>
                    </svg>
                    Connect Outlook
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right column: AI assistant overview + recent activity */}
          <div className="lg:col-span-2 flex flex-col gap-6">

            {/* AI Assistant overview */}
            <div className="animate-fade-up delay-400" style={{ opacity: 0 }}>
              <div
                className="rounded-2xl p-5"
                style={{
                  backgroundColor: "var(--bg-card)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    AI Assistant
                  </h3>
                  <span
                    className="flex items-center gap-1.5 text-xs font-medium rounded-full px-2.5 py-1"
                    style={{
                      backgroundColor: "rgba(52, 211, 153, 0.08)",
                      color: "#34d399",
                      border: "1px solid rgba(52, 211, 153, 0.15)",
                    }}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full animate-pulse-soft"
                      style={{ backgroundColor: "#34d399" }}
                    />
                    Ready
                  </span>
                </div>

                <div className="space-y-2.5">
                  {[
                    {
                      icon: AlertCircle,
                      color: "#fbbf24",
                      bg: "rgba(251, 191, 36, 0.08)",
                      label: "Emails needing reply",
                      value: "—",
                    },
                    {
                      icon: MessageSquare,
                      color: "var(--indigo-400)",
                      bg: "rgba(99, 102, 241, 0.08)",
                      label: "Important threads",
                      value: "—",
                    },
                    {
                      icon: Zap,
                      color: "#a78bfa",
                      bg: "rgba(139, 92, 246, 0.08)",
                      label: "Suggested actions",
                      value: "—",
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between rounded-xl px-3.5 py-2.5 cursor-pointer transition-all duration-150 group bg-[var(--item-bg)] hover:bg-[var(--item-hover-bg)]"
                      style={{
                        "--item-bg": item.bg,
                        "--item-hover-bg": item.bg.replace("0.08", "0.14"),
                        borderColor: `${item.color}18`,
                        borderWidth: "1px",
                        borderStyle: "solid",
                      } as React.CSSProperties}
                    >
                      <div className="flex items-center gap-2.5">
                        <item.icon size={14} style={{ color: item.color }} strokeWidth={2} />
                        <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                          {item.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold tabular-nums" style={{ color: "var(--text-muted)" }}>
                          {item.value}
                        </span>
                        <ChevronRight size={12} style={{ color: "var(--text-muted)" }} className="group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent AI Activity */}
            <div className="animate-fade-up delay-500" style={{ opacity: 0 }}>
              <div
                className="rounded-2xl p-5"
                style={{
                  backgroundColor: "var(--bg-card)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    Recent Activity
                  </h3>
                  <button
                    className="flex items-center gap-1 text-xs transition-colors duration-150 text-[var(--indigo-400)] hover:text-[#818cf8]"
                  >
                    View all
                    <ArrowRight size={11} />
                  </button>
                </div>

                <div className="space-y-3">
                  {[
                    {
                      icon: CheckCircle2,
                      color: "#34d399",
                      text: "Connect Gmail to see AI activity",
                      time: "now",
                      dimmed: true,
                    },
                    {
                      icon: Brain,
                      color: "var(--indigo-400)",
                      text: "AI will categorize emails automatically",
                      time: "–",
                      dimmed: true,
                    },
                    {
                      icon: Sparkles,
                      color: "#a78bfa",
                      text: "Smart drafts will appear here",
                      time: "–",
                      dimmed: true,
                    },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div
                        className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                        style={{
                          backgroundColor: `${item.color}15`,
                          border: `1px solid ${item.color}25`,
                        }}
                      >
                        <item.icon size={11} style={{ color: item.color }} strokeWidth={2.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-xs leading-relaxed"
                          style={{ color: item.dimmed ? "var(--text-muted)" : "var(--text-secondary)" }}
                        >
                          {item.text}
                        </p>
                      </div>
                      <span className="shrink-0 text-[10px]" style={{ color: "var(--text-faint)" }}>
                        {item.time}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

      ) : (
        /* ── EMAIL LIST (when emails exist) ── */
        <div className="grid gap-6 lg:grid-cols-5">

          {/* Email list — takes 3/5 */}
          <div className="lg:col-span-3 animate-fade-up delay-200" style={{ opacity: 0 }}>
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              {/* Header */}
              <div
                className="flex items-center justify-between px-5 py-3.5"
                style={{ borderBottom: "1px solid var(--border-subtle)" }}
              >
                <div className="flex items-center gap-3">
                  <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    Inbox
                  </h2>
                  <span
                    className="text-xs font-medium rounded-full px-2 py-0.5"
                    style={{
                      backgroundColor: "rgba(99, 102, 241, 0.1)",
                      color: "var(--indigo-400)",
                      border: "1px solid rgba(99, 102, 241, 0.15)",
                    }}
                  >
                    {emails.length}
                  </span>
                  {unreadCount > 0 && (
                    <span
                      className="text-xs font-medium rounded-full px-2 py-0.5"
                      style={{
                        backgroundColor: "rgba(52, 211, 153, 0.08)",
                        color: "#34d399",
                        border: "1px solid rgba(52, 211, 153, 0.15)",
                      }}
                    >
                      {unreadCount} unread
                    </span>
                  )}
                </div>
                <button
                  className="flex items-center gap-1.5 text-xs rounded-lg px-2.5 py-1.5 transition-all duration-150 text-[var(--text-muted)] bg-transparent border border-[var(--border-subtle)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
                >
                  <Clock size={12} />
                  Newest first
                </button>
              </div>

              {/* Email rows */}
              <ul>
                {emails.map((email, i) => {
                  const { initials, bg, text } = getAvatar(
                    email.fromName ?? "",
                    email.from
                  );
                  return (
                    <li
                      key={email.id}
                      className="group flex cursor-pointer items-center gap-3.5 px-5 py-3.5 transition-all duration-100 hover:bg-[rgba(255,255,255,0.02)]"
                      style={{
                        borderBottom: i < emails.length - 1 ? "1px solid var(--border-subtle)" : "none",
                      }}
                    >
                      {/* Unread indicator */}
                      <div className="shrink-0 flex items-center justify-center w-2">
                        {!email.isRead ? (
                          <div
                            className="h-1.5 w-1.5 rounded-full"
                            style={{
                              backgroundColor: "var(--indigo-400)",
                              boxShadow: "0 0 6px rgba(129, 140, 248, 0.6)",
                            }}
                          />
                        ) : null}
                      </div>

                      {/* Avatar */}
                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                        style={{ backgroundColor: bg, color: text }}
                      >
                        {initials}
                      </div>

                      {/* Email content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2 mb-0.5">
                          <span
                            className="truncate text-sm"
                            style={{
                              color: !email.isRead ? "var(--text-primary)" : "var(--text-secondary)",
                              fontWeight: !email.isRead ? 600 : 400,
                            }}
                          >
                            {email.fromName || email.from}
                          </span>
                          <span className="shrink-0 text-[11px]" style={{ color: "var(--text-muted)" }}>
                            {formatDistanceToNow(email.receivedAt, { addSuffix: true })}
                          </span>
                        </div>
                        <p
                          className="truncate text-sm"
                          style={{
                            color: !email.isRead ? "var(--text-secondary)" : "var(--text-muted)",
                            fontWeight: !email.isRead ? 500 : 400,
                          }}
                        >
                          {email.subject || "(no subject)"}
                        </p>
                        <p className="truncate text-xs mt-0.5" style={{ color: "var(--text-muted)", opacity: 0.7 }}>
                          {email.snippet}
                        </p>
                      </div>

                      {/* AI Priority & Category Badge */}
                      <div className="flex items-center gap-3">
                        {email.category && (
                          <span
                            className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-md shrink-0 hidden sm:block"
                            style={{
                              backgroundColor: getCategoryBadge(email.category).bg,
                              color: getCategoryBadge(email.category).text,
                              border: `1px solid ${getCategoryBadge(email.category).border}`,
                            }}
                          >
                            {email.category}
                          </span>
                        )}

                        {email.priority !== null && email.priority >= 70 && (
                          <div className="flex items-center gap-1.5 shrink-0" title={`Priority: ${email.priority}`}>
                            <div className="h-1.5 w-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse" />
                            <span className="text-[10px] font-bold text-red-400 hidden sm:block">URGENT</span>
                          </div>
                        )}
                        
                        <EmailRowAiButton emailId={email.id} />
                      </div>

                      {/* Star */}
                      {email.isStarred && (
                        <Star
                          size={13}
                          className="shrink-0"
                          style={{ fill: "#fbbf24", color: "#fbbf24" }}
                        />
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {/* Right panel */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* AI Assistant */}
            <div className="animate-fade-up delay-300" style={{ opacity: 0 }}>
              <div
                className="rounded-2xl p-5"
                style={{
                  backgroundColor: "var(--bg-card)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    AI Assistant
                  </h3>
                  <span
                    className="flex items-center gap-1.5 text-xs font-medium rounded-full px-2.5 py-1"
                    style={{
                      backgroundColor: "rgba(52, 211, 153, 0.08)",
                      color: "#34d399",
                      border: "1px solid rgba(52, 211, 153, 0.15)",
                    }}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full animate-pulse-soft"
                      style={{ backgroundColor: "#34d399" }}
                    />
                    Active
                  </span>
                </div>

                <div className="space-y-2.5">
                  {[
                    {
                      icon: AlertCircle,
                      color: "#fbbf24",
                      bg: "rgba(251, 191, 36, 0.08)",
                      label: "Need replies",
                      value: String(unreadCount),
                    },
                    {
                      icon: MessageSquare,
                      color: "var(--indigo-400)",
                      bg: "rgba(99, 102, 241, 0.08)",
                      label: "Important threads",
                      value: String(starredCount),
                    },
                    {
                      icon: Zap,
                      color: "#a78bfa",
                      bg: "rgba(139, 92, 246, 0.08)",
                      label: "AI suggestions",
                      value: "—",
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between rounded-xl px-3.5 py-2.5 cursor-pointer transition-all duration-150 group"
                      style={{
                        backgroundColor: item.bg,
                        border: `1px solid ${item.color}18`,
                      }}
                    >
                      <div className="flex items-center gap-2.5">
                        <item.icon size={14} style={{ color: item.color }} strokeWidth={2} />
                        <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                          {item.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
                          {item.value}
                        </span>
                        <ChevronRight size={12} style={{ color: "var(--text-muted)" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent AI Activity */}
            <div className="animate-fade-up delay-400" style={{ opacity: 0 }}>
              <div
                className="rounded-2xl p-5"
                style={{
                  backgroundColor: "var(--bg-card)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    AI Activity
                  </h3>
                  <button
                    className="flex items-center gap-1 text-xs"
                    style={{ color: "var(--indigo-400)" }}
                  >
                    View all <ArrowRight size={11} />
                  </button>
                </div>

                <div className="space-y-3">
                  {[
                    {
                      icon: CheckCircle2,
                      color: "#34d399",
                      text: `Synced ${emails.length} emails from Gmail`,
                      time: emailAccount?.lastSyncedAt
                        ? formatDistanceToNow(emailAccount.lastSyncedAt, { addSuffix: true })
                        : "recently",
                    },
                    {
                      icon: Brain,
                      color: "var(--indigo-400)",
                      text: "AI analysis ready on next sync",
                      time: "soon",
                    },
                    {
                      icon: Sparkles,
                      color: "#a78bfa",
                      text: "Draft generation available",
                      time: "–",
                    },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div
                        className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                        style={{
                          backgroundColor: `${item.color}15`,
                          border: `1px solid ${item.color}25`,
                        }}
                      >
                        <item.icon size={11} style={{ color: item.color }} strokeWidth={2.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                          {item.text}
                        </p>
                      </div>
                      <span className="shrink-0 text-[10px]" style={{ color: "var(--text-faint)" }}>
                        {item.time}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
