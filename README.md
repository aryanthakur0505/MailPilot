# MailPilot 🚀

MailPilot is an AI-powered email client designed to bring order to your chaotic inbox. It integrates directly with Google using NextAuth, securely stores your emails in PostgreSQL (Neon), and uses a standalone AI worker powered by Google Gemini to automatically categorize your emails, extract tasks, and draft replies for you in the background.

## Features

- **Google OAuth Integration**: Connect your Gmail account seamlessly with a single click.
- **Background Synchronization**: Syncs your emails directly to the local database without slowing down the app.
- **Smart Inbox UI**: A beautiful, modern dashboard built with Tailwind CSS.
- **AI Categorization**: Background worker automatically categorizes incoming emails (`WORK`, `PERSONAL`, `URGENT`, etc.).
- **Priority Scoring**: Important emails are flagged with glowing urgency indicators.
- **AI Task Extraction**: Automatically pulls out action items from your emails and places them in a dedicated Tasks list.
- **Smart Drafts**: Click a button to generate context-aware email replies instantly.

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React, Tailwind CSS, Lucide Icons
- **Backend**: Next.js API Routes, NextAuth (Auth.js) v5
- **Database**: PostgreSQL (hosted on Neon), Prisma ORM
- **Queue System**: BullMQ backed by Redis (Upstash)
- **AI Engine**: Google Generative AI (Gemini Flash)
- **Worker Process**: Standalone Node.js process using `tsx`

## Prerequisites

To run this project locally, you will need:
- Node.js installed
- A [Google Cloud Console](https://console.cloud.google.com/) account for OAuth credentials
- A PostgreSQL database (e.g., [Neon](https://neon.tech/))
- A Redis database (e.g., [Upstash](https://upstash.com/))
- A Google AI Studio API Key ([Gemini](https://aistudio.google.com/app/apikey))

## Getting Started

1. **Clone the repository and install dependencies:**
   ```bash
   git clone https://github.com/your-username/MailPilot.git
   cd MailPilot
   npm install
   ```

2. **Set up Environment Variables:**
   Rename `.env.example` to `.env.local` and fill in your keys:
   ```env
   DATABASE_URL="your-neon-postgres-url"
   AUTH_SECRET="your-generated-secret"
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   REDIS_URL="your-upstash-redis-url"
   GEMINI_API_KEY="your-gemini-api-key"
   ```

3. **Push the database schema:**
   ```bash
   npx prisma db push
   ```

4. **Start the applications (requires two terminals):**

   **Terminal 1 (Next.js App):**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) with your browser to view the app.

   **Terminal 2 (AI Background Worker):**
   ```bash
   npm run worker
   ```

## Architecture

MailPilot splits heavy AI lifting from the frontend experience to ensure a snappy UI. When you click "Sync Now", the Next.js API fetches your latest emails from Google, saves them to Postgres, and places a job on the Upstash Redis queue. The standalone AI Worker consumes these jobs one by one, classifies the emails with Gemini, and writes the results back to the database. The UI is then updated in real-time.
