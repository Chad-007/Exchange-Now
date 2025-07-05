const Redis = require("ioredis");

const redis = new Redis({ host: process.env.REDIS_HOST|| 'redis' });             
const subscriber = new Redis({ host: process.env.REDIS_HOST || 'redis'});
        

console.log("Candle Aggregator running...");

const tradeBuffers = {};

subscriber.subscribe("trades_channel");

subscriber.on("message", async (channel, message) => {
  if (channel !== "trades_channel") return;

  const trade = JSON.parse(message);
  const { symbol, price, amount, timestamp } = trade;

  const fiveSecondTimestamp = Math.floor(timestamp / 5000) * 5000;

  if (!tradeBuffers[symbol]) tradeBuffers[symbol] = {};
  if (!tradeBuffers[symbol][fiveSecondTimestamp]) {
    tradeBuffers[symbol][fiveSecondTimestamp] = [];
  }
  tradeBuffers[symbol][fiveSecondTimestamp].push(trade);
});

setInterval(async () => {
  const now = Date.now();
  const cutoff = now - 5000;

  for (const symbol of Object.keys(tradeBuffers)) {
    for (const slot of Object.keys(tradeBuffers[symbol])) {
      const slotInt = parseInt(slot);
      if (slotInt < cutoff) {
        const trades = tradeBuffers[symbol][slotInt];
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
          const key = `candle:${symbol}:${slotInt}`;
          await redis.hmset(key, candle);   
          console.log(`Saved 5s candle for ${symbol} at ${new Date(slotInt).toISOString()}`);
        }
        delete tradeBuffers[symbol][slot];
      }
    }
  }
}, 2000);
