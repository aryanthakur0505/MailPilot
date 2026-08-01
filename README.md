# MailPilot

MailPilot is an open-source, AI-powered email client designed to give you superpowers over your inbox. It acts as an intelligent layer on top of your Gmail account, automatically categorizing, summarizing, and turning your emails into actionable tasks using the Gemini AI API.

![Dashboard Preview](/docs/dashboard.png)

## 🚀 Features

MailPilot was built in 8 distinct phases, creating a full-featured AI inbox from scratch:

- **Phase 1: Secure Authentication** — NextAuth.js integration with Google OAuth.
- **Phase 2: Gmail Sync** — Fetches and synchronizes your inbox locally.
- **Phase 3: AI Categorization & Summarization** — A background worker automatically reads incoming emails, categorizes them (Work, Personal, Receipt, Newsletter, Spam, etc.), and generates a one-sentence summary.
- **Phase 4: Action Extraction (Tasks)** — The AI reads threads and extracts actionable tasks with due dates, adding them directly to your dashboard.
- **Phase 5: RAG Draft Generation** — Quickly generate email replies using AI, controlled by a customizable tone (Professional, Casual, Direct, etc.).
- **Phase 6: Personalized Writing Style** — MailPilot analyzes your past sent emails to learn your unique tone and vocabulary, generating drafts that sound exactly like you.
- **Phase 7: Automated Rules Engine** — Set up IF/THEN automation rules (e.g., "If Category is Newsletter, then Archive"). Automations run seamlessly in the background as soon as new emails arrive.
- **Phase 8: Semantic Search & Chat (RAG)** — Chat with your inbox! Ask questions like *"What's my tracking number for the Amazon package?"*. This feature uses `pgvector` to create embeddings of your emails and perform lightning-fast semantic searches, feeding the results to Gemini for a grounded answer.

## 🛠 Tech Stack

- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS + custom glassmorphism & gradients
- **Database:** PostgreSQL (Neon Serverless)
- **ORM:** Prisma
- **AI Models:** Google Gemini (`gemini-2.0-flash` for logic, `text-embedding-004` for vector search)
- **Authentication:** NextAuth.js (Auth.js) v5
- **Background Jobs:** BullMQ + Redis
- **Integrations:** Gmail API (googleapis)

## 📸 Screenshots

### Landing Page
![Landing Page](/docs/landing_page.png)

### The Dashboard
![Dashboard Area](/docs/dashboard.png)

## 🚦 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database (with `pgvector` extension enabled for Semantic Search)
- Redis instance (for BullMQ background jobs)
- Google Cloud Project (with Gmail API enabled and OAuth credentials)
- Google Gemini API Key

### Installation

1. **Clone the repo**
   ```bash
   git clone https://github.com/aryanthakur0505/MailPilot.git
   cd MailPilot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   DATABASE_URL="postgres://user:password@host/db"
   REDIS_URL="redis://localhost:6379"

   AUTH_SECRET="your_nextauth_secret"
   NEXTAUTH_URL="http://localhost:3000"

   GOOGLE_CLIENT_ID="your_google_client_id.apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="your_google_client_secret"

   GEMINI_API_KEY="your_gemini_api_key"
   ```

4. **Initialize the database**
   ```bash
   npx dotenv-cli -e .env.local -- prisma db push
   ```

5. **Start the background worker (in a separate terminal)**
   ```bash
   npm run worker
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 📝 License

This project is open-source and available under the MIT License.
