// ==================================================
// MailPilot — BullMQ Worker (Placeholder)
// ==================================================
// This worker runs as a separate process outside Next.js.
// It consumes jobs from the email-processing queue.
//
// Run with: npx tsx worker/index.ts
// In production: use a process manager (PM2, Docker, etc.)

import { Worker } from "bullmq";

const connection = {
  host: process.env.REDIS_URL
    ? new URL(process.env.REDIS_URL).hostname
    : "localhost",
  port: process.env.REDIS_URL
    ? parseInt(new URL(process.env.REDIS_URL).port || "6379")
    : 6379,
  password: process.env.REDIS_URL
    ? new URL(process.env.REDIS_URL).password || undefined
    : undefined,
};

const worker = new Worker(
  "email-processing",
  async (job) => {
    console.log(`[Worker] Processing job ${job.id} — ${job.name}`);
    console.log(`[Worker] Data:`, JSON.stringify(job.data, null, 2));

    // Phase 0: Placeholder — actual processors added in Phase 2+
    switch (job.data.type) {
      case "sync-emails":
        console.log("[Worker] Sync emails — not implemented yet");
        break;
      case "categorize-email":
        console.log("[Worker] Categorize email — not implemented yet");
        break;
      case "summarize-thread":
        console.log("[Worker] Summarize thread — not implemented yet");
        break;
      case "generate-draft":
        console.log("[Worker] Generate draft — not implemented yet");
        break;
      default:
        console.log(`[Worker] Unknown job type: ${job.data.type}`);
    }

    return { success: true };
  },
  { connection, concurrency: 5 }
);

worker.on("completed", (job) => {
  console.log(`[Worker] ✓ Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`[Worker] ✗ Job ${job?.id} failed:`, err.message);
});

worker.on("ready", () => {
  console.log("[Worker] MailPilot email worker is ready and listening...");
});

console.log("[Worker] Starting MailPilot email worker...");
