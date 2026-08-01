<div align="center">
  <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/mail.svg" alt="MailPilot Logo" width="80" height="80">
  <h1 align="center">MailPilot</h1>
  <p align="center">
    <strong>An intelligent, AI-powered email client designed to give you superpowers over your inbox.</strong>
  </p>
  
  <p align="center">
    <a href="#-the-problem-it-solves">Why MailPilot?</a> •
    <a href="#-core-architecture">Architecture</a> •
    <a href="#-feature-deep-dive-the-8-phases">Features</a> •
    <a href="#-getting-started">Installation</a>
  </p>
</div>

---

![Dashboard Preview](/public/docs/dashboard.png)

## 🧠 The Problem It Solves

Modern inboxes are overwhelming. Between newsletters, receipts, urgent work threads, and spam, it's impossible to manually triage everything. Standard email clients force you to do the heavy lifting: reading threads, identifying action items, writing replies from scratch, and manually organizing folders.

**MailPilot flips this model on its head.**

By placing a background worker and the **Google Gemini AI API** between your Gmail account and your dashboard, MailPilot acts as an autonomous assistant. It reads your emails, categorizes them, extracts tasks, learns your writing style, and lets you chat with your inbox using semantic search—all before you even open the app.

---

## 🏗 Core Architecture

MailPilot isn't just a basic CRUD wrapper around an email API; it uses an asynchronous, worker-based architecture to process emails heavily without blocking the UI.

### 1. The Async AI Pipeline
When you sync your inbox, MailPilot fetches the raw emails from the **Gmail API** and immediately saves them to a **Neon Serverless PostgreSQL Database**. 

Instead of making the user wait for AI processing, MailPilot enqueues a job in **Redis (via BullMQ)**. A separate Node.js worker process picks up the job, streams the email to **Gemini 2.0 Flash**, and updates the database with categories, summaries, and extracted tasks. The UI instantly updates via optimistic UI patterns in Next.js.

### 2. Semantic Search & RAG (Retrieval-Augmented Generation)
MailPilot moves beyond traditional keyword search. Every incoming email is passed through the `text-embedding-004` model to generate a **768-dimensional vector embedding**. 

These embeddings are stored directly in PostgreSQL using the **`pgvector`** extension. When a user asks a question in the Chat UI (e.g., *"What is my flight tracking number?"*), the query is embedded, and a fast cosine-similarity search (`<=>`) retrieves the exact emails. These emails are then injected as context into a Gemini prompt to generate a highly accurate, grounded answer.

---

## 🚀 Feature Deep-Dive (The 8 Phases)

MailPilot was built incrementally over 8 architectural phases:

### Phase 1: Secure Identity & Access
- Integrated **Auth.js (NextAuth v5)** with Google OAuth.
- Requests specific, granular scopes (`https://www.googleapis.com/auth/gmail.modify`) to interact with the user's inbox securely.
- Stores OAuth `access_token` and `refresh_token` securely in PostgreSQL.

### Phase 2: Gmail Sync Engine
- Connects directly to the Gmail REST API to fetch recent threads and messages.
- Parses complex multipart MIME payloads into clean text snippets and HTML bodies.
- Ensures duplicate emails aren't saved on re-syncs by enforcing unique `gmailId` constraints.

### Phase 3: AI Categorization & Summaries
- Background worker uses Gemini 2.0 Flash with `responseMimeType: "application/json"`.
- Automatically assigns categories: `work`, `personal`, `newsletter`, `receipt`, `social`, `spam`, or `urgent`.
- Generates a concise, one-sentence summary for long threads so you can skip reading the whole email.

### Phase 4: Autonomous Task Extraction
- The AI reads incoming threads and identifies actionable requests (e.g., *"Please send the report by Friday"*).
- Extracts a Task Title and an optional Due Date.
- Tasks are populated in a unified Todo widget on the dashboard, linked directly back to the source email.

### Phase 5: RAG Draft Generation
- One-click reply generation based on the entire context of the email thread.
- Users can control the tone: **Professional, Casual, Direct, Persuasive, or Apologetic**.

### Phase 6: Personalized Writing Style Learning
- MailPilot scans your past `SENT` emails to build a personalized profile of your writing style, vocabulary, and sign-offs.
- This profile is saved in the database and automatically injected into the Draft Generation prompt, ensuring the AI sounds exactly like *you*.

### Phase 7: Automated Rules Engine
- Set up autonomous "IF/THEN" workflows.
- Example: *IF Category is "Newsletter" THEN "Archive"*.
- The worker executes these rules directly against the Gmail API the millisecond an email is categorized, keeping your inbox clean without manual intervention.

### Phase 8: Chat-to-Inbox (Semantic Search)
- A persistent floating chat widget on the dashboard.
- Uses `pgvector` and Gemini embeddings to let you talk to your inbox using natural language.

---

## 💻 Tech Stack

### Frontend
- **Framework:** Next.js 14+ (App Router, Server Actions)
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **UI Architecture:** Custom glassmorphic design system with CSS tokens and CSS-driven animations (No Tailwind utility-class bloat in core logic).

### Backend & Infrastructure
- **Database:** PostgreSQL hosted on [Neon](https://neon.tech)
- **Vector Database:** Postgres `pgvector` extension
- **ORM:** Prisma
- **Background Jobs:** BullMQ + Redis
- **AI/LLM:** Google Gemini API (`gemini-2.0-flash` & `text-embedding-004`)
- **Email Provider:** Google Gmail API

---

## 🚦 Getting Started

Follow these instructions to set up MailPilot locally.

### Prerequisites
1. **Node.js** v18 or higher.
2. A **PostgreSQL database** (Neon is recommended as it supports `pgvector` out of the box).
3. A local or managed **Redis** instance (e.g., Upstash).
4. A **Google Cloud Console Project** with:
   - Gmail API enabled.
   - OAuth 2.0 Client ID and Secret (Add `http://localhost:3000/api/auth/callback/google` as an authorized redirect URI).
5. A **Google Gemini API Key** from Google AI Studio.

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/aryanthakur0505/MailPilot.git
   cd MailPilot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env.local` file in the root of the project:
   ```env
   # Database (Must support pgvector)
   DATABASE_URL="postgres://user:password@host/db_name?sslmode=require"

   # Redis (For BullMQ background worker)
   REDIS_URL="redis://localhost:6379"

   # NextAuth / Auth.js
   AUTH_SECRET="generate_a_random_secret_string_here"
   NEXTAUTH_URL="http://localhost:3000"

   # Google OAuth (For Authentication & Gmail API)
   GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="your-client-secret"

   # Google Gemini API (For AI processing & embeddings)
   GEMINI_API_KEY="your-gemini-api-key"
   ```

4. **Initialize the Database & pgvector**
   Because we use `pgvector`, we use `prisma db push` to sync the schema directly:
   ```bash
   npx dotenv-cli -e .env.local -- prisma db push
   ```

5. **Start the Background Worker**
   The AI categorization and task extraction run in a separate Node.js process. Open a new terminal and run:
   ```bash
   npm run worker
   ```

6. **Start the Next.js Development Server**
   In your main terminal, run:
   ```bash
   npm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000) and sign in with Google!

---

## 📸 Screenshots Gallery

### 1. Landing Page
Modern, animated landing page showcasing the core value proposition.
![Landing Page](/public/docs/landing_page.png)

### 2. Main Dashboard & AI Categorization
Emails are automatically categorized, and actionable items are pushed to the Tasks widget on the right.
![Dashboard](/public/docs/dashboard.png)

### 3. Google OAuth Verification (Phase 1)
Secure login requesting specific scopes to read and manage emails on behalf of the user.
![Verification](/public/docs/verify.webp)

---

## 🤝 Contributing

Contributions, issues, and feature requests are highly welcome!
If you'd like to improve the RAG pipeline, add a new AI model provider (like OpenAI or Anthropic), or add a new Gmail action, please submit a pull request.

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.
