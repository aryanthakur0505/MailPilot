// ==================================================
// MailPilot — Root Layout
// ==================================================

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { QueryProvider } from "@/components/providers/QueryProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MailPilot — AI Email Operations Assistant",
  description:
    "Intelligently manage your inbox with AI. Connect Gmail & Outlook, auto-organize emails, generate reply drafts, extract tasks, and boost productivity.",
  keywords: [
    "email assistant",
    "AI email",
    "Gmail",
    "Outlook",
    "inbox management",
    "email automation",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <SessionProvider>
          <QueryProvider>{children}</QueryProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
