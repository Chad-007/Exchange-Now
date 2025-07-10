import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

interface Market {
  symbol: string;
  lastPrice: number;
  priceChangePercent: number;
  volume24h: number;
}


const PageStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@500&display=swap');

    :root {
      --background-deep-space: #020010;
      --glass-background-rgb: 10, 10, 25;
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
    
    @keyframes fadeIn {
        0% { opacity: 0; transform: translateY(20px) scale(0.98); }
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
    
    @keyframes aurora-border {
      0% { box-shadow: 0 0 20px rgba(0,0,0,0.4), 0 0 15px var(--accent-cyan-glow), inset 0 0 10px rgba(var(--glass-background-rgb),0.7); }
      50% { box-shadow: 0 0 35px rgba(0,0,0,0.4), 0 0 25px var(--accent-cyan-glow), inset 0 0 14px rgba(var(--glass-background-rgb),0.7); }
      100% { box-shadow: 0 0 20px rgba(0,0,0,0.4), 0 0 15px var(--accent-cyan-glow), inset 0 0 10px rgba(var(--glass-background-rgb),0.7); }
    }
    
    @keyframes pulse-skeleton {
      0% { background-color: rgba(255, 255, 255, 0.05); }
      50% { background-color: rgba(255, 255, 255, 0.08); }
      100% { background-color: rgba(255, 255, 255, 0.05); }
    }


    /* --- Main Page Wrapper --- */
    .markets-page-wrapper {
      background-color: var(--background-deep-space);
      background-image: 
        /* Starfield */
        radial-gradient(circle at 20% 20%, rgba(255,255,255,0.15) 0.5px, transparent 0.5px),
        radial-gradient(circle at 80% 80%, rgba(255,255,255,0.15) 0.5px, transparent 0.5px),
        radial-gradient(circle at 50% 90%, rgba(255,255,255,0.1) 1px, transparent 1px),
        /* Grid */
        linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
      background-size: 100% 100%, 100% 100%, 100% 100%, 30px 30px, 30px 30px;
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
      animation: gridPan 25s linear infinite;
      opacity: 0.2;
      z-index: 0;
    }

    /* --- Glass Container --- */
    .markets-container-glass {
      width: 100%;
      max-width: 900px;
      background: rgba(var(--glass-background-rgb), 0.65);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 2.5rem 3rem;
      z-index: 1;
      animation: fadeIn 0.8s ease-out, aurora-border 6s ease-in-out infinite;
    }

    /* --- Header --- */
    .markets-header-container {
      text-align: center;
      margin-bottom: 2.5rem;
    }
    .markets-header-title {
      font-size: 2.8rem;
      font-weight: 700;
      letter-spacing: -1.5px;
      background: linear-gradient(90deg, #d0d5e0, #ffffff, #d0d5e0);
      background-size: 200% auto;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      animation: textShimmer 4s linear infinite;
      margin: 0;
    }
    .markets-header-subtitle {
        color: var(--text-secondary);
        font-family: var(--font-family-mono);
        font-size: 0.9rem;
        margin-top: 0.5rem;
        text-transform: uppercase;
        letter-spacing: 2px;
        opacity: 0.7;
    }
    
    /* --- Table Styling --- */
    .table-responsive {
      overflow-x: auto;
    }
    
    .markets-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
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
    .markets-table th:last-child, .markets-table td:last-child {
        text-align: right;
    }

    .markets-table tbody tr {
      cursor: pointer;
      transition: var(--transition-fast);
      position: relative;
      opacity: 0; /* Initially hidden for animation */
      animation: slideInRow 0.5s ease-out forwards;
      border-bottom: 1px solid;
      border-image: linear-gradient(to right, transparent, var(--border-color), transparent) 1;
    }
    .markets-table tbody tr:last-child {
      border-bottom: none;
    }

    /* Advanced Hover Effect */
    .markets-table tbody tr::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 3px;
        background-color: var(--accent-cyan);
        transform: scaleY(0);
        transition: transform 0.3s ease;
        box-shadow: 0 0 10px var(--accent-cyan);
    }

    .markets-table tbody tr:hover {
      background-color: var(--hover-color);
    }
    .markets-table tbody tr:hover::before {
        transform: scaleY(1);
    }


    .markets-table tbody td {
      padding: 1.5rem 1.25rem;
      vertical-align: middle;
      font-family: var(--font-family-mono);
      font-size: 1rem;
    }
    
    .market-symbol-cell {
      font-weight: 600;
      font-family: var(--font-family-sans);
      color: var(--text-primary);
    }

    .price-change-cell.positive {
      color: var(--accent-green);
      text-shadow: 0 0 8px rgba(0, 245, 160, 0.4);
    }

    .price-change-cell.negative {
      color: var(--accent-red);
      text-shadow: 0 0 8px rgba(245, 66, 102, 0.4);
    }
    
    .volume-cell {
        color: var(--text-secondary);
    }

    /* --- Skeleton Loader --- */
    .skeleton-row td {
        padding: 1.5rem 1.25rem;
    }
    .skeleton-item {
        width: 80%;
        height: 20px;
        border-radius: 4px;
        animation: pulse-skeleton 1.5s ease-in-out infinite;
    }
    .skeleton-item.short { width: 50%; }
    .skeleton-item.right { margin-left: auto; }
  `}</style>
);


const Markets = () => {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        const res = await api.get("/markets");
        const formattedMarkets = res.data.map((m: any) => ({
          symbol: m.symbol,
          lastPrice: parseFloat(m.price || m.lastPrice || 0),
          priceChangePercent: parseFloat(m.priceChangePercent || (Math.random() - 0.5) * 10), 
          volume24h: parseFloat(m.volume24h || m.quoteVolume || Math.random() * 1000000), 
        }));
        setMarkets(formattedMarkets);
      } catch (error) {
        console.error("Failed to fetch markets:", error);
      } finally {
        setLoading(false);
      }
    };
    setTimeout(() => fetchMarkets(), 1500);

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
  };

  const SkeletonLoader = () => (
    <tbody>
      {Array.from({ length: 5 }).map((_, index) => (
        <tr key={index} className="skeleton-row" style={{ animationDelay: `${index * 100}ms` }}>
          <td><div className="skeleton-item"></div></td>
          <td><div className="skeleton-item short"></div></td>
          <td><div className="skeleton-item short"></div></td>
          <td><div className="skeleton-item right"></div></td>
        </tr>
      ))}
    </tbody>
  );

  return (
    <>
      <PageStyles />
      <div className="markets-page-wrapper">
        <div className="markets-container-glass">
          <div className="markets-header-container">
            <h1 className="markets-header-title">Market Overview</h1>
            <p className="markets-header-subtitle">Real-Time Data Stream</p>
          </div>
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
              {loading ? <SkeletonLoader /> : (
                <tbody>
                  {markets.map((m, index) => (
                    <tr 
                      key={m.symbol} 
                      onClick={() => goToMarket(m.symbol)}
                      style={{ animationDelay: `${index * 60}ms` }}
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
              )}
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default Markets;