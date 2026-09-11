// ==================================================
// MailPilot — Shared Email Display Helpers
// ==================================================
// Avatar + category-badge logic, extracted from the Inbox page so
// Starred/Sent/Drafts/Categories can render emails identically instead
// of re-implementing the same helpers per page.

import type { EmailCategory } from "@/lib/ai";

// -----------------------------------------------------------------------
// Avatar initials + color, derived from sender name/email
// -----------------------------------------------------------------------
const AVATAR_PALETTES = [
  "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400",
  "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  "bg-rose-500/15 text-rose-600 dark:text-rose-400",
  "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  "bg-pink-500/15 text-pink-600 dark:text-pink-400",
  "bg-teal-500/15 text-teal-600 dark:text-teal-400",
];

export function getAvatar(name: string, email: string) {
  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : email.slice(0, 2).toUpperCase();

  const colorIndex = (name.charCodeAt(0) || email.charCodeAt(0) || 0) % AVATAR_PALETTES.length;
  return { initials, className: AVATAR_PALETTES[colorIndex] };
}

// -----------------------------------------------------------------------
// Category metadata — every category the AI actually assigns (see
// EmailCategory in lib/ai.ts). Used for badges and the Categories page's
// selector, so this list can never drift out of sync with what the
// classifier can actually produce.
// -----------------------------------------------------------------------
export const CATEGORY_META: Record<EmailCategory, { label: string; badgeClass: string }> = {
  urgent: { label: "Urgent", badgeClass: "bg-red-500/10 text-red-600 dark:text-red-400" },
  work: { label: "Work", badgeClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  newsletter: { label: "Newsletter", badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  personal: { label: "Personal", badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  social: { label: "Social", badgeClass: "bg-pink-500/10 text-pink-600 dark:text-pink-400" },
  receipt: { label: "Receipt", badgeClass: "bg-violet-500/10 text-violet-600 dark:text-violet-400" },
  spam: { label: "Spam", badgeClass: "bg-slate-500/10 text-slate-600 dark:text-slate-400" },
};

export function categoryBadgeClass(category: string | null) {
  if (category && category in CATEGORY_META) {
    return CATEGORY_META[category as EmailCategory].badgeClass;
  }
  return "bg-muted text-muted-foreground";
}
