// ==================================================
// MailPilot — AI Drafts API
// ==================================================
// GET  /api/ai/drafts — list all drafts for current user
// POST /api/ai/drafts — generate a new draft for an email

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { emailQueue } from "@/lib/queue";
import { generateDraft } from "@/lib/ai";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const drafts = await prisma.aiDraft.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      email: {
        select: {
          subject: true,
          from: true,
          fromName: true,
          receivedAt: true,
        },
      },
    },
  });

  return NextResponse.json({ drafts });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { emailId } = await req.json();
  if (!emailId) {
    return NextResponse.json({ error: "emailId is required" }, { status: 400 });
  }

  // Verify the email belongs to this user
  const email = await prisma.email.findFirst({
    where: {
      id: emailId,
      emailAccount: { userId: session.user.id },
    },
    select: { subject: true, fromName: true, body: true, snippet: true },
  });

  if (!email) {
    return NextResponse.json({ error: "Email not found" }, { status: 404 });
  }

  // Generate draft immediately (synchronous for the API — fast enough for UX)
  try {
    // Phase 6: Fetch user's writing style profile if available
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { writingStyle: true },
    });

    const result = await generateDraft(
      email.subject ?? "",
      email.fromName ?? "Unknown",
      email.body ?? email.snippet ?? "",
      "professional",
      user?.writingStyle ?? undefined
    );

    const draft = await prisma.aiDraft.create({
      data: {
        emailId,
        userId: session.user.id,
        subject: result.subject,
        body: result.body,
        tone: "professional",
        status: "draft",
      },
    });

    return NextResponse.json({ draft }, { status: 201 });
  } catch (err) {
    console.error("[ai/drafts] Error generating draft:", err);
    return NextResponse.json(
      { error: "Failed to generate draft. Check your GEMINI_API_KEY." },
      { status: 502 }
    );
  }
}
