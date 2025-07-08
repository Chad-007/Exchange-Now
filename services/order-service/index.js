const express = require("express");
const cors = require("cors");
const Redis = require("ioredis");
const client = require("prom-client");

client.collectDefaultMetrics();

const ordersCounter = new client.Counter({
  name: "orders_total",
  help: "Total number of orders placed"
});

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

  ordersCounter.inc(); 

  console.log("Order pushed to queue:", order);
  res.json({ status: "queued" });
});

app.get("/metrics", async (req, res) => {
  res.set("Content-Type", client.register.contentType);
  res.send(await client.register.metrics());
});

app.listen(4002, () => {
  console.log("Order service listening on port 4002");
});
