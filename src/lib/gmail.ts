// ==================================================
// MailPilot — Gmail API Client
// ==================================================
// Uses stored OAuth access/refresh tokens to fetch
// emails from Gmail on behalf of the user.

import { google } from "googleapis";

// -----------------------------------------------------------------------
// Refreshed-token persistence callback — googleapis transparently
// refreshes an expired access_token on any request using the stored
// refresh_token, but only in-memory on that OAuth2Client instance.
// Without this, the refreshed token is thrown away and every call after
// the original token's ~1hr expiry pays a refresh round-trip again
// instead of reusing a cached fresh one. Callers pass their own
// persistence logic (rather than gmail.ts importing Prisma directly)
// since this module is shared between the Next.js app and the standalone
// worker process, which use separate Prisma client setups.
// -----------------------------------------------------------------------
export type OnTokenRefresh = (tokens: {
  access_token?: string | null;
  refresh_token?: string | null;
}) => unknown;

// -----------------------------------------------------------------------
// Build an authenticated OAuth2 client from stored tokens
// -----------------------------------------------------------------------
export function getGmailClient(
  accessToken: string,
  refreshToken: string,
  onTokenRefresh?: OnTokenRefresh
) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.AUTH_URL}/api/auth/callback/google`
  );

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (onTokenRefresh) {
    oauth2Client.on("tokens", (tokens) => {
      // Google only includes refresh_token here on the rare occasions it
      // rotates it — access_token is present on every refresh.
      if (tokens.access_token || tokens.refresh_token) {
        Promise.resolve(
          onTokenRefresh({
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
          })
        ).catch((err) => console.error("[gmail] Failed to persist refreshed token:", err));
      }
    });
  }

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
// Fetch and parse the latest N messages carrying a given Gmail label.
// Used for INBOX, SENT, and DRAFT — same message shape either way, so
// one implementation covers all three instead of duplicating the
// list+batch-fetch+parse logic per label.
// -----------------------------------------------------------------------
export async function fetchEmailsByLabel(
  accessToken: string,
  refreshToken: string,
  labelId: "INBOX" | "SENT" | "DRAFT",
  maxResults = 50,
  onTokenRefresh?: OnTokenRefresh
): Promise<ParsedEmail[]> {
  const gmail = getGmailClient(accessToken, refreshToken, onTokenRefresh);

  // Step 1: Get message IDs carrying this label
  const listRes = await gmail.users.messages.list({
    userId: "me",
    labelIds: [labelId],
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

// -----------------------------------------------------------------------
// Back-compat wrapper — fetchInboxEmails was the original, single-label
// entry point; kept so existing call sites don't need to change.
// -----------------------------------------------------------------------
export function fetchInboxEmails(
  accessToken: string,
  refreshToken: string,
  maxResults = 50,
  onTokenRefresh?: OnTokenRefresh
): Promise<ParsedEmail[]> {
  return fetchEmailsByLabel(accessToken, refreshToken, "INBOX", maxResults, onTokenRefresh);
}

// -----------------------------------------------------------------------
// Send an email via Gmail API (user-triggered only)
// -----------------------------------------------------------------------
export async function sendGmailEmail(
  accessToken: string,
  refreshToken: string,
  options: {
    to: string;
    subject: string;
    body: string;
    threadId?: string; // pass to keep it in the same Gmail thread
  },
  onTokenRefresh?: OnTokenRefresh
): Promise<{ messageId: string }> {
  const gmail = getGmailClient(accessToken, refreshToken, onTokenRefresh);

  // Build RFC 2822 MIME message
  const mimeLines = [
    `To: ${options.to}`,
    `Subject: ${options.subject}`,
    "Content-Type: text/plain; charset=utf-8",
    "MIME-Version: 1.0",
    "",
    options.body,
  ];
  const raw = Buffer.from(mimeLines.join("\r\n"))
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const res = await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw,
      threadId: options.threadId,
    },
  });

  return { messageId: res.data.id! };
}

// -----------------------------------------------------------------------
// Fetch sent emails for writing style analysis (Phase 6)
// -----------------------------------------------------------------------
export async function fetchSentEmails(
  accessToken: string,
  refreshToken: string,
  maxResults = 30,
  onTokenRefresh?: OnTokenRefresh
): Promise<{ subject: string; body: string }[]> {
  const gmail = getGmailClient(accessToken, refreshToken, onTokenRefresh);

  const listRes = await gmail.users.messages.list({
    userId: "me",
    labelIds: ["SENT"],
    maxResults,
  });

  const messages = listRes.data.messages ?? [];
  if (messages.length === 0) return [];

  const results: { subject: string; body: string }[] = [];
  const batchSize = 10;

  for (let i = 0; i < messages.length; i += batchSize) {
    const batch = messages.slice(i, i + batchSize);
    const fetched = await Promise.all(
      batch.map(async (msg) => {
        if (!msg.id) return null;
        const detail = await gmail.users.messages.get({
          userId: "me",
          id: msg.id,
          format: "full",
        });
        const headers = detail.data.payload?.headers ?? [];
        const subject =
          headers.find((h) => h.name?.toLowerCase() === "subject")?.value ?? "";
        const body = extractBody(detail.data.payload ?? {});
        return { subject, body };
      })
    );
    results.push(
      ...fetched.filter((r): r is { subject: string; body: string } => r !== null)
    );
  }

  return results;
}

