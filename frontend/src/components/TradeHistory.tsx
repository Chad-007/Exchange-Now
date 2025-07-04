import React from "react";

interface Trade {
  price: number;
  amount: number;
  side: string;
  timestamp: number;
}

interface Props {
  trades: Trade[];
}

const TradeHistory: React.FC<Props> = ({ trades }) => {
  return (
    <div>
      <h3>Trade History</h3>
      <ul>
        {trades.map((t, index) => (
          <li key={index} style={{ color: t.side === "buy" ? "green" : "red" }}>
            {(t.side || "unknown").toUpperCase()} {t.amount} @ ${t.price} ({new Date(t.timestamp).toLocaleTimeString()})
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TradeHistory;
