import { logger } from "./logger.js";

export interface TradeNotification {
  agentName: string;
  agentEmoji: string;
  action: "LONG" | "SHORT" | "CLOSE";
  size: number;
  price: number;
  reason: string;
  unrealizedPnl: number;
  dailyPnl: number;
}

const AGENT_COLORS: Record<string, number> = {
  Shark: 0xff4444, // Red
  Wolf: 0x6644ff, // Purple
  Grid: 0x00ffaa, // Green
};

const AGENT_EMOJIS: Record<string, string> = {
  Shark: "🦈",
  Wolf: "🐺",
  Grid: "📊",
};

export function getAgentEmoji(name: string): string {
  return AGENT_EMOJIS[name] || "🤖";
}

export async function sendTradeNotification(
  notification: TradeNotification
): Promise<void> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

  if (!webhookUrl) {
    return; // Silently skip if no webhook configured
  }

  const { agentName, agentEmoji, action, size, price, reason, unrealizedPnl, dailyPnl } =
    notification;

  const color = AGENT_COLORS[agentName] || 0x888888;
  const actionText =
    action === "CLOSE" ? "closed position" : `opened ${action}`;

  const pnlEmoji = dailyPnl >= 0 ? "📈" : "📉";

  const embed = {
    title: `${agentEmoji} ${agentName.toUpperCase()} ${actionText}`,
    color,
    fields: [
      { name: "Size", value: `${size.toFixed(4)} SOL`, inline: true },
      { name: "Price", value: `$${price.toFixed(2)}`, inline: true },
      { name: "Daily PnL", value: `${pnlEmoji} $${dailyPnl.toFixed(2)}`, inline: true },
      { name: "Reason", value: reason, inline: false },
    ],
    footer: { text: "perpsclaw.com" },
    timestamp: new Date().toISOString(),
  };

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [embed] }),
    });

    if (!response.ok) {
      logger.warn(`Webhook failed: ${response.status}`);
    }
  } catch (err) {
    logger.warn(`Webhook error: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export async function sendDailySummary(
  agents: Array<{ name: string; pnl: number; trades: number }>
): Promise<void> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

  if (!webhookUrl) {
    return;
  }

  const totalPnl = agents.reduce((sum, a) => sum + a.pnl, 0);
  const totalTrades = agents.reduce((sum, a) => sum + a.trades, 0);

  const leaderboard = agents
    .sort((a, b) => b.pnl - a.pnl)
    .map((a, i) => {
      const emoji = getAgentEmoji(a.name);
      const medal = i === 0 ? "👑" : "";
      const pnlStr = a.pnl >= 0 ? `+$${a.pnl.toFixed(2)}` : `-$${Math.abs(a.pnl).toFixed(2)}`;
      return `${medal}${emoji} **${a.name}**: ${pnlStr} (${a.trades} trades)`;
    })
    .join("\n");

  const embed = {
    title: "📊 Daily Summary",
    color: totalPnl >= 0 ? 0x00ff00 : 0xff0000,
    description: leaderboard,
    fields: [
      { name: "Total PnL", value: `$${totalPnl.toFixed(2)}`, inline: true },
      { name: "Total Trades", value: `${totalTrades}`, inline: true },
    ],
    footer: { text: "perpsclaw.com" },
    timestamp: new Date().toISOString(),
  };

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [embed] }),
    });
  } catch (err) {
    logger.warn(`Daily summary webhook error: ${err instanceof Error ? err.message : String(err)}`);
  }
}
