import { PYTH_HERMES_URL } from "@/config/rpc";
import { SOL_PYTH_FEED_ID } from "@/config/markets";

export interface PythPrice {
  price: number;
  confidence: number;
  expo: number;
  publishTime: number;
}

export async function fetchSolPrice(): Promise<PythPrice> {
  const url = `${PYTH_HERMES_URL}/v2/updates/price/latest?ids[]=${SOL_PYTH_FEED_ID}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Pyth fetch failed: ${res.status}`);

  const data = await res.json();
  const parsed = data.parsed?.[0];
  if (!parsed?.price) throw new Error("No price data");

  return {
    price: Number(parsed.price.price) * Math.pow(10, parsed.price.expo),
    confidence: Number(parsed.price.conf) * Math.pow(10, parsed.price.expo),
    expo: parsed.price.expo,
    publishTime: parsed.price.publish_time,
  };
}

export type PythWsCallback = (price: PythPrice) => void;

export class PythWebSocketClient {
  private ws: WebSocket | null = null;
  private callback: PythWsCallback;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(callback: PythWsCallback) {
    this.callback = callback;
  }

  connect() {
    const wsUrl = PYTH_HERMES_URL.replace("https", "wss") + "/ws";
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      this.ws?.send(
        JSON.stringify({
          type: "subscribe",
          ids: [SOL_PYTH_FEED_ID],
        })
      );
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "price_update" && data.price_feed) {
          const feed = data.price_feed;
          if (feed.price) {
            this.callback({
              price:
                Number(feed.price.price) * Math.pow(10, feed.price.expo),
              confidence:
                Number(feed.price.conf) * Math.pow(10, feed.price.expo),
              expo: feed.price.expo,
              publishTime: feed.price.publish_time,
            });
          }
        }
      } catch {
        // Ignore malformed messages
      }
    };

    this.ws.onclose = () => this.scheduleReconnect();
    this.ws.onerror = () => this.ws?.close();
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 3000);
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.ws?.close();
    this.ws = null;
  }
}
