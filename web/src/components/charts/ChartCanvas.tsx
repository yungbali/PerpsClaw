"use client";

import { useEffect, useRef } from "react";
import {
  createChart,
  ColorType,
  type IChartApi,
  type ISeriesApi,
  type Time,
} from "lightweight-charts";
import { CandleData } from "@/stores/usePriceStore";

interface ChartCanvasProps {
  candles: CandleData[];
}

export default function ChartCanvas({ candles }: ChartCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#3a4a5c",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10,
      },
      grid: {
        vertLines: { color: "rgba(26, 34, 51, 0.5)" },
        horzLines: { color: "rgba(26, 34, 51, 0.5)" },
      },
      crosshair: {
        vertLine: { color: "#232f40", width: 1, style: 2, labelBackgroundColor: "#151c24" },
        horzLine: { color: "#232f40", width: 1, style: 2, labelBackgroundColor: "#151c24" },
      },
      rightPriceScale: {
        borderColor: "#1a2233",
        scaleMargins: { top: 0.08, bottom: 0.08 },
      },
      timeScale: {
        borderColor: "#1a2233",
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const series = chart.addCandlestickSeries({
      upColor: "#00ff88",
      downColor: "#ff2e4c",
      borderUpColor: "#00ff88",
      borderDownColor: "#ff2e4c",
      wickUpColor: "#00ff8880",
      wickDownColor: "#ff2e4c80",
    });

    chartRef.current = chart;
    seriesRef.current = series;

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    const observer = new ResizeObserver(handleResize);
    observer.observe(containerRef.current);
    handleResize();

    return () => {
      observer.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (seriesRef.current && candles.length > 0) {
      const chartData = candles.map((c) => ({
        time: c.time as Time,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }));
      seriesRef.current.setData(chartData);
    }
  }, [candles]);

  return <div ref={containerRef} className="absolute inset-0" />;
}
