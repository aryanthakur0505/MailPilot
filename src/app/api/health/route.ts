// ==================================================
// MailPilot — Health Check API
// ==================================================
// Verifies database and Redis connectivity.
// Both checks have a hard 4-second timeout so a slow/dead
// dependency degrades gracefully instead of hanging the server.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";

const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms)
  );
  return Promise.race([promise, timeout]);
};

export async function GET() {
  const health: {
    status: "ok" | "degraded" | "error";
    database: "connected" | "disconnected";
    redis: "connected" | "disconnected";
    timestamp: string;
  } = {
    status: "ok",
    database: "disconnected",
    redis: "disconnected",
    timestamp: new Date().toISOString(),
  };

  // Check database — 4s hard timeout
  try {
    await withTimeout(prisma.$queryRaw`SELECT 1`, 4000);
    health.database = "connected";
  } catch {
    health.status = "degraded";
  }

  // Check Redis — 4s hard timeout
  try {
    const pong = await withTimeout(redis.ping(), 4000);
    if (pong === "PONG") {
      health.redis = "connected";
    }
  } catch {
    if (health.status === "degraded") {
      health.status = "error";
    } else {
      health.status = "degraded";
    }
  }

  const statusCode = health.status === "ok" ? 200 : 503;
  return NextResponse.json(health, { status: statusCode });
}
