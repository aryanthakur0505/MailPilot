// ==================================================
// MailPilot — Dashboard Layout
// ==================================================
// Wraps all /dashboard/* pages with sidebar + topbar.

import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { ChatWidget } from "@/components/dashboard/ChatWidget";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1">
          <div className="animate-fade-up mx-auto max-w-7xl p-6 sm:p-8">{children}</div>
        </main>
      </div>

      {/* Phase 8: Floating chat widget */}
      <ChatWidget />
    </div>
  );
}
