import React from "react";

interface Order {
  price: number;
  amount: number;
}

interface OrderBookProps {
  prices: number[];
  orderBook: {
    bids: Order[];
    asks: Order[];
  };
}

export const OrderBook: React.FC<OrderBookProps> = ({ prices, orderBook }) => {
  return (
    
    <div>
      <h3>Order Book</h3>
      <div style={{ display: "flex", gap: "40px" }}>
        <div>
          <h4>Bids</h4>
          <ul>
            {orderBook.bids.map((b, i) => (
              <li key={i}>
                {b.amount} @ ${b.price}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4>Asks</h4>
          <ul>
            {orderBook.asks.map((a, i) => (
              <li key={i}>
                {a.amount} @ ${a.price}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
