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
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
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
