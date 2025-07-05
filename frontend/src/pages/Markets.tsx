import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

interface Market {
  symbol: string;
  lastPrice: number;
  priceChangePercent: number;
  volume24h: number;
}

// --- Futuristic UI Styles ---
const PageStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@500&display=swap');

    :root {
      --background-deep-space: #020010;
      --glass-background-rgb: 10, 10, 25; /* For RGBA */
      --border-color: rgba(0, 200, 255, 0.2);
      --text-primary: #e0e5f0;
      --text-secondary: #808a9d;
      --accent-green: #00f5a0;
      --accent-red: #f54266;
      --accent-cyan: #00c8ff;
      --accent-cyan-glow: rgba(0, 200, 255, 0.3);
      --hover-color: rgba(0, 200, 255, 0.07);
      --font-family-sans: 'Inter', sans-serif;
      --font-family-mono: 'Roboto Mono', monospace;
      --transition-fast: all 0.2s ease-in-out;
      --transition-medium: all 0.4s ease-in-out;
    }

    /* --- Keyframe Animations --- */
    @keyframes gridPan {
      0% { background-position: 0% 0%; }
      100% { background-position: 100% 100%; }
    }
    
    @keyframes fadeInFromBelow {
        0% { opacity: 0; transform: translateY(30px) scale(0.98); }
        100% { opacity: 1; transform: translateY(0) scale(1); }
    }

    @keyframes textShimmer {
        0% { background-position: -200% center; }
        100% { background-position: 200% center; }
    }
    
    @keyframes slideInRow {
        0% { opacity: 0; transform: translateX(-20px); }
        100% { opacity: 1; transform: translateX(0); }
    }

    @keyframes scanLine {
        0% { transform: translateX(-105%) skewX(-20deg); }
        100% { transform: translateX(105%) skewX(-20deg); }
    }

    /* --- Main Page Wrapper --- */
    .markets-page-wrapper {
      background-color: var(--background-deep-space);
      background-image: 
        radial-gradient(ellipse at center, rgba(10, 10, 25, 0) 0%, var(--background-deep-space) 70%),
        linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
      background-size: 100% 100%, 30px 30px, 30px 30px;
      color: var(--text-primary);
      font-family: var(--font-family-sans);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      overflow: hidden;
      position: relative;
    }

    /* Animated Grid Overlay */
    .markets-page-wrapper::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-image: 
        linear-gradient(var(--accent-cyan-glow) 1px, transparent 1px),
        linear-gradient(90deg, var(--accent-cyan-glow) 1px, transparent 1px);
      background-size: 60px 60px;
      animation: gridPan 20s linear infinite;
      opacity: 0.3;
      z-index: 0;
    }

    /* --- Glass Container --- */
    .markets-container-glass {
      width: 100%;
      max-width: 900px;
      background: rgba(var(--glass-background-rgb), 0.6);
      backdrop-filter: blur(15px);
      -webkit-backdrop-filter: blur(15px);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 2.5rem;
      z-index: 1;
      box-shadow: 0 0 50px rgba(0, 0, 0, 0.4), 0 0 20px var(--accent-cyan-glow);
      animation: fadeInFromBelow 0.8s ease-out;
    }

    /* --- Header --- */
    .markets-header {
      font-size: 3rem;
      font-weight: 700;
      margin-bottom: 2.5rem;
      text-align: center;
      letter-spacing: -1.5px;
      background: linear-gradient(90deg, #e0e5f0, #ffffff, #e0e5f0);
      background-size: 200% auto;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      animation: textShimmer 4s linear infinite;
    }
    
    /* --- Table Styling --- */
    .table-responsive {
      overflow-x: auto;
    }
    
    .markets-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }

    .markets-table thead th {
      color: var(--text-secondary);
      font-weight: 500;
      padding: 1rem 1.25rem;
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 1px;
      border-bottom: 1px solid var(--border-color);
    }

    .markets-table tbody tr {
      cursor: pointer;
      transition: var(--transition-fast);
      border-bottom: 1px solid var(--border-color);
      position: relative;
      overflow: hidden;
      opacity: 0; /* Initially hidden for animation */
      animation: slideInRow 0.5s ease-out forwards;
    }
    
    .markets-table tbody tr:last-child {
      border-bottom: none;
    }

    /* Advanced Hover Effect */
    .markets-table tbody tr:hover {
      background-color: var(--hover-color);
      transform: translateY(-3px);
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
    }

    /* The "Scan Line" */
    .markets-table tbody tr::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(0, 200, 255, 0.2), transparent);
      opacity: 0;
      transition: var(--transition-medium);
    }
    
    .markets-table tbody tr:hover::after {
      opacity: 1;
    }

    /* Click feedback */
    .markets-table tbody tr:active {
        transform: translateY(-1px) scale(0.99);
        transition-duration: 0.1s;
    }

    .markets-table tbody td {
      padding: 1.5rem 1.25rem;
      vertical-align: middle;
      font-family: var(--font-family-mono);
    }
    
    .market-symbol-cell {
      font-weight: 600;
      font-size: 1.1rem;
      font-family: var(--font-family-sans);
      color: var(--text-primary);
    }

    .price-change-cell {
        font-weight: 500;
    }
    
    .price-change-cell.positive {
      color: var(--accent-green);
      text-shadow: 0 0 8px rgba(0, 245, 160, 0.3);
    }

    .price-change-cell.negative {
      color: var(--accent-red);
      text-shadow: 0 0 8px rgba(245, 66, 102, 0.3);
    }
    
    .volume-cell {
        color: var(--text-secondary);
    }
  `}</style>
);

const Markets = () => {
  const [markets, setMarkets] = useState<Market[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/markets")
      .then((res) => {
        const formattedMarkets = res.data.map((m: any) => ({
          symbol: m.symbol,
          lastPrice: m.price || m.lastPrice || 0,
          priceChangePercent: m.priceChangePercent || (Math.random() - 0.5) * 10, 
          volume24h: m.volume24h || Math.random() * 1000000, 
        }));
        setMarkets(formattedMarkets);
      })
      .catch(console.error);
  }, []);

  const goToMarket = (symbol: string) => {
    navigate(`/trade/${symbol}`);
  };

  const formatVolume = (volume: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        notation: 'compact',
        maximumFractionDigits: 2
    }).format(volume);
  }

  return (
    <>
      <PageStyles />
      <div className="markets-page-wrapper">
        <div className="markets-container-glass">
          <h1 className="markets-header">Select Market</h1>
          <div className="table-responsive">
            <table className="markets-table">
              <thead>
                <tr>
                  <th>Market</th>
                  <th>Last Price</th>
                  <th>24h Change</th>
                  <th>24h Volume</th>
                </tr>
              </thead>
              <tbody>
                {markets.map((m, index) => (
                  <tr 
                    key={m.symbol} 
                    onClick={() => goToMarket(m.symbol)}
                    // Staggered animation delay for each row
                    style={{ animationDelay: `${index * 70}ms` }}
                  >
                    <td className="market-symbol-cell">{m.symbol.replace("USDC", "/USDC")}</td>
                    <td>${m.lastPrice.toFixed(4)}</td>
                    <td className={`price-change-cell ${m.priceChangePercent >= 0 ? 'positive' : 'negative'}`}>
                      {m.priceChangePercent >= 0 ? '+' : ''}{m.priceChangePercent.toFixed(2)}%
                    </td>
                    <td className="volume-cell">{formatVolume(m.volume24h)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default Markets;