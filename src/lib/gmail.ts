// ==================================================
// MailPilot — Gmail API Client
// ==================================================
// Uses stored OAuth access/refresh tokens to fetch
// emails from Gmail on behalf of the user.

import { google } from "googleapis";

// -----------------------------------------------------------------------
// Build an authenticated OAuth2 client from stored tokens
// -----------------------------------------------------------------------
export function getGmailClient(accessToken: string, refreshToken: string) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.AUTH_URL}/api/auth/callback/google`
  );

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  return google.gmail({ version: "v1", auth: oauth2Client });
}

// -----------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------
export interface ParsedEmail {
  gmailId: string;
  gmailThreadId: string;
  from: string;
  fromName: string;
  to: string;
  subject: string;
  snippet: string;
  body: string;
  isRead: boolean;
  isStarred: boolean;
  labels: string[];
  receivedAt: Date;
}

// -----------------------------------------------------------------------
// Parse Gmail message headers helper
// -----------------------------------------------------------------------
function getHeader(
  headers: { name?: string | null; value?: string | null }[],
  name: string
): string {
  return (
    headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ?? ""
  );
}

// -----------------------------------------------------------------------
// Parse a raw sender string like "John Doe <john@example.com>"
// -----------------------------------------------------------------------
function parseSender(raw: string): { name: string; email: string } {
  const match = raw.match(/^(.*?)\s*<(.+?)>$/);
  if (match) {
    return {
      name: match[1].trim().replace(/^"|"$/g, ""),
      email: match[2].trim(),
    };
  }
  return { name: raw, email: raw };
}

// -----------------------------------------------------------------------
// Decode base64url encoded Gmail body
// -----------------------------------------------------------------------
function decodeBody(data?: string | null): string {
  if (!data) return "";
  try {
    return Buffer.from(
      data.replace(/-/g, "+").replace(/_/g, "/"),
      "base64"
    ).toString("utf-8");
  } catch {
    return "";
  }
}

// -----------------------------------------------------------------------
// Extract text/plain or text/html body from Gmail message parts
// -----------------------------------------------------------------------
function extractBody(payload: {
  mimeType?: string | null;
  body?: { data?: string | null } | null;
  parts?: Array<{
    mimeType?: string | null;
    body?: { data?: string | null } | null;
  }> | null;
}): string {
  if (payload.mimeType === "text/plain" && payload.body?.data) {
    return decodeBody(payload.body.data);
  }
  if (payload.mimeType === "text/html" && payload.body?.data) {
    return decodeBody(payload.body.data);
  }
  if (payload.parts) {
    const textPart = payload.parts.find((p) => p.mimeType === "text/plain");
    if (textPart?.body?.data) return decodeBody(textPart.body.data);
    const htmlPart = payload.parts.find((p) => p.mimeType === "text/html");
    if (htmlPart?.body?.data) return decodeBody(htmlPart.body.data);
  }
  return "";
}

// -----------------------------------------------------------------------
// Fetch and parse the latest N emails from INBOX
// -----------------------------------------------------------------------
export async function fetchInboxEmails(
  accessToken: string,
  refreshToken: string,
  maxResults = 50
): Promise<ParsedEmail[]> {
  const gmail = getGmailClient(accessToken, refreshToken);

  // Step 1: Get message IDs from INBOX
  const listRes = await gmail.users.messages.list({
    userId: "me",
    labelIds: ["INBOX"],
    maxResults,
  });

  const messages = listRes.data.messages ?? [];
  if (messages.length === 0) return [];

  // Step 2: Fetch full details in parallel batches of 10
  const parsed: ParsedEmail[] = [];
  const batchSize = 10;

  for (let i = 0; i < messages.length; i += batchSize) {
    const batch = messages.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(async (msg) => {
        if (!msg.id) return null;
        const detail = await gmail.users.messages.get({
          userId: "me",
          id: msg.id,
          format: "full",
        });

        const data = detail.data;
        const headers = data.payload?.headers ?? [];
        const fromRaw = getHeader(headers, "From");
        const { name: fromName, email: fromEmail } = parseSender(fromRaw);
        const labels = data.labelIds ?? [];
        const receivedAtMs = data.internalDate
          ? parseInt(data.internalDate)
          : Date.now();

        return {
          gmailId: data.id!,
          gmailThreadId: data.threadId!,
          from: fromEmail,
          fromName,
          to: getHeader(headers, "To"),
          subject: getHeader(headers, "Subject"),
          snippet: data.snippet ?? "",
          body: extractBody(data.payload ?? {}),
          isRead: !labels.includes("UNREAD"),
          isStarred: labels.includes("STARRED"),
          labels,
          receivedAt: new Date(receivedAtMs),
        } satisfies ParsedEmail;
      })
    );
    parsed.push(...results.filter((r): r is ParsedEmail => r !== null));
  }

  return parsed;
}
