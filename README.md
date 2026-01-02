# ShipSafe

> "Ship fast. Ship safe."

ShipSafe is an opinionated, developer-friendly security scanner for JavaScript/TypeScript projects. It analyzes your repository for real security risks—hardcoded secrets, auth mistakes, and dangerous configurations—before you ship to production.

## Features
- **GitHub OAuth**: Seamlessly scan public and private repositories.
- **Direct Groq Connect**: Users provide their own Groq API keys directly in the UI for privacy and control.
- **AI-Powered Orchestration**: Uses a multi-step pipeline (Classification → Detection → Validation → Explanation) via Groq's Llama 3 models to minimize noise.
- **Honest Warnings**: Feedback written in developer-to-developer language. No corporate fluff.
- **Privacy First**: Code is processed in-memory and never stored. API keys are kept in local storage.

## Tech Stack
- **Frontend**: Next.js 15 (App Router)
- **Styling**: Vanilla CSS (Premium Dark Mode)
- **Auth**: Auth.js (Next-Auth) with GitHub
- **Database**: PostgreSQL (Docker)
- **ORM**: Prisma
- **AI**: OpenAI GPT-4 Turbo

## Getting Started

### 1. Prerequisites
- Docker & Docker Compose
- Node.js 18+
- GitHub OAuth App (Client ID & Secret)
- OpenAI API Key

### 2. Setup Database
Start the local PostgreSQL instance:
```bash
docker-compose up -d
```

### 3. Environment Variables
Create a `.env` file based on the provided configuration:
- `DATABASE_URL`: Connection string for Postgres.
- `GITHUB_ID` / `GITHUB_SECRET`: From your GitHub Developer Settings.
- `OPENAI_API_KEY`: For the analysis pipeline.
- `NEXTAUTH_SECRET`: A random string for session encryption.

### 4. Install & Run
```bash
npm install
npx prisma generate
npx prisma db push
npm run dev
```

## Usage
1. Log in via GitHub.
2. Search and select a repository.
3. Wait for the pipeline to run (20-30 seconds).
4. Review the security cards.
5. Ship with confidence 🚀

---

**Tone & Philosophy**: ShipSafe is like a friend warning you before you make a mistake you'll regret. We don't care about style or minor best practices; we care about things that will hurt you later.
