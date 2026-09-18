// ==================================================
// MailPilot — Compose (send a brand-new email) API
// ==================================================
// POST /api/emails/compose
//
// Unlike /api/emails/[id]/send (which replies to an existing email +
// AI draft), this sends a fresh email to anyone — no existing thread
// required. Reuses the same sendGmailEmail() the reply flow already
// uses; just omits threadId since there's no thread to keep it in.
// The user MUST explicitly trigger this action (the Compose dialog's
// own Send button) — MailPilot never sends automatically.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendGmailEmail } from "@/lib/gmail";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const { to, subject, body } = (await req.json()) as {
    to?: string;
    subject?: string;
    body?: string;
  };

  if (!to?.trim()) {
    return NextResponse.json({ error: "A recipient is required" }, { status: 400 });
  }
  // Minimal shape check — Gmail itself will reject a genuinely malformed address.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to.trim())) {
    return NextResponse.json({ error: "That doesn't look like a valid email address" }, { status: 400 });
  }
  if (!body?.trim()) {
    return NextResponse.json({ error: "The email body can't be empty" }, { status: 400 });
  }

  // Retrieve the user's OAuth tokens from their Google account
  const account = await prisma.account.findFirst({
    where: { userId, provider: "google" },
    select: { access_token: true, refresh_token: true },
  });

  if (!account?.access_token || !account?.refresh_token) {
    return NextResponse.json(
      { error: "No Gmail account connected. Please connect Google." },
      { status: 403 }
    );
  }

  try {
    const { messageId } = await sendGmailEmail(
      account.access_token,
      account.refresh_token,
      {
        to: to.trim(),
        subject: subject?.trim() || "(no subject)",
        body: body.trim(),
        // no threadId — this is a new conversation, not a reply
      },
      (tokens) =>
        prisma.account.updateMany({
          where: { userId, provider: "google" },
          data: {
            ...(tokens.access_token ? { access_token: tokens.access_token } : {}),
            ...(tokens.refresh_token ? { refresh_token: tokens.refresh_token } : {}),
          },
        })
    );

    return NextResponse.json({ success: true, messageId });
  } catch (err) {
    console.error("[compose] Error sending email:", err);
    return NextResponse.json(
      { error: "Failed to send email. Please try again." },
      { status: 502 }
    );
  }
}
