// ==================================================
// MailPilot — Writing Style Analysis API
// ==================================================
// POST /api/ai/style/analyze
// Enqueues an analyze-writing-style job for the current user.
// The worker fetches sent emails → Gemini → stores style profile.

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { emailQueue } from "@/lib/queue";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if they have a connected Google account
  const account = await prisma.account.findFirst({
    where: { userId: session.user.id, provider: "google" },
    select: { id: true },
  });

  if (!account) {
    return NextResponse.json(
      { error: "No Gmail account connected. Connect Google first." },
      { status: 403 }
    );
  }

  // Enqueue the style analysis job
  await emailQueue.add("analyze-writing-style", {
    type: "analyze-writing-style",
    userId: session.user.id,
    payload: {},
  });

  return NextResponse.json({
    success: true,
    message: "Style analysis started. Check back in a minute.",
  });
}

// GET — return the user's current writing style profile
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { writingStyle: true, styleAnalyzedAt: true },
  });

  return NextResponse.json({
    writingStyle: user?.writingStyle ?? null,
    styleAnalyzedAt: user?.styleAnalyzedAt ?? null,
  });
}
