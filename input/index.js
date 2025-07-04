const axios = require("axios");

const BASE_URL = "http://localhost:4002/api/orders";

const symbols = ["SOL_USDC", "BTC_USDT", "ETH_USDT"];

const priceRanges = {
  SOL_USDC: [22, 23],
  BTC_USDT: [30000, 30500],
  ETH_USDT: [1950, 2050],
};

function generateOrder() {
  const symbol = symbols[Math.floor(Math.random() * symbols.length)];
  const [minPrice, maxPrice] = priceRanges[symbol];
  const price = (Math.random() * (maxPrice - minPrice) + minPrice).toFixed(2);
  const amount = (Math.random() * 5 + 0.01).toFixed(4);
  const side = Math.random() > 0.5 ? "buy" : "sell";

  // randomly choose between market or limit order
  const type = Math.random() > 0.5 ? "market" : "limit";

  // for market orders, do not include price (matching engines usually ignore it)
  return type === "market"
    ? { symbol, amount: parseFloat(amount), side, type }
    : { symbol, price: parseFloat(price), amount: parseFloat(amount), side, type };
}

async function simulate() {
  const totalOrders = 500;
  const requests = [];

  for (let i = 0; i < totalOrders; i++) {
    const order = generateOrder();
    requests.push(
      axios
        .post(BASE_URL, order)
        .then(() => {
          console.log(
            `Placed ${order.type.toUpperCase()} ${order.side} order on ${order.symbol} ${
              order.price ? `@ $${order.price}` : ""
            } for ${order.amount}`
          );
        })
        .catch((err) => {
          console.error(`Error placing order: ${err.message}`);
        })
    );
  }

  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Timeout exceeded")), 5000)
  );

  try {
    await Promise.race([
      Promise.all(requests),
      timeout,
    ]);
    console.log("All orders submitted within 5 seconds (or timed out).");
  } catch (e) {
    console.error("Simulation finished with timeout or error:", e.message);
  }
}

simulate();
