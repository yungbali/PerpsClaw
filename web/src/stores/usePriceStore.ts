import { create } from "zustand";

export interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface PriceData {
  price: number;
  confidence: number;
  timestamp: number;
  change24h: number;
  changePct24h: number;
}

interface PriceState {
  price: PriceData | null;
  candles: CandleData[];
  setPrice: (data: PriceData) => void;
  addCandle: (candle: CandleData) => void;
  setCandles: (candles: CandleData[]) => void;
}

export const usePriceStore = create<PriceState>((set, get) => ({
  price: null,
  candles: [],
  setPrice: (data) => set({ price: data }),
  addCandle: (candle) => {
    const existing = get().candles;
    const last = existing[existing.length - 1];
    if (last && last.time === candle.time) {
      const updated = [...existing];
      updated[updated.length - 1] = candle;
      set({ candles: updated });
    } else {
      set({ candles: [...existing, candle] });
    }
  },
  setCandles: (candles) => set({ candles }),
}));
