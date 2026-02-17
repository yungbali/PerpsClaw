"use client";

import { useEffect, useRef } from "react";
import { usePriceStore, CandleData } from "@/stores/usePriceStore";
import { fetchSolPrice, PythWebSocketClient } from "@/lib/prices/pyth";

const CANDLE_INTERVAL = 60;
const PRICE_THROTTLE_MS = 500;

function generateSyntheticCandles(currentPrice: number) {
  const candles: CandleData[] = [];
  const now = Math.floor(Date.now() / 1000);
  const candleCount = 200;
  let price = currentPrice * (1 - 0.02 * Math.random());

  for (let i = candleCount; i >= 0; i--) {
    const time = now - i * 900;
    const volatility = currentPrice * 0.003;
    const open = price;
    const close = open + (Math.random() - 0.48) * volatility * 2;
    const high = Math.max(open, close) + Math.random() * volatility;
    const low = Math.min(open, close) - Math.random() * volatility;
    candles.push({ time: time - (time % 900), open, high, low, close });
    price = close;
  }

  usePriceStore.getState().setCandles(candles);
}

export function usePrices() {
  const wsRef = useRef<PythWebSocketClient | null>(null);
  const lastPriceRef = useRef<number>(0);
  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    fetchSolPrice()
      .then((data) => {
        lastPriceRef.current = data.price;
        usePriceStore.getState().setPrice({
          price: data.price,
          confidence: data.confidence,
          timestamp: data.publishTime,
          change24h: 0,
          changePct24h: 0,
        });
        generateSyntheticCandles(data.price);
      })
      .catch((err) => {
        console.warn("Pyth REST failed, using fallback:", err);
        const fallbackPrice = 200;
        lastPriceRef.current = fallbackPrice;
        usePriceStore.getState().setPrice({
          price: fallbackPrice,
          confidence: 0,
          timestamp: Date.now() / 1000,
          change24h: 0,
          changePct24h: 0,
        });
        generateSyntheticCandles(fallbackPrice);
      });

    const ws = new PythWebSocketClient((data) => {
      const now = Date.now();
      if (now - lastUpdateRef.current < PRICE_THROTTLE_MS) return;
      lastUpdateRef.current = now;

      const prev = lastPriceRef.current || data.price;
      const change = data.price - prev;

      usePriceStore.getState().setPrice({
        price: data.price,
        confidence: data.confidence,
        timestamp: data.publishTime,
        change24h: change,
        changePct24h: prev > 0 ? (change / prev) * 100 : 0,
      });

      const ts = Math.floor(Date.now() / 1000);
      const candleTime = ts - (ts % CANDLE_INTERVAL);
      usePriceStore.getState().addCandle({
        time: candleTime,
        open: lastPriceRef.current || data.price,
        high: data.price,
        low: data.price,
        close: data.price,
      });

      lastPriceRef.current = data.price;
    });

    ws.connect();
    wsRef.current = ws;

    return () => {
      ws.disconnect();
      wsRef.current = null;
    };
  }, []);
}
