// ==================================================
// MailPilot — Chat API (Phase 8: RAG)
// ==================================================
// POST /api/chat
// 1. Embeds the user's query with Gemini text-embedding-004
// 2. Runs a pgvector cosine similarity search against stored email embeddings
// 3. Passes the top-5 matching emails as context to Gemini Flash
// 4. Returns a grounded natural-language answer

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateEmbedding, answerFromContext } from "@/lib/ai";
import { format } from "date-fns";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { query } = await req.json();
  if (!query || typeof query !== "string" || query.trim().length === 0) {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }

  try {
    // Step 1: Embed the user's query (use RETRIEVAL_QUERY task type)
    const queryVector = await generateEmbedding(query);
    const vectorStr = `[${queryVector.join(",")}]`;

    // Step 2: pgvector cosine similarity search
    // We scope to emails belonging to the current user's accounts
    const results = await prisma.$queryRaw<
      {
        id: string;
        subject: string | null;
        from: string;
        fromName: string | null;
        body: string | null;
        snippet: string | null;
        receivedAt: Date;
        similarity: number;
      }[]
    >`
      SELECT
        e.id,
        e.subject,
        e.from,
        e."fromName",
        e.body,
        e.snippet,
        e."receivedAt",
        1 - (e.embedding <=> ${vectorStr}::vector) AS similarity
      FROM emails e
      JOIN email_accounts ea ON e."emailAccountId" = ea.id
      WHERE ea."userId" = ${session.user.id}
        AND e.embedding IS NOT NULL
      ORDER BY e.embedding <=> ${vectorStr}::vector
      LIMIT 5
    `;

    if (results.length === 0) {
      return NextResponse.json({
        answer:
          "I don't have any indexed emails to search through yet. Try syncing your inbox first, then emails will be embedded for semantic search.",
        sources: [],
      });
    }

    // Step 3: Build context and get grounded answer from Gemini
    const contexts = results.map((r) => ({
      subject: r.subject ?? "(no subject)",
      from: r.fromName ? `${r.fromName} <${r.from}>` : r.from,
      body: r.body ?? r.snippet ?? "",
      date: format(new Date(r.receivedAt), "MMM d, yyyy"),
    }));

    const answer = await answerFromContext(query, contexts);

    return NextResponse.json({
      answer,
      sources: results.map((r) => ({
        id: r.id,
        subject: r.subject,
        from: r.fromName || r.from,
        receivedAt: r.receivedAt,
        similarity: Number(r.similarity).toFixed(3),
      })),
    });
  } catch (err) {
    console.error("[api/chat] Error:", err);
    return NextResponse.json(
      { error: "Failed to process query. Check logs." },
      { status: 500 }
    );
  }
}
