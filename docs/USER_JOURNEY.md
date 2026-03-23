# User Journey Process Flow
# Personal AI Assistant SaaS

**Version:** 1.0  
**Date:** March 2026  
**Type:** Full end-to-end user lifecycle flow

---

## Overview

This document maps the complete user journey from first awareness through daily engagement, upgrade, referral, and retention recovery. Decision points, happy paths, and drop-off recovery flows are shown.

---

## Master Flow (Happy Path Summary)

```
[DISCOVERY] → [LANDING PAGE] → [PRICING] → [SIGNUP] → [PAYMENT]
     → [ONBOARDING] → [AGENT SETUP] → [FIRST MESSAGE] → [DAILY USAGE]
          → [UPGRADE PATH] → [REFERRAL LOOP]
```

---

## Stage 1: Discovery

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          DISCOVERY CHANNELS                              │
│                                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │  Google/SEO  │  │   Reddit     │  │  Twitter/X   │  │  YouTube   │  │
│  │              │  │              │  │              │  │            │  │
│  │"personal AI  │  │r/productivity│  │ Founder      │  │  Creator   │  │
│  │ assistant"   │  │r/ChatGPT     │  │ build-in-    │  │  review    │  │
│  │              │  │r/Entrepreneur│  │ public posts │  │  videos    │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └─────┬──────┘  │
│         │                 │                  │                │          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                   │
│  │ ProductHunt  │  │   Referral   │  │    Paid      │                   │
│  │              │  │   from user  │  │    Social    │                   │
│  │  Launch day  │  │  (+1 free mo)│  │    (Meta)    │                   │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                   │
└─────────┼─────────────────┼─────────────────┼──────────────────────────┘
          │                 │                  │
          └─────────────────┴──────────────────┘
                            │
                            ▼
                    [LANDING PAGE]
```

---

## Stage 2: Landing Page

```
                            │
                            ▼
          ┌─────────────────────────────────────┐
          │           LANDING PAGE               │
          │                                      │
          │  Hero: "Your AI employee. Always on. │
          │  Setup in 60 seconds."               │
          │                                      │
          │  [Watch 90-sec demo video]           │
          │  [Start Free Trial — No CC needed]   │
          │                                      │
          │  Social proof: 500+ active agents    │
          │  Featured in: ProductHunt, HN        │
          │                                      │
          │  ┌─────────────────────────────────┐ │
          │  │  Key sections:                  │ │
          │  │  1. Hero + CTA                  │ │
          │  │  2. Demo video / GIF            │ │
          │  │  3. "How it works" (3 steps)    │ │
          │  │  4. Agent examples              │ │
          │  │  5. Pricing snapshot            │ │
          │  │  6. Testimonials / tweets       │ │
          │  │  7. FAQ                         │ │
          │  │  8. Final CTA                   │ │
          │  └─────────────────────────────────┘ │
          └───────────────────┬─────────────────-┘
                              │
              ┌───────────────┴────────────────┐
              │                                │
              ▼                                ▼
    [Clicks CTA → SIGNUP]            [Scrolls to PRICING]
```

---

## Stage 3: Pricing Page

```
          ┌─────────────────────────────────────────────────────────┐
          │                    PRICING PAGE                          │
          │                                                          │
          │  ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐ │
          │  │   STARTER    │ │     PRO      │ │     POWER        │ │
          │  │   $15/mo     │ │   $30/mo     │ │    $60/mo        │ │
          │  │              │ │              │ │                  │ │
          │  │ 3 agents     │ │ 10 agents    │ │ Unlimited agents │ │
          │  │ Telegram     │ │ + WhatsApp   │ │ + API access     │ │
          │  │ 30-day mem   │ │ Dashboard    │ │ Custom agents    │ │
          │  │              │ │ 6-mo memory  │ │ Unlimited memory │ │
          │  │[Start Free]  │ │[Start Free]  │ │ [Start Free]     │ │
          │  │   Trial      │ │   Trial      │ │    Trial         │ │
          │  └──────┬───────┘ └──────┬───────┘ └────────┬─────────┘ │
          └─────────┼────────────────┼──────────────────┼───────────┘
                    │                │                  │
              ┌─────▼────────────────▼──────────────────▼──────┐
              │           User selects a plan                    │
              │                                                  │
              │  Decision: Which tier?                           │
              │  ├── Starter (most common entry point)          │
              │  ├── Pro (WhatsApp users, productivity-focused) │
              │  └── Power (technical users, heavy AI users)    │
              └──────────────────────┬───────────────────────────┘
                                     │
                                     ▼
                                 [SIGNUP]

  ── Drop-off Recovery ──────────────────────────────────────────────
  │                                                                  │
  │  User BOUNCES from pricing without signing up:                  │
  │                                                                  │
  │  → Exit intent popup: "Before you go — 7 days FREE, no card"   │
  │  → Email retargeting (if email captured): "Still curious?"      │
  │  → Retargeting ad: demo gif + "Start free today"                │
  │                                                                  │
  ───────────────────────────────────────────────────────────────────
```

---

## Stage 4: Signup

```
                                     │
                                     ▼
          ┌──────────────────────────────────────────────────────┐
          │                      SIGNUP                           │
          │                                                        │
          │  Options:                                              │
          │  ┌─────────────────────────────────────────────────┐  │
          │  │  [Sign up with Google]    ← Recommended          │  │
          │  │  [Sign up with Email]                            │  │
          │  │  [Sign up with GitHub]                           │  │
          │  └─────────────────────────────────────────────────┘  │
          │                                                        │
          │  Fields: Name, Email (if email signup)                 │
          │  No password required for OAuth                        │
          │                                                        │
          └──────────────────────────┬───────────────────────────┘
                                     │
                         ┌───────────┴───────────┐
                         │                       │
                         ▼                       ▼
                  [Email verified]       [OAuth success]
                         │                       │
                         └───────────┬───────────┘
                                     │
                                     ▼
                              [PAYMENT / TRIAL]

  ── Drop-off Recovery ──────────────────────────────────────────────
  │                                                                  │
  │  User starts signup but ABANDONS:                               │
  │                                                                  │
  │  → Trigger: Email entered but not completed                     │
  │  → Automated email: "You're 30 seconds away from your AI..."   │
  │  → Sent: 1 hour after, 24 hours after, 3 days after            │
  │  → Subject line sequence:                                       │
  │     T+1h: "You almost had an AI assistant..."                   │
  │     T+24h: "Your AI is waiting for you"                         │
  │     T+3d: "Last chance for your free 7-day trial"               │
  │                                                                  │
  ───────────────────────────────────────────────────────────────────
```

---

## Stage 5: Payment / Trial Start

```
                                     │
                                     ▼
          ┌──────────────────────────────────────────────────────┐
          │                   PAYMENT / TRIAL                      │
          │                                                        │
          │  ┌─────────────────────────────────────────────────┐  │
          │  │  "Start your 7-day free trial"                  │  │
          │  │                                                  │  │
          │  │  Plan selected: [Starter / Pro / Power]         │  │
          │  │  Trial: 7 days free                             │  │
          │  │  Then: $15 / $30 / $60 per month                │  │
          │  │                                                  │  │
          │  │  [Enter card details]  ← Stripe Elements        │  │
          │  │  Or: [Pay with Apple Pay / Google Pay]          │  │
          │  │                                                  │  │
          │  │  Cancel anytime. No commitment.                  │  │
          │  └─────────────────────────────────────────────────┘  │
          └──────────────────────────┬───────────────────────────┘
                                     │
                         ┌───────────┴───────────┐
                         │                       │
                         ▼                       ▼
                  [Payment success]      [Payment declined]
                         │                       │
                         │               ┌───────▼────────┐
                         │               │ Show error msg  │
                         │               │ Suggest PayPal  │
                         │               │ or other card   │
                         │               └───────┬────────┘
                         │                       │
                         │               ┌───────▼────────┐
                         │               │  3 retries     │
                         │               │  → Abandon:    │
                         │               │  email recovery │
                         │               └───────┬────────┘
                         │                       │
                         └───────────┬───────────┘
                                     │
                                     ▼
                              [ONBOARDING]
```

---

## Stage 6: Onboarding Flow

```
                                     │
                                     ▼
          ┌──────────────────────────────────────────────────────────────┐
          │                   ONBOARDING WIZARD                           │
          │                   (3 steps, < 2 min)                          │
          │                                                                │
          │  ┌───────────────────────────────────────────────────────┐   │
          │  │  STEP 1 of 3: Tell us about yourself (30 seconds)     │   │
          │  │                                                        │   │
          │  │  "What's your name?"                                   │   │
          │  │  ┌──────────────────────────────┐                     │   │
          │  │  │  Richard                      │                     │   │
          │  │  └──────────────────────────────┘                     │   │
          │  │                                                        │   │
          │  │  "What do you mainly use AI for?"                      │   │
          │  │  ☐ Work & productivity                                 │   │
          │  │  ☐ Email management                                    │   │
          │  │  ☐ Planning & scheduling                               │   │
          │  │  ☐ Creative work                                       │   │
          │  │  ☐ Learning & research                                 │   │
          │  │  ☐ Business / startup                                  │   │
          │  │                                                        │   │
          │  │  "How would you describe yourself?"                    │   │
          │  │  ○ Student   ○ Professional   ○ Entrepreneur           │   │
          │  │  ○ Freelancer   ○ Executive   ○ Other                  │   │
          │  │                                                        │   │
          │  │                              [Next →]                  │   │
          │  └───────────────────────────────────────────────────────┘   │
          │                                                                │
          │  ┌───────────────────────────────────────────────────────┐   │
          │  │  STEP 2 of 3: Connect your messaging app (45 seconds)  │   │
          │  │                                                        │   │
          │  │  "Where should your agent talk to you?"                │   │
          │  │                                                        │   │
          │  │  ┌────────────────────────────────────────────────┐   │   │
          │  │  │  📱 Telegram  ← Recommended (all tiers)        │   │   │
          │  │  │  📲 WhatsApp  ← Pro & Power tier only          │   │   │
          │  │  │  💻 Web Chat  ← Available on dashboard         │   │   │
          │  │  └────────────────────────────────────────────────┘   │   │
          │  │                                                        │   │
          │  │  [Connect Telegram]                                    │   │
          │  │  → Opens: t.me/YourPersonalAI_[username]_bot          │   │
          │  │  → User clicks START in Telegram                      │   │
          │  │  → Bot confirms: "✅ Connected! Setting up your        │   │
          │  │    agent now..."                                       │   │
          │  │                                                        │   │
          │  │  Status: ⏳ Connecting...  →  ✅ Connected!            │   │
          │  │                                                        │   │
          │  │                              [Next →]                  │   │
          │  └───────────────────────────────────────────────────────┘   │
          │                                                                │
          │  ┌───────────────────────────────────────────────────────┐   │
          │  │  STEP 3 of 3: Choose your starting agents (30 sec)    │   │
          │  │                                                        │   │
          │  │  "Your 3 agents are ready. Customize your setup:"     │   │
          │  │                                                        │   │
          │  │  ✅ Personal Assistant  — Always on, chat anytime     │   │
          │  │  ✅ Daily Briefing      — 7am summary (editable time)  │   │
          │  │  ✅ Email Summarizer    — Morning inbox digest         │   │
          │  │                                                        │   │
          │  │  "What time should I send your morning briefing?"     │   │
          │  │  [7:00 AM ▼]  [Asia/Singapore ▼]                      │   │
          │  │                                                        │   │
          │  │  [🚀 Launch My Agent!]                                 │   │
          │  └───────────────────────────────────────────────────────┘   │
          └────────────────────────────┬─────────────────────────────────┘
                                       │
                                       ▼
                    ┌──────────────────────────────────────┐
                    │   BACKEND: Container Provisioning     │
                    │                                       │
                    │   1. Create Docker container          │
                    │   2. Configure agent with user prefs  │
                    │   3. Register Telegram bot            │
                    │   4. Schedule daily briefing          │
                    │   5. Initialize memory store          │
                    │                                       │
                    │   Time: < 30 seconds                  │
                    └──────────────────┬───────────────────┘
                                       │
                                       ▼
                               [FIRST MESSAGE]
```

---

## Stage 7: First Agent Message

```
                                       │
                                       ▼
          ┌────────────────────────────────────────────────────────────┐
          │                    FIRST MESSAGE                            │
          │             (The "Aha Moment" — must happen < 60s)         │
          │                                                              │
          │  📱 On Telegram / WhatsApp:                                  │
          │  ─────────────────────────────────────────────────────────  │
          │                                                              │
          │  [AI Agent 🤖]                                               │
          │  "Hey Richard! 👋 I'm your personal AI assistant.           │
          │   I'm fully set up and ready to go.                         │
          │                                                              │
          │   Here's what I'll do for you:                              │
          │   🌅 Every morning at 7am → Your daily briefing             │
          │   📧 Summarize your emails when you ask                     │
          │   💬 Answer anything, anytime — just message me             │
          │                                                              │
          │   To get started, tell me one thing you want help with     │
          │   today. Or just say hi — I'm here. 😊"                    │
          │                                                              │
          │  ─────────────────────────────────────────────────────────  │
          │                                                              │
          │  [User types first message]                                   │
          │         │                                                     │
          │         ▼                                                     │
          │  Agent responds intelligently, stores context in memory       │
          │                                                              │
          └────────────────────────────┬───────────────────────────────┘
                                       │
                                       ▼
                              [DAILY USAGE LOOP]
```

---

## Stage 8: Daily Usage Loop

```
          ┌──────────────────────────────────────────────────────────────┐
          │                    DAILY USAGE LOOP                           │
          │                                                                │
          │                         [Morning]                             │
          │                             │                                 │
          │                             ▼                                 │
          │            ┌────────────────────────────────┐                │
          │            │  🌅 7:00 AM: Agent sends daily  │                │
          │            │  briefing automatically:        │                │
          │            │                                 │                │
          │            │  "Good morning Richard! Here's  │                │
          │            │   your Monday brief:            │                │
          │            │   📅 3 meetings today           │                │
          │            │   📧 12 unread (2 urgent)       │                │
          │            │   🌤️ 28°C, clear                │                │
          │            │   💡 Priority: prep for 2pm..."  │                │
          │            └────────────────┬───────────────┘                │
          │                             │                                 │
          │                 ┌───────────┴───────────┐                    │
          │                 │                       │                    │
          │                 ▼                       ▼                    │
          │         [User responds]         [User ignores]               │
          │         with task/question      (no action needed)           │
          │                 │                       │                    │
          │                 ▼                       ▼                    │
          │         Agent executes          Agent continues              │
          │         task or answers         background tasks             │
          │                 │                       │                    │
          │                 └───────────┬───────────┘                    │
          │                             │                                 │
          │                         [Midday]                             │
          │                             │                                 │
          │                             ▼                                 │
          │            ┌────────────────────────────────┐                │
          │            │  User ad-hoc requests:          │                │
          │            │                                 │                │
          │            │  💬 "Summarize my emails"       │                │
          │            │  💬 "Write a reply to John"     │                │
          │            │  💬 "What's on my calendar?"   │                │
          │            │  💬 "Remind me at 3pm to..."   │                │
          │            │  💬 "Help me draft a proposal"  │                │
          │            └────────────────┬───────────────┘                │
          │                             │                                 │
          │                             ▼                                 │
          │                   Agent responds + learns                    │
          │                   (memory updated each interaction)          │
          │                             │                                 │
          │                         [Evening]                            │
          │                             │                                 │
          │                             ▼                                 │
          │            ┌────────────────────────────────┐                │
          │            │  Optional EOD check-in:         │                │
          │            │                                 │                │
          │            │  "Here's what we did today:     │                │
          │            │   ✅ 3 emails drafted            │                │
          │            │   ✅ 1 reminder triggered        │                │
          │            │   📋 Tomorrow: 2 meetings        │                │
          │            │   💡 Suggestion: Follow up on..."│               │
          │            └────────────────┬───────────────┘                │
          │                             │                                 │
          │                             ▼                                 │
          │                    [Loop repeats daily]                      │
          │                             │                                 │
          └─────────────────────────────┼────────────────────────────────┘
                                        │
                          ┌─────────────┴──────────────┐
                          │                            │
                          ▼                            ▼
                   [Continue same tier]         [UPGRADE TRIGGER]
```

---

## Stage 9: Upgrade Path

```
          ┌──────────────────────────────────────────────────────────────┐
          │                    UPGRADE TRIGGERS                           │
          │                                                                │
          │  Trigger 1: User hits task limit                              │
          │  ──────────────────────────────                               │
          │  [Agent] "You've used 95/100 tasks this month.               │
          │           Upgrade to Pro for 5x more tasks + WhatsApp. 🚀"  │
          │                [Upgrade to Pro — $30/mo]                     │
          │                                                                │
          │  Trigger 2: User asks for Pro-only feature                    │
          │  ─────────────────────────────────────────                   │
          │  [User] "Add me on WhatsApp instead?"                        │
          │  [Agent] "WhatsApp is available on the Pro plan ($30/mo).   │
          │           Want to upgrade? I'll switch you over instantly."  │
          │                [Yes, upgrade me]  [Not yet]                  │
          │                                                                │
          │  Trigger 3: Proactive upsell email (Day 20)                  │
          │  ─────────────────────────────────────────                   │
          │  Subject: "Your agent is working hard — want to unlock more?"│
          │  "In 20 days, your agent has completed 87 tasks. Power users │
          │   get unlimited tasks + custom agents. Join them for $30/mo."│
          │                                                                │
          │  Trigger 4: Annual plan offer (Day 30)                        │
          │  ──────────────────────────────────────                       │
          │  "Save 20% — switch to annual billing"                       │
          │  Email: "You've been with us for a month. Switch to annual   │
          │          billing and save 2 months."                          │
          └──────────────────────────────┬───────────────────────────────┘
                                         │
                                         ▼
          ┌──────────────────────────────────────────────────────────────┐
          │                    UPGRADE FLOW                               │
          │                                                                │
          │  [User clicks upgrade]                                        │
          │         │                                                      │
          │         ▼                                                      │
          │  Dashboard: "Upgrade your plan"                               │
          │  ┌─────────────────────────────────────────────────────────┐ │
          │  │  Current: Starter ($15/mo)                               │ │
          │  │  New: Pro ($30/mo)                                       │ │
          │  │                                                          │ │
          │  │  You'll be charged: $15 today (prorated)                │ │
          │  │  Then: $30/month on [renewal date]                      │ │
          │  │                                                          │ │
          │  │  New features unlocked:                                  │ │
          │  │  ✅ WhatsApp delivery                                    │ │
          │  │  ✅ 10 agents (7 more in library)                       │ │
          │  │  ✅ Web dashboard                                        │ │
          │  │  ✅ 6-month memory window                               │ │
          │  │                                                          │ │
          │  │  [Confirm Upgrade]                                       │ │
          │  └─────────────────────────────────────────────────────────┘ │
          │         │                                                      │
          │         ▼                                                      │
          │  Stripe processes proration                                    │
          │  Container config updated                                     │
          │  Agent sends confirmation via Telegram:                       │
          │  "🎉 You've upgraded to Pro! WhatsApp is now enabled.        │
          │   Send me your number to connect."                            │
          └──────────────────────────────┬───────────────────────────────┘
                                         │
                                         ▼
                               [REFERRAL LOOP]
```

---

## Stage 10: Referral Loop

```
          ┌──────────────────────────────────────────────────────────────┐
          │                    REFERRAL LOOP                              │
          │                                                                │
          │  Trigger: User at Day 14, 30, and 60 (happy user moments)   │
          │                                                                │
          │  Agent message:                                               │
          │  "Hey! You've been using your agent for 2 weeks. 🎉          │
          │   Know someone who'd love this?                              │
          │   Share your link → they get 7 days free,                   │
          │   you get 1 month FREE. Win-win. 🙌"                        │
          │                                                                │
          │  [Copy my referral link]                                     │
          │  [Share on Twitter]  [Share on WhatsApp]                     │
          │                                                                │
          │  ┌─────────────────────────────────────────────────────┐    │
          │  │                REFERRAL MECHANICS                     │    │
          │  │                                                       │    │
          │  │  Referrer: +1 month FREE when friend pays            │    │
          │  │  Referee: Extended 14-day trial (vs 7-day standard)  │    │
          │  │  Link format: app.personal-ai.com/r/[username]       │    │
          │  │  Tracking: UTM + referral cookie (30-day window)     │    │
          │  │                                                       │    │
          │  │  Dashboard: "Referrals" tab shows:                   │    │
          │  │  - [3] friends referred                              │    │
          │  │  - [2] converted to paid                             │    │
          │  │  - [2] free months earned                            │    │
          │  └─────────────────────────────────────────────────────┘    │
          │                                                                │
          │  Friend receives referral →                                   │
          │         │                                                      │
          │         ▼                                                      │
          │  [Landing page with "Your friend [Name] uses this"]          │
          │  → Higher conversion (social proof built in)                  │
          │  → Enters the same journey from Stage 2                       │
          └──────────────────────────────┬───────────────────────────────┘
                                         │
                                         ▼
                                 [CHURN RECOVERY]
```

---

## Stage 11: Churn Recovery Flow

```
          ┌──────────────────────────────────────────────────────────────┐
          │                  CHURN RECOVERY FLOWS                         │
          │                                                                │
          │  SIGNAL: User inactive for 5+ days                           │
          │  ─────────────────────────────────                            │
          │  Day 5: Agent sends: "Haven't heard from you in a while!    │
          │          Everything okay? 👋 Ask me anything."              │
          │  Day 10: Email: "Your agent is still on standby for you"     │
          │  Day 14: "Here's what I could have done for you this week..."│
          │           (shows personalized examples based on their usage) │
          │                                                                │
          │  SIGNAL: User clicks "Cancel" in dashboard                   │
          │  ────────────────────────────────────────                     │
          │         │                                                      │
          │         ▼                                                      │
          │  ┌─────────────────────────────────────────────────────────┐ │
          │  │  CANCELLATION SAVE FLOW                                  │ │
          │  │                                                          │ │
          │  │  "Before you go — why are you leaving?"                 │ │
          │  │  ○ Too expensive                                         │ │
          │  │  ○ Not using it enough                                   │ │
          │  │  ○ Missing features I need                               │ │
          │  │  ○ Found a better alternative                            │ │
          │  │  ○ Just taking a break                                   │ │
          │  │                                                          │ │
          │  │  Based on selection:                                     │ │
          │  │                                                          │ │
          │  │  "Too expensive" →                                       │ │
          │  │    "Pause for 1 month at no charge?"                    │ │
          │  │    Or: "Downgrade to Starter for $15/mo?"               │ │
          │  │                                                          │ │
          │  │  "Not using it enough" →                                │ │
          │  │    "Let me show you 3 things you're missing..."         │ │
          │  │    Video: "5-minute power user guide"                   │ │
          │  │                                                          │ │
          │  │  "Missing features" →                                   │ │
          │  │    "Tell us what you need" → Product feedback form      │ │
          │  │    "We're building [X] — want early access?"            │ │
          │  │                                                          │ │
          │  │  "Taking a break" →                                     │ │
          │  │    "Pause for 1-3 months" option                        │ │
          │  │    Agent goes to sleep mode (container paused)          │ │
          │  │    Memory preserved, reactivate anytime                 │ │
          │  └───────────────┬─────────────────────────────────────────┘ │
          │                  │                                             │
          │      ┌───────────┴────────────────┐                          │
          │      │                            │                          │
          │      ▼                            ▼                          │
          │  [Saved - stays]          [Confirms cancel]                  │
          │      │                            │                          │
          │      ▼                            ▼                          │
          │  Continue daily loop       Container suspended               │
          │                           Data retained 90 days             │
          │                           Win-back emails:                  │
          │                           D+7: "We miss you"                │
          │                           D+30: "Here's what's new"         │
          │                           D+60: "Special offer to return"   │
          │                           D+90: "Final: your agent retires" │
          └──────────────────────────────────────────────────────────────┘
```

---

## Full Journey Summary (Decision Tree View)

```
[Any Channel]
     │
     ▼
[Landing Page]──────────────────────────────────────────[Bounce]
     │                                                      │
     ▼                                                 [Exit popup]
[Pricing Page]─────────────────────────────────────────────┘
     │
     ├── Starter ($15) ──┐
     ├── Pro ($30) ───────┤
     └── Power ($60) ─────┘
                         │
                         ▼
                    [Signup]────────────────────────[Abandon: email sequence]
                         │
                         ▼
               [Trial / Payment]──────────────────[Decline: retry + email]
                         │
                         ▼
               [3-step Onboarding]
                         │
                         ▼
               [Container Provisioned]
                         │
                         ▼
               [First Telegram Message] ← AHA MOMENT
                         │
                         ▼
               [Daily Usage Loop]
                         │
                    ─────┴─────
                   │            │
                   ▼            ▼
          [Hit limit/         [Happy, active]
           want feature]            │
                   │                ▼
                   ▼         [Day 14+: Referral]
          [Upgrade prompt]          │
                   │                ▼
                   ▼         [Friend joins → referral cycle]
          [Upgrade to Pro
           or Power]
                   │
                   ▼
          [Higher retention,
           deeper lock-in]
                   │
              ─────┴──────
             │             │
             ▼             ▼
      [Long-term        [Churn signal]
       subscriber]           │
             │               ▼
             │       [Save flow: pause/
             │        downgrade/feature]
             │               │
             │          ─────┴─────
             │         │           │
             │         ▼           ▼
             │    [Saved]    [Cancelled]
             │         │           │
             │         ▼           ▼
             │   [Daily loop]  [Win-back
             │                  sequence]
             │
             ▼
      [Year+ subscriber:
       Ambassador program
       Agent marketplace
       Referral rewards]
```

---

## Key Metrics by Stage

| Stage | Key Metric | Target |
|---|---|---|
| Discovery → Landing | Traffic | 10K visits/month (Month 6) |
| Landing → Signup | Conversion rate | 8–12% |
| Signup → Payment | Conversion rate | 60–70% |
| Payment → Active | Activation rate | 85%+ |
| Active → Day 7 | 7-day retention | 70%+ |
| Day 7 → Day 30 | 30-day retention | 55%+ |
| Active → Upgrade | Upgrade rate | 25% within 90 days |
| User → Referral | Referral rate | 15% of users refer 1+ |
| Cancel → Save | Save rate | 30% of cancellations |

---

## Emotional Journey Map

```
Awareness    Interest    Trial       Active      Habitual    Advocate
    │            │          │           │            │            │
    ▼            ▼          ▼           ▼            ▼            ▼
"This looks   "Interesting  "Let me    "Oh wow,    "I can't    "You NEED
 cool, but     — does it    try it"    it actually  imagine     this, it
 does it       really                  works!"      my day      changed
 work?"        work for                             without     my life"
               me?"                                this"
    │            │          │           │            │            │
CURIOUS      HOPEFUL     SKEPTICAL   DELIGHTED   DEPENDENT   EVANGELIST
    │            │          │           │            │            │
  Clear       Demo        Fast        Daily       Memory      Referral
  value       video       setup       aha         lock-in     program
  prop         +          < 60s      moment      + habits    + NPS
  needed     pricing     needed      crucial     critical    critical
```

---

*Document version 1.0 — Internal product reference*  
*Last updated: March 2026*
