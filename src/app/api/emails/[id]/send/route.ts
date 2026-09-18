// ==================================================
// MailPilot — Send Email API
// ==================================================
// POST /api/emails/[id]/send
//
// Sends the email associated with a draft via Gmail.
// The user MUST explicitly trigger this action.
// MailPilot NEVER sends automatically.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendGmailEmail } from "@/lib/gmail";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const { id: emailId } = await params;
  const { draftId } = await req.json() as { draftId: string };

  if (!draftId) {
    return NextResponse.json({ error: "draftId is required" }, { status: 400 });
  }

  // 1. Load the original email (to get reply-to address + thread)
  const email = await prisma.email.findFirst({
    where: {
      id: emailId,
      emailAccount: { userId: session.user.id },
    },
    include: {
      emailAccount: true,
      thread: { select: { gmailThreadId: true } },
    },
  });

  if (!email) {
    return NextResponse.json({ error: "Email not found" }, { status: 404 });
  }

  // 2. Load the draft being sent
  const draft = await prisma.aiDraft.findFirst({
    where: { id: draftId, userId: session.user.id, emailId },
  });

  if (!draft) {
    return NextResponse.json({ error: "Draft not found" }, { status: 404 });
  }

  // 3. Retrieve the user's OAuth tokens from their Google account
  const account = await prisma.account.findFirst({
    where: {
      userId: session.user.id,
      provider: "google",
    },
    select: { access_token: true, refresh_token: true },
  });

  if (!account?.access_token || !account?.refresh_token) {
    return NextResponse.json(
      { error: "No Gmail account connected. Please connect Google." },
      { status: 403 }
    );
  }

  try {
    // 4. Send via Gmail API
    const { messageId } = await sendGmailEmail(
      account.access_token,
      account.refresh_token,
      {
        to: email.from,               // Reply to the original sender
        subject: draft.subject ?? `Re: ${email.subject ?? ""}`,
        body: draft.body,
        threadId: email.thread.gmailThreadId, // Keep in the same Gmail thread
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

    // 5. Mark the draft as sent
    await prisma.aiDraft.update({
      where: { id: draftId },
      data: { status: "discarded" }, // Remove from active drafts list
    });

    return NextResponse.json({ success: true, messageId });
  } catch (err) {
    console.error("[send] Error sending email:", err);
    return NextResponse.json(
      { error: "Failed to send email. Please try again." },
      { status: 502 }
    );
  }
}
