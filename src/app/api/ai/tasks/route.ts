// ==================================================
// MailPilot — AI Tasks API
// ==================================================
// GET /api/ai/tasks — list all tasks for current user

import { NextResponse } from "next/server";
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
