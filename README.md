# AI Task Manager

An AI-powered task manager primarily tailored for procurement managers handling RFPs. This project streamlines task creation and management using natural language processing. Users can input tasks via text or voice, which are then parsed by AI to extract actionable structured data (like 'task' and 'due date').

## Architecture Overview

1. **Input Interface:** Users provide natural language input via the Next.js web dashboard (and long-term, Telegram).
2. **Orchestration / Backend:** **n8n** acts as the backend orchestration layer, communicating with the frontend via webhooks.
3. **AI Parsing:** Claude (via `@anthropic-ai/sdk`) is responsible for parsing unstructured natural language inputs into structured, strict JSON task data.
4. **Database:** **Supabase** (PostgreSQL) is the single source of truth for all tasks, user profiles, and authentication.
5. **Notifications:** The system connects with Telegram to send daily reminders for upcoming and pending tasks.

## Tech Stack

- **Frontend:** [Next.js](https://nextjs.org/) (React 18), [Tailwind CSS](https://tailwindcss.com/) for minimal, clean UI.
- **Backend Orchestration:** n8n webhooks.
- **Database & Auth:** [Supabase](https://supabase.com).
- **AI Processing:** Anthropic Claude (`@anthropic-ai/sdk`).

## Project Structure

- `pages/`: Contains Next.js routes, including the main dashboard (`index.jsx`), authentication (`login.jsx`, `signup.jsx`), and Next API routes (`api/`).
- `lib/`: Helper functions, external SDK initializations (e.g., Supabase client, Anthropic client).
- `styles/`: Global stylesheets and Tailwind inputs.
- `sql/`: Database schema definitions, tables, and setup scripts for Supabase.

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment Setup:**
   The project requires a `.env.local` to store environment variables safely. Ensure you populate the following:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `ANTHROPIC_API_KEY`
   - Necessary n8n Webhook URLs.

3. **Run the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Core Development Guidelines
- Always route complex workflows through **n8n** rather than over-engineering internal web app processes.
- Ensure the AI Parsing prompts enforce strict JSON responses.
- Stick to Supabase as the ultimate source of truth.
