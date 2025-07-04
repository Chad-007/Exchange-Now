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

    :root {
      --background-deep-space: #0a0a0f;
      --glass-background-rgb: 23, 23, 31; /* For RGBA */
      --border-color: rgba(255, 255, 255, 0.1);
      --text-primary: #f0f0f5;
      --text-secondary: #a0a0b0;
      --accent-green: #00f5a0;
      --accent-red: #f54266;
      --hover-color: rgba(255, 255, 255, 0.05);
      --font-family: 'Inter', sans-serif;
    }

    @keyframes drift {
      0% { transform: translate(-50%, -50%) rotate(0deg); }
      100% { transform: translate(-50%, -50%) rotate(360deg); }
    }

    .markets-page-wrapper {
      background-color: var(--background-deep-space);
      color: var(--text-primary);
      font-family: var(--font-family);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      overflow: hidden;
      position: relative;
    }

    /* Animated background blobs for the "mesmerizing" effect */
    .markets-page-wrapper::before,
    .markets-page-wrapper::after {
      content: '';
      position: absolute;
      width: 600px;
      height: 600px;
      border-radius: 50%;
      z-index: 0;
      animation: drift 70s infinite linear;
      opacity: 0.15;
    }

    .markets-page-wrapper::before {
      background: radial-gradient(circle, #7F00FF, transparent 60%);
      top: 10%;
      left: 10%;
    }

    .markets-page-wrapper::after {
      background: radial-gradient(circle, #0077ff, transparent 60%);
      bottom: 10%;
      right: 10%;
      animation-duration: 50s;
    }

    .markets-container-glass {
      width: 100%;
      max-width: 900px;
      background: rgba(var(--glass-background-rgb), 0.5);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px); /* For Safari */
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 2rem;
      z-index: 1;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    }

    .markets-header {
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: 2rem;
      text-align: center;
      letter-spacing: -1px;
    }

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
      padding: 1rem;
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid var(--border-color);
    }

    .markets-table tbody tr {
      cursor: pointer;
      transition: background-color 0.2s ease-in-out;
      border-bottom: 1px solid var(--border-color);
    }
    
    .markets-table tbody tr:last-child {
      border-bottom: none;
    }

    .markets-table tbody tr:hover {
      background-color: var(--hover-color);
    }

    .markets-table tbody td {
      padding: 1.25rem 1rem;
      vertical-align: middle;
    }
    
    .market-symbol-cell {
      font-weight: 600;
      font-size: 1.1rem;
    }

    .price-change-cell.positive {
      color: var(--accent-green);
    }

    .price-change-cell.negative {
      color: var(--accent-red);
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
          <h1 className="markets-header">Select a Market</h1>
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
                {markets.map((m) => (
                  <tr key={m.symbol} onClick={() => goToMarket(m.symbol)}>
                    <td className="market-symbol-cell">{m.symbol.replace("USDC", "/USDC")}</td>
                    <td>${m.lastPrice.toFixed(4)}</td>
                    <td className={`price-change-cell ${m.priceChangePercent >= 0 ? 'positive' : 'negative'}`}>
                      {m.priceChangePercent.toFixed(2)}%
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