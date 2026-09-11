// ==================================================
// MailPilot — Shared Email List Card
// ==================================================
// The Card + header + row-list markup used by Inbox, Starred, Sent,
// and the Categories page. Extracted from the original Inbox page so
// all four don't each re-implement the same list rendering.

import type { Email } from "@prisma/client";
import type { ReactNode } from "react";
import { Star, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { EmailRowAiButton } from "@/components/dashboard/EmailRowAiButton";
import { getAvatar, categoryBadgeClass } from "@/lib/email-display";
import { cn } from "@/lib/utils";

interface EmailListCardProps {
  title: string;
  emails: Email[];
  /** Extra badges next to the title (e.g. unread count). Total count badge is always shown. */
  extraBadges?: ReactNode;
  /** Show the category/priority badges + "Draft Reply" action on each row. Off for Sent/Drafts, where those don't apply. */
  showAiActions?: boolean;
  emptyState: { icon: ReactNode; title: string; description: ReactNode };
}

export function EmailListCard({
  title,
  emails,
  extraBadges,
  showAiActions = true,
  emptyState,
}: EmailListCardProps) {
  if (emails.length === 0) {
    return (
      <Card className="p-12 text-center">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-xl bg-muted">
          {emptyState.icon}
        </div>
        <h2 className="mb-2 text-lg font-semibold">{emptyState.title}</h2>
        <p className="text-sm text-muted-foreground">{emptyState.description}</p>
      </Card>
    );
  }

  return (
    <Card className="p-0">
      <div className="flex items-center justify-between border-b px-5 py-3.5">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold">{title}</h2>
          <Badge variant="secondary">{emails.length}</Badge>
          {extraBadges}
        </div>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Clock size={12} />
          Newest first
        </Button>
      </div>

      <ul>
        {emails.map((email, i) => {
          const { initials, className } = getAvatar(email.fromName ?? "", email.from);
          return (
            <li
              key={email.id}
              className={cn(
                "flex cursor-pointer items-center gap-3.5 px-5 py-3.5 transition-colors hover:bg-muted/40",
                i < emails.length - 1 && "border-b"
              )}
            >
              <div className="flex w-2 shrink-0 items-center justify-center">
                {!email.isRead && <div className="size-1.5 rounded-full bg-primary" />}
              </div>

              <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold", className)}>
                {initials}
              </div>

              <div className="min-w-0 flex-1">
                <div className="mb-0.5 flex items-baseline justify-between gap-2">
                  <span className={cn("truncate text-sm", !email.isRead ? "font-semibold" : "text-muted-foreground")}>
                    {email.fromName || email.from}
                  </span>
                  <span className="shrink-0 text-[11px] text-muted-foreground">
                    {formatDistanceToNow(email.receivedAt, { addSuffix: true })}
                  </span>
                </div>
                <p className={cn("truncate text-sm", !email.isRead ? "text-foreground/90 font-medium" : "text-muted-foreground")}>
                  {email.subject || "(no subject)"}
                </p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground/80">{email.snippet}</p>
              </div>

              {showAiActions && (
                <div className="flex items-center gap-3">
                  {email.category && (
                    <span className={cn("hidden rounded-md px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase sm:block", categoryBadgeClass(email.category))}>
                      {email.category}
                    </span>
                  )}

                  {email.priority !== null && email.priority >= 70 && (
                    <div className="flex shrink-0 items-center gap-1.5" title={`Priority: ${email.priority}`}>
                      <div className="size-1.5 animate-pulse rounded-full bg-red-500" />
                      <span className="hidden text-[10px] font-bold text-red-500 sm:block">URGENT</span>
                    </div>
                  )}

                  <EmailRowAiButton emailId={email.id} />
                </div>
              )}

              {email.isStarred && (
                <Star size={13} className="shrink-0 fill-amber-400 text-amber-400" />
              )}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
