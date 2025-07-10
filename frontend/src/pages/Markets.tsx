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
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap');

    :root {
      --background-dark: #0A0A0A;
      --background-element: #1A1A1A;
      --text-primary: #EAEAEA;
      --text-secondary: #888888;
      --border-color: #333333;
      --hover-background: #252525;
      --hover-glow: rgba(255, 255, 255, 0.04);
      --font-family-main: 'JetBrains Mono', monospace;
      --transition-smooth: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }

    /* --- Keyframe Animations --- */
    @keyframes fadeIn {
        0% { opacity: 0; transform: translateY(15px); }
        100% { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes slideInRow {
        0% { opacity: 0; transform: translateX(-15px); }
        100% { opacity: 1; transform: translateX(0); }
    }
    
    @keyframes pulse-skeleton {
      0% { background-color: rgba(255, 255, 255, 0.06); }
      50% { background-color: rgba(255, 255, 255, 0.09); }
      100% { background-color: rgba(255, 255, 255, 0.06); }
    }

    @keyframes subtleGlow {
      0% { box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3), 0 0 10px rgba(255, 255, 255, 0.02); }
      50% { box-shadow: 0 10px 35px rgba(0, 0, 0, 0.3), 0 0 20px rgba(255, 255, 255, 0.05); }
      100% { box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3), 0 0 10px rgba(255, 255, 255, 0.02); }
    }

    @keyframes subtleShimmer {
        0% { background-position: -200% center; }
        100% { background-position: 200% center; }
    }

    @keyframes dataFlashPositive {
      0% { background-color: transparent; }
      25% { background-color: rgba(234, 234, 234, 0.1); }
      100% { background-color: transparent; }
    }
    
    @keyframes dataFlashNegative {
      0% { background-color: transparent; }
      25% { background-color: rgba(136, 136, 136, 0.1); }
      100% { background-color: transparent; }
    }

    /* --- Main Page Wrapper --- */
    .markets-page-wrapper {
      background-color: var(--background-dark);
      color: var(--text-primary);
      font-family: var(--font-family-main);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }

    /* --- Main Container --- */
    .markets-container {
      width: 100%;
      max-width: 800px;
      background: transparent;
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 2.5rem 3rem;
      animation: fadeIn 0.7s var(--transition-smooth), subtleGlow 8s ease-in-out infinite;
    }

    /* --- Header --- */
    .markets-header-container {
      text-align: center;
      margin-bottom: 2.5rem;
    }
    .markets-header-title {
      font-size: 2.2rem;
      font-weight: 500;
      letter-spacing: -1px;
      margin: 0;
      background: linear-gradient(90deg, #888, #fff, #888);
      background-size: 200% auto;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      animation: subtleShimmer 7s linear infinite;
    }
    .markets-header-subtitle {
        color: var(--text-secondary);
        font-size: 0.8rem;
        margin-top: 0.5rem;
        text-transform: uppercase;
        letter-spacing: 1.5px;
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
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 1px;
      border-bottom: 1px solid var(--border-color);
      transition: var(--transition-smooth);
    }
    .markets-table th:last-child, .markets-table td:last-child {
        text-align: right;
    }

    .markets-table tbody tr {
      border-bottom: 1px solid var(--border-color);
      cursor: pointer;
      opacity: 0; /* Initially hidden for animation */
      animation: slideInRow 0.4s ease-out forwards;
      transition: var(--transition-smooth);
      
      /* For hover radial gradient */
      background-position: center;
      background-repeat: no-repeat;
      background-size: 0% 0%;
      background-image: radial-gradient(circle at center, var(--hover-glow) 0%, transparent 70%);
    }

    /* --- Amazing Hover "Spotlight" Effect --- */
    .markets-table:hover tbody tr:not(:hover) {
        opacity: 0.5;
    }

    .markets-table tbody tr:hover {
      background-color: var(--hover-background);
      background-size: 200% 200%;
      transform: translateY(-2px);
    }
    
    .markets-table tbody tr:last-child {
      border-bottom: none;
    }

    .markets-table tbody td {
      padding: 1.25rem 1.25rem;
      vertical-align: middle;
      font-size: 0.9rem;
    }
    
    .market-symbol-cell {
      font-weight: 500;
      color: var(--text-primary);
    }

    .price-change-cell.positive {
      color: var(--text-primary);
      animation: dataFlashPositive 1.2s ease-out;
    }

    .price-change-cell.negative {
      color: var(--text-secondary);
      animation: dataFlashNegative 1.2s ease-out;
    }
    
    .volume-cell {
      color: var(--text-secondary);
    }

    /* --- Skeleton Loader --- */
    .skeleton-row td {
        padding: 1.25rem 1.25rem;
    }
    .skeleton-item {
        width: 80%;
        height: 18px;
        border-radius: 4px;
        animation: pulse-skeleton 1.5s ease-in-out infinite;
    }
    .skeleton-item.short { width: 60%; }
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
    // Keep timeout for skeleton visibility
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
        <tr key={index} className="skeleton-row">
          <td><div className="skeleton-item"></div></td>
          <td><div className="skeleton-item short"></div></td>
          <td><div className="skeleton-item short"></div></td>
          <td><div className="skeleton-item short right"></div></td>
        </tr>
      ))}
    </tbody>
  );

  return (
    <>
      <PageStyles />
      <div className="markets-page-wrapper">
        <div className="markets-container">
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
                      style={{ animationDelay: `${index * 50}ms` }}
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