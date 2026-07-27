// ==================================================
// MailPilot — AI Email Worker
// ==================================================
// Standalone Node.js process. Run with: npm run worker
// Consumes jobs from BullMQ and performs AI processing.

import "dotenv/config";
import { Worker } from "bullmq";
import { PrismaClient } from "@prisma/client";
import { connection } from "../src/lib/queue";
import { classifyEmail, generateDraft, extractTasks } from "../src/lib/ai";
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

      const result = await generateDraft(
        email.subject ?? "",
        email.fromName ?? "Unknown",
        email.body ?? email.snippet ?? ""
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

    else {
      console.warn(`[worker] Unknown job type: ${type}`);
    }
  },
  {
    connection,
    concurrency: 3, // Process up to 3 emails at once
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

console.log("[worker] Ready. Waiting for jobs...");
