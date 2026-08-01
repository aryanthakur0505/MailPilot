// ==================================================
// MailPilot — Rules API
// ==================================================
// GET  /api/rules — list user's rules
// POST /api/rules — create a new rule

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const VALID_CONDITIONS = [
  "work", "personal", "newsletter", "receipt",
  "social", "spam", "urgent",
];
const VALID_ACTIONS = ["archive", "markRead", "addLabel"];

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rules = await prisma.rule.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ rules });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, conditionValue, actionType, actionValue } = body;

  if (!name || !conditionValue || !actionType) {
    return NextResponse.json(
      { error: "name, conditionValue, and actionType are required" },
      { status: 400 }
    );
  }

  if (!VALID_CONDITIONS.includes(conditionValue)) {
    return NextResponse.json(
      { error: `conditionValue must be one of: ${VALID_CONDITIONS.join(", ")}` },
      { status: 400 }
    );
  }

  if (!VALID_ACTIONS.includes(actionType)) {
    return NextResponse.json(
      { error: `actionType must be one of: ${VALID_ACTIONS.join(", ")}` },
      { status: 400 }
    );
  }

  const rule = await prisma.rule.create({
    data: {
      userId: session.user.id,
      name,
      conditionField: "category",
      conditionValue,
      actionType,
      actionValue: actionValue ?? null,
      isActive: true,
    },
  });

  return NextResponse.json({ rule }, { status: 201 });
}
