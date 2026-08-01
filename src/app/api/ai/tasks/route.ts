// ==================================================
// MailPilot — AI Tasks API
// ==================================================
// GET  /api/ai/tasks — list all tasks for current user
// POST /api/ai/tasks — manually create a new task

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tasks = await prisma.task.findMany({
    where: { userId: session.user.id },
    orderBy: [{ completed: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
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

  return NextResponse.json({ tasks });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, dueDate, emailId } = await req.json();

  if (!title || typeof title !== "string" || title.trim().length === 0) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  // emailId is optional — manual tasks may not be linked to an email
  if (emailId) {
    const email = await prisma.email.findFirst({
      where: { id: emailId, emailAccount: { userId: session.user.id } },
    });
    if (!email) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 });
    }
  }

  const task = await prisma.task.create({
    data: {
      userId: session.user.id,
      emailId: emailId ?? null,
      title: title.trim(),
      dueDate: dueDate ? new Date(dueDate) : null,
    },
  });

  return NextResponse.json({ task }, { status: 201 });
}
