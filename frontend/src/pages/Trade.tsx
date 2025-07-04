import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { OrderBook as OrderBookComponent } from "../components/OrderBook";
import TradeHistory from "../components/TradeHistory";
import TradingViewChart from "../components/TradingViewChart";
import { connectSocket } from "../services/websocket";
import api from "../services/api";

interface Trade {
  price: number;
  amount: number;
  side: string;
  timestamp: number;
  symbol: string;
}

interface Order {
  price: number;
  amount: number;
}

interface OrderBook {
  bids: Order[];
  asks: Order[];
}

interface Ticker {
  symbol: string;
  lastPrice: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  priceChange: number;
}

const TradePage: React.FC = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const [prices, setPrices] = useState<number[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [orderBook, setOrderBook] = useState<OrderBook>({ bids: [], asks: [] });
  const [ticker, setTicker] = useState<Ticker | null>(null);

  const [orderPrice, setOrderPrice] = useState("");
  const [orderAmount, setOrderAmount] = useState("");
  const [orderSide, setOrderSide] = useState<"buy" | "sell">("buy");

  useEffect(() => {
    if (!symbol) return;

    // fetch initial orderbook
    api
      .get(`/markets/${symbol}/orderbook`)
      .then((res) => setOrderBook(res.data))
      .catch(console.error);

    // fetch initial trades
    api
      .get(`/markets/${symbol}/trades`)
      .then((res) => setTrades(res.data))
      .catch(console.error);

    // fetch initial ticker
    api
      .get(`/markets/${symbol}/ticker`)
      .then((res) => setTicker(res.data))
      .catch(console.error);

    // socket subscribe
    connectSocket(
      symbol,
      (tradeData) => {
        setPrices((prev) => [...prev.slice(-19), tradeData.price]);
        setTrades((prev) => [tradeData, ...prev.slice(0, 19)]);
      },
      (orderBookData) => {
        setOrderBook(orderBookData);
      }
    );
  }, [symbol]);

  const handlePlaceOrder = async () => {
    if (!symbol) return;

    try {
      const response = await api.post("http://localhost:4002/api/orders", {
        symbol,
        price: parseFloat(orderPrice),
        amount: parseFloat(orderAmount),
        side: orderSide,
      });
      console.log("Order placed:", response.data);
      setOrderPrice("");
      setOrderAmount("");
    } catch (err) {
      console.error("Error placing order", err);
    }
  };

  return (
    <div>
      <h2>Trading {symbol}</h2>

      {/* Ticker details */}
      {ticker && (
        <div
          style={{
            display: "flex",
            gap: "2rem",
            marginBottom: "1rem",
            background: "#222",
            color: "#fff",
            padding: "1rem",
            borderRadius: "8px",
          }}
        >
          <div>
            <strong>Last Price:</strong> ${ticker.lastPrice.toFixed(4)}
          </div>
          <div>
            <strong>24h High:</strong> ${ticker.high24h.toFixed(4)}
          </div>
          <div>
            <strong>24h Low:</strong> ${ticker.low24h.toFixed(4)}
          </div>
          <div>
            <strong>24h Volume:</strong> {ticker.volume24h.toFixed(2)}
          </div>
          <div>
            <strong>24h Change:</strong>{" "}
            <span style={{ color: ticker.priceChange >= 0 ? "green" : "red" }}>
              {ticker.priceChange.toFixed(2)}%
            </span>
          </div>
        </div>
      )}

      {/* TradingView Chart */}
      <TradingViewChart symbol={symbol || "SOLUSDC"} />

      {/* Orderbook */}
      <OrderBookComponent prices={prices} orderBook={orderBook} />

      {/* Trade History */}
      <TradeHistory trades={trades} />

      {/* simple order form */}
      <div style={{ marginTop: "2rem" }}>
        <h3>Place Order</h3>
        <div>
          <label>
            Price:
            <input
              value={orderPrice}
              onChange={(e) => setOrderPrice(e.target.value)}
              type="number"
            />
          </label>
        </div>
        <div>
          <label>
            Amount:
            <input
              value={orderAmount}
              onChange={(e) => setOrderAmount(e.target.value)}
              type="number"
            />
          </label>
        </div>
        <div>
          <label>
            Side:
            <select
              value={orderSide}
              onChange={(e) => setOrderSide(e.target.value as "buy" | "sell")}
            >
              <option value="buy">Buy</option>
              <option value="sell">Sell</option>
            </select>
          </label>
        </div>
        <button onClick={handlePlaceOrder}>Submit Order</button>
      </div>
    </div>
  );
};

export default TradePage;
