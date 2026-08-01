// ==================================================
// MailPilot — AI Draft by ID
// ==================================================
// PATCH /api/ai/drafts/[id] — update draft body, subject, or status

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { status, body: draftBody, subject } = body;

  // Validate status if provided
  if (status && !["draft", "discarded"].includes(status)) {
    return NextResponse.json(
      { error: "Invalid status. Must be 'draft' or 'discarded'." },
      { status: 400 }
    );
  }

  const existing = await prisma.aiDraft.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Draft not found" }, { status: 404 });
  }

  // Build update payload — only update fields that were provided
  const updateData: Record<string, unknown> = {};
  if (status !== undefined) updateData.status = status;
  if (draftBody !== undefined) updateData.body = draftBody;
  if (subject !== undefined) updateData.subject = subject;

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const updated = await prisma.aiDraft.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json({ draft: updated });
}
