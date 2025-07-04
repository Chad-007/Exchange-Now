import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

interface Market {
  symbol: string;
  price: number;
}

const Markets = () => {
  const [markets, setMarkets] = useState<Market[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/markets")
      .then((res) => setMarkets(res.data))
      .catch(console.error);
  }, []);

  const goToMarket = (symbol: string) => {
    navigate(`/trade/${symbol}`);
  };

  return (
    <div>
      <h2>Markets</h2>
      <ul>
        {markets.map((m) => (
          <li key={m.symbol}>
            <button onClick={() => goToMarket(m.symbol)}>
              {m.symbol} @ ${m.price}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Markets;
