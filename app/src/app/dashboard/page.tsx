import { authOptions } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

// ── Types ──────────────────────────────────────────────────────────────────

type SubscriptionStatus =
  | "inactive"
  | "trialing"
  | "active"
  | "paused"
  | "past_due"
  | "cancelled";

type AgentStatus =
  | "provisioning"
  | "running"
  | "stopped"
  | "error"
  | "deprovisioned";

interface DashboardData {
  subscriptionTier: string | null;
  subscriptionStatus: SubscriptionStatus;
  agentId: string | null;
  agentStatus: AgentStatus | null;
  telegramChatId: string | null;
  tasksThisMonth: number;
  tokensThisMonth: number;
  memoryEntries: number;
}

// ── Data fetching ──────────────────────────────────────────────────────────

async function getDashboardData(userId: string): Promise<DashboardData> {
  const supabase = createServerClient();

  // User subscription data
  const { data: user } = await supabase
    .from("users")
    .select("subscription_tier, subscription_status")
    .eq("id", userId)
    .single();

  // Agent data
  const { data: agent } = await supabase
    .from("agents")
    .select("id, status, telegram_chat_id")
    .eq("user_id", userId)
    .single();

  // Usage stats for current month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  let tasksThisMonth = 0;
  let tokensThisMonth = 0;
  let memoryEntries = 0;

  if (agent?.id) {
    const { data: usageLogs } = await supabase
      .from("usage_logs")
      .select("tokens_used")
      .eq("agent_id", agent.id)
      .gte("created_at", startOfMonth.toISOString());

    tasksThisMonth = usageLogs?.length ?? 0;
    tokensThisMonth = usageLogs?.reduce((sum, r) => sum + (r.tokens_used ?? 0), 0) ?? 0;

    const { count } = await supabase
      .from("agent_memory")
      .select("id", { count: "exact", head: true })
      .eq("agent_id", agent.id);

    memoryEntries = count ?? 0;
  }

  return {
    subscriptionTier: user?.subscription_tier ?? null,
    subscriptionStatus: (user?.subscription_status ?? "inactive") as SubscriptionStatus,
    agentId: agent?.id ?? null,
    agentStatus: (agent?.status ?? null) as AgentStatus | null,
    telegramChatId: agent?.telegram_chat_id ?? null,
    tasksThisMonth,
    tokensThisMonth,
    memoryEntries,
  };
}

// ── Page ───────────────────────────────────────────────────────────────────

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { onboarding?: string; checkout?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const sessionUser = session.user as {
    name?: string | null;
    email?: string | null;
    id?: string;
  };
  const userId = sessionUser.id!;

  const data = await getDashboardData(userId);

  const isOnboarding = searchParams.onboarding === "true";
  const checkoutSuccess = searchParams.checkout === "success";
  const checkoutCancelled = searchParams.checkout === "cancelled";

  const tierLabel =
    data.subscriptionTier === "pro"
      ? "Pro"
      : data.subscriptionTier === "max"
        ? "Max"
        : data.subscriptionTier === "starter"
          ? "Starter"
          : "Free";

  const isAgentOnline = data.agentStatus === "running";
  const isAgentProvisioning = data.agentStatus === "provisioning" || !data.agentId;

  const telegramBotUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;
  const telegramDeepLink = telegramBotUsername
    ? `https://t.me/${telegramBotUsername}?start=${userId}`
    : null;

  const hasTelegramConnected = !!data.telegramChatId;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Top nav */}
      <nav className="border-b border-slate-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span className="font-bold text-lg tracking-tight">PAI</span>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400">{sessionUser.email}</span>
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
              {sessionUser.name
                ? `Welcome back, ${sessionUser.name.split(" ")[0]}`
                : "Dashboard"}
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              {isAgentOnline
                ? "Your personal AI assistant is running."
                : isAgentProvisioning
                  ? "Your agent is being set up..."
                  : "Your agent is currently offline."}
            </p>
          </div>
          <AgentStatusBadge status={data.agentStatus} />
        </div>

        {/* Banners */}
        {(isOnboarding || checkoutSuccess) && (
          <div className="bg-indigo-950/60 border border-indigo-700/40 rounded-xl p-5 mb-8">
            <p className="font-semibold text-indigo-300 text-sm">
              {checkoutSuccess
                ? "Payment confirmed — your agent is being provisioned."
                : "Your agent is being provisioned — takes about 30 seconds."}
            </p>
            <p className="text-sm text-indigo-400/80 mt-1">
              Connect it to Telegram below to start chatting.
            </p>
          </div>
        )}

        {checkoutCancelled && (
          <div className="bg-slate-900 border border-amber-800/40 rounded-xl p-5 mb-8">
            <p className="font-semibold text-amber-400 text-sm">
              Checkout was cancelled. Your plan has not changed.
            </p>
          </div>
        )}

        {data.subscriptionStatus === "past_due" && (
          <div className="bg-red-950/60 border border-red-700/40 rounded-xl p-5 mb-8">
            <p className="font-semibold text-red-400 text-sm">
              Your last payment failed. Please update your billing details to keep your agent running.
            </p>
          </div>
        )}

        {/* Subscription card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600/20 flex items-center justify-center text-indigo-400 font-bold text-sm">
              {tierLabel[0]}
            </div>
            <div>
              <p className="font-semibold text-white text-sm">{tierLabel} plan</p>
              <p className="text-slate-500 text-xs mt-0.5 capitalize">
                {data.subscriptionStatus === "inactive"
                  ? "No active subscription"
                  : data.subscriptionStatus}
              </p>
            </div>
          </div>
          {data.subscriptionTier !== "max" && (
            <Link
              href="/billing"
              className="text-xs font-semibold text-indigo-400 border border-indigo-600/30 px-3 py-1.5 rounded-lg hover:bg-indigo-600/10 transition-colors"
            >
              {data.subscriptionTier ? "Upgrade plan" : "Choose a plan"}
            </Link>
          )}
        </div>

        {/* Connected channels */}
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4">
          Connected channels
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          <ChannelCard
            name="Telegram"
            icon="✈️"
            status={hasTelegramConnected ? "connected" : "disconnected"}
            detail={
              hasTelegramConnected
                ? `Chat ID: ${data.telegramChatId}`
                : "Not connected yet"
            }
            action={
              !hasTelegramConnected && telegramDeepLink
                ? { label: "Connect", href: telegramDeepLink }
                : undefined
            }
          />
          <ChannelCard
            name="WhatsApp"
            icon="💬"
            status="disconnected"
            detail="Coming soon"
          />
        </div>

        {/* Usage stats */}
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4">
          This month
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <StatCard label="Tasks completed" value={String(data.tasksThisMonth)} />
          <StatCard
            label="Tokens used"
            value={
              data.tokensThisMonth >= 1000
                ? `${(data.tokensThisMonth / 1000).toFixed(1)}k`
                : String(data.tokensThisMonth)
            }
          />
          <StatCard label="Memory entries" value={String(data.memoryEntries)} />
        </div>

        {/* Quick actions */}
        {isAgentOnline && telegramDeepLink && hasTelegramConnected && (
          <div className="mb-10">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4">
              Quick actions
            </h2>
            <a
              href={`https://t.me/${telegramBotUsername}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 transition-colors text-white font-semibold text-sm px-5 py-2.5 rounded-xl"
            >
              ✈️ Talk to your agent on Telegram
            </a>
          </div>
        )}

        {/* Agent settings */}
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4">
          Agent settings
        </h2>
        <div className="bg-slate-900 border border-slate-800 rounded-xl divide-y divide-slate-800">
          <ConfigRow label="Persona name" value="Assistant" action="Edit" />
          <ConfigRow label="Primary language" value="English" action="Change" />
          <ConfigRow label="Custom instructions" value="Not set" action="Add" />
          <ConfigRow label="Web search" value="Enabled" action="Configure" />
        </div>
      </main>
    </div>
  );
}

// ── Components ─────────────────────────────────────────────────────────────

function AgentStatusBadge({ status }: { status: AgentStatus | null }) {
  if (status === "running") {
    return (
      <div className="flex items-center gap-2 bg-green-950 border border-green-800 px-3 py-1.5 rounded-full">
        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        <span className="text-sm text-green-400 font-medium">Agent online</span>
      </div>
    );
  }
  if (status === "provisioning" || !status) {
    return (
      <div className="flex items-center gap-2 bg-amber-950/60 border border-amber-800/50 px-3 py-1.5 rounded-full">
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
        <span className="text-sm text-amber-400 font-medium">Setting up</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-full">
      <span className="w-2 h-2 rounded-full bg-slate-500" />
      <span className="text-sm text-slate-400 font-medium">Agent offline</span>
    </div>
  );
}

function ChannelCard({
  name,
  icon,
  status,
  detail,
  action,
}: {
  name: string;
  icon: string;
  status: "connected" | "disconnected";
  detail: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-center gap-4">
      <span className="text-2xl">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-white text-sm">{name}</p>
        <p className="text-xs text-slate-500 mt-0.5 truncate">{detail}</p>
      </div>
      {action ? (
        <a
          href={action.href}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-950 text-indigo-400 border border-indigo-800 hover:bg-indigo-900 transition-colors"
        >
          {action.label}
        </a>
      ) : (
        <span
          className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${
            status === "connected"
              ? "bg-green-950 text-green-400 border border-green-800"
              : "bg-slate-800 text-slate-400 border border-slate-700"
          }`}
        >
          {status === "connected" ? "Connected" : "Not set up"}
        </span>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-slate-500 mt-1">{label}</p>
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
      <button className="text-xs text-indigo-400 font-semibold hover:text-indigo-300 transition-colors">
        {action}
      </button>
    </div>
  );
}
