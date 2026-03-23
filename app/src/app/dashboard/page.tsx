import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

// Replace with your authOptions import once NextAuth is configured
// import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { onboarding?: string };
}) {
  // Server-side auth guard
  const session = await getServerSession(/* authOptions */);
  if (!session) redirect("/login");

  const isOnboarding = searchParams.onboarding === "true";

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Welcome back{/* , {session.user?.name} */}
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Your personal AI assistant is running.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
            <span className="text-sm text-slate-600">Agent online</span>
          </div>
        </div>

        {/* Onboarding banner */}
        {isOnboarding && (
          <div className="bg-brand-50 border border-brand-200 rounded-xl p-4 mb-6">
            <p className="font-medium text-brand-900">
              🎉 Your agent is being provisioned — takes ~30 seconds.
            </p>
            <p className="text-sm text-brand-700 mt-1">
              Connect it to Telegram or WhatsApp below to start chatting.
            </p>
          </div>
        )}

        {/* Channel cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
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

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Messages this month" value="142" />
          <StatCard label="Tasks completed" value="17" />
          <StatCard label="Memory entries" value="34" />
        </div>
      </div>
    </main>
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
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4">
      <span className="text-3xl">{icon}</span>
      <div className="flex-1">
        <p className="font-semibold text-slate-900">{name}</p>
        <p className="text-sm text-slate-500">{detail}</p>
      </div>
      <span
        className={`text-xs font-medium px-2.5 py-1 rounded-full ${
          status === "connected"
            ? "bg-green-50 text-green-700"
            : "bg-slate-100 text-slate-500"
        }`}
      >
        {status === "connected" ? "Connected" : "Set up"}
      </span>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-sm text-slate-500 mt-1">{label}</p>
    </div>
  );
}
