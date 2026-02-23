"use client";

import { useEffect, useState } from "react";
import { ReportCard } from "./ReportCard";

interface AgentReport {
  wallet: string;
  walletSol: number;
  driftCollateral: number;
  freeCollateral: number;
  position: string;
  positionSize: number;
  entryPrice: number;
  unrealizedPnl: number;
  error?: string;
}

interface MarketData {
  price: number | null;
  sma10: number | null;
  sma30: number | null;
  rsi14: number | null;
  bbUpper: number | null;
  bbMiddle: number | null;
  bbLower: number | null;
  trend: string;
  volatility: string;
}

export interface Report {
  timestamp: string;
  market: MarketData;
  agents: Record<string, AgentReport>;
}

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

export function ReportsFeed() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchReports() {
    try {
      const res = await fetch("/api/reports");
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setReports(data.reports);
        setError(null);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchReports();
    const interval = setInterval(fetchReports, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3 text-[var(--muted)]">
          <div className="w-2 h-2 rounded-full bg-[var(--muted)] animate-pulse" />
          <span className="font-['Syne'] font-semibold">
            Loading reports...
          </span>
        </div>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">📭</div>
        <h2 className="font-['Syne'] font-bold text-2xl text-[var(--foreground)] mb-2">
          No reports yet
        </h2>
        <p className="text-[var(--muted)]">
          The first report will appear within 2 hours. Agents are running.
        </p>
        {error && (
          <p className="text-sm text-[var(--red)] mt-4">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <span className="text-sm text-[var(--muted)]">
          {reports.length} report{reports.length !== 1 ? "s" : ""} — auto-refreshes every 5 min
        </span>
        <button
          onClick={fetchReports}
          className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
        >
          Refresh now
        </button>
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-[19px] top-4 bottom-4 w-px bg-[var(--border)]" />

        <div className="space-y-8">
          {reports.map((report, i) => (
            <ReportCard key={report.timestamp} report={report} isLatest={i === 0} />
          ))}
        </div>
      </div>
    </div>
  );
}
