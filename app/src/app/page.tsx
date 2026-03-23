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

const FEATURES = [
  {
    icon: "⚡",
    title: "Always online",
    body: "Your agent runs 24/7 in the cloud. Never miss a message, reminder, or task.",
  },
  {
    icon: "🧠",
    title: "Persistent memory",
    body: "Your agent remembers your preferences, past conversations, and important context.",
  },
  {
    icon: "🔗",
    title: "Connects everywhere",
    body: "Chat via Telegram, WhatsApp, or the web — all synced to the same agent.",
  },
  {
    icon: "🛠",
    title: "Powerful tools",
    body: "Web search, calendar access, reminders, and more — all built in.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <span className="text-xl font-bold tracking-tight">PAI</span>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-slate-400 hover:text-white text-sm font-medium transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="bg-brand-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors"
          >
            Start free trial
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="text-center pt-20 pb-28 px-6 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-brand-600/10 border border-brand-600/20 text-brand-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
          Now in beta — 7-day free trial
        </div>

        <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-6 tracking-tight">
          Your Personal AI Agent.
          <br />
          <span className="bg-gradient-to-r from-brand-400 to-blue-400 bg-clip-text text-transparent">
            Always On.
          </span>
        </h1>

        <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
          Get your own Claude-powered AI assistant running 24/7 on Telegram,
          WhatsApp, or the web. No setup. No code. Just subscribe and start
          chatting.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-brand-600 text-white font-semibold px-8 py-4 rounded-xl hover:bg-brand-700 transition-colors text-base"
          >
            Try free for 7 days
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </Link>
          <Link
            href="#pricing"
            className="text-slate-400 hover:text-white text-sm font-medium transition-colors"
          >
            View pricing →
          </Link>
        </div>

        {/* Social proof */}
        <p className="mt-10 text-slate-600 text-sm">
          No credit card required · Cancel anytime · Powered by Claude
        </p>
      </section>

      {/* Feature grid */}
      <section className="py-16 px-6 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="bg-slate-900 border border-slate-800 rounded-xl p-6"
            >
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-white mb-3">
            Simple, transparent pricing
          </h2>
          <p className="text-slate-400">
            Start free, upgrade when you need more power.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`relative rounded-2xl p-8 border ${
                tier.highlight
                  ? "border-brand-500 bg-gradient-to-b from-brand-600/20 to-slate-900 shadow-2xl shadow-brand-900/30 scale-105"
                  : "border-slate-800 bg-slate-900"
              }`}
            >
              {tier.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-brand-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                    {tier.badge}
                  </span>
                </div>
              )}

              <div className="mb-6">
                <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-2">
                  {tier.name}
                </p>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-4xl font-extrabold text-white">
                    {tier.price}
                  </span>
                  <span className="text-slate-500 text-sm pb-1">
                    {tier.period}
                  </span>
                </div>
                <p className="text-sm text-slate-500">{tier.description}</p>
              </div>

              <ul className="space-y-3 mb-8">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <svg
                      className="w-4 h-4 text-brand-500 shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-slate-300">{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/signup"
                className={`block text-center font-semibold py-3 rounded-xl transition-colors text-sm ${
                  tier.highlight
                    ? "bg-brand-600 text-white hover:bg-brand-700"
                    : "bg-slate-800 text-slate-200 hover:bg-slate-700"
                }`}
              >
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-20 px-6 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">
          Ready to meet your agent?
        </h2>
        <p className="text-slate-400 mb-8 max-w-xl mx-auto">
          Start your free 7-day trial today. Your AI agent will be ready in
          seconds.
        </p>
        <Link
          href="/signup"
          className="inline-flex items-center gap-2 bg-brand-600 text-white font-semibold px-8 py-4 rounded-xl hover:bg-brand-700 transition-colors text-base"
        >
          Get started free
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-600">
          <span className="font-bold text-slate-400">PAI</span>
          <div className="flex gap-6">
            <Link href="/terms" className="hover:text-slate-400 transition-colors">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-slate-400 transition-colors">
              Privacy
            </Link>
          </div>
          <span>© {new Date().getFullYear()} Personal AI Assistant</span>
        </div>
      </footer>
    </div>
  );
}
