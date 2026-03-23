# Cost Model — Personal AI Assistant
_Last updated: 2026-03-24 | Based on real vendor pricing_

---

## 1. Infrastructure Cost Stack (Per User/Month)

### A. LLM API Cost (Anthropic Claude) — BIGGEST VARIABLE

**Real pricing (March 2026):**
| Model | Input (per 1M tokens) | Output (per 1M tokens) |
|-------|----------------------|------------------------|
| Claude Haiku 4.5 | $1.00 | $5.00 |
| Claude Sonnet 4.5 | $3.00 | $15.00 |
| Claude Opus 4.5 | $5.00 | $25.00 |

**Key levers to reduce cost:**
- **Prompt caching:** 90% discount on repeated context (system prompts, memory) → use heavily
- **Batch API:** 50% discount for non-real-time tasks (daily briefings, scheduled agents)
- **Model routing:** Use Haiku for simple tasks, Sonnet for complex reasoning only

**Per-user cost estimate by tier:**

| Usage pattern | Avg tokens/task | Tasks/month | Model mix | Monthly API cost |
|---------------|----------------|-------------|-----------|-----------------|
| Starter (light) | ~2,000 | 100 | 80% Haiku, 20% Sonnet | **$1.20** |
| Pro (moderate) | ~3,000 | 500 | 60% Haiku, 40% Sonnet | **$5.40** |
| Power (heavy) | ~4,000 | 1,500+ | 40% Haiku, 60% Sonnet | **$15.60** |

_Note: With prompt caching on memory/context (typically 60% of input tokens), real costs are ~40% lower._

**Revised with caching:**
| Tier | API Cost (no cache) | API Cost (with cache) |
|------|--------------------|-----------------------|
| Starter | $1.20 | **$0.72** |
| Pro | $5.40 | **$3.24** |
| Power | $15.60 | **$9.36** |

---

### B. Railway Hosting (Containers + DB)

**Railway pricing (real, March 2026):**
- Memory: $0.00000386/GB/sec
- CPU: $0.00000772/vCPU/sec
- Pro plan: $20/month (includes $20 usage credit)

**Per-user container (OpenClaw agent):**
- Assumed: 256MB RAM, 0.1 vCPU, running 24/7
- RAM cost: 0.256 GB × $0.00000386 × 2,592,000 sec/mo = **$2.56/user/mo**
- CPU cost: 0.1 vCPU × $0.00000772 × 2,592,000 sec/mo = **$2.00/user/mo**
- Total per container: ~**$4.56/user/mo**

**Optimization: Sleep idle containers**
- If agent sleeps when not active (18hrs/day idle, 6hrs active):
- Effective cost: 25% of above = **$1.14/user/mo**
- Realistic: 50% active time → **$2.28/user/mo**

**Shared infrastructure (amortised across all users):**
- Railway Pro base: $20/mo fixed
- Load balancer / gateway: ~$5/mo
- Postgres (Supabase): $25/mo for Pro plan (unlimited users)
- Redis (queuing): ~$10/mo
- Fixed overhead: ~$60/mo

| Users | Fixed overhead per user |
|-------|------------------------|
| 100 | $0.60 |
| 500 | $0.12 |
| 2,000 | $0.03 |

---

### C. Supabase (Database + Auth)

**Real pricing (2026):**
- Free: 500MB DB, 50K MAU
- Pro: $25/month per project (flat — no per-user charge)
- Storage: $0.021/GB above 8GB included

**Per-user cost at scale:**
- 100 users: $25/100 = **$0.25/user**
- 500 users: $25/500 = **$0.05/user**
- 2,000 users: $25/2,000 = **$0.013/user**

Essentially **free per user at scale**.

---

### D. Stripe Payment Processing

**Real pricing (2026):**
- Standard: 2.9% + $0.30 per transaction
- International cards: +1.5%
- Subscription: included in standard rate

| Tier | Revenue | Stripe fee (2.9% + $0.30) | Net to you |
|------|---------|--------------------------|------------|
| Self-hosted | $9.00 | $0.56 | $8.44 |
| Starter | $15.00 | $0.74 | $14.26 |
| Pro | $30.00 | $1.17 | $28.83 |
| Power | $60.00 | $2.04 | $57.96 |

---

### E. Telegram/WhatsApp

- Telegram Bot API: **Free** (unlimited messages)
- WhatsApp Business API (Meta): **Free** for first 1,000 conversations/month per business account, then ~$0.005–0.08 per conversation depending on region
- At 500 Pro/Power users, WhatsApp cost: ~$25–50/month total (negligible)

---

## 2. Full Cost Per User Per Month (COGS)

### Starter Tier ($15/month)

| Cost Component | Amount |
|----------------|--------|
| Claude API (with caching) | $0.72 |
| Railway container (50% active) | $2.28 |
| Supabase (at 500 users) | $0.05 |
| Stripe fees | $0.74 |
| Telegram delivery | $0.00 |
| **Total COGS** | **$3.79** |
| **Revenue** | **$15.00** |
| **Gross Profit** | **$11.21** |
| **Gross Margin** | **74.7%** |

---

### Pro Tier ($30/month)

| Cost Component | Amount |
|----------------|--------|
| Claude API (with caching) | $3.24 |
| Railway container (50% active) | $2.28 |
| Supabase | $0.05 |
| Stripe fees | $1.17 |
| WhatsApp (amortised) | $0.10 |
| **Total COGS** | **$6.84** |
| **Revenue** | **$30.00** |
| **Gross Profit** | **$23.16** |
| **Gross Margin** | **77.2%** |

---

### Power Tier ($60/month)

| Cost Component | Amount |
|----------------|--------|
| Claude API (with caching, heavy use) | $9.36 |
| Railway container (70% active) | $3.20 |
| Supabase | $0.05 |
| Stripe fees | $2.04 |
| WhatsApp | $0.15 |
| **Total COGS** | **$14.80** |
| **Revenue** | **$60.00** |
| **Gross Profit** | **$45.20** |
| **Gross Margin** | **75.3%** |

---

### Self-Hosted Tier ($9/month)

| Cost Component | Amount |
|----------------|--------|
| Claude API | $0.00 (user pays their own) |
| Container | $0.00 (user's own VPS) |
| Supabase (auth/profile only) | $0.01 |
| Stripe fees | $0.56 |
| Support/docs hosting | $0.10 |
| **Total COGS** | **$0.67** |
| **Revenue** | **$9.00** |
| **Gross Profit** | **$8.33** |
| **Gross Margin** | **92.5%** |

---

## 3. Blended COGS at Scale

### At 2,000 users (Year 1 target mix: 20% self-hosted, 35% Starter, 30% Pro, 15% Power)

| Tier | Users | COGS/user | Total COGS |
|------|-------|-----------|------------|
| Self-Hosted | 400 | $0.67 | $268 |
| Starter | 700 | $3.79 | $2,653 |
| Pro | 600 | $6.84 | $4,104 |
| Power | 300 | $14.80 | $4,440 |
| Fixed overhead | — | — | $60 |
| **Total monthly COGS** | **2,000** | **~$5.76 avg** | **$11,525** |

### At 2,000 users revenue:
| Tier | Users | ARPU | Revenue |
|------|-------|------|---------|
| Self-Hosted | 400 | $9 | $3,600 |
| Starter | 700 | $15 | $10,500 |
| Pro | 600 | $30 | $18,000 |
| Power | 300 | $60 | $18,000 |
| **Total** | **2,000** | **$25** | **$50,100** |

**Blended gross margin: ($50,100 - $11,525) / $50,100 = 77.0%**

---

## 4. Break-Even Analysis

**Fixed monthly costs to run the business:**

| Expense | Monthly Cost |
|---------|-------------|
| Railway Pro plan | $20 |
| Supabase Pro | $25 |
| Vercel Pro (frontend) | $20 |
| Domain + SSL | $2 |
| Monitoring (Sentry/etc) | $10 |
| Total fixed infra | **$77/month** |

**Break-even users by tier:**
- Starter only: $77 / $11.21 gross profit = **7 users**
- Pro only: $77 / $23.16 = **4 users**
- Blended: ~**6-8 paying users to cover infra costs**

**This means you're profitable from day 1 with just 8 paying users.** 🎯

---

## 5. Scale Economics (COGS Drop as Users Grow)

| Milestone | Users | Avg COGS | Gross Margin | Monthly Gross Profit |
|-----------|-------|----------|-------------|---------------------|
| Break-even | 8 | $5.76 | 77% | ~$85 |
| Early | 100 | $5.90 | 76% | ~$2,300 |
| Growing | 500 | $5.80 | 77% | ~$11,800 |
| Scaled | 2,000 | $5.76 | 77% | ~$38,500 |
| $1M ARR | 2,430 | $5.70 | 78% | ~$48,000 |

**Key insight:** Gross margin stays remarkably stable (76-78%) across scale because:
1. Railway container costs scale linearly with users (no bulk discount issue)
2. Supabase flat fee becomes negligible
3. Claude API costs are usage-based (scale with revenue)
4. Fixed overhead becomes trivially small % of revenue

---

## 6. Risk Scenarios

### Scenario A: Heavy Users Exceed Estimates
If Power users use 3x estimated tokens:
- COGS rises from $14.80 → $28 per Power user
- Gross margin drops to 53% on Power tier
- **Mitigation:** Rate limiting, fair-use policy, usage caps

### Scenario B: Claude API Price Increase
If Anthropic raises prices 50%:
- Starter COGS: $3.79 → $4.15 (+9.5%)
- Power COGS: $14.80 → $18.88 (+27%)
- **Mitigation:** Multi-model routing (OpenAI, Gemini as fallback), pass-through pricing clause in ToS

### Scenario C: High WhatsApp Usage
Meta charges per conversation in some regions:
- At 100K conversations/month: ~$5,000-8,000 additional cost
- **Mitigation:** WhatsApp only for Pro+ tiers, fair-use limits, buffer in pricing

### Scenario D: Container Costs Higher Than Estimated
If users have always-on bots (100% active time):
- Container cost doubles from $2.28 → $4.56
- Starter margin drops: 74% → 66%
- **Mitigation:** Container sleep optimisation, shared hosting for Starter tier

---

## 7. Recommendations

1. **Implement prompt caching immediately** — 40% reduction in API costs with one config change
2. **Route Starter users to Haiku** — 3x cheaper than Sonnet, sufficient for simple tasks
3. **Sleep idle containers** — Set 30-min inactivity timeout, saves ~50% on infra
4. **Cap Power tier usage** — "Unlimited" should have a soft limit (e.g., 10K tasks/mo) with fair-use clause
5. **Monitor cost per user weekly** — Set Railway + Anthropic billing alerts at 80% of projected COGS
6. **Price annual plans at 20% discount** — Collect 12 months upfront, improves cash flow dramatically

---

_This model should be reviewed monthly as user behaviour data becomes available._
