import Link from "next/link";

const TIERS = [
  {
    name: "Starter",
    price: "$15",
    description: "Perfect for personal use",
    features: [
      "1 AI agent (Telegram or WhatsApp)",
      "1,000 messages/month",
      "Basic memory & reminders",
      "Email support",
    ],
    cta: "Get started",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$30",
    description: "For power users",
    features: [
      "1 AI agent (all channels)",
      "5,000 messages/month",
      "Advanced memory & web search",
      "Calendar & task integrations",
      "Priority support",
    ],
    cta: "Go Pro",
    highlight: true,
  },
  {
    name: "Max",
    price: "$60",
    description: "Unlimited power",
    features: [
      "1 AI agent (all channels)",
      "Unlimited messages",
      "Full tool suite",
      "Custom instructions & persona",
      "Dedicated support",
    ],
    cta: "Go Max",
    highlight: false,
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <span className="text-xl font-bold text-brand-700">PAI</span>
        <div className="flex gap-4">
          <Link
            href="/login"
            className="text-slate-600 hover:text-slate-900 text-sm font-medium"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="bg-brand-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors"
          >
            Start free trial
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="text-center py-20 px-6 max-w-3xl mx-auto">
        <h1 className="text-5xl font-extrabold text-slate-900 leading-tight mb-4">
          Your personal AI assistant,
          <br />
          <span className="text-brand-600">always on.</span>
        </h1>
        <p className="text-xl text-slate-500 mb-8">
          Get your own AI agent running 24/7 on Telegram, WhatsApp, or the web.
          No setup. No code. Just subscribe and start chatting.
        </p>
        <Link
          href="/signup"
          className="inline-block bg-brand-600 text-white font-semibold px-8 py-4 rounded-xl hover:bg-brand-700 transition-colors text-lg"
        >
          Try free for 7 days →
        </Link>
      </section>

      {/* Pricing */}
      <section className="py-16 px-6 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">
          Simple, transparent pricing
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-2xl p-8 border ${
                tier.highlight
                  ? "border-brand-500 bg-brand-600 text-white shadow-xl scale-105"
                  : "border-slate-200 bg-white text-slate-900"
              }`}
            >
              <div className="mb-6">
                <p
                  className={`text-sm font-semibold uppercase tracking-wide mb-1 ${tier.highlight ? "text-blue-200" : "text-brand-600"}`}
                >
                  {tier.name}
                </p>
                <p className="text-4xl font-extrabold">
                  {tier.price}
                  <span
                    className={`text-base font-normal ${tier.highlight ? "text-blue-200" : "text-slate-400"}`}
                  >
                    /mo
                  </span>
                </p>
                <p
                  className={`text-sm mt-1 ${tier.highlight ? "text-blue-100" : "text-slate-500"}`}
                >
                  {tier.description}
                </p>
              </div>
              <ul className="space-y-3 mb-8">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <span className={tier.highlight ? "text-blue-200" : "text-brand-500"}>
                      ✓
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className={`block text-center font-semibold py-3 rounded-xl transition-colors ${
                  tier.highlight
                    ? "bg-white text-brand-600 hover:bg-blue-50"
                    : "bg-brand-600 text-white hover:bg-brand-700"
                }`}
              >
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
