"use client";

// ==================================================
// MailPilot — Dashboard Sidebar
// ==================================================
// Collapsible desktop sidebar. The link list is exported separately
// (SidebarLinks) so Topbar's mobile Sheet can reuse it without duplication.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Inbox,
  Send,
  FileEdit,
  ListTodo,
  Settings,
  Sparkles,
  FolderOpen,
  Star,
  Zap,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/Logo";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ComposeButton } from "@/components/dashboard/ComposeButton";

const mailLinks = [
  { label: "Inbox", href: "/dashboard", icon: Inbox },
  { label: "Starred", href: "/dashboard/starred", icon: Star },
  { label: "Drafts", href: "/dashboard/drafts", icon: FileEdit },
  { label: "Sent", href: "/dashboard/sent", icon: Send },
  { label: "Categories", href: "/dashboard/categories", icon: FolderOpen },
];

const aiLinks = [
  { label: "AI Drafts", href: "/dashboard/ai-drafts", icon: Sparkles },
  { label: "Tasks", href: "/dashboard/tasks", icon: ListTodo },
  { label: "Rules", href: "/dashboard/rules", icon: Zap },
];

const STORAGE_KEY = "mailpilot:sidebar-collapsed";

function useActive() {
  const pathname = usePathname();
  return (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);
}

function NavGroup({
  label,
  links,
  collapsed,
  isActive,
  onNavigate,
}: {
  label: string;
  links: typeof mailLinks;
  collapsed: boolean;
  isActive: (href: string) => boolean;
  onNavigate?: () => void;
}) {
  return (
    <div className="space-y-0.5">
      {!collapsed && (
        <p className="px-2.5 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
      )}
      {links.map(({ href, label: linkLabel, icon: Icon }) => {
        const active = isActive(href);
        const link = (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
              collapsed && "justify-center px-0",
              active
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <Icon className="size-4 shrink-0" strokeWidth={active ? 2.25 : 1.8} />
            {!collapsed && <span className="truncate">{linkLabel}</span>}
          </Link>
        );

        if (!collapsed) return link;

        return (
          <Tooltip key={href}>
            <TooltipTrigger asChild>{link}</TooltipTrigger>
            <TooltipContent side="right">{linkLabel}</TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}

/** Shared nav content, reused by the desktop rail and the mobile Sheet in Topbar. */
export function SidebarLinks({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const isActive = useActive();
  return (
    <>
      <NavGroup label="Mail" links={mailLinks} collapsed={collapsed} isActive={isActive} onNavigate={onNavigate} />
      <Separator collapsed={collapsed} />
      <NavGroup label="AI Assistant" links={aiLinks} collapsed={collapsed} isActive={isActive} onNavigate={onNavigate} />
    </>
  );
}

function Separator({ collapsed }: { collapsed: boolean }) {
  return <div className={cn("my-3 h-px bg-sidebar-border", collapsed ? "mx-1" : "mx-2.5")} />;
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const isActive = useActive();

  useEffect(() => {
    setMounted(true);
    try {
      setCollapsed(window.localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      // localStorage unavailable — default to expanded
    }
  }, []);

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        // ignore — collapse state just won't persist this session
      }
      return next;
    });
  }

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-150 md:flex",
        collapsed ? "w-16" : "w-60"
      )}
    >
      <div className={cn("flex h-14 items-center border-b border-sidebar-border px-4", collapsed && "justify-center px-0")}>
        <Logo size="md" showText={!collapsed} />
      </div>

      <div className={cn("px-3 pt-3 pb-1", collapsed && "px-2")}>
        <ComposeButton collapsed={collapsed} />
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        <SidebarLinks collapsed={collapsed} />
      </nav>

      <div className="border-t border-sidebar-border p-2">
        {(() => {
          const active = isActive("/dashboard/settings");
          const link = (
            <Link
              href="/dashboard/settings"
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                collapsed && "justify-center px-0",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Settings className="size-4 shrink-0" strokeWidth={active ? 2.25 : 1.8} />
              {!collapsed && <span>Settings</span>}
            </Link>
          );
          return collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>{link}</TooltipTrigger>
              <TooltipContent side="right">Settings</TooltipContent>
            </Tooltip>
          ) : (
            link
          );
        })()}

        <Button
          variant="ghost"
          size={collapsed ? "icon-sm" : "sm"}
          className={cn("mt-1 w-full text-sidebar-foreground/60", !collapsed && "justify-start gap-2")}
          onClick={toggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronsRight className="size-4" /> : <ChevronsLeft className="size-4" />}
          {!collapsed && <span suppressHydrationWarning>{mounted ? "Collapse" : ""}</span>}
        </Button>
      </div>
    </aside>
  );
}
