// ==================================================
// MailPilot — BullMQ Queue Setup
// ==================================================
// Defines the main email processing queue.
// Works with both local Redis and Upstash (rediss:// TLS).

import { Queue } from "bullmq";

function getRedisConnection() {
  const url = process.env.REDIS_URL;

  if (!url) {
    return { host: "localhost", port: 6379 };
  }

  const parsed = new URL(url);
  const isTls = parsed.protocol === "rediss:";

  return {
    host: parsed.hostname,
    port: parseInt(parsed.port || (isTls ? "6380" : "6379")),
    password: parsed.password || undefined,
    username: parsed.username || undefined,
    tls: isTls ? {} : undefined,
  };
}

export const connection = getRedisConnection();

// Main email processing queue
export const emailQueue = new Queue("email-processing", {
  connection,
  defaultJobOptions: {
    attempts: 5,
    // Gemini free-tier 429s ask for up to ~60s before retrying (see the worker's
    // concurrency comment). Exponential from a 5s base (5s/10s/20s/40s/80s) gives
    // retries a real chance of landing after the quota window actually clears,
    // instead of burning all attempts in the first few seconds.
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
});

// Job type definitions
export type EmailJobName =
  | "sync-emails"
  | "categorize-email"
  | "summarize-thread"
  | "generate-draft"
  | "extract-tasks"
  | "analyze-writing-style"
  | "generate-embedding";

export interface EmailJobData {
  type: EmailJobName;
  userId: string;
  payload: Record<string, unknown>;
}
