let socket: WebSocket;

interface Trade {
  price: number;
  amount: number;
  side: string;
  timestamp: number;
  symbol: string;
}

interface OrderBook {
  bids: { price: number; amount: number }[];
  asks: { price: number; amount: number }[];
}

export function connectSocket(
  symbol: string,
  onTrade: (trade: Trade) => void,
  onOrderBook: (orderBook: OrderBook) => void
) {
  if (socket && socket.readyState !== WebSocket.CLOSED) {
    socket.close();
  }

  socket = new WebSocket(`ws://209.38.125.121:4003`);

  socket.onopen = () => {
    console.log("WebSocket connected to", symbol);
    socket.send(JSON.stringify({ type: "subscribe", symbol }));
  };

  socket.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log("WS message:", data);  
  if (data.type === "orderbook") {
    console.log("Received orderbook:", data.data);  
    onOrderBook(data.data);
  } else if (data.type === "trade") {
    console.log("Received trade:", data.data);      
    onTrade(data.data);
  }
};


  socket.onerror = (e) => {
    console.error("WebSocket error", e);
  };
}
