// ==================================================
// MailPilot — Email Sync API Route
// ==================================================
// POST /api/sync
// Fetches latest emails from Gmail using stored OAuth tokens
// and upserts them into the database. After upsert, enqueues
// AI processing jobs for each email.

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchEmailsByLabel, type ParsedEmail } from "@/lib/gmail";
import { emailQueue } from "@/lib/queue";

export async function POST() {
  // 1. Verify session
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // 2. Look up the user's Google OAuth tokens from the Account table
  const account = await prisma.account.findFirst({
    where: { userId, provider: "google" },
    select: { access_token: true, refresh_token: true },
  });

  if (!account?.access_token || !account?.refresh_token) {
    return NextResponse.json(
      {
        error:
          "No Google account linked or tokens missing. Please sign in again.",
      },
      { status: 400 }
    );
  }

  // 3. Get or create the EmailAccount record for this user
  const emailAccount = await prisma.emailAccount.upsert({
    where: {
      userId_email: {
        userId,
        email: session.user.email!,
      },
    },
    update: { lastSyncedAt: new Date() },
    create: {
      userId,
      provider: "google",
      email: session.user.email!,
      lastSyncedAt: new Date(),
    },
  });

  // 4. Fetch emails from Gmail API — INBOX for the main list, plus SENT and
  // DRAFT so the /dashboard/sent and /dashboard/drafts pages have real data
  // to show (previously only INBOX was ever synced; those two pages 404'd
  // because no page existed for them, but even a page would have had
  // nothing to query). Smaller caps on Sent/Draft since they're
  // secondary views, not the primary triage surface.
  let emails: ParsedEmail[];
  try {
    const [inbox, sent, drafts] = await Promise.all([
      fetchEmailsByLabel(account.access_token, account.refresh_token, "INBOX", 50),
      fetchEmailsByLabel(account.access_token, account.refresh_token, "SENT", 30),
      fetchEmailsByLabel(account.access_token, account.refresh_token, "DRAFT", 20),
    ]);
    // A message can carry more than one of these labels (rare, but possible);
    // dedupe by gmailId so it isn't processed/upserted twice in this run.
    const byGmailId = new Map<string, ParsedEmail>();
    for (const email of [...inbox, ...sent, ...drafts]) {
      byGmailId.set(email.gmailId, email);
    }
    emails = [...byGmailId.values()];
  } catch (err) {
    console.error("[sync] Gmail API error:", err);
    return NextResponse.json(
      { error: "Failed to fetch emails from Gmail. Try signing in again." },
      { status: 502 }
    );
  }

  if (emails.length === 0) {
    return NextResponse.json({ synced: 0, message: "No emails found." });
  }

  // 5. Upsert threads and emails into the database
  let syncedCount = 0;

  for (const email of emails) {
    // Upsert the thread
    const thread = await prisma.thread.upsert({
      where: {
        emailAccountId_gmailThreadId: {
          emailAccountId: emailAccount.id,
          gmailThreadId: email.gmailThreadId,
        },
      },
      update: {
        subject: email.subject,
        snippet: email.snippet,
        lastMessageAt: email.receivedAt,
        unread: !email.isRead,
        updatedAt: new Date(),
      },
      create: {
        emailAccountId: emailAccount.id,
        gmailThreadId: email.gmailThreadId,
        subject: email.subject,
        snippet: email.snippet,
        lastMessageAt: email.receivedAt,
        unread: !email.isRead,
      },
    });

    // Upsert the individual email (gmailId is unique — no duplicates on re-sync)
    const upsertedEmail = await prisma.email.upsert({
      where: { gmailId: email.gmailId },
      update: {
        isRead: email.isRead,
        isStarred: email.isStarred,
        labels: email.labels,
      },
      create: {
        emailAccountId: emailAccount.id,
        threadId: thread.id,
        gmailId: email.gmailId,
        from: email.from,
        fromName: email.fromName,
        to: email.to,
        subject: email.subject,
        snippet: email.snippet,
        body: email.body,
        isRead: email.isRead,
        isStarred: email.isStarred,
        labels: email.labels,
        receivedAt: email.receivedAt,
      },
    });

    syncedCount++;

    // Enqueue AI processing jobs — only for INBOX mail. Categorizing or
    // extracting tasks from your own sent replies/drafts isn't meaningful
    // (you already know what you sent), and it would burn through the
    // Gemini free-tier rate limit for no benefit. Embeddings are the
    // exception: indexing sent/draft content too makes chat/RAG search
    // actually useful across everything, not just inbound mail.
    const isInbox = email.labels.includes("INBOX");
    try {
      if (isInbox) {
        await emailQueue.add("categorize-email", {
          type: "categorize-email",
          userId,
          payload: { emailId: upsertedEmail.id },
        });
        // Phase 4: extract action items — the worker has always handled this job type,
        // but nothing ever enqueued one, so task extraction was silently dead.
        await emailQueue.add("extract-tasks", {
          type: "extract-tasks",
          userId,
          payload: { emailId: upsertedEmail.id },
        });
      }
      // Phase 8: embedding generation for semantic search — all mail, inbox or not
      await emailQueue.add("generate-embedding", {
        type: "generate-embedding",
        userId,
        payload: { emailId: upsertedEmail.id },
      });
    } catch {
      // Non-fatal: if Redis is unavailable, skip queuing
      console.warn("[sync] Redis unavailable, skipping AI job enqueue");
    }
  }

  return NextResponse.json({
    synced: syncedCount,
    message: `Successfully synced ${syncedCount} emails.`,
  });
}
