# Personal AI Assistant

> Managed AI agent hosting for non-technical users. Subscribe and instantly get your own Claude-powered AI running 24/7 on Telegram, WhatsApp, or the Web — no setup required.

## Product Vision

Most people can't run their own AI agent. They don't know how to manage API keys, spin up servers, or keep a process running 24/7. **Personal AI Assistant** solves this with a simple subscription model: users sign up, pick their plan, and immediately get a personal Claude-powered agent that:

- Remembers them across conversations (persistent memory)
- Runs continuously on their channel of choice
- Can search the web, manage reminders, and help with daily tasks
- Gets smarter over time as it learns their preferences

### Pricing

| Plan    | Price  | Messages/mo | Channels       |
|---------|--------|-------------|----------------|
| Starter | $15/mo | 1,000       | Telegram or WA |
| Pro     | $30/mo | 5,000       | All channels   |
| Max     | $60/mo | Unlimited   | All channels   |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js 14 (app/)                    │
│  Landing page · Auth · Dashboard · Billing UI           │
└──────────────────────────┬──────────────────────────────┘
                           │ REST / NextAuth
┌──────────────────────────▼──────────────────────────────┐
│                  Express API (api/)                      │
│  Auth · Stripe billing · Agent provisioner              │
│  Telegram/WhatsApp webhook ingestion                    │
└──────┬──────────────────────────────────────┬───────────┘
       │ Docker Engine API                    │ Redis pub/sub
┌──────▼──────────┐                 ┌─────────▼───────────┐
│  Agent Container│   × N users     │       Redis         │
│  (agents/)      │ ◄──────────────►│  Message queue      │
│                 │                 │  Session routing    │
│  PersonalAgent  │                 └─────────────────────┘
│  ↕ Anthropic    │
│  claude-opus-4-6│                 ┌─────────────────────┐
│  ↕ Tools        │                 │     Supabase        │
│  ↕ Memory       │◄───────────────►│  Users · Messages   │
└─────────────────┘                 │  Memory · Agents    │
                                    └─────────────────────┘
```

### Key Design Decisions

- **One container per user** — complete isolation, easy resource limits, no cross-user contamination
- **Redis pub/sub** — decouples webhook ingestion from agent processing; allows queuing during restarts
- **Supabase** — handles auth (via NextAuth), message history, and agent memory in one managed service
- **Claude Opus 4.6 + adaptive thinking** — best available model for a personal assistant; adaptive thinking kicks in for complex tasks without wasting tokens on simple queries
- **Streaming by default** — all agent responses stream via the Anthropic SDK for low first-token latency

---

## Project Structure

```
personal-ai-assistant/
├── app/              # Next.js 14 frontend (App Router)
│   └── src/app/
│       ├── page.tsx           # Landing / pricing page
│       ├── (auth)/            # Login + signup
│       ├── dashboard/         # User dashboard
│       └── api/auth/          # NextAuth route handler
│
├── api/              # Express.js backend API
│   └── src/
│       ├── index.ts           # Server entrypoint
│       ├── routes/            # users, agents, billing, webhooks
│       ├── middleware/        # JWT auth, rate limiting
│       └── services/          # Supabase, Stripe, agent provisioner
│
├── agents/           # Agent provisioning engine
│   └── src/
│       ├── index.ts           # Container entrypoint (subscribes to Redis)
│       ├── PersonalAgent.ts   # Core agentic loop (Anthropic SDK)
│       ├── tools/             # memory, web search, time
│       └── channels/          # Telegram + WhatsApp senders
│
├── infra/            # Infrastructure config
│   ├── docker/                # Dockerfiles for api + agent
│   └── scripts/               # provision-agent.sh, teardown-agent.sh
│
├── docker-compose.yml         # Local dev stack
├── .env.example               # All required env vars
└── package.json               # Workspace root
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- Docker + Docker Compose
- A Supabase project
- An Anthropic API key
- A Stripe account (test mode is fine for dev)
- A Telegram bot token (from @BotFather)

### 1. Clone and install

```bash
git clone <repo-url>
cd personal-ai-assistant
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Fill in all values in .env
```

Required for basic local dev:
- `ANTHROPIC_API_KEY`
- `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` + `SUPABASE_ANON_KEY`
- `NEXTAUTH_SECRET` (run: `openssl rand -base64 32`)
- `TELEGRAM_BOT_TOKEN`

### 3. Set up Supabase tables

Run these SQL migrations in your Supabase SQL editor:

```sql
-- Users table
create table users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text not null,
  password_hash text not null,
  plan text default 'trial',
  stripe_customer_id text,
  created_at timestamptz default now()
);

-- Agent containers
create table agents (
  user_id uuid primary key references users(id) on delete cascade,
  container_id text,
  container_name text,
  status text default 'stopped',
  provisioned_at timestamptz
);

-- Conversation messages
create table messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  session_id text not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz default now()
);
create index on messages (user_id, session_id, created_at desc);

-- Agent memory (key-value per user)
create table agent_memory (
  user_id uuid references users(id) on delete cascade,
  key text not null,
  value text not null,
  updated_at timestamptz default now(),
  primary key (user_id, key)
);

-- Channel mappings
create table telegram_mappings (
  user_id uuid references users(id) on delete cascade,
  chat_id text unique not null,
  primary key (user_id, chat_id)
);

create table whatsapp_mappings (
  user_id uuid references users(id) on delete cascade,
  phone text unique not null,
  primary key (user_id, phone)
);
```

### 4. Run locally

```bash
# Option A: Docker Compose (full stack)
npm run docker:up

# Option B: Individual services for faster iteration
npm run dev:api      # Express API on :4000
npm run dev:app      # Next.js on :3000
npm run dev:agents   # Sample agent (needs USER_ID env)
```

### 5. Expose webhooks (dev)

Use [ngrok](https://ngrok.com) to expose your local API for Telegram webhooks:

```bash
ngrok http 4000
# Then set Telegram webhook:
curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://<ngrok-id>.ngrok.io/api/webhooks/telegram"
```

---

## 2-Week MVP Sprint Plan

### Week 1 — Core Infrastructure
- [ ] Supabase schema + RLS policies
- [ ] Auth flow (register → Stripe checkout → agent provision)
- [ ] Agent container spawning + Redis pub/sub routing
- [ ] Telegram channel end-to-end (message in → Claude → reply)
- [ ] Basic agent memory (store/retrieve)

### Week 2 — Polish + Launch
- [ ] Dashboard UI (channel connect, usage stats, plan upgrade)
- [ ] Stripe subscription lifecycle (trial end, upgrade, cancel)
- [ ] WhatsApp channel via Twilio
- [ ] Agent persona customization (Pro+ feature)
- [ ] Rate limiting per plan tier
- [ ] Error monitoring (Sentry)
- [ ] Production deployment (Fly.io or Railway)

---

## Environment Variables Reference

See `.env.example` for all required variables with descriptions.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), Tailwind CSS |
| Backend API | Express.js, TypeScript |
| AI | Anthropic Claude Opus 4.6 (`@anthropic-ai/sdk`) |
| Database | Supabase (PostgreSQL) |
| Auth | NextAuth.js + JWT |
| Billing | Stripe Subscriptions |
| Messaging | Telegram Bot API, Twilio WhatsApp |
| Queue | Redis pub/sub |
| Containers | Docker (one per user) |
| Infra | Docker Compose (dev), Fly.io / Railway (prod) |
