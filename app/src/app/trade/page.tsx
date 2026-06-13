import TopNav from "@/components/trading/TopNav";
import TradePage from "./TradePage";

async function fetchBtcPrice(): Promise<number | null> {
  try {
    const res = await fetch("http://localhost:4000/api/trading/price/BTC", {
      next: { revalidate: 30 },
    });
    if (!res.ok) return null;
    const d = await res.json();
    return typeof d.price === "number" ? d.price : null;
  } catch {
    return null;
  }
}

export default async function TradePageRoute() {
  const btcPrice = await fetchBtcPrice();

  return (
    <div className="h-screen bg-slate-950 text-white flex flex-col overflow-hidden">
      <TopNav activePage="trade" btcPrice={btcPrice} />
      <TradePage />
    </div>
  );
}
