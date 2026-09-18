// ==================================================
// MailPilot — AI Email Worker
// ==================================================
// Standalone Node.js process. Run with: npm run worker
// Consumes jobs from BullMQ and performs AI processing.

import "dotenv/config";
import { Worker } from "bullmq";
import { PrismaClient } from "@prisma/client";
import { google } from "googleapis";
import { connection } from "../src/lib/queue";
import { classifyEmail, generateDraft, extractTasks, analyzeWritingStyle, generateEmbedding } from "../src/lib/ai";
import { fetchSentEmails } from "../src/lib/gmail";
import type { EmailJobData } from "../src/lib/queue";

const prisma = new PrismaClient();

console.log("[worker] MailPilot AI Worker starting...");

const worker = new Worker<EmailJobData>(
  "email-processing",
  async (job) => {
    const { type, userId, payload } = job.data;
    console.log(`[worker] Processing job: ${type} (${job.id})`);

    // ── categorize-email ──────────────────────────────────────────────
    if (type === "categorize-email") {
      const { emailId } = payload as { emailId: string };

      const email = await prisma.email.findUnique({
        where: { id: emailId },
        select: { subject: true, snippet: true, body: true },
      });

      if (!email) {
        console.warn(`[worker] Email ${emailId} not found, skipping.`);
        return;
      }

      const result = await classifyEmail(
        email.subject ?? "",
        email.snippet ?? "",
        email.body ?? ""
      );

      await prisma.email.update({
        where: { id: emailId },
        data: {
          category: result.category,
          priority: result.priority,
          summary: result.summary,
          processedAt: new Date(),
        },
      });

      console.log(`[worker] Classified email ${emailId}: ${result.category} (priority: ${result.priority})`);

      // ── Phase 7: Rule Evaluation ─────────────────────────────────────
      const activeRules = await prisma.rule.findMany({
        where: { userId, isActive: true },
      });

      const matchedRules = activeRules.filter(
        (r) => r.conditionField === "category" && r.conditionValue === result.category
      );

      if (matchedRules.length > 0) {
        // Fetch the email's Gmail ID and the user's OAuth token
        const emailRecord = await prisma.email.findUnique({
          where: { id: emailId },
          select: { gmailId: true },
        });
        const account = await prisma.account.findFirst({
          where: { userId, provider: "google" },
          select: { access_token: true, refresh_token: true },
        });

        if (emailRecord && account?.access_token) {
          const auth = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET
          );
          auth.setCredentials({
            access_token: account.access_token,
            refresh_token: account.refresh_token ?? undefined,
          });
          const gmail = google.gmail({ version: "v1", auth });

          for (const rule of matchedRules) {
            try {
              if (rule.actionType === "archive") {
                await gmail.users.messages.modify({
                  userId: "me",
                  id: emailRecord.gmailId,
                  requestBody: { removeLabelIds: ["INBOX"] },
                });
                console.log(`[worker] Rule "${rule.name}": Archived email ${emailRecord.gmailId}`);
              } else if (rule.actionType === "markRead") {
                await gmail.users.messages.modify({
                  userId: "me",
                  id: emailRecord.gmailId,
                  requestBody: { removeLabelIds: ["UNREAD"] },
                });
                console.log(`[worker] Rule "${rule.name}": Marked email ${emailRecord.gmailId} as read`);
              } else if (rule.actionType === "addLabel" && rule.actionValue) {
                // Look up or create the label ID
                const labelsRes = await gmail.users.labels.list({ userId: "me" });
                const existing = labelsRes.data.labels?.find(
                  (l) => l.name?.toLowerCase() === rule.actionValue!.toLowerCase()
                );
                const labelId = existing?.id ?? (
                  await gmail.users.labels.create({
                    userId: "me",
                    requestBody: { name: rule.actionValue },
                  })
                ).data.id;

                if (labelId) {
                  await gmail.users.messages.modify({
                    userId: "me",
                    id: emailRecord.gmailId,
                    requestBody: { addLabelIds: [labelId] },
                  });
                  console.log(`[worker] Rule "${rule.name}": Added label "${rule.actionValue}" to email ${emailRecord.gmailId}`);
                }
              }
            } catch (ruleErr) {
              console.error(`[worker] Rule "${rule.name}" action failed:`, (ruleErr as Error).message);
            }
          }
        }
      }
    }

    // ── generate-draft ────────────────────────────────────────────────
    else if (type === "generate-draft") {
      const { emailId } = payload as { emailId: string };

      const email = await prisma.email.findUnique({
        where: { id: emailId },
        select: { subject: true, fromName: true, body: true, snippet: true },
      });

      if (!email) {
        console.warn(`[worker] Email ${emailId} not found, skipping.`);
        return;
      }

      // Fetch user's writing style for personalized draft
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { writingStyle: true },
      });

      const result = await generateDraft(
        email.subject ?? "",
        email.fromName ?? "Unknown",
        email.body ?? email.snippet ?? "",
        "professional",
        user?.writingStyle ?? undefined
      );

      await prisma.aiDraft.create({
        data: {
          emailId,
          userId,
          subject: result.subject,
          body: result.body,
          tone: "professional",
          status: "draft",
        },
      });

      console.log(`[worker] Generated draft for email ${emailId}`);
    }

    // ── extract-tasks ─────────────────────────────────────────────────
    else if (type === "extract-tasks") {
      const { emailId } = payload as { emailId: string };

      const email = await prisma.email.findUnique({
        where: { id: emailId },
        select: { subject: true, body: true, snippet: true },
      });

      if (!email) {
        console.warn(`[worker] Email ${emailId} not found, skipping.`);
        return;
      }

      const tasks = await extractTasks(
        email.subject ?? "",
        email.body ?? email.snippet ?? ""
      );

      if (tasks.length > 0) {
        await prisma.task.createMany({
          data: tasks.map((t) => ({
            emailId,
            userId,
            title: t.title,
            dueDate: t.dueDate ? new Date(t.dueDate) : null,
          })),
        });
        console.log(`[worker] Extracted ${tasks.length} tasks from email ${emailId}`);
      } else {
        console.log(`[worker] No tasks found in email ${emailId}`);
      }
    }

    else if (type === "analyze-writing-style") {
      // Fetch the user's Google OAuth tokens
      const account = await prisma.account.findFirst({
        where: { userId, provider: "google" },
        select: { access_token: true, refresh_token: true },
      });

      if (!account?.access_token || !account?.refresh_token) {
        console.warn(`[worker] No Google account for user ${userId}, skipping style analysis.`);
        return;
      }

      console.log(`[worker] Fetching sent emails for user ${userId}...`);
      const sentEmails = await fetchSentEmails(
        account.access_token,
        account.refresh_token,
        30
      );

      if (sentEmails.length === 0) {
        console.warn(`[worker] No sent emails found for user ${userId}, skipping.`);
        return;
      }

      console.log(`[worker] Analyzing writing style from ${sentEmails.length} sent emails...`);
      const { styleSummary } = await analyzeWritingStyle(
        sentEmails.map((e) => `Subject: ${e.subject}\n\n${e.body}`)
      );

      await prisma.user.update({
        where: { id: userId },
        data: {
          writingStyle: styleSummary,
          styleAnalyzedAt: new Date(),
        },
      });

      console.log(`[worker] ✅ Writing style saved for user ${userId}: "${styleSummary.slice(0, 80)}..."`);
    }

    else if (type === "generate-embedding") {
      const { emailId } = payload as { emailId: string };

      const email = await prisma.email.findUnique({
        where: { id: emailId },
        select: { subject: true, body: true, snippet: true },
      });

      if (!email) {
        console.warn(`[worker] Email ${emailId} not found for embedding, skipping.`);
        return;
      }

      // Strip basic HTML tags and build a clean text blob
      const rawText = `${email.subject ?? ""} ${email.body ?? email.snippet ?? ""}`;
      const cleanText = rawText.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

      if (cleanText.length < 10) {
        console.warn(`[worker] Email ${emailId} has no usable text for embedding, skipping.`);
        return;
      }

      const vector = await generateEmbedding(cleanText);
      const vectorStr = `[${vector.join(",")}]`;

      // Use raw SQL to update the vector column (Prisma doesn't support vector type natively)
      await prisma.$executeRaw`
        UPDATE emails
        SET embedding = ${vectorStr}::vector
        WHERE id = ${emailId}
      `;

      console.log(`[worker] ✅ Embedding generated for email ${emailId} (${vector.length} dims)`);
    }

    else {
      console.warn(`[worker] Unknown job type: ${type}`);
    }
  },
  {
    connection,
    // The Gemini free tier caps generateContent at 15 requests/minute per model
    // (categorize-email and extract-tasks both call it). Concurrency 3 blew through
    // that instantly on a backlog, and jobs exhausted their retry attempts (see
    // queue.ts) faster than Google's ~60s cooldown, landing in "failed" permanently
    // instead of eventually succeeding. concurrency: 1 keeps this comfortably under
    // the free-tier ceiling; bump it back up once on a paid tier with real quota.
    concurrency: 1,
  }
);

worker.on("completed", (job) => {
  console.log(`[worker] ✅ Job ${job.id} (${job.data.type}) completed`);
});

worker.on("failed", (job, err) => {
  console.error(`[worker] ❌ Job ${job?.id} failed:`, err.message);
});

worker.on("error", (err) => {
  console.error("[worker] Worker error:", err.message);
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("[worker] Shutting down gracefully...");
  await worker.close();
  await prisma.$disconnect();
  process.exit(0);
});

// ── Dummy HTTP Server for Render Free Tier ──────────────────────
// Render only offers a free tier for "Web Services" (which require an open port),
// not "Background Workers". This dummy server listens on the required port and
// returns 200 OK, tricking Render into hosting this worker on the free tier!
import http from "http";
const PORT = process.env.PORT || 8080;
http.createServer((req, res) => {
  res.writeHead(200);
  res.end("MailPilot Worker is healthy!");
}).listen(PORT, () => {
  console.log(`[worker] Dummy HTTP server listening on port ${PORT} (for Render health checks)`);
});

console.log("[worker] Ready. Waiting for jobs...");
