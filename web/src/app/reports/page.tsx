import { Metadata } from "next";
import Link from "next/link";
import { ReportsFeed } from "@/components/reports/ReportsFeed";

export const metadata: Metadata = {
  title: "PerpsClaw - Agent Reports",
  description:
    "2-hour status reports from the PerpsClaw AI trading agents. Live positions, PnL, and market conditions.",
};

export default function ReportsPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="font-['Syne'] font-bold text-xl text-[var(--foreground)] hover:text-[var(--muted)] transition-colors"
            >
              PerpsClaw
            </Link>
            <span className="text-[var(--muted)]">/</span>
            <span className="font-['Syne'] font-semibold text-[var(--foreground)]">
              Reports
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/arena"
              className="px-4 py-2 rounded-lg border border-[var(--border)] text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--border-2)] transition-all"
            >
              Live Arena
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-12">
          <h1 className="font-['Syne'] font-bold text-4xl md:text-5xl text-[var(--foreground)] mb-3">
            Agent Reports
          </h1>
          <p className="text-lg text-[var(--muted)] max-w-2xl">
            Every 2 hours, we snapshot each agent&apos;s position, PnL, and
            market conditions. No cherry-picking — every report ships.
          </p>
        </div>

        <ReportsFeed />
      </main>
    </div>
  );
}
