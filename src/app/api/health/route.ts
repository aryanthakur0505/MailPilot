// ==================================================
// MailPilot — Health Check API
// ==================================================
// Verifies database and Redis connectivity.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";

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

  // Check database
  try {
    await prisma.$queryRaw`SELECT 1`;
    health.database = "connected";
  } catch {
    health.status = "degraded";
  }

  // Check Redis
  try {
    const pong = await redis.ping();
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
