import Link from "next/link";

const TIERS = [
  {
    name: "Starter",
    price: "$15",
    period: "/mo",
    description: "Perfect for personal use",
    features: [
      "1 AI agent (Telegram or WhatsApp)",
      "1,000 messages / month",
      "Basic memory & reminders",
      "Email support",
    ],
    cta: "Get started",
    highlight: false,
    badge: null,
  },
  {
    name: "Pro",
    price: "$30",
    period: "/mo",
    description: "For power users",
    features: [
      "1 AI agent (all channels)",
      "5,000 messages / month",
      "Advanced memory & web search",
      "Calendar & task integrations",
      "Priority support",
    ],
    cta: "Go Pro",
    highlight: true,
    badge: "Most popular",
  },
  {
    name: "Power",
    price: "$60",
    period: "/mo",
    description: "Unlimited power",
    features: [
      "1 AI agent (all channels)",
      "Unlimited messages",
      "Full tool suite",
      "Custom persona & instructions",
      "Dedicated support",
    ],
    cta: "Go Power",
    highlight: false,
    badge: null,
  },
];

const STEPS = [
  {
    number: "01",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    title: "Create your account",
    body: "Sign up in 30 seconds. Choose your plan. No credit card needed for your 7-day trial.",
  },
  {
    number: "02",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    title: "Connect Telegram or WhatsApp",
    body: "Link your preferred messaging app in one click. Your AI agent is live instantly — no code, no config.",
  },
  {
    number: "03",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: "Start chatting",
    body: "Ask questions, set reminders, get daily briefings, search the web — your agent is ready 24/7.",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "I replaced my entire morning routine app stack with PAI. My agent briefs me at 7am — calendar, emails, market data. It's like having a chief of staff in my pocket.",
    name: "Marcus T.",
    role: "Founder, early access",
    avatar: "MT",
    color: "from-violet-500 to-indigo-500",
  },
  {
    quote:
      "As a freelancer juggling 6 clients, PAI keeps me sane. The persistent memory is unreal — it remembers context from weeks ago without me having to re-explain anything.",
    name: "Priya S.",
    role: "UX Consultant, beta user",
    avatar: "PS",
    color: "from-indigo-500 to-blue-500",
  },
  {
    quote:
      "I was skeptical at first, but two weeks in and I'm completely hooked. The Telegram integration is seamless and it actually understands nuance. Highly recommend.",
    name: "Jake R.",
    role: "Product Manager, beta user",
    avatar: "JR",
    color: "from-blue-500 to-cyan-500",
  },
];

const FEATURES = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
      </svg>
    ),
    title: "Always online",
    body: "Your agent runs 24/7 in the cloud. Never miss a message, reminder, or task.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    title: "Persistent memory",
    body: "Remembers your preferences, past conversations, and important context — forever.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
    title: "Connects everywhere",
    body: "Telegram, WhatsApp, or the web — all synced to the same agent, same context.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: "Powerful tools",
    body: "Web search, calendar access, reminders, task tracking — all built in and ready.",
  },
];

function CheckIcon() {
  return (
    <svg className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function ArrowRight() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
    </svg>
  );
}

function TelegramMockup() {
  return (
    <div className="relative w-full max-w-sm mx-auto animate-float">
      {/* Glow behind the phone */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-600/30 to-violet-600/20 rounded-3xl blur-3xl scale-110" />

      {/* Phone frame */}
      <div className="relative glass rounded-3xl overflow-hidden shadow-2xl border border-white/10">
        {/* Telegram header */}
        <div className="bg-[#1c2a3a] px-4 py-3 flex items-center gap-3 border-b border-white/5">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
            AI
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-sm font-semibold">Personal AI Agent</div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 text-xs">online</span>
            </div>
          </div>
          <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Chat messages */}
        <div className="bg-[#0e1621] px-3 py-4 space-y-3 min-h-[360px]">
          {/* AI message - morning briefing */}
          <div className="flex items-end gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold shrink-0 mb-1">
              AI
            </div>
            <div className="max-w-[85%]">
              <div className="bg-[#182533] rounded-2xl rounded-bl-sm px-3 py-2.5 text-xs text-slate-200 leading-relaxed">
                <p className="font-semibold text-white mb-1.5">Good morning Alex! ☀️</p>
                <p className="text-slate-300 mb-2">Here&apos;s your briefing for Tuesday:</p>
                <div className="space-y-1 text-slate-300">
                  <p>📅 <span className="text-white">3 meetings</span> — 10am standup, 2pm client call, 4pm review</p>
                  <p>📧 <span className="text-amber-400">2 emails</span> need your reply today</p>
                  <p>📈 BTC <span className="text-emerald-400">+3.2%</span> overnight</p>
                  <p>⏰ Dentist tomorrow at 3pm</p>
                </div>
              </div>
              <span className="text-slate-600 text-[10px] ml-2 mt-0.5 block">9:07 AM</span>
            </div>
          </div>

          {/* User message */}
          <div className="flex justify-end">
            <div>
              <div className="bg-brand-600 rounded-2xl rounded-br-sm px-3 py-2 text-xs text-white max-w-[85%]">
                Any urgent emails I need to handle?
              </div>
              <span className="text-slate-600 text-[10px] mr-1 mt-0.5 block text-right">9:08 AM ✓✓</span>
            </div>
          </div>

          {/* AI message */}
          <div className="flex items-end gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold shrink-0 mb-1">
              AI
            </div>
            <div className="max-w-[85%]">
              <div className="bg-[#182533] rounded-2xl rounded-bl-sm px-3 py-2.5 text-xs text-slate-200 leading-relaxed">
                <p>Yes — <span className="text-white font-medium">Sarah from Acme</span> asked about your Q2 proposal. She needs a decision by EOD.</p>
                <p className="mt-1.5 text-slate-400">Want me to draft a reply?</p>
              </div>
              <span className="text-slate-600 text-[10px] ml-2 mt-0.5 block">9:08 AM</span>
            </div>
          </div>

          {/* User message */}
          <div className="flex justify-end">
            <div>
              <div className="bg-brand-600 rounded-2xl rounded-br-sm px-3 py-2 text-xs text-white max-w-[85%]">
                Yes please, keep it concise 🙌
              </div>
              <span className="text-slate-600 text-[10px] mr-1 mt-0.5 block text-right">9:09 AM ✓✓</span>
            </div>
          </div>

          {/* AI typing */}
          <div className="flex items-end gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
              AI
            </div>
            <div className="bg-[#182533] rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
              <span className="typing-dot w-1.5 h-1.5 rounded-full bg-slate-400 inline-block" />
              <span className="typing-dot w-1.5 h-1.5 rounded-full bg-slate-400 inline-block" />
              <span className="typing-dot w-1.5 h-1.5 rounded-full bg-slate-400 inline-block" />
            </div>
          </div>
        </div>

        {/* Input bar */}
        <div className="bg-[#1c2a3a] px-3 py-2.5 flex items-center gap-2 border-t border-white/5">
          <div className="flex-1 bg-[#2b3c4e] rounded-full px-3 py-1.5 text-xs text-slate-500">
            Message...
          </div>
          <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#020617] text-white overflow-x-hidden">
      {/* Background grid + gradient */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(99,102,241,1) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,1) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-brand-600/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-violet-600/8 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-indigo-600/8 rounded-full blur-[100px]" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center text-white text-sm font-extrabold shadow-lg shadow-brand-900/50">
            P
          </div>
          <span className="text-lg font-bold tracking-tight text-white">PAI</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <a href="#how-it-works" className="text-slate-400 hover:text-white text-sm transition-colors">How it works</a>
          <a href="#pricing" className="text-slate-400 hover:text-white text-sm transition-colors">Pricing</a>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-slate-400 hover:text-white text-sm font-medium transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all shadow-lg shadow-brand-900/50 hover:shadow-brand-900/70"
          >
            Start free trial
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 pt-16 pb-24 px-6 max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: copy */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-brand-900/50 border border-brand-700/40 text-brand-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Now in beta — 7-day free trial
            </div>

            <h1 className="text-5xl md:text-6xl font-extrabold leading-[1.08] mb-6 tracking-tight">
              Your Personal
              <br />
              <span className="text-shimmer">AI Agent.</span>
              <br />
              <span className="text-white">Always On.</span>
            </h1>

            <p className="text-lg text-slate-400 mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Get your own Claude-powered AI assistant running 24/7 on Telegram or WhatsApp.
              Morning briefings, reminders, web search, calendar — all in your chat app.
              No setup. No code. Just subscribe and start.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-8">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold px-8 py-4 rounded-xl transition-all text-base shadow-xl shadow-brand-900/50 hover:shadow-brand-900/70 hover:-translate-y-0.5"
              >
                Try free for 7 days
                <ArrowRight />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-sm font-medium transition-colors"
              >
                See how it works
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </a>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 text-xs text-slate-600">
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                No credit card required
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Cancel anytime
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Powered by Claude
              </span>
            </div>
          </div>

          {/* Right: Telegram mockup */}
          <div className="flex justify-center lg:justify-end">
            <TelegramMockup />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="relative z-10 py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-brand-400 text-sm font-semibold uppercase tracking-widest mb-3">How it works</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Up and running in under 2 minutes
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-8 left-[calc(16.67%+16px)] right-[calc(16.67%+16px)] h-px bg-gradient-to-r from-brand-600/0 via-brand-600/50 to-brand-600/0" />

            {STEPS.map((step, i) => (
              <div key={i} className="relative text-center">
                <div className="relative inline-flex items-center justify-center w-16 h-16 mb-5 mx-auto">
                  <div className="absolute inset-0 bg-brand-600/20 rounded-2xl blur-md" />
                  <div className="relative w-16 h-16 bg-gradient-to-br from-brand-900/80 to-slate-900 border border-brand-700/40 rounded-2xl flex items-center justify-center text-brand-400">
                    {step.icon}
                  </div>
                  <div className="absolute -top-2 -right-2 w-5 h-5 bg-brand-600 rounded-full flex items-center justify-center text-[10px] font-bold text-white">
                    {i + 1}
                  </div>
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="group glass-light rounded-2xl p-6 hover:border-brand-700/40 transition-all hover:-translate-y-1"
              >
                <div className="w-10 h-10 bg-brand-900/60 border border-brand-700/30 rounded-xl flex items-center justify-center text-brand-400 mb-4 group-hover:bg-brand-800/60 transition-colors">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-brand-400 text-sm font-semibold uppercase tracking-widest mb-3">Testimonials</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Loved by early users
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="glass-light rounded-2xl p-6 flex flex-col hover:-translate-y-1 transition-all">
                {/* Stars */}
                <div className="flex gap-0.5 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <svg key={j} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-slate-300 text-sm leading-relaxed flex-1 mb-5">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold">{t.name}</p>
                    <p className="text-slate-500 text-xs">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="relative z-10 py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-brand-400 text-sm font-semibold uppercase tracking-widest mb-3">Pricing</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
              Simple, transparent pricing
            </h2>
            <p className="text-slate-400 max-w-md mx-auto">
              Start free, upgrade when you need more. All plans include a 7-day free trial.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {TIERS.map((tier) => (
              <div
                key={tier.name}
                className={`relative rounded-2xl p-8 transition-all ${
                  tier.highlight
                    ? "bg-gradient-to-b from-brand-900/60 to-slate-900/80 border border-brand-500/50 shadow-2xl shadow-brand-900/40 scale-[1.03] animate-pulse-glow"
                    : "glass-light hover:-translate-y-1"
                }`}
              >
                {tier.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-brand-600 to-violet-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
                      {tier.badge}
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <p className={`text-xs font-bold uppercase tracking-widest mb-3 ${tier.highlight ? "text-brand-400" : "text-slate-500"}`}>
                    {tier.name}
                  </p>
                  <div className="flex items-end gap-1 mb-2">
                    <span className="text-4xl font-extrabold text-white">{tier.price}</span>
                    <span className="text-slate-500 text-sm pb-1.5">{tier.period}</span>
                  </div>
                  <p className="text-sm text-slate-500">{tier.description}</p>
                </div>

                <ul className="space-y-3 mb-8">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <CheckIcon />
                      <span className="text-slate-300">{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/signup"
                  className={`block text-center font-semibold py-3 rounded-xl transition-all text-sm ${
                    tier.highlight
                      ? "bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-900/50 hover:-translate-y-0.5"
                      : "bg-slate-800 hover:bg-slate-700 text-slate-200"
                  }`}
                >
                  {tier.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-brand-600/20 to-violet-600/20 rounded-3xl blur-2xl" />
            <div className="relative glass rounded-3xl p-12 border border-brand-700/30">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to meet your agent?
              </h2>
              <p className="text-slate-400 mb-8 text-lg">
                Your AI agent will be live and ready to chat in under 2 minutes.
              </p>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold px-10 py-4 rounded-xl transition-all text-base shadow-xl shadow-brand-900/60 hover:-translate-y-0.5"
              >
                Get started free
                <ArrowRight />
              </Link>
              <p className="mt-4 text-slate-600 text-sm">No credit card required · 7-day free trial</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/60 py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center text-white text-xs font-extrabold">
              P
            </div>
            <span className="font-semibold text-slate-400">PAI</span>
          </div>
          <div className="flex gap-6">
            <Link href="/terms" className="hover:text-slate-400 transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-slate-400 transition-colors">Privacy</Link>
          </div>
          <span>© {new Date().getFullYear()} Personal AI Assistant</span>
        </div>
      </footer>
    </div>
  );
}
