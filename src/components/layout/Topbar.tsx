// ==================================================
// MailPilot — Dashboard Topbar
// ==================================================

"use client";

import { useSession, signOut } from "next-auth/react";
import { Avatar } from "@/components/ui/Avatar";
import { Search, Bell, LogOut, ChevronDown, Settings } from "lucide-react";
import { useState } from "react";

export function Topbar() {
  const { data: session } = useSession();
  const [showMenu, setShowMenu] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <header
      className="fixed right-0 top-0 z-30 flex h-16 items-center justify-between px-6"
      style={{
        left: "256px",
        backgroundColor: "rgba(8, 11, 22, 0.85)",
        borderBottom: "1px solid var(--border-subtle)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      {/* Search bar */}
      <div className="relative flex-1 max-w-md">
        <Search
          size={15}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200"
          style={{ color: searchFocused ? "var(--indigo-400)" : "var(--text-muted)" }}
        />
        <input
          type="text"
          placeholder="Search emails, threads, contacts..."
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          className="w-full rounded-xl pl-9 pr-4 py-2.5 text-sm transition-all duration-200"
          style={{
            backgroundColor: searchFocused
              ? "var(--bg-elevated)"
              : "var(--bg-card)",
            border: `1px solid ${searchFocused ? "rgba(99, 102, 241, 0.4)" : "var(--border-subtle)"}`,
            color: "var(--text-primary)",
            outline: "none",
            boxShadow: searchFocused
              ? "0 0 0 3px rgba(99, 102, 241, 0.1)"
              : "none",
          }}
        />
        {!searchFocused && (
          <div
            className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-1"
          >
            <kbd
              className="rounded px-1.5 py-0.5 text-[10px] font-medium"
              style={{
                backgroundColor: "var(--bg-elevated)",
                color: "var(--text-muted)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              ⌘K
            </kbd>
          </div>
        )}
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-2 ml-4">
        {/* Notifications */}
        <button
          className="relative flex items-center justify-center rounded-xl transition-all duration-200"
          style={{
            width: "38px",
            height: "38px",
            color: "var(--text-muted)",
            border: "1px solid var(--border-subtle)",
            backgroundColor: "var(--bg-card)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "var(--text-primary)";
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--bg-elevated)";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-default)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)";
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--bg-card)";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-subtle)";
          }}
        >
          <Bell size={16} />
          {/* Notification dot */}
          <span
            className="absolute right-2 top-2 h-2 w-2 rounded-full"
            style={{
              backgroundColor: "var(--indigo-500)",
              boxShadow: "0 0 6px rgba(99, 102, 241, 0.8)",
            }}
          />
        </button>

        {/* Divider */}
        <div
          className="mx-1 h-6"
          style={{ width: "1px", backgroundColor: "var(--border-subtle)" }}
        />

        {/* User profile */}
        <div className="relative">
          <button
            id="user-menu-button"
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 transition-all duration-200"
            style={{
              backgroundColor: showMenu ? "var(--bg-elevated)" : "transparent",
              border: "1px solid transparent",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                "var(--bg-card)";
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "var(--border-subtle)";
            }}
            onMouseLeave={(e) => {
              if (!showMenu) {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  "transparent";
                (e.currentTarget as HTMLButtonElement).style.borderColor =
                  "transparent";
              }
            }}
          >
            <Avatar
              src={session?.user?.image}
              alt={session?.user?.name || "User"}
              size="sm"
            />
            <div className="hidden text-left md:block">
              <p className="text-sm font-semibold leading-none" style={{ color: "var(--text-primary)" }}>
                {session?.user?.name || "User"}
              </p>
              <p className="mt-0.5 text-xs leading-none truncate max-w-[140px]" style={{ color: "var(--text-muted)" }}>
                {session?.user?.email || ""}
              </p>
            </div>
            <ChevronDown
              size={13}
              style={{ color: "var(--text-muted)" }}
              className={`transition-transform duration-200 ${showMenu ? "rotate-180" : ""}`}
            />
          </button>

          {/* Dropdown menu */}
          {showMenu && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowMenu(false)}
              />
              {/* Menu */}
              <div
                className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-xl animate-scale-in"
                style={{
                  backgroundColor: "var(--bg-card)",
                  border: "1px solid var(--border-default)",
                  boxShadow: "0 16px 48px rgba(0, 0, 0, 0.6), 0 4px 12px rgba(0, 0, 0, 0.4)",
                }}
              >
                {/* User info header */}
                <div
                  className="flex items-center gap-3 px-4 py-3.5"
                  style={{ borderBottom: "1px solid var(--border-subtle)" }}
                >
                  <Avatar
                    src={session?.user?.image}
                    alt={session?.user?.name || "User"}
                    size="md"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                      {session?.user?.name}
                    </p>
                    <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                      {session?.user?.email}
                    </p>
                  </div>
                </div>

                {/* Menu items */}
                <div className="p-1.5">
                  <button
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-150"
                    style={{ color: "var(--text-secondary)" }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                        "rgba(255,255,255,0.03)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                        "transparent";
                    }}
                  >
                    <Settings size={15} />
                    Account settings
                  </button>
                  <div
                    className="my-1 mx-1"
                    style={{ height: "1px", backgroundColor: "var(--border-subtle)" }}
                  />
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150"
                    style={{ color: "#f87171" }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                        "rgba(248, 113, 113, 0.07)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                        "transparent";
                    }}
                  >
                    <LogOut size={15} />
                    Sign out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
