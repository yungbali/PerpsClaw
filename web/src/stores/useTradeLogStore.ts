import { create } from "zustand";

export interface TradeLogEntry {
  id: string;
  agentId: string;
  agentName: string;
  timestamp: number;
  direction: "long" | "short" | "close";
  size: number;
  price: number;
  reason: string;
}

interface TradeLogState {
  entries: TradeLogEntry[];
  addEntry: (entry: TradeLogEntry) => void;
}

const MAX_ENTRIES = 50;

export const useTradeLogStore = create<TradeLogState>((set, get) => ({
  entries: [],
  addEntry: (entry) => {
    const current = get().entries;
    const updated = [entry, ...current].slice(0, MAX_ENTRIES);
    set({ entries: updated });
  },
}));
