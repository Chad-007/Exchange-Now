import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
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

type OrderType = "limit" | "market";
type OrderSide = "buy" | "sell";

const PageStyles = () => (
  <style>{`
    :root {
      --background-primary: #0b0e11;
      --background-secondary: #171a21;
      --background-tertiary: #1f232b;
      --border-color: #2d323c;
      --text-primary: #e6edf3;
      --text-secondary: #848e9c;
      --text-tertiary: #5e6673;
      --accent-green: #0ecb81;
      --accent-red: #f6465d;
      --font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      --hover-background: rgba(31, 35, 43, 0.6);
    }

    /* Custom Scrollbar */
    ::-webkit-scrollbar {
        width: 6px;
        height: 6px;
    }
    ::-webkit-scrollbar-track {
        background: transparent;
    }
    ::-webkit-scrollbar-thumb {
        background: var(--text-tertiary);
        border-radius: 3px;
    }
    ::-webkit-scrollbar-thumb:hover {
        background: var(--text-secondary);
    }
    
    .trade-page-wrapper {
      background-color: var(--background-primary);
      color: var(--text-primary);
      font-family: var(--font-family);
      height: 100vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .ticker-bar {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      padding: 0.75rem 1.5rem;
      border-bottom: 1px solid var(--border-color);
      flex-shrink: 0;
    }
    .ticker-symbol { font-size: 1.25rem; font-weight: 700; }
    .ticker-item { font-size: 0.8rem; }
    .ticker-item strong { color: var(--text-secondary); margin-right: 0.5rem; font-weight: 500; }

    .main-layout-grid {
      display: grid;
      /* NEW LAYOUT: OrderForm | Chart + History | OrderBook */
      grid-template-columns: 320px 1fr 320px;
      grid-template-rows: 1fr;
      gap: 0.75rem;
      padding: 0.75rem;
      flex-grow: 1;
      overflow: hidden;
    }
    
    .left-column, .right-column {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      min-height: 0;
    }
    
    .center-column {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      min-height: 0;
    }

    .chart-container {
      flex-grow: 1;
      min-height: 250px; /* Ensure chart has a minimum height */
    }

    .trade-card {
      background-color: var(--background-secondary);
      border-radius: 4px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .card-header {
      font-size: 0.9rem;
      font-weight: 600;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--border-color);
      flex-shrink: 0;
    }
    
    /* Order Book */
    .order-book-container { flex-grow: 1; }
    .order-book-body { display: flex; flex-direction: column; flex-grow: 1; min-height: 0; }
    .order-book-header, .order-book-row {
      display: grid; grid-template-columns: 1fr 1fr 1fr;
      font-size: 0.75rem; padding: 2px 1rem;
    }
    .order-book-header { color: var(--text-secondary); padding: 0.5rem 1rem; }
    .order-book-row { position: relative; cursor: pointer; transition: background-color 0.1s ease; }
    .order-book-row:hover { background-color: var(--hover-background); }
    .price-col.ask { color: var(--accent-red); }
    .price-col.bid { color: var(--accent-green); }
    .amount-col, .total-col { text-align: right; }
    .depth-bar { position: absolute; top: 0; bottom: 0; opacity: 0.12; z-index: 0; }
    .depth-bar.ask { right: 0; background-color: var(--accent-red); }
    .depth-bar.bid { right: 0; background-color: var(--accent-green); }
    .order-book-spread {
      padding: 0.5rem; text-align: center; font-size: 1.1rem;
      font-weight: 600; border-top: 1px solid var(--border-color);
      border-bottom: 1px solid var(--border-color);
    }
    .asks-list, .bids-list { display: flex; flex-direction: column; overflow-y: auto; }
    .asks-list { flex-direction: column-reverse; }

    /* Trade History */
    .trade-history-container { height: 300px; /* Give a fixed height to the panel */ }
    .trade-history-header, .trade-history-row {
      display: grid; grid-template-columns: 1fr 1fr 1fr;
      font-size: 0.75rem; padding: 4px 1rem; flex-shrink: 0;
    }
    .trade-history-header {
      color: var(--text-secondary);
      font-weight: 500;
    }
    .trade-history-body { flex-grow: 1; overflow-y: auto; }
    .price-col.buy { color: var(--accent-green); }
    .price-col.sell { color: var(--accent-red); }
    .time-col { text-align: right; color: var(--text-secondary); }

    /* Order Form */
    .order-form-container { padding: 1rem; flex-shrink: 0; }
    .order-form-tabs { display: flex; margin-bottom: 1.5rem; border-bottom: 1px solid var(--border-color);}
    .order-form-tab {
      flex: 1; padding-bottom: 0.75rem; border: none; background: transparent;
      color: var(--text-secondary); font-size: 1rem; font-weight: 600;
      cursor: pointer; position: relative;
    }
    .order-form-tab.active { color: var(--text-primary); }
    .order-form-tab.active::after {
        content: ''; position: absolute; bottom: -1px; left: 0; right: 0;
        height: 2px;
    }
    .order-form-tab.buy.active::after { background-color: var(--accent-green); }
    .order-form-tab.sell.active::after { background-color: var(--accent-red); }
    
    .order-type-selector { display: flex; gap: 0.5rem; margin-bottom: 1rem; }
    .order-type-button {
        flex: 1; padding: 0.5rem; border-radius: 4px; border: none;
        background-color: var(--background-tertiary);
        color: var(--text-secondary); cursor: pointer; font-weight: 500;
        transition: all 0.2s ease;
    }
    .order-type-button.active { background-color: var(--background-primary); color: var(--text-primary); }

    .input-wrapper {
      position: relative; margin-bottom: 1rem;
    }
    .input-wrapper label {
      display: flex; justify-content: space-between; font-size: 0.8rem;
      color: var(--text-secondary); margin-bottom: 0.5rem;
    }
    .input-wrapper input {
      width: 100%; box-sizing: border-box; background-color: var(--background-primary);
      border: 1px solid var(--border-color); border-radius: 4px;
      padding: 0.75rem; color: var(--text-primary); font-size: 0.9rem;
    }
    .input-wrapper input:focus { border-color: var(--text-secondary); outline: none; }
    .input-unit { position: absolute; right: 1rem; top: 58%; color: var(--text-tertiary); }
    
    .total-display { font-size: 0.8rem; color: var(--text-secondary); margin-top: -0.5rem; margin-bottom: 1rem; }
    .total-display span { color: var(--text-primary); }

    .submit-order-btn {
      width: 100%; padding: 0.8rem; border: none; border-radius: 4px; color: white;
      font-size: 1rem; font-weight: 600; cursor: pointer; transition: opacity 0.2s;
    }
    .submit-order-btn.buy { background-color: var(--accent-green); }
    .submit-order-btn.sell { background-color: var(--accent-red); }
    .submit-order-btn:hover { opacity: 0.9; }
  `}</style>
);

const TradePage: React.FC = () => {
    const { symbol } = useParams<{ symbol: string }>();
    const [trades, setTrades] = useState<Trade[]>([]);
    const [orderBook, setOrderBook] = useState<OrderBook>({ bids: [], asks: [] });
    const [ticker, setTicker] = useState<Ticker | null>(null);
    const [orderSide, setOrderSide] = useState<OrderSide>("buy");
    const [orderType, setOrderType] = useState<OrderType>("limit");
    const [orderPrice, setOrderPrice] = useState("");
    const [orderAmount, setOrderAmount] = useState("");

    const baseCurrency = symbol?.replace("USDC", "") || "";

    useEffect(() => {
        if (!symbol) return;

        setTrades([]);
        setOrderBook({ bids: [], asks: [] });
        setTicker(null);
        setOrderPrice("");
        setOrderAmount("");

        // initial get the orderbook trades ticker etc..
        api.get(`/markets/${symbol}/orderbook`).then((res) => setOrderBook(res.data));
        api.get(`/markets/${symbol}/trades`).then((res) => setTrades(res.data.slice(0, 50)));
        api.get(`/markets/${symbol}/ticker`).then((res) => setTicker(res.data));
        
        const cleanupSocket = connectSocket(
            symbol,
            (tradeData: Trade) => { setTrades((prev) => [tradeData, ...prev].slice(0, 50)); },
            (orderBookData: OrderBook) => { setOrderBook(orderBookData); }
        );

        return () => {
        };
        
    }, [symbol]);

    const handlePlaceOrder = async () => {
        const isLimit = orderType === 'limit';
        if (!symbol || !orderAmount || (isLimit && !orderPrice)) {
            alert("Please fill in all required fields.");
            return;
        }
        try {
            const payload: any = {
                symbol,
                side: orderSide,
                type: orderType,
                amount: parseFloat(orderAmount)
            };

            if (isLimit) {
                payload.price = parseFloat(orderPrice);
            }

            const response = await api.post("http://64.225.86.126/ordersapi/api/orders", payload);
            console.log("Order placed:", response.data);
            

            setOrderPrice("");
            setOrderAmount("");
        } catch (err) {
            console.error("Error placing order", err);
            alert("Failed to place order.");
        }
    };
    
    const handleRowClick = (price: number) => {
        setOrderPrice(price.toFixed(4));
    }

    const orderTotal = useMemo(() => {
        const price = parseFloat(orderPrice);
        const amount = parseFloat(orderAmount);
        if (orderType === 'limit' && price > 0 && amount > 0) {
            return (price * amount).toFixed(4);
        }
        return "0.00";
    }, [orderPrice, orderAmount, orderType]);


    const renderTicker = () => (
        <div className="ticker-bar">
            <div className="ticker-symbol">{ticker?.symbol.replace("USDC", "/USDC")}</div>
            <div className="ticker-item">
                <strong>Last Price:</strong>
                <span style={{ color: ticker && ticker.priceChange >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                    ${ticker?.lastPrice.toFixed(4)}
                </span>
            </div>
            <div className="ticker-item">
                <strong>24h Change:</strong>
                <span style={{ color: ticker && ticker.priceChange >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                    {ticker?.priceChange.toFixed(2)}%
                </span>
            </div>
            <div className="ticker-item"><strong>24h High:</strong> ${ticker?.high24h.toFixed(4)}</div>
            <div className="ticker-item"><strong>24h Low:</strong> ${ticker?.low24h.toFixed(4)}</div>
            <div className="ticker-item"><strong>24h Volume:</strong> {ticker?.volume24h.toFixed(2)}</div>
        </div>
    );

    const renderOrderBook = () => {
        const maxRows = 20;
        const sortedAsks = orderBook.asks.sort((a, b) => a.price - b.price).slice(0, maxRows);
        const sortedBids = orderBook.bids.sort((a, b) => b.price - a.price).slice(0, maxRows);
        
        let cumulativeAsk = 0, cumulativeBid = 0;
        const asksWithCum = sortedAsks.map(a => ({ ...a, cumulative: (cumulativeAsk += a.amount) }));
        const bidsWithCum = sortedBids.map(b => ({ ...b, cumulative: (cumulativeBid += b.amount) }));
        const maxCumulative = Math.max(cumulativeAsk, cumulativeBid);

        return (
            <div className="trade-card order-book-container">
                <div className="card-header">Order Book</div>
                <div className="order-book-header">
                    <span>Price (USDC)</span>
                    <span className="amount-col">Amount ({baseCurrency})</span>
                    <span className="total-col">Total</span>
                </div>
                <div className="order-book-body">
                    <div className="asks-list">
                        {asksWithCum.reverse().map((ask, i) => (
                            <div className="order-book-row" key={`ask-${ask.price}-${i}`} onClick={() => handleRowClick(ask.price)}>
                                <div className="depth-bar ask" style={{ width: `${(ask.cumulative / maxCumulative) * 100}%` }}></div>
                                <span className="price-col ask">{ask.price.toFixed(4)}</span>
                                <span className="amount-col">{ask.amount.toFixed(4)}</span>
                                <span className="total-col">{(ask.price * ask.amount).toFixed(4)}</span>
                            </div>
                        ))}
                    </div>
                    <div className="order-book-spread" style={{ color: ticker && ticker.priceChange >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                        {ticker?.lastPrice.toFixed(4) || '...'}
                    </div>
                    <div className="bids-list">
                        {bidsWithCum.map((bid, i) => (
                            <div className="order-book-row" key={`bid-${bid.price}-${i}`} onClick={() => handleRowClick(bid.price)}>
                                <div className="depth-bar bid" style={{ width: `${(bid.cumulative / maxCumulative) * 100}%` }}></div>
                                <span className="price-col bid">{bid.price.toFixed(4)}</span>
                                <span className="amount-col">{bid.amount.toFixed(4)}</span>
                                <span className="total-col">{(bid.price * bid.amount).toFixed(4)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };
    
    const renderTradeHistory = () => (
        <div className="trade-card trade-history-container">
            <div className="card-header">Trade History</div>
            <div className="trade-history-header">
                <span>Price (USDC)</span>
                <span className="amount-col">Amount ({baseCurrency})</span>
                <span className="time-col">Time</span>
            </div>
            <div className="trade-history-body">
                {trades.map((trade, i) => (
                    <div className="trade-history-row" key={`${trade.timestamp}-${i}`}>
                        <span className={`price-col ${trade.side === 'buy' ? 'buy' : 'sell'}`}>{trade.price.toFixed(4)}</span>
                        <span className="amount-col">{trade.amount.toFixed(4)}</span>
                        <span className="time-col">{new Date(trade.timestamp).toLocaleTimeString()}</span>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderPlaceOrderForm = () => {
        const isMarketBuy = orderType === 'market' && orderSide === 'buy';
        
        return (
            <div className="trade-card">
                <div className="order-form-tabs">
                    <button className={`order-form-tab buy ${orderSide === 'buy' ? 'active' : ''}`} onClick={() => setOrderSide('buy')}>Buy</button>
                    <button className={`order-form-tab sell ${orderSide === 'sell' ? 'active' : ''}`} onClick={() => setOrderSide('sell')}>Sell</button>
                </div>
                
                <div className="order-form-container">
                    <div className="order-type-selector">
                        <button className={`order-type-button ${orderType === 'limit' ? 'active' : ''}`} onClick={() => setOrderType('limit')}>Limit</button>
                        <button className={`order-type-button ${orderType === 'market' ? 'active' : ''}`} onClick={() => setOrderType('market')}>Market</button>
                    </div>
                    
                    <div className="form-body">
                        {orderType === 'limit' && (
                            <div className="input-wrapper">
                                <label>Price</label>
                                <input value={orderPrice} onChange={e => setOrderPrice(e.target.value)} type="number" placeholder="0.00" />
                                <span className="input-unit">USDC</span>
                            </div>
                        )}

                        <div className="input-wrapper">
                            <label>{isMarketBuy ? 'Total' : 'Amount'}</label>
                            <input value={orderAmount} onChange={e => setOrderAmount(e.target.value)} type="number" placeholder="0.00" />
                            <span className="input-unit">{isMarketBuy ? 'USDC' : baseCurrency}</span>
                        </div>
                        
                        {orderType === 'limit' && (
                            <div className="total-display">Total: <span>{orderTotal} USDC</span></div>
                        )}
                        
                        <button onClick={handlePlaceOrder} className={`submit-order-btn ${orderSide}`}>
                            {orderSide === 'buy' ? `Buy ${baseCurrency}` : `Sell ${baseCurrency}`}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            <PageStyles />
            <div className="trade-page-wrapper">
                {ticker && renderTicker()}
                
                <div className="main-layout-grid">
                    <div className="left-column">
                        {renderPlaceOrderForm()}
                    </div>

                    <div className="center-column">
                        <div className="chart-container">
                            <TradingViewChart symbol={symbol || "SOLUSDC"} />
                        </div>
                        {renderTradeHistory()}
                    </div>

                    <div className="right-column">
                        {renderOrderBook()}
                    </div>
                </div>
            </div>
        </>
    );
};
export default TradePage;