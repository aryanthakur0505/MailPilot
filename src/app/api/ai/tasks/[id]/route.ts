// ==================================================
// MailPilot — AI Task by ID
// ==================================================
// PATCH /api/ai/tasks/[id] — toggle completed or update due date
// DELETE /api/ai/tasks/[id] — remove a task

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// -----------------------------------------------------------------------
// PATCH — update completed status and/or dueDate
// -----------------------------------------------------------------------
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
  const { completed, dueDate } = body;

  const task = await prisma.task.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const updateData: Record<string, unknown> = {};
  if (completed !== undefined) updateData.completed = Boolean(completed);
  if (dueDate !== undefined) {
    // Accept ISO string or null to clear the due date
    updateData.dueDate = dueDate ? new Date(dueDate) : null;
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const updated = await prisma.task.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json({ task: updated });
}

// -----------------------------------------------------------------------
// DELETE — remove a task entirely
// -----------------------------------------------------------------------
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const task = await prisma.task.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  await prisma.task.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
