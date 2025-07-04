const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 4001 });

wss.on("connection", (ws, req) => {
  console.log("Client connected");

  const symbol = req.url.split("/").pop(); 
  const sendRandomPrice = () => {
    const price = +(20 + Math.random() * 5).toFixed(2); 
    ws.send(JSON.stringify({ symbol, price }));
  };

  const interval = setInterval(sendRandomPrice, 1000);

  ws.on("close", () => {
    clearInterval(interval);
    console.log("Client disconnected");
  });
});

console.log("WebSocket server listening on port 4001");
