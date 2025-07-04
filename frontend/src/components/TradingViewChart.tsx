// src/components/TradingViewChart.tsx
import React, { useEffect } from "react";

const TradingViewChart: React.FC<{ symbol: string }> = ({ symbol }) => {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;

    script.onload = () => {
      // @ts-ignore
      new window.TradingView.widget({
        autosize: true,
        symbol: symbol.replace("_", ""), 
        interval: "60",
        timezone: "Etc/UTC",
        theme: "dark",
        style: "1",
        locale: "en",
        container_id: "tradingview_container",
      });
    };

    document.body.appendChild(script);
  }, [symbol]);

  return <div id="tradingview_container" style={{ height: 500 }}></div>;
};

export default TradingViewChart;
