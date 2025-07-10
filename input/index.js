const axios = require("axios");

const BASE_URL = "https://basics-sends-marvel-own.trycloudflare.com/ordersapi/api/orders";

const symbols = ["SOL_USDC", "BTC_USDT", "ETH_USDT"];

const priceRanges = {
  SOL_USDC: [100, 200],
  BTC_USDT: [200, 300],
  ETH_USDT: [300, 400],
};

function generateOrder() {
  const symbol = symbols[Math.floor(Math.random() * symbols.length)];
  const [minPrice, maxPrice] = priceRanges[symbol];
  const price = (Math.random() * (maxPrice - minPrice) + minPrice).toFixed(2);
  const amount = (Math.random() * 5 + 0.01).toFixed(4);
  const side = Math.random() > 0.5 ? "buy" : "sell";

  const type = Math.random() > 0.5 ? "market" : "limit";

  return type === "market"
    ? { symbol, amount: parseFloat(amount), side, type }
    : { symbol, price: parseFloat(price), amount: parseFloat(amount), side, type };
}

async function simulate() {
  const totalOrders = 500;

  for (let i = 0; i < totalOrders; i++) {
    const order = generateOrder();
    try {
      await axios.post(BASE_URL, order);
      console.log(
        `Placed ${order.type.toUpperCase()} ${order.side} order on ${order.symbol} ${
          order.price ? `@ $${order.price}` : ""
        } for ${order.amount}`
      );
    } catch (err) {
      console.error(`Error placing order: ${err.message}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 100)); // 0.2s delay
  }

  console.log("Simulation complete with 0.2s interval between orders.");
}

simulate();
