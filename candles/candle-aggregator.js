const Redis = require("ioredis");
const redis = new Redis({ host: process.env.REDIS_HOST || "redis" });
const subscriber = new Redis({ host: process.env.REDIS_HOST || "redis" });
console.log("Candle Aggregator running...");
const tradeBuffers = {};
subscriber.subscribe("trades_channel");
subscriber.on("message", async (channel, message) => {
  if (channel !== "trades_channel") return;
  const trade = JSON.parse(message);
  const { symbol, price, amount, timestamp } = trade;
  const fiveSecondTimestamp = Math.floor(timestamp / 1000 / 5) * 5; 
  if (!tradeBuffers[symbol]) {
    tradeBuffers[symbol] = {};
  }
  if (!tradeBuffers[symbol][fiveSecondTimestamp]) {
    tradeBuffers[symbol][fiveSecondTimestamp] = [];
  }
  tradeBuffers[symbol][fiveSecondTimestamp].push(trade);
});
setInterval(async () => {
  const now = Math.floor(Date.now() / 1000); 
  const cutoff = now - 5; 
  for (const symbol of Object.keys(tradeBuffers)) {
    for (const slot of Object.keys(tradeBuffers[symbol])) {
      const slotInt = parseInt(slot);
      if (slotInt < cutoff) {
        const trades = tradeBuffers[symbol][slotInt];
        const key = `candle:${symbol}:${slotInt}`;
        if (trades && trades.length > 0) {
          const prices = trades.map((t) => t.price);
          const volumes = trades.map((t) => t.amount);
          const candle = {
            timestamp: slotInt,
            open: trades[0].price,
            close: trades[trades.length - 1].price,
            high: Math.max(...prices),
            low: Math.min(...prices),
            volume: volumes.reduce((a, b) => a + b, 0),
          };
          await redis.hmset(key, candle);
          console.log(`saved 5s candle for ${symbol} at ${new Date(slotInt).toISOString()}`);
        } else {
          // if not trades then fill with empty candles
          const prevKeys = await redis.keys(`candle:${symbol}:*`);
          if (prevKeys.length === 0) continue;
          const sortedKeys = prevKeys.sort((a, b) => {
            const ta = parseInt(a.split(":").pop());
            const tb = parseInt(b.split(":").pop());
            return ta - tb;
          });
          const lastKey = sortedKeys[sortedKeys.length - 1];
          const prevCandle = await redis.hgetall(lastKey);
          if (prevCandle && prevCandle.close) {
            const price = parseFloat(prevCandle.close);
            const flatCandle = {
              timestamp: slotInt,
              open: price,
              close: price,
              high: price,
              low: price,
              volume: 0,
            };
            await redis.hmset(key, flatCandle);
            console.log(`filled missing candle for ${symbol} at ${new Date(slotInt).toISOString()}`);
          }
        }
        delete tradeBuffers[symbol][slot];
      }
    }
  }
}, 2000);
