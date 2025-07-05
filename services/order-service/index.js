// order-service/index.js
const express = require("express");
const cors = require("cors");
const Redis = require("ioredis");

const app = express();
app.use(cors());
app.use(express.json());
const redis = new Redis({ host: process.env.REDIS_HOST || 'redis' });
app.post("/api/orders", async (req, res) => {
  const order = req.body;
  if (
  !order.symbol ||
  !order.amount ||
  !order.side ||
  !order.type ||
  (order.type === "limit" && !order.price) 
) {
  return res.status(400).json({ error: "Invalid order data" });
}

  await redis.lpush("order_queue", JSON.stringify(order));
  await redis.lpush("pending_orders", JSON.stringify(order));
  console.log("Order pushed to queue:", order);
  res.json({ status: "queued" });
});
app.listen(4002, () => {
  console.log("Order service listening on port 4002");
});
//new one

