// ==================================================
// MailPilot — AI Draft by ID
// ==================================================
// PATCH /api/ai/drafts/[id] — update draft status

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
  const { status } = await req.json();

  if (!["draft", "discarded"].includes(status)) {
    return NextResponse.json(
      { error: "Invalid status. Must be 'draft' or 'discarded'." },
      { status: 400 }
    );
  }

  const draft = await prisma.aiDraft.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!draft) {
    return NextResponse.json({ error: "Draft not found" }, { status: 404 });
  }

  const updated = await prisma.aiDraft.update({
    where: { id },
    data: { status },
  });

  return NextResponse.json({ draft: updated });
}
