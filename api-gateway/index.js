    const express = require("express");
    const cors = require("cors");

    const app = express();
    app.use(cors());
    app.use(express.json());

    const markets = [
    { symbol: "SOL_USDC", price: 22.15 },
    { symbol: "BTC_USDT", price: 30300 },
    { symbol: "ETH_USDT", price: 2000 }
    ];

    app.get("/api/markets", (req, res) => {
    res.json(markets);
    });

    app.get("/api/markets/:symbol/orderbook", async (req, res) => {
    const { symbol } = req.params;

    const Redis = require("ioredis");
    const redis = new Redis();

    const bidsKey = `orderbook_bids:${symbol}`;
    const asksKey = `orderbook_asks:${symbol}`;
    const bidsAmountKey = `amounts:${symbol}:bids`;
    const asksAmountKey = `amounts:${symbol}:asks`;

    const bidPrices = await redis.zrevrange(bidsKey, 0, -1);
    const askPrices = await redis.zrange(asksKey, 0, -1);

    const bids = [];
    for (const price of bidPrices) {
        const amount = parseFloat(await redis.hget(bidsAmountKey, price));
        if (amount > 0) {
        bids.push({ price: parseFloat(price), amount });
        }
    }

    const asks = [];
    for (const price of askPrices) {
        const amount = parseFloat(await redis.hget(asksAmountKey, price));
        if (amount > 0) {
        asks.push({ price: parseFloat(price), amount });
        }
    }

    res.json({
        symbol,
        bids,
        asks,
    });
    });


   app.get("/api/markets/:symbol/trades", async (req, res) => {
  const { symbol } = req.params;
  const Redis = require("ioredis");
  const redis = new Redis();
  const rawTrades = await redis.lrange(`trades:${symbol}`, 0, 49);
  const trades = rawTrades.map((t) => JSON.parse(t));
  res.json(trades);
});

app.get("/api/markets/:symbol/ticker", async (req, res) => {
  const { symbol } = req.params;
  const Redis = require("ioredis");
  const redis = new Redis();

  const lastPrice = parseFloat(await redis.get(`ticker:${symbol}:lastPrice`) || "0");
  const high24h = parseFloat(await redis.get(`ticker:${symbol}:high24h`) || "0");
  const low24h = parseFloat(await redis.get(`ticker:${symbol}:low24h`) || "0");
  const volume24h = parseFloat(await redis.get(`ticker:${symbol}:volume24h`) || "0");
  const priceChange = parseFloat(await redis.get(`ticker:${symbol}:priceChange`) || "0");

  res.json({
    symbol,
    lastPrice,
    high24h,
    low24h,
    volume24h,
    priceChange
  });
});



    app.listen(4000, () => {
    console.log("REST API listening on port 4000");
    });
