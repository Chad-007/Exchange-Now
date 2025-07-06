const WebSocket = require("ws");
const Redis = require("ioredis");

const redis = new Redis({ host: process.env.REDIS_HOST || 'redis'});
const subscriber = new Redis({ host: process.env.REDIS_HOST || 'redis' });

const wss = new WebSocket.Server({ port: 4003 });

wss.on("connection", (ws) => {
  console.log("Client connected to price stream");

  ws.send(JSON.stringify({ type: "info", message: "Connected to price stream" }));

  ws.on("message", (msg) => {
    try {
      const data = JSON.parse(msg);
      if (data.type === "subscribe" && data.symbol) {
        ws.symbol = data.symbol;
        console.log(`Client subscribed to ${data.symbol}`);
      }
    } catch (err) {
      console.error("Bad message from client", err);
    }
  });
});
subscriber.subscribe("trades_channel", () => {
  console.log("Subscribed to trades_channel");
});
subscriber.subscribe("orderbook_channel", () => {
  console.log("Subscribed to orderbook_channel");
});

subscriber.on("message", (channel, message) => {
  if (channel === "trades_channel") {
    const trade = JSON.parse(message);
    console.log("Broadcasting trade:", trade);

    wss.clients.forEach((client) => {
      if (
        client.readyState === WebSocket.OPEN &&
        client.symbol === trade.symbol
      ) {
        client.send(JSON.stringify({ type: "trade", data: trade }));
      }
    });
  }

  if (channel === "orderbook_channel") {
    const orderbook = JSON.parse(message);
    console.log("Broadcasting orderbook update:", orderbook);

    wss.clients.forEach((client) => {
      if (
        client.readyState === WebSocket.OPEN &&
        client.symbol === orderbook.symbol
      ) {
        client.send(JSON.stringify({ type: "orderbook", data: orderbook }));
      }
    });
  }
});

console.log("Price stream WebSocket running on port 4003");
//new change
//hey again
//erewhjrh
// new one
// for api gateway
//new change en new
// im close