// ==================================================
// MailPilot — Shared Types
// ==================================================

export type EmailProvider = "google" | "microsoft";

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  badge?: number;
}

export interface HealthStatus {
  status: "ok" | "error";
  database: "connected" | "disconnected";
  redis: "connected" | "disconnected";
  timestamp: string;
}
