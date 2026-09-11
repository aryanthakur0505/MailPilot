// ==================================================
// MailPilot — Settings Page (Phase 6)
// ==================================================
// Hosts user preference panels including
// the Phase 6 Writing Style analyzer.

import { auth } from "@/lib/auth";
import { WritingStyleCard } from "@/components/dashboard/WritingStyleCard";
import { Settings } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
          <Settings size={18} className="text-primary" strokeWidth={1.8} />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Customize how MailPilot works for you
          </p>
        </div>
      </div>

      {/* Phase 6 — Writing Style */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          AI Personalization
        </h2>
        <WritingStyleCard />
      </section>

      {/* Account info */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          Account
        </h2>
        <Card className="p-5">
          <div className="flex items-center gap-4">
            <Avatar className="size-12">
              <AvatarImage src={session.user.image ?? undefined} alt={session.user.name ?? "User"} />
              <AvatarFallback>{session.user.name?.[0]?.toUpperCase() ?? "?"}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold">{session.user.name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{session.user.email}</p>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}
