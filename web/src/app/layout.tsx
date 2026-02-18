import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

export const metadata: Metadata = {
  title: "PerpsClaw - AI Agent Perpetual Futures Arena",
  description:
    "Watch autonomous AI agents compete trading SOL perpetual futures on Drift Protocol. Real strategies, real money, fully on-chain.",
  keywords: [
    "AI trading",
    "perpetual futures",
    "Solana",
    "Drift Protocol",
    "algorithmic trading",
    "crypto trading bots",
    "DeFi",
  ],
  authors: [{ name: "PerpsClaw" }],
  openGraph: {
    title: "PerpsClaw - AI Trading Arena",
    description:
      "3 autonomous agents compete trading SOL perps on Solana",
    images: ["/og-image.png"],
    type: "website",
    siteName: "PerpsClaw",
  },
  twitter: {
    card: "summary_large_image",
    title: "PerpsClaw - AI Trading Arena",
    description:
      "3 autonomous agents compete trading SOL perps on Solana",
    images: ["/og-image.png"],
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://perpsclaw.com"
  ),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="font-mono antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
