// ==================================================
// MailPilot — Regenerate AI Draft
// ==================================================
// POST /api/ai/drafts/[id]/regenerate
// Regenerates the draft body with a new tone.
// The old body is replaced and saved.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateDraft, type DraftTone } from "@/lib/ai";

const VALID_TONES: DraftTone[] = ["professional", "friendly", "brief", "detailed"];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { tone } = await req.json() as { tone?: DraftTone };

  if (!tone || !VALID_TONES.includes(tone)) {
    return NextResponse.json(
      { error: `Invalid tone. Must be one of: ${VALID_TONES.join(", ")}` },
      { status: 400 }
    );
  }

  // Fetch the existing draft + its original email
  const draft = await prisma.aiDraft.findFirst({
    where: { id, userId: session.user.id },
    include: {
      email: {
        select: { subject: true, fromName: true, body: true, snippet: true },
      },
    },
  });

  if (!draft) {
    return NextResponse.json({ error: "Draft not found" }, { status: 404 });
  }

  try {
    const result = await generateDraft(
      draft.email.subject ?? "",
      draft.email.fromName ?? "Unknown",
      draft.email.body ?? draft.email.snippet ?? "",
      tone
    );

    // Update draft with new content + new tone
    const updated = await prisma.aiDraft.update({
      where: { id },
      data: {
        body: result.body,
        subject: result.subject,
        tone,
      },
    });

    return NextResponse.json({ draft: updated });
  } catch (err) {
    console.error("[regenerate] Error:", err);
    return NextResponse.json(
      { error: "Failed to regenerate draft. Check your GEMINI_API_KEY." },
      { status: 502 }
    );
  }
}
