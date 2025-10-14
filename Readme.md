# 🚀 Exchange-Now – Real-Time Crypto Trading Simulator

**Exchange-Now** is a high-performance, fully containerized cryptocurrency trading simulator inspired by real-world platforms like **Binance** and **Backpack Exchange**. Built with a microservices architecture and powered by Redis Pub/Sub, it simulates a real trading environment with orderbooks, matching, trades, charts, and WebSocket data — all in real time.

🔗 [Live Demo](Currently Not Available)  
📘 Status: Actively Developed | Public Demo Available | Only Supports desktop view 

---

## 🎯 Features

- ✅ **Live Matching Engine** – High-speed trade matching via Redis queues
- ✅ **Order Book Simulation** – Real-time bid/ask management
- ✅ **WebSocket Price Feed** – Trades, orderbooks, tickers pushed to frontend
- ✅ **OHLC Candle Charting** – Live aggregation of trades into candlestick data
- ✅ **Multi-Market Support** – Easily add new trading pairs (e.g., BTC/USDT)
- ✅ **Microservices in Node.js** – 6 distinct services for scale and modularity
- ✅ **Fully Containerized** – Runs via Docker & Helm in Kubernetes
- ✅ **CI/CD with GitHub Actions** – Seamless deployments

---

## 🛠️ Tech Stack

| Layer | Stack |
|---|---|
| Frontend | React, Lightweight-Charts, WebSocket |
| Backend | Node.js (Express for most services) |
| Database | Redis (queue, pub/sub, key store) |
| Containerization| Docker, Kubernetes, Helm |
| CI/CD | GitHub Actions |
| Deployment | Bare Metal or Cloud K8s |

---

## 🧱 Microservice Breakdown

| Service | Description |
|---|---|
| **Frontend** | React UI that displays live price charts, order book depth, and executes orders |
| **Order Service** | Receives new buy/sell orders from users and pushes them into a Redis queue |
| **Matching Engine** | Continuously pulls from the order queue and matches orders based on price/side |
| **Price Streamer** | Listens to Redis pub/sub channels (`trades`, `orderbook`) and forwards updates via WebSocket |
| **Candle Aggregator**| Aggregates live trade events into OHLC candle data |
| **API Gateway** | Provides public endpoints for trades, orderbook, tickers, and candle data |

> 📌 **Note**: The **frontend directly connects to the Order Service** to submit user orders, bypassing the API Gateway for speed.

---

## ⚙️ Installation & Setup

### 1️⃣ Prerequisites

Make sure you have:

- [Node.js](https://nodejs.org/)
- [Docker](https://www.docker.com/)
- [Redis](https://redis.io/)
- [Kubernetes & Helm](https://helm.sh/)
- [GitHub CLI](https://cli.github.com/) *(optional for CI/CD)*

---

### 2️⃣ Clone the Repository

```bash
git clone https://github.com/Chad-007/Exchange-Now.git
cd Exchange-Now
```

### 3️⃣ Setup Options

#### Option A: Local Setup (Manual)

**🔧 Install Dependencies**

For each service (e.g., order-service, matching-engine, etc.):

```bash
cd services/order-service
npm install
node index.js
```

Repeat for all 6 services and the frontend.

**🧠 Start Redis**

```bash
docker run -p 6379:6379 redis
```

**🌐 Access Frontend**

```bash
cd frontend
npm install
npm start
```

Then visit: [http://localhost:3000](http://localhost:3000)

#### Option B: Docker Compose (Recommended for Dev)

✅ Coming soon — will include `docker-compose.yml` to spin up Redis, all services, and frontend with one command.

#### Option C: Kubernetes + Helm (Production)

**📦 Install Redis**

```bash
# Deploy Redis using the provided Helm chart
helm install redis ./helm/redis
```

**🚀 Deploy Backend Services**

Each service has its own Helm chart. Deploy them individually:

```bash
# Deploy API Gateway
helm install api-gateway ./helm/api-gateway

# Deploy Matching Engine
helm install matching-engine ./helm/matching-engine

# Deploy Order Service
helm install orders ./helm/orders

# Deploy Price Streamer
helm install price-stream ./helm/price-stream

# Deploy Candle Aggregator
helm install candles ./helm/candles

# Deploy Ingress for backend services
helm install ingress ./helm/ingress
```

**🌐 Deploy Frontend**

The frontend is deployed separately and uses a LoadBalancer for direct access:

```bash
# Deploy frontend (typically via separate K8s manifests)
kubectl apply -f frontend/deployment.yml

# Get LoadBalancer IP
kubectl get svc frontend-service
```

**🌍 Access the Application**

- **Frontend**: Access via LoadBalancer IP/domain
- **Backend APIs**: Access via Ingress endpoint
- **WebSocket**: Connects through the configured ingress/load balancer

```bash
# Check all services
kubectl get svc
kubectl get ingress
```

**📝 Customize Deployment**

Each service can be customized via its respective `values.yaml`:
- `./helm/api-gateway/values.yaml`
- `./helm/matching-engine/values.yaml`
- `./helm/orders/values.yaml`
- `./helm/price-stream/values.yaml`
- `./helm/candles/values.yaml`

---

## 🧪 API Overview (via API Gateway)

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/markets` | List all supported pairs |
| GET | `/api/markets/:symbol/ticker` | Latest ticker info |
| GET | `/api/markets/:symbol/orderbook` | Order book snapshot |
| GET | `/api/markets/:symbol/trades` | Recent trades |
| GET | `/api/markets/:symbol/candles` | Candlestick data |

---

## 📡 WebSocket Channels

| Channel | Description |
|---|---|
| `trades` | Streams every new executed trade |
| `orderbook` | Sends orderbook depth updates |


---

## 📌 Developer Notes

- Orders are processed as either LIMIT or MARKET
- The system can support thousands of updates per second using Redis Pub/Sub

---

## 📜 Future Scope

Need to change the lastprice 24H change 24Hvolume etc.. hardcoded  values in the markets page and make it realtime.
Make the Candles a bit realtime
Change the utc time and make it ist

---
---

## 📜 License

This project is licensed under the MIT License — see the LICENSE file for details.

---

## 🤝 Contributing

We welcome contributions!

```bash
# How to contribute:
1. Fork this repository
2. Create a feature branch
3. Push your changes
4. Open a pull request
```

Feel free to raise issues, suggest features, or just star the repo 

---

## 📧 Contact

**Built by Alan Sebastian**

🔗 [Live App](http://144.126.255.193)  
✉️ Email: alansebastian484gmail.com  
💼 GitHub: [github.com/Chad-007](https://github.com/Chad-007)

---

*"Trade like a pro — simulate before you go."* 
