// ==================================================
// MailPilot — AI Client (Google Gemini)
// ==================================================
// Wraps the Gemini Flash model with structured prompts
// for email classification, draft generation (with tone
// + style control), and task extraction.

import { GoogleGenerativeAI, TaskType } from "@google/generative-ai";

// -----------------------------------------------------------------------
// Client singleton
// -----------------------------------------------------------------------
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

// gemini-2.0-flash and text-embedding-004 were retired by Google. gemini-3.1-flash-lite
// replaces the chat model — deliberately the non-"thinking" lite variant, since this runs
// on every synced email (classify + extract-tasks) and the reasoning-heavy "-latest" alias
// (currently gemini-3.8-flash) burns ~10x the tokens per call on internal thinking tokens
// for no quality benefit on these structured-output tasks. gemini-embedding-001 (truncated
// to 768 dims via outputDimensionality, matching the existing pgvector column) replaces
// text-embedding-004.
const CHAT_MODEL = "gemini-3.1-flash-lite";
const EMBEDDING_MODEL = "gemini-embedding-001";
const EMBEDDING_DIMENSIONS = 768;

function getModel() {
  return genAI.getGenerativeModel({
    model: CHAT_MODEL,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.4,
    },
  });
}

// -----------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------
export type EmailCategory =
  | "work"
  | "personal"
  | "newsletter"
  | "receipt"
  | "social"
  | "spam"
  | "urgent";

export type DraftTone = "professional" | "friendly" | "brief" | "detailed";

export interface EmailClassification {
  category: EmailCategory;
  priority: number; // 0–100
  summary: string;  // one sentence
}

export interface DraftResult {
  subject: string;
  body: string;
}

export interface ExtractedTask {
  title: string;
  dueDate: string | null; // ISO date string or null
}

// -----------------------------------------------------------------------
// Helper: safely parse JSON from LLM output
// -----------------------------------------------------------------------
function parseJson<T>(raw: string): T {
  const cleaned = raw.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim();
  return JSON.parse(cleaned) as T;
}

// -----------------------------------------------------------------------
// Tone instruction map
// -----------------------------------------------------------------------
const toneInstructions: Record<DraftTone, string> = {
  professional:
    "Write in a formal, professional tone. Use complete sentences. Be courteous and concise.",
  friendly:
    "Write in a warm, conversational tone. Feel free to use casual language and a friendly greeting.",
  brief:
    "Write an extremely short reply — 2 to 4 sentences maximum. Get straight to the point.",
  detailed:
    "Write a thorough, comprehensive reply. Address all points raised in the original email with detail.",
};

// -----------------------------------------------------------------------
// 1. Classify an email
// -----------------------------------------------------------------------
export async function classifyEmail(
  subject: string,
  snippet: string,
  body: string
): Promise<EmailClassification> {
  const model = getModel();

  const prompt = `You are an email classifier. Analyze this email and return a JSON object only.

Subject: ${subject || "(no subject)"}
Preview: ${snippet || ""}
Body: ${body?.slice(0, 1500) || ""}

Return this exact JSON structure:
{
  "category": one of ["work", "personal", "newsletter", "receipt", "social", "spam", "urgent"],
  "priority": integer from 0 to 100 (100 = extremely urgent, 0 = not important),
  "summary": "One sentence description of what this email is about"
}`;

  const result = await model.generateContent(prompt);
  return parseJson<EmailClassification>(result.response.text());
}

// -----------------------------------------------------------------------
// 2. Generate a draft reply (with tone + optional style hint)
// -----------------------------------------------------------------------
export async function generateDraft(
  subject: string,
  fromName: string,
  body: string,
  tone: DraftTone = "professional",
  userStyleHint?: string
): Promise<DraftResult> {
  const model = getModel();

  const styleSection = userStyleHint
    ? `\nUser's writing style: ${userStyleHint}`
    : "";

  const toneInstruction = toneInstructions[tone];

  const prompt = `You are a personal email assistant. Write a reply to the email below.

Tone instruction: ${toneInstruction}${styleSection}

Original Email:
From: ${fromName}
Subject: ${subject || "(no subject)"}
Body: ${body?.slice(0, 2000) || ""}

Return this exact JSON structure:
{
  "subject": "Re: ${subject || ""}",
  "body": "The full reply body text — plain text only, no HTML, no markdown"
}`;

  const result = await model.generateContent(prompt);
  return parseJson<DraftResult>(result.response.text());
}

// -----------------------------------------------------------------------
// 3. Extract tasks from an email
// -----------------------------------------------------------------------
export async function extractTasks(
  subject: string,
  body: string
): Promise<ExtractedTask[]> {
  const model = getModel();

  const prompt = `You are a task extraction assistant. Extract any action items or tasks from this email.

Subject: ${subject || "(no subject)"}
Body: ${body?.slice(0, 2000) || ""}

Return a JSON array only. If there are no tasks, return an empty array [].
Each task: { "title": "Short action item description", "dueDate": "2024-01-15" or null }`;

  const result = await model.generateContent(prompt);
  return parseJson<ExtractedTask[]>(result.response.text());
}

// -----------------------------------------------------------------------
// 4. Analyze writing style from sent emails (Phase 6)
// -----------------------------------------------------------------------
export interface WritingStyleResult {
  styleSummary: string; // 2-4 sentence profile describing the user's style
}

export async function analyzeWritingStyle(
  sentEmailBodies: string[]
): Promise<WritingStyleResult> {
  // Use a slightly higher temperature for more nuanced style analysis
  const model = genAI.getGenerativeModel({
    model: CHAT_MODEL,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.5,
    },
  });

  // Concatenate up to 30 emails, each capped to 500 chars to stay in token budget
  const sample = sentEmailBodies
    .slice(0, 30)
    .map((body, i) => `--- Email ${i + 1} ---\n${body.slice(0, 500)}`)
    .join("\n\n");

  const prompt = `You are a writing style analyst. Based on the following emails sent by a user, write a concise 2-4 sentence description of their personal writing style.

Focus on:
- Tone (formal vs casual, warm vs neutral)
- Sentence length and structure (short/punchy vs long/detailed)
- Greeting and sign-off patterns
- Use of punctuation, emoji, or informal language
- Any distinctive phrases or patterns

Sent emails sample:
${sample}

Return this exact JSON structure:
{
  "styleSummary": "2-4 sentence description of the user's writing style"
}`;

  const result = await model.generateContent(prompt);
  return parseJson<WritingStyleResult>(result.response.text());
}

// -----------------------------------------------------------------------
// 5. Generate vector embedding for semantic search (Phase 8)
// -----------------------------------------------------------------------
export async function generateEmbedding(text: string): Promise<number[]> {
  const embeddingModel = genAI.getGenerativeModel({
    model: EMBEDDING_MODEL,
  });

  // outputDimensionality isn't in this SDK version's TypeScript types yet, but the
  // REST API honors it — verified directly against the live endpoint. Truncating to
  // 768 dims here keeps compatibility with the existing `vector(768)` column instead
  // of requiring a schema migration to this model's native (larger) output size.
  const result = await embeddingModel.embedContent({
    content: { parts: [{ text: text.slice(0, 8000) }], role: "user" },
    taskType: TaskType.RETRIEVAL_DOCUMENT,
    outputDimensionality: EMBEDDING_DIMENSIONS,
  } as Parameters<typeof embeddingModel.embedContent>[0] & { outputDimensionality: number });

  return result.embedding.values;
}

// -----------------------------------------------------------------------
// 6. Answer a question using retrieved email context (Phase 8 RAG)
// -----------------------------------------------------------------------
export async function answerFromContext(
  userQuery: string,
  emailContexts: { subject: string; from: string; body: string; date: string }[]
): Promise<string> {
  // Use a text model (not JSON mode) for a natural language answer
  const chatModel = genAI.getGenerativeModel({
    model: CHAT_MODEL,
    generationConfig: {
      temperature: 0.3,
    },
  });

  const contextBlock = emailContexts
    .map(
      (e, i) =>
        `--- Email ${i + 1} ---\nFrom: ${e.from}\nDate: ${e.date}\nSubject: ${e.subject}\n\n${e.body.slice(0, 1000)}`
    )
    .join("\n\n");

  const prompt = `You are MailPilot, an AI assistant with access to the user's emails.
Answer the user's question using ONLY the emails provided below as context.
If the answer is not in the emails, say "I couldn't find that in your emails."
Be concise and direct. Never make up information.

User Question: ${userQuery}

Email Context:
${contextBlock}

Answer:`;

  const result = await chatModel.generateContent(prompt);
  return result.response.text().trim();
}

