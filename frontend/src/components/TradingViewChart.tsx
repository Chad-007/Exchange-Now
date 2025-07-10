import React, { useEffect, useRef, useState } from "react";
import {
  createChart,
  ColorType,
  CrosshairMode,
  UTCTimestamp,
  CandlestickData,
  IChartApi,
  ISeriesApi,
} from "lightweight-charts";
import { TrendingUp, TrendingDown, Activity, AlertCircle } from "lucide-react";

interface TradingViewChartProps {
  symbol: string;
}

const TradingViewChart: React.FC<TradingViewChartProps> = ({ symbol }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastPrice, setLastPrice] = useState<number | null>(null);
  const [priceChange, setPriceChange] = useState<number | null>(null);
  const [priceChangePercent, setPriceChangePercent] = useState<number | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#0a0a0a" },
        textColor: "#e5e7eb",
      },
      grid: {
        vertLines: { 
          color: "#1f2937",
          style: 1,
          visible: true,
        },
        horzLines: { 
          color: "#1f2937",
          style: 1,
          visible: true,
        },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: "#6366f1",
          width: 1,
          style: 2,
          labelBackgroundColor: "#6366f1",
        },
        horzLine: {
          color: "#6366f1",
          width: 1,
          style: 2,
          labelBackgroundColor: "#6366f1",
        },
      },
      timeScale: { 
        timeVisible: true, 
        secondsVisible: false,
        borderColor: "#374151",
        ticksVisible: true,
      },
      rightPriceScale: {
        borderColor: "#374151",
        ticksVisible: true,
      },
      width: chartContainerRef.current.clientWidth,
      height: 500,
    });

    chartRef.current = chart;

    const candleSeries = chart.addCandlestickSeries({
      upColor: "#10b981",
      downColor: "#ef4444",
      borderDownColor: "#dc2626",
      borderUpColor: "#059669",
      wickDownColor: "#dc2626",
      wickUpColor: "#059669",
    });
    candleSeriesRef.current = candleSeries;
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);
    // need to fix this not fully confident
    let previousData: CandlestickData[] = [];
async function loadCandles() {
  try {
    setError(null);
    const res = await fetch(`http://64.225.86.126/api-gate/api/markets/${symbol}/candles`);

    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) throw new Error("No data received");

    const formatted: CandlestickData[] = data.map((candle: {
      time: number;
      open: number;
      high: number;
      low: number;
      close: number;
    }) => ({
      time: (candle.time / 1000) as UTCTimestamp,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
    }));

    const latest = formatted[formatted.length - 1];
    const previous = formatted[formatted.length - 2];

    if (candleSeriesRef.current) {
      if (previousData.length === 0) {
        candleSeriesRef.current.setData(formatted);
        previousData = formatted;
      } else {
        const lastKnown = previousData[previousData.length - 1];
        if (latest.time > lastKnown.time) {
          candleSeriesRef.current.update(latest);
          previousData.push(latest);
        } else if (latest.time === lastKnown.time) {
          candleSeriesRef.current.update(latest);
          previousData[previousData.length - 1] = latest;
        }
      }
    }

    if (latest && previous) {
      const change = latest.close - previous.close;
      const changePercent = (change / previous.close) * 100;
      setLastPrice(latest.close);
      setPriceChange(change);
      setPriceChangePercent(changePercent);
    }

    setIsLoading(false);
  } catch (err) {
    console.error("Error fetching candles", err);
    setError(err instanceof Error ? err.message : "Failed to fetch data");
    setIsLoading(false);
  }
}

    loadCandles(); 
    const interval = setInterval(loadCandles, 5000); 
    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [symbol]);

  const formatPrice = (price: number) => {
    return price.toLocaleString(undefined, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 6 
    });
  };

  const formatChange = (change: number) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}`;
  };

  const formatPercent = (percent: number) => {
    const sign = percent >= 0 ? '+' : '';
    return `${sign}${percent.toFixed(2)}%`;
  };

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden shadow-2xl">
      {}
      <div className="bg-gray-800 px-6 py-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-indigo-400" />
              <h2 className="text-xl font-semibold text-white tracking-tight">
                {symbol.toUpperCase()}
              </h2>
            </div>
            
            {lastPrice && (
              <div className="flex items-center space-x-3">
                <span className="text-2xl font-bold text-white">
                  ${formatPrice(lastPrice)}
                </span>
                
                {priceChange !== null && priceChangePercent !== null && (
                  <div className={`flex items-center space-x-1 px-2 py-1 rounded-md ${
                    priceChange >= 0 
                      ? 'bg-emerald-500/20 text-emerald-400' 
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {priceChange >= 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    <span className="text-sm font-medium">
                      {formatChange(priceChange)} ({formatPercent(priceChangePercent)})
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <div className="h-2 w-2 bg-emerald-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-400">Live</span>
            </div>
          </div>
        </div>
      </div>

      {}
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
              <span className="text-gray-300">Loading chart data...</span>
            </div>
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
              <p className="text-red-400 text-lg font-medium mb-2">Error loading chart</p>
              <p className="text-gray-400 text-sm">{error}</p>
            </div>
          </div>
        )}
        
        <div
          ref={chartContainerRef}
          className="w-full h-[500px] bg-gray-900"
        />
      </div>
      
      {}
      <div className="bg-gray-800 px-6 py-3 border-t border-gray-700">
        <div className="flex items-center justify-between text-sm text-gray-400">
          <div className="flex items-center space-x-4">
            <span>Timeframe: 5m</span>
            <span>•</span>
            <span>Auto-refresh: 5s</span>
          </div>
          <div className="flex items-center space-x-1">
            <span>Powered by</span>
            <span className="text-indigo-400 font-medium">TradingView</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradingViewChart;