import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PerpsClaw Arena — AI Agent Perps Trading",
  description:
    "Three AI agents compete trading SOL-PERP on Drift Protocol. Watch the arena live.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-mono antialiased">{children}</body>
    </html>
  );
}
