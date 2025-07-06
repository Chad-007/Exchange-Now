        const Redis = require("ioredis");
        const redis = new Redis({ host: process.env.REDIS_HOST || 'redis' });

        console.log("Matching Engine running...");


        async function matchOrders() {
        while (true) {
            const orderData = await redis.brpop("order_queue", 0);
        const order = JSON.parse(orderData[1]);
        console.log("Received order from queue:", order);

        const { symbol, side, type } = order;
        console.log("this is the symbol",symbol)

        const bidsKey = `orderbook_bids:${symbol}`;
        const asksKey = `orderbook_asks:${symbol}`;
        const bidsAmountKey = `amounts:${symbol}:bids`;
        const asksAmountKey = `amounts:${symbol}:asks`;


        if (order.side === "buy") {
        while (order.amount > 0) {
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

            // market buy matches ANY ask
            // limit buy matches only if ask <= limit price
            if (type === "limit" && askPrice > order.price) break;

            const tradeAmount = Math.min(order.amount, askAmount);

            console.log(`Matched BUY with ask: ${tradeAmount} @ ${askPrice}`);

            const trade = {
            symbol,
            price: askPrice,
            amount: tradeAmount,
            side: "buy",
            timestamp: Date.now(),
            };

            await redis.publish("trades_channel", JSON.stringify(trade));
            const now = new Date();
        const bucketTime = now.toISOString().slice(0,16).replace(/[-:T]/g,""); // to get the time..
        
        const candleKey = `candle:${symbol}:${bucketTime}`;

        // try to get existing candle
        const existingCandle = await redis.hgetall(candleKey);

        if (Object.keys(existingCandle).length === 0) {
        // new candle for this minute
        await redis.hmset(candleKey, {
            open: trade.price,
            close: trade.price,
            high: trade.price,
            low: trade.price,
            volume: trade.amount,
            timestamp: now.getTime()
        });
        } else {
        // update existing
        await redis.hmset(candleKey, {
            close: trade.price,
            high: Math.max(parseFloat(existingCandle.high), trade.price),
            low: Math.min(parseFloat(existingCandle.low), trade.price),
            volume: parseFloat(existingCandle.volume) + trade.amount,
        });
        }

            await redis.lpush(`trades:${symbol}`, JSON.stringify(trade));
            await redis.ltrim(`trades:${symbol}`, 0, 49);

            await redis.set(`ticker:${symbol}:lastPrice`, trade.price);

            const currentHigh = parseFloat(await redis.get(`ticker:${symbol}:high24h`) || "0");
            if (trade.price > currentHigh) {
            await redis.set(`ticker:${symbol}:high24h`, trade.price);
            }
            const currentLow = parseFloat(await redis.get(`ticker:${symbol}:low24h`) || trade.price);
            if (currentLow === 0 || trade.price < currentLow) {
            await redis.set(`ticker:${symbol}:low24h`, trade.price);
            }
            await redis.incrbyfloat(`ticker:${symbol}:volume24h`, trade.amount);

            const openKey = `ticker:${symbol}:open24h`;
            const existsOpen = await redis.exists(openKey);
            if (!existsOpen) {
            await redis.set(openKey, trade.price);
            }
            const openPrice = parseFloat(await redis.get(openKey));
            const changePercent = ((trade.price - openPrice) / openPrice) * 100;
            await redis.set(`ticker:${symbol}:priceChange`, changePercent);

            if (askAmount > tradeAmount) {
            await redis.hset(asksAmountKey, askPriceStr, askAmount - tradeAmount);
            } else {
            await redis.zrem(asksKey, askPriceStr);
            await redis.hdel(asksAmountKey, askPriceStr);
            }

            order.amount -= tradeAmount;
        }
        if (type === "limit" && order.amount > 0) {
            await redis.zadd(bidsKey, order.price, String(order.price));
            await redis.hincrbyfloat(bidsAmountKey, String(order.price), order.amount);
        }
        }
            if (order.side === "sell") {
        while (order.amount > 0) {
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

            // market sell matches ANY bid
            // limit sell matches only if bid >= limit price
            if (type === "limit" && bidPrice < order.price) break;

            const tradeAmount = Math.min(order.amount, bidAmount);

            console.log(`Matched SELL with bid: ${tradeAmount} @ ${bidPrice}`);

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

            const currentHigh = parseFloat(await redis.get(`ticker:${symbol}:high24h`) || "0");
            if (trade.price > currentHigh) {
            await redis.set(`ticker:${symbol}:high24h`, trade.price);
            }
            const currentLow = parseFloat(await redis.get(`ticker:${symbol}:low24h`) || trade.price);
            if (currentLow === 0 || trade.price < currentLow) {
            await redis.set(`ticker:${symbol}:low24h`, trade.price);
            }
            await redis.incrbyfloat(`ticker:${symbol}:volume24h`, trade.amount);

            const openKey = `ticker:${symbol}:open24h`;
            const existsOpen = await redis.exists(openKey);
            if (!existsOpen) {
            await redis.set(openKey, trade.price);
            }
            const openPrice = parseFloat(await redis.get(openKey));
            const changePercent = ((trade.price - openPrice) / openPrice) * 100;
            await redis.set(`ticker:${symbol}:priceChange`, changePercent);

            if (bidAmount > tradeAmount) {
            await redis.hset(bidsAmountKey, bidPriceStr, bidAmount - tradeAmount);
            } else {
            await redis.zrem(bidsKey, bidPriceStr);
            await redis.hdel(bidsAmountKey, bidPriceStr);
            }

            order.amount -= tradeAmount;
        }

        // if limit order and still unfilled, store it
        if (type === "limit" && order.amount > 0) {
            await redis.zadd(asksKey, order.price, String(order.price));
            await redis.hincrbyfloat(asksAmountKey, String(order.price), order.amount);
        }
        }


            const bidPrices = await redis.zrevrange(bidsKey, 0, -1);
            const askPrices = await redis.zrange(asksKey, 0, -1);

            const bidOrders = [];
            for (const price of bidPrices) {
            const amount = parseFloat(await redis.hget(bidsAmountKey, price));
            if (amount > 0) {
                bidOrders.push({ price: parseFloat(price), amount });
            }
            }

            const askOrders = [];
            for (const price of askPrices) {
            const amount = parseFloat(await redis.hget(asksAmountKey, price));
            if (amount > 0) {
                askOrders.push({ price: parseFloat(price), amount });
            }
            }

            await redis.publish(
            "orderbook_channel",
            JSON.stringify({
                symbol,
                bids: bidOrders,
                asks: askOrders,
            })
            );
        }
        }

        matchOrders();
        // i need to check if the image is rebuilt
        //change?
        // ha ha
        //finally
        //new one
        //damn