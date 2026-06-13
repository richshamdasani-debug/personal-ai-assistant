import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VTX Macro — AI Trading Platform",
  description:
    "LLM-powered Hyperliquid trading bots. Run AI agents that trade crypto 24/7.",
  openGraph: {
    title: "VTX Macro",
    description: "AI-powered trading bots on Hyperliquid.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-slate-950 text-white antialiased">
        {children}
      </body>
    </html>
  );
}
