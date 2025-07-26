const Redis = require("ioredis");
const redis = new Redis({ host: process.env.REDIS_HOST || "redis" });

console.log("Matching Engine running...");

async function matchOrders() {
  while (true) {
    const orderData = await redis.brpop("order_queue", 0);
    const order = JSON.parse(orderData[1]);
    console.log("Received order from queue:", order);
    const { symbol, side, type } = order;
    const bidsKey = `orderbook_bids:${symbol}`;
    const asksKey = `orderbook_asks:${symbol}`;
    const bidsAmountKey = `amounts:${symbol}:bids`;
    const asksAmountKey = `amounts:${symbol}:asks`;
    let remainingAmount = order.amount || 0;
    let remainingTotal = order.total || 0;
    if (side === "buy") {
      while ((type === "limit" && remainingAmount > 0) || (type === "market" && remainingTotal > 0)) {
        const bestAsk = await redis.zrange(asksKey, 0, 0);
        if (bestAsk.length === 0) break;
        const askPriceStr = bestAsk[0];
        const askAmountStr = await redis.hget(asksAmountKey, askPriceStr);
        if (!askAmountStr) {
          await redis.zrem(asksKey, askPriceStr);
          continue;
        }
        const askPrice = parseFloat(askPriceStr);
        const askAmount = parseFloat(askAmountStr);
        if (type === "limit" && askPrice > order.price) break;
        let tradeAmount = 0;
        let cost = 0;
        if (type === "market") {//how much qty can be bought with usd
          const maxQty = remainingTotal / askPrice;
          tradeAmount = Math.min(maxQty, askAmount);
          cost = tradeAmount * askPrice;
          remainingTotal -= cost;
        } else {
          tradeAmount = Math.min(remainingAmount, askAmount);
          cost = tradeAmount * askPrice;
          remainingAmount -= tradeAmount;
        }
        const trade = {
          symbol,
          price: askPrice,
          amount: tradeAmount,
          side: "buy",
          timestamp: Date.now(),
        };
        await redis.publish("trades_channel", JSON.stringify(trade));
        await redis.lpush(`trades:${symbol}`, JSON.stringify(trade));
        await redis.ltrim(`trades:${symbol}`, 0, 49);
        await redis.set(`ticker:${symbol}:lastPrice`, trade.price);
        const high = parseFloat(await redis.get(`ticker:${symbol}:high24h`) || "0");
        const low = parseFloat(await redis.get(`ticker:${symbol}:low24h`) || trade.price);
        if (trade.price > high) await redis.set(`ticker:${symbol}:high24h`, trade.price);
        if (trade.price < low || low === 0) await redis.set(`ticker:${symbol}:low24h`, trade.price);
        await redis.incrbyfloat(`ticker:${symbol}:volume24h`, trade.amount);
        const openKey = `ticker:${symbol}:open24h`;
        const openExists = await redis.exists(openKey);
        if (!openExists) await redis.set(openKey, trade.price);
        const openPrice = parseFloat(await redis.get(openKey));
        const changePercent = ((trade.price - openPrice) / openPrice) * 100;
        await redis.set(`ticker:${symbol}:priceChange`, changePercent);
        if (askAmount > tradeAmount) {
          await redis.hset(asksAmountKey, askPriceStr, askAmount - tradeAmount);
        } else {
          await redis.zrem(asksKey, askPriceStr);
          await redis.hdel(asksAmountKey, askPriceStr);
        }
        if (type === "market" && remainingTotal <= 0) break;
      }
      if (type === "limit" && remainingAmount > 0) {
        await redis.zadd(bidsKey, order.price, String(order.price));
        await redis.hincrbyfloat(bidsAmountKey, String(order.price), remainingAmount);
      }
    }
    if (side === "sell") {
      while (remainingAmount > 0) {
        const bestBid = await redis.zrevrange(bidsKey, 0, 0);
        if (bestBid.length === 0) break;
        const bidPriceStr = bestBid[0];
        const bidAmountStr = await redis.hget(bidsAmountKey, bidPriceStr);
        if (!bidAmountStr) {
          await redis.zrem(bidsKey, bidPriceStr);
          continue;
        }
        const bidPrice = parseFloat(bidPriceStr);
        const bidAmount = parseFloat(bidAmountStr);
        if (type === "limit" && bidPrice < order.price) break;
        const tradeAmount = Math.min(remainingAmount, bidAmount);
        remainingAmount -= tradeAmount;
        const trade = {
          symbol,
          price: bidPrice,
          amount: tradeAmount,
          side: "sell",
          timestamp: Date.now(),
        };
        await redis.publish("trades_channel", JSON.stringify(trade));
        await redis.lpush(`trades:${symbol}`, JSON.stringify(trade));
        await redis.ltrim(`trades:${symbol}`, 0, 49);
        await redis.set(`ticker:${symbol}:lastPrice`, trade.price);
        const high = parseFloat(await redis.get(`ticker:${symbol}:high24h`) || "0");
        const low = parseFloat(await redis.get(`ticker:${symbol}:low24h`) || trade.price);
        if (trade.price > high) await redis.set(`ticker:${symbol}:high24h`, trade.price);
        if (trade.price < low || low === 0) await redis.set(`ticker:${symbol}:low24h`, trade.price);
        await redis.incrbyfloat(`ticker:${symbol}:volume24h`, trade.amount);
        const openKey = `ticker:${symbol}:open24h`;
        const openExists = await redis.exists(openKey);
        if (!openExists) await redis.set(openKey, trade.price);
        const openPrice = parseFloat(await redis.get(openKey));
        const changePercent = ((trade.price - openPrice) / openPrice) * 100;
        await redis.set(`ticker:${symbol}:priceChange`, changePercent);
        if (bidAmount > tradeAmount) {
          await redis.hset(bidsAmountKey, bidPriceStr, bidAmount - tradeAmount);
        } else {
          await redis.zrem(bidsKey, bidPriceStr);
          await redis.hdel(bidsAmountKey, bidPriceStr);
        }
      }
      if (type === "limit" && remainingAmount > 0) {
        await redis.zadd(asksKey, order.price, String(order.price));
        await redis.hincrbyfloat(asksAmountKey, String(order.price), remainingAmount);
      }
    }
    const bidPrices = await redis.zrevrange(bidsKey, 0, -1);
    const askPrices = await redis.zrange(asksKey, 0, -1);
    const bidOrders = [];
    for (const price of bidPrices) {
      const amt = parseFloat(await redis.hget(bidsAmountKey, price));
      if (amt > 0) bidOrders.push({ price: parseFloat(price), amount: amt });
    }
    const askOrders = [];
    for (const price of askPrices) {
      const amt = parseFloat(await redis.hget(asksAmountKey, price));
      if (amt > 0) askOrders.push({ price: parseFloat(price), amount: amt });
    }
    await redis.publish("orderbook_channel", JSON.stringify({
      symbol,
      bids: bidOrders,
      asks: askOrders,
    }));
  }
}
matchOrders();
//change
