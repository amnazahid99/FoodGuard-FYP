# FoodGuard — Full Setup Guide (Frontend + Backend + MongoDB)

## 1. Prerequisites
- Node.js 18+  (you already have v22 ✅)
- MongoDB — choose ONE:
  - **Local**: install MongoDB Community Server → https://www.mongodb.com/try/download/community
  - **Cloud (recommended, free)**: MongoDB Atlas → https://www.mongodb.com/cloud/atlas/register

## 2. MongoDB connection string

### Option A — Local MongoDB
After installing, MongoDB runs on `mongodb://127.0.0.1:27017`.
The `.env` is already set to:
```
MONGO_URI=mongodb://127.0.0.1:27017/foodguard
```
Start the MongoDB service (Windows): open Services → start "MongoDB Server", OR run `mongod` in a terminal.

### Option B — MongoDB Atlas (cloud, easiest)
1. Create a free cluster at https://cloud.mongodb.com
2. Database Access → add a user (username + password)
3. Network Access → Add IP → **Allow access from anywhere** (0.0.0.0/0)
4. Cluster → Connect → Drivers → copy the URI, looks like:
   `mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/foodguard?retryWrites=true&w=majority`
5. Open `FoodGuard-Backend/.env` and replace `MONGO_URI=...` with that URI.

## 3. Backend — install & run
```bash
cd FoodGuard-Backend
npm install
npm run dev
```
Expected output:
```
✅ MongoDB connected
🚀 Server running on http://localhost:5000
```

## 4. Frontend — install & run (new terminal)
```bash
cd FoodGuard-Frontend
npm install
npm run dev
```
Open: http://localhost:5173

## 5. Verify connection
- Frontend calls `http://localhost:5000/api` (set in `FoodGuard-Frontend/.env`)
- Try Signup → Login → you should land on the Dashboard.
- Check the backend terminal for request logs.

## Troubleshooting

**`MONGO_URI missing`** → `.env` not loaded. Make sure `.env` is in `FoodGuard-Backend/` (same folder as `server.js`), then restart `npm run dev`.

**`MongooseServerSelectionError` / `ECONNREFUSED 127.0.0.1:27017`** → MongoDB isn't running locally. Start the MongoDB service, or switch to an Atlas URI.

**`Network Error` in frontend** → backend isn't running, or `VITE_API_URL` in `FoodGuard-Frontend/.env` doesn't match the backend port. Restart `npm run dev` after editing `.env`.

**CORS errors** → backend `.env` `CLIENT_URL` must match frontend URL (default `http://localhost:5173`).
