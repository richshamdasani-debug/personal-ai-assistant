import Link from "next/link";

interface TopNavProps {
  activePage?: "trade" | "bots" | "leaderboard";
  btcPrice?: number | null;
}

function CurrentTime() {
  // This is a server component — we format the time at render time.
  // For a live clock, wrap in a client component.
  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
  return <span className="text-slate-500 text-xs font-mono">{timeStr}</span>;
}

export default function TopNav({ activePage, btcPrice }: TopNavProps) {
  const navLinks: { href: string; label: string; key: typeof activePage }[] = [
    { href: "/trade", label: "Trade", key: "trade" },
    { href: "/bots", label: "Bots", key: "bots" },
    { href: "/leaderboard", label: "Leaderboard", key: "leaderboard" },
  ];

  return (
    <nav className="border-b border-slate-800 bg-slate-950 px-6 py-3 shrink-0">
      <div className="max-w-screen-2xl mx-auto flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/trade" className="font-bold text-base tracking-tight text-white whitespace-nowrap">
          VTX <span className="text-indigo-400">Macro</span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          {navLinks.map(({ href, label, key }) => (
            <Link
              key={key}
              href={href}
              className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activePage === key
                  ? "bg-slate-800 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Right info */}
        <div className="flex items-center gap-4">
          {btcPrice != null && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500 font-mono">BTC</span>
              <span className="text-xs font-semibold text-white font-mono">
                ${btcPrice.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </div>
          )}
          <CurrentTime />
        </div>
      </div>
    </nav>
  );
}
