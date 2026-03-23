import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { onboarding?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user as {
    name?: string | null;
    email?: string | null;
    id?: string;
    plan?: string;
  };

  const isOnboarding = searchParams.onboarding === "true";
  const planLabel =
    user.plan === "pro"
      ? "Pro"
      : user.plan === "power"
        ? "Power"
        : "Starter";

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Top nav */}
      <nav className="border-b border-slate-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span className="font-bold text-lg tracking-tight">PAI</span>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400">{user.email}</span>
            <Link
              href="/api/auth/signout"
              className="text-sm text-slate-500 hover:text-white transition-colors"
            >
              Sign out
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">
              {user.name ? `Welcome back, ${user.name.split(" ")[0]}` : "Dashboard"}
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Your personal AI assistant is running.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-green-950 border border-green-800 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sm text-green-400 font-medium">Agent online</span>
          </div>
        </div>

        {/* Onboarding banner */}
        {isOnboarding && (
          <div className="bg-brand-600/10 border border-brand-600/20 rounded-xl p-5 mb-8">
            <p className="font-semibold text-brand-300 text-sm">
              Your agent is being provisioned — takes about 30 seconds.
            </p>
            <p className="text-sm text-brand-400/80 mt-1">
              Connect it to Telegram or WhatsApp below to start chatting.
            </p>
          </div>
        )}

        {/* Plan badge + upgrade CTA */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-brand-600/20 flex items-center justify-center text-brand-400 font-bold text-sm">
              {planLabel[0]}
            </div>
            <div>
              <p className="font-semibold text-white text-sm">{planLabel} plan</p>
              <p className="text-slate-500 text-xs mt-0.5">
                Active subscription
              </p>
            </div>
          </div>
          {user.plan !== "power" && (
            <Link
              href="/billing"
              className="text-xs font-semibold text-brand-400 border border-brand-600/30 px-3 py-1.5 rounded-lg hover:bg-brand-600/10 transition-colors"
            >
              Upgrade plan
            </Link>
          )}
        </div>

        {/* Channels */}
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4">
          Connected channels
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          <ChannelCard
            name="Telegram"
            status="connected"
            icon="✈️"
            detail="@your_agent_bot"
          />
          <ChannelCard
            name="WhatsApp"
            status="disconnected"
            icon="💬"
            detail="Tap to connect"
          />
        </div>

        {/* Stats */}
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4">
          This month
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <StatCard label="Messages" value="142" trend="+12%" />
          <StatCard label="Tasks completed" value="17" trend="+3%" />
          <StatCard label="Memory entries" value="34" trend="+8" />
        </div>

        {/* Agent config skeleton */}
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4">
          Agent settings
        </h2>
        <div className="bg-slate-900 border border-slate-800 rounded-xl divide-y divide-slate-800">
          <ConfigRow
            label="Persona name"
            value="Assistant"
            action="Edit"
          />
          <ConfigRow
            label="Primary language"
            value="English"
            action="Change"
          />
          <ConfigRow
            label="Custom instructions"
            value="Not set"
            action="Add"
          />
          <ConfigRow
            label="Web search"
            value="Enabled"
            action="Configure"
          />
        </div>
      </main>
    </div>
  );
}

function ChannelCard({
  name,
  status,
  icon,
  detail,
}: {
  name: string;
  status: "connected" | "disconnected";
  icon: string;
  detail: string;
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-center gap-4">
      <span className="text-2xl">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-white text-sm">{name}</p>
        <p className="text-xs text-slate-500 mt-0.5 truncate">{detail}</p>
      </div>
      <span
        className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${
          status === "connected"
            ? "bg-green-950 text-green-400 border border-green-800"
            : "bg-slate-800 text-slate-400 border border-slate-700"
        }`}
      >
        {status === "connected" ? "Connected" : "Set up"}
      </span>
    </div>
  );
}

function StatCard({
  label,
  value,
  trend,
}: {
  label: string;
  value: string;
  trend: string;
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <p className="text-2xl font-bold text-white">{value}</p>
      <div className="flex items-center justify-between mt-1">
        <p className="text-xs text-slate-500">{label}</p>
        <span className="text-xs text-green-400 font-medium">{trend}</span>
      </div>
    </div>
  );
}

function ConfigRow({
  label,
  value,
  action,
}: {
  label: string;
  value: string;
  action: string;
}) {
  return (
    <div className="flex items-center justify-between px-5 py-4">
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-xs text-slate-500 mt-0.5">{value}</p>
      </div>
      <button className="text-xs text-brand-400 font-semibold hover:text-brand-300 transition-colors">
        {action}
      </button>
    </div>
  );
}
