let socket: WebSocket;

export function connectSocket() {
  socket = new WebSocket("ws://localhost:4000/ws/prices");
  socket.onopen = () => console.log("WebSocket connected");
}

export function subscribePrice(cb: (price: number) => void) {
  if (!socket) return;
  socket.onmessage = (event) => {
    const price = JSON.parse(event.data);
    cb(price);
  };
}

// force module export
export {};
