// ==================================================
// MailPilot — AI Client (Google Gemini)
// ==================================================
// Wraps the Gemini 1.5 Flash model with structured
// prompts for email classification, draft generation,
// and task extraction. All outputs are strict JSON.

import { GoogleGenerativeAI } from "@google/generative-ai";

// -----------------------------------------------------------------------
// Client singleton
// -----------------------------------------------------------------------
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

function getModel() {
  return genAI.getGenerativeModel({
    model: "antigravity-preview-05-2026",
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.3,
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
  // Strip markdown code fences if present
  const cleaned = raw.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim();
  return JSON.parse(cleaned) as T;
}

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
  const text = result.response.text();
  return parseJson<EmailClassification>(text);
}

// -----------------------------------------------------------------------
// 2. Generate a draft reply
// -----------------------------------------------------------------------
export async function generateDraft(
  subject: string,
  fromName: string,
  body: string
): Promise<DraftResult> {
  const model = getModel();

  const prompt = `You are a professional email assistant. Write a concise, helpful reply to this email.

Original Email:
From: ${fromName}
Subject: ${subject || "(no subject)"}
Body: ${body?.slice(0, 2000) || ""}

Return this exact JSON structure:
{
  "subject": "Re: ${subject || ""}",
  "body": "The full reply body text, plain text only, no HTML"
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  return parseJson<DraftResult>(text);
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
Each task should follow this structure:
{ "title": "Short action item description", "dueDate": "2024-01-15" or null }`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  return parseJson<ExtractedTask[]>(text);
}
