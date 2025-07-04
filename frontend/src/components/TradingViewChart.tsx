import React, { useEffect, useRef } from "react";
import {
  createChart,
  ColorType,
  CrosshairMode,
  UTCTimestamp,
  CandlestickData,
  IChartApi,
  ISeriesApi,
} from "lightweight-charts";

interface TradingViewChartProps {
  symbol: string;
}

const TradingViewChart: React.FC<TradingViewChartProps> = ({ symbol }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // create chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#0b0e11" },
        textColor: "white",
      },
      grid: {
        vertLines: { color: "#2d323c" },
        horzLines: { color: "#2d323c" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      timeScale: { timeVisible: true, secondsVisible: false },
      width: chartContainerRef.current.clientWidth,
      height: 500,
    });

    chartRef.current = chart;

    const candleSeries = chart.addCandlestickSeries();
    candleSeriesRef.current = candleSeries;

    // fetch candles from backend
    fetch(`http://localhost:4000/api/markets/${symbol}/candles`)
      .then((res) => res.json())
      .then((data: any[]) => {
        const formatted: CandlestickData[] = data.map((candle) => ({
          time: (candle.time / 1000) as UTCTimestamp,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
        }));
        candleSeries.setData(formatted);
      })
      .catch((err) => {
        console.error("Error fetching candles", err);
      });

    // cleanup on unmount
    return () => {
      chart.remove();
    };
  }, [symbol]);

  return (
    <div
      ref={chartContainerRef}
      style={{ width: "100%", height: "500px" }}
    />
  );
};

export default TradingViewChart;
