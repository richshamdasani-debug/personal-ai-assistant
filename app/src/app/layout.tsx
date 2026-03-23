import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Personal AI Assistant — Your 24/7 AI Agent",
  description:
    "Get your own personal AI assistant running 24/7 on Telegram, WhatsApp, or the web. No setup required. Starting at $15/mo.",
  openGraph: {
    title: "Personal AI Assistant",
    description: "Your own AI agent, always on.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
