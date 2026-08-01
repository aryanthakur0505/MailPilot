// ==================================================
// MailPilot — Dashboard Sidebar
// ==================================================

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/layout/Logo";
import {
  Inbox,
  Send,
  FileEdit,
  ListTodo,
  BarChart3,
  Settings,
  Sparkles,
  FolderOpen,
  Star,
  PenSquare,
  Zap,
} from "lucide-react";

const navItems = [
  { label: "Inbox", href: "/dashboard", icon: Inbox, badge: 0 },
  { label: "Starred", href: "/dashboard/starred", icon: Star },
  { label: "Drafts", href: "/dashboard/drafts", icon: FileEdit },
  { label: "Sent", href: "/dashboard/sent", icon: Send },
  { label: "Categories", href: "/dashboard/categories", icon: FolderOpen },
];

const aiItems = [
  { label: "AI Drafts", href: "/dashboard/ai-drafts", icon: Sparkles },
  { label: "Tasks", href: "/dashboard/tasks", icon: ListTodo },
  { label: "Rules", href: "/dashboard/rules", icon: Zap },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <aside
      className="fixed left-0 top-0 z-40 flex h-screen flex-col animate-slide-in-left"
      style={{
        width: "256px",
        backgroundColor: "var(--bg-surface)",
        borderRight: "1px solid var(--border-subtle)",
      }}
    >
      {/* Logo area */}
      <div
        className="flex h-16 items-center px-5 shrink-0"
        style={{ borderBottom: "1px solid var(--border-subtle)" }}
      >
        <Logo size="md" />
      </div>

      {/* Compose button */}
      <div className="px-4 pt-4 pb-2 shrink-0">
        <button
          className="w-full flex items-center justify-center gap-2.5 rounded-xl py-2.5 text-sm font-semibold transition-all duration-200 active:scale-[0.98]"
          style={{
            background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            color: "white",
            boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.boxShadow =
              "0 6px 20px rgba(99, 102, 241, 0.45), inset 0 1px 0 rgba(255,255,255,0.1)";
            (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.boxShadow =
              "0 4px 12px rgba(99, 102, 241, 0.3), inset 0 1px 0 rgba(255,255,255,0.1)";
            (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
          }}
        >
          <PenSquare size={15} />
          Compose
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3">
        {/* MAIL section */}
        <div className="mb-5">
          <p
            className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.12em]"
            style={{ color: "var(--text-muted)" }}
          >
            Mail
          </p>
          <ul className="space-y-0.5">
            {navItems.map((item, i) => {
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 animate-fade-in`}
                    style={{
                      animationDelay: `${i * 40}ms`,
                      color: active ? "var(--indigo-400)" : "var(--text-secondary)",
                      backgroundColor: active
                        ? "rgba(99, 102, 241, 0.08)"
                        : "transparent",
                    }}
                    onMouseEnter={(e) => {
                      if (!active) {
                        (e.currentTarget as HTMLAnchorElement).style.backgroundColor =
                          "rgba(255, 255, 255, 0.03)";
                        (e.currentTarget as HTMLAnchorElement).style.color =
                          "var(--text-primary)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        (e.currentTarget as HTMLAnchorElement).style.backgroundColor =
                          "transparent";
                        (e.currentTarget as HTMLAnchorElement).style.color =
                          "var(--text-secondary)";
                      }
                    }}
                  >
                    {active && <span className="nav-item-active" />}
                    <item.icon size={16} strokeWidth={active ? 2.5 : 1.8} />
                    <span className="flex-1">{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span
                        className="flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-bold"
                        style={{
                          background: "rgba(99, 102, 241, 0.2)",
                          color: "var(--indigo-400)",
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Divider */}
        <div
          className="my-3 mx-3"
          style={{ height: "1px", backgroundColor: "var(--border-subtle)" }}
        />

        {/* AI ASSISTANT section */}
        <div>
          <p
            className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.12em]"
            style={{ color: "var(--text-muted)" }}
          >
            AI Assistant
          </p>
          <ul className="space-y-0.5">
            {aiItems.map((item, i) => {
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 animate-fade-in"
                    style={{
                      animationDelay: `${(navItems.length + i) * 40}ms`,
                      color: active ? "var(--violet-400)" : "var(--text-secondary)",
                      backgroundColor: active
                        ? "rgba(139, 92, 246, 0.08)"
                        : "transparent",
                    }}
                    onMouseEnter={(e) => {
                      if (!active) {
                        (e.currentTarget as HTMLAnchorElement).style.backgroundColor =
                          "rgba(255, 255, 255, 0.03)";
                        (e.currentTarget as HTMLAnchorElement).style.color =
                          "var(--text-primary)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        (e.currentTarget as HTMLAnchorElement).style.backgroundColor =
                          "transparent";
                        (e.currentTarget as HTMLAnchorElement).style.color =
                          "var(--text-secondary)";
                      }
                    }}
                  >
                    {active && <span className="nav-item-active" style={{ background: "linear-gradient(180deg, #a78bfa, #8b5cf6)" }} />}
                    <item.icon size={16} strokeWidth={active ? 2.5 : 1.8} />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* Bottom — Settings */}
      <div
        className="shrink-0 p-3"
        style={{ borderTop: "1px solid var(--border-subtle)" }}
      >
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150"
          style={{
            color: isActive("/dashboard/settings")
              ? "var(--indigo-400)"
              : "var(--text-muted)",
            backgroundColor: isActive("/dashboard/settings")
              ? "rgba(99, 102, 241, 0.08)"
              : "transparent",
          }}
          onMouseEnter={(e) => {
            if (!isActive("/dashboard/settings")) {
              (e.currentTarget as HTMLAnchorElement).style.backgroundColor =
                "rgba(255, 255, 255, 0.03)";
              (e.currentTarget as HTMLAnchorElement).style.color =
                "var(--text-secondary)";
            }
          }}
          onMouseLeave={(e) => {
            if (!isActive("/dashboard/settings")) {
              (e.currentTarget as HTMLAnchorElement).style.backgroundColor =
                "transparent";
              (e.currentTarget as HTMLAnchorElement).style.color =
                "var(--text-muted)";
            }
          }}
        >
          <Settings size={16} strokeWidth={1.8} />
          <span>Settings</span>
        </Link>
      </div>
    </aside>
  );
}
