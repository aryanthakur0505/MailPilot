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
    <div
      className="min-h-screen bg-mesh"
      style={{ backgroundColor: "var(--bg-base)" }}
    >
      {/* Fixed sidebar */}
      <Sidebar />

      {/* Fixed topbar — offset by sidebar width */}
      <Topbar />

      {/* Main content area */}
      <main
        className="min-h-screen"
        style={{
          marginLeft: "256px",
          paddingTop: "64px",
        }}
      >
        <div className="p-8 animate-fade-up">{children}</div>
      </main>

      {/* Phase 8: Floating chat widget */}
      <ChatWidget />
    </div>
  );
}
