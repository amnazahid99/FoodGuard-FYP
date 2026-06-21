**Final Year Project** 
# 🍃 FoodGuard:
**An intelligent food management system that helps users track inventory, analyze nutrition, reduce food wastage, and get AI-powered meal recommendations.**

<p align="center">
  <img src="https://img.shields.io/badge/MERN-Stack-cyan" alt="MERN Stack">
  <img src="https://img.shields.io/badge/FastAPI-Python-blue" alt="FastAPI">
  <img src="https://img.shields.io/badge/AI-Groq%20%2B%20Gemini-green" alt="AI APIs">
  <img src="https://img.shields.io/badge/License-MIT-yellow" alt="License">
</p>


---

## 🌐 Live Demo

FoodGuard is **deployed and live** as three independent services:

| Service | URL |
|---------|-----|
| 🖥️ **Live App (Frontend)** | **https://food-guard-fypp.vercel.app/** |
| ⚙️ **Backend API** | https://foodguard-fyp.onrender.com — health check: `/api/health` |
| 🤖 **AI Microservice** | https://foodguard-fyp-ai.onrender.com — health check: `/health` |
| 💻 **Source Code (GitHub)** | https://github.com/amnazahid99/FoodGuard-FYP |

> Hosted on **Vercel** (frontend), **Render** (backend + AI service), and **MongoDB Atlas** (database), with automatic CI/CD on every push to `main`.
> ⏳ The free Render tier sleeps after ~15 min of inactivity, so the **first request after a pause may take 30–60s** to wake.

---

## 📋 Table of Contents

- [🌐 Live Demo](#-live-demo)
- [🌟 Features](#-features)
- [🏗️ Architecture](#️-architecture)
- [🛠️ Tech Stack](#️-tech-stack)
- [📂 Project Structure](#-project-structure)
- [🚀 Getting Started](#-getting-started)
- [⚙️ Environment Setup](#️-environment-setup)
- [💻 Running the Application](#-running-the-application)
- [🔗 API Endpoints](#-api-endpoints)
- [📱 Frontend Screenshots](#-frontend-screenshots)
- [🔧 Troubleshooting](#-troubleshooting)
- [🔮 Future Enhancements](#-future-enhancements)
- [📄 License](#-license)
- [👨‍💻 Authors](#-authors)
- [👥 Project Team & Contributions](#-project-team--contributions)
- [🙏 Acknowledgments](#-acknowledgments)

---

## 🌟 Features

### Core Features

| Feature | Description |
|---------|-------------|
| **📸 Receipt Scanning (OCR)** | Scan and extract item details from receipts using AI-powered image recognition |
| **📦 Smart Inventory Management** | Track food items with expiry dates, quantities, and categories |
| **🍽️ AI Meal Recommendations** | Get personalized meal suggestions based on available inventory |
| **📊 Nutrition Analysis** | Analyze nutritional content of meals and ingredients |
| **⏰ Expiry Tracking & Alerts** | Receive notifications before items expire |
| **🧮 Health Profile (BMI)** | Calculate BMI and get diet recommendations based on health profile |
| **💬 AI Chatbot** | Interactive chatbot for food-related queries |
| **📈 Dashboard Analytics** | Visual insights into food wastage, consumption patterns, and inventory status |
| **♻️ Wastage Reporting** | Track and report food wastage to improve habits |
| **🥗 Condition-Based Meal Plans** | Generate meal plans based on dietary conditions (diabetes, weight loss, etc.) |
| **💳 Payments** | Stripe-powered payment gateway for premium features |

### User Features

- 🔐 **Authentication** — Secure JWT-based signup/login with refresh tokens
- 👤 **Profile Management** — Update personal info, preferences, and notifications
- 📱 **Responsive Design** — Works on desktop and mobile devices
- 🔔 **Notifications** — Alerts for expiring items and important updates

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React + Vite)                 │
│                     http://localhost:3000                      │
└─────────────────────────────┬───────────────────────────────────┘
                              │ Axios / HTTP
┌─────────────────────────────▼───────────────────────────────────┐
│                     Express.js Backend                          │
│                      http://localhost:5001                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   MongoDB   │  │  JWT Auth   │  │   Multer   │              │
│  │  Database   │  │  Security  │  │   Uploads  │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└─────────────────────────────┬───────────────────────────────────┘
                              │ HTTP / REST
┌─────────────────────────────▼───────────────────────────────────┐
│                   FastAPI AI Service (Python)                   │
│                      http://localhost:8000                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │    Groq    │  │   Gemini    │  │ Fireworks   │              │
│  │    LLM     │  │    Vision   │  │    (OCR)    │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└─────────────────────────────────────────────────────────────────┘
```

### System Flow

1. **User** interacts with React Frontend
2. **Frontend** sends requests to Express Backend
3. **Backend** processes business logic and interacts with MongoDB
4. **Backend** calls FastAPI AI Service for intelligent features
5. **AI Service** uses **Fireworks AI** as the primary OCR vision model for receipt scanning, with **Groq vision** as automatic fallback. The OCR pipeline includes client-side image preprocessing (resize + compress), 4 retry attempts with 90s timeout, strict JSON prompt engineering, and robust response parsing.

> 💡 If the AI service is unreachable, the backend returns a clean **503** with a friendly message (never a crash or fake data). Rule-based features (BMI, wastage report) work even without any AI key.

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | UI Framework |
| Vite | Build Tool |
| React Router | Navigation |
| Tailwind CSS | Styling |
| Recharts | Data Visualization |
| Framer Motion | Animations |
| Axios | HTTP Client |
| Lucide React | Icons |

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js | Runtime Environment |
| Express.js | Web Framework |
| MongoDB | Database |
| Mongoose | ODM |
| JWT | Authentication |
| bcryptjs | Password Hashing |
| Multer | File Uploads |
| Node-Cron | Scheduled Tasks |
| Nodemailer | Email Notifications |
| Stripe | Payment Gateway |

### AI Service
| Technology | Purpose |
|------------|---------|
| Python 3.11–3.13 (**3.12 recommended**) | Runtime — note: 3.14 is **not** supported yet (deps won't build) |
| FastAPI | Web Framework |
| Uvicorn | ASGI Server |
| Groq | LLM (Llama-3.3) for meals/nutrition/chatbot **+ fallback OCR vision** |
| Fireworks AI | **Primary OCR vision model** for receipt scanning (kimi-k2p5) |
| Google Gemini | Optional vision/text AI |
| Pydantic | Data Validation |

### External APIs
- **Spoonacular** — Recipe & Nutrition Data
- **CalorieNinjas** — Calorie Information
- **Stripe** — Payment Processing

---

## 📂 Project Structure

```
Final Project-updated/
├── 📄 README.md                    # This file
├── 📄 Makefile                     # Quick start commands
├── 📄 .gitignore                   # Git ignore patterns
├── 📄 pyproject.toml               # Python project config
│
├── 🍽️ FoodGuard-Frontend/          # React Frontend
│   ├── src/
│   │   ├── components/             # Reusable UI components
│   │   ├── pages/                  # Page components
│   │   ├── services/               # API service functions
│   │   ├── context/                # React context providers
│   │   ├── hooks/                  # Custom React hooks
│   │   └── utils/                  # Utility functions
│   ├── public/                     # Static assets
│   ├── package.json                # Dependencies
│   ├── vite.config.js              # Vite configuration
│   └── tailwind.config.js          # Tailwind configuration
│
├── ⚙️ FoodGuard-Backend/            # Express Backend
│   ├── config/
│   │   └── db.js                   # MongoDB connection
│   ├── controllers/                # Request handlers
│   │   ├── auth.controller.js
│   │   ├── inventory.controller.js
│   │   ├── dashboard.controller.js
│   │   ├── alerts.controller.js
│   │   ├── meals.controller.js
│   │   ├── nutrition.controller.js
│   │   ├── settings.controller.js
│   │   ├── notifications.controller.js
│   │   └── contact.controller.js
│   ├── models/                     # Mongoose schemas
│   │   ├── User.js
│   │   ├── InventoryItem.js
│   │   ├── Notification.js
│   │   ├── Alert.js
│   │   ├── Recipe.js
│   │   └── ContactMessage.js
│   ├── routes/                     # Express routers
│   ├── middleware/                 # Custom middleware
│   │   ├── auth.js                # JWT authentication
│   │   ├── upload.js              # Multer file upload
│   │   └── errorHandler.js        # Error handling
│   ├── utils/                      # Utility functions
│   ├── uploads/                    # Uploaded files
│   ├── server.js                   # Entry point
│   ├── app.js                      # Express app config
│   └── package.json                # Dependencies
│
└── 🤖 FoodGuard-AI/                 # FastAPI AI Service
    ├── app/
    │   ├── core/
    │   │   └── config.py           # Settings management
    │   ├── models/
    │   │   └── schemas.py          # Pydantic schemas
    │   ├── routes/                 # API endpoints
    │   │   ├── ocr.py              # Receipt scanning
    │   │   ├── meal.py             # Meal recommendations
    │   │   ├── nutrition_analyze.py # Nutrition analysis
    │   │   ├── expiry.py           # Expiry insights
    │   │   ├── expiry_tips.py     # Expiry tips
    │   │   ├── dashboard.py       # Dashboard summary
    │   │   ├── health.py           # Health profile (BMI)
    │   │   ├── wastage.py          # Wastage reporting
    │   │   ├── meal_plan.py       # Condition-based meal plans
    │   │   └── chatbot.py          # AI chatbot
    │   ├── services/               # Business logic
    │   │   ├── groq_service.py    # Groq API client
    │   │   ├── gemini_service.py  # Gemini API client
    │   │   ├── prompt_engine.py   # AI prompt templates
    │   │   └── external_apis.py   # Spoonacular, CalorieNinjas
    │   └── main.py                 # FastAPI app
    ├── venv/                       # Python virtual environment
    ├── requirements.txt            # Python dependencies
    ├── .env                        # Environment variables
    └── sample_requests.json        # API request examples
```

---

## 🚀 Getting Started

### Prerequisites

| Software | Version | Notes |
|----------|---------|-------|
| Node.js | 18+ | Required for Frontend & Backend |
| Python | 3.11 - 3.13 (**3.12 recommended**) | AI Service — **not 3.14** (dependencies won't build) |
| MongoDB | 5.0+ | Local or Atlas cloud |
| Git | Latest | Version control |

### Required Accounts

1. **Fireworks AI** — https://fireworks.ai (**primary OCR** — required for best receipt scanning accuracy)
2. **Groq** — https://console.groq.com (**free, required** — powers meals, nutrition, chatbot, and OCR fallback)
3. **MongoDB Atlas** (optional locally, required for cloud) — https://www.mongodb.com/cloud/atlas
4. **Google Gemini** (optional) — https://aistudio.google.com/app/apikey
5. **Spoonacular** (optional) — https://spoonacular.com/food-api (richer recipe data)
6. **CalorieNinjas** (optional) — https://calorieninjas.com/api (nutrition lookups)
7. **Stripe** (optional) — https://stripe.com (only for the payment/upgrade feature)

---

## ⚙️ Environment Setup

### 1. Clone and Navigate

```bash
cd "Final Project-updated"
```

### 2. Backend Environment

Create `FoodGuard-Backend/.env`:

```env
NODE_ENV=development

# MongoDB (local, or your MongoDB Atlas string)
MONGO_URI=mongodb://127.0.0.1:27017/foodguard

# JWT Secrets — generate strong random strings, e.g.
#   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Frontend URL (for CORS) — no trailing slash
CLIENT_URL=http://localhost:3000

# Server Port (local only; on Render leave this unset — it provides PORT)
PORT=5001

# AI service base URL
FASTAPI_URL=http://localhost:8000

# Stripe (optional — billing returns a clean 503 until set)
# STRIPE_SECRET_KEY=sk_test_...
```

> 🔒 The backend **validates these on startup** and refuses to boot with a clear message if `MONGO_URI`, `JWT_SECRET`, or `JWT_REFRESH_SECRET` is missing — preventing confusing runtime 500s.

### 3. Frontend Environment

Update `FoodGuard-Frontend/.env`:

```env
# Local dev — the Vite dev server proxies /api to this origin
VITE_API_URL=http://localhost:5001/api

# Production (e.g. Vercel) — the URL the built app calls directly
# VITE_API_BASE=https://foodguard-fyp.onrender.com/api
```

### 4. AI Service Environment

Update `FoodGuard-AI/.env`:

```env
# Fireworks API — primary OCR vision model for receipt scanning.
# Without it, OCR falls back to Groq vision automatically.
FIREWORKS_API_KEY=your-fireworks-api-key

# Groq API — powers meals, nutrition, chatbot, AND fallback OCR.
# Required for non-OCR AI features.
GROQ_API_KEY=your-groq-api-key

# Optional extras
GEMINI_API_KEY=
SPOONACULAR_API_KEY=
CALORIENINJAS_API_KEY=

# Server Settings
LOG_LEVEL=INFO
```

---

## 💻 Running the Application

### Option 1: Using Make (Recommended)

```bash
# Install all dependencies
make install

# Run all three services
make up

# Or run individually:
make run-ai      # AI Service :8000
make run-backend # Express Backend :5001
make run-frontend # React Frontend :3000

# Stop all services
make stop
```

### Option 1b: Windows (one-click scripts)

`make` is a Unix tool, so on Windows use the included batch scripts in the project root:

```bat
setup.bat   :: one-time — creates the Python venv (3.12) + installs all dependencies
dev.bat     :: starts all 3 services (each in its own window)
stop.bat    :: stops everything on ports 8000 / 5001 / 3000
```

> `setup.bat` auto-detects Python **3.12 → 3.11 → 3.13**. If none are installed, run `winget install Python.Python.3.12` first.

### Option 2: Manual Setup

#### Step 1: Start MongoDB

```bash
# Option A: Local MongoDB
mongod

# Option B: Docker
docker run -d --name foodguard-mongo -p 27017:27017 mongo:7
```

#### Step 2: Install Frontend Dependencies

```bash
cd FoodGuard-Frontend
npm install
```

#### Step 3: Install Backend Dependencies

```bash
cd FoodGuard-Backend
npm install
```

#### Step 4: Install AI Service Dependencies

Use **Python 3.12** (3.11/3.13 also work; **3.14 will fail** to build the dependencies):

```bash
cd FoodGuard-AI

# macOS / Linux
python3.12 -m venv venv
./venv/bin/python -m pip install -r requirements.txt

# Windows (PowerShell / CMD)
py -3.12 -m venv venv
venv\Scripts\python -m pip install -r requirements.txt
```

#### Step 5: Start All Services

**Terminal 1 — AI Service:**
```bash
cd FoodGuard-AI
# macOS / Linux
./venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
# Windows
venv\Scripts\python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 2 — Backend:**
```bash
cd FoodGuard-Backend
npm run dev
```

**Terminal 3 — Frontend:**
```bash
cd FoodGuard-Frontend
npm run dev
```

---

## 🔗 API Endpoints

### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/signup` | ❌ | User registration |
| POST | `/api/auth/login` | ❌ | User login |
| POST | `/api/auth/logout` | ✓ | User logout |
| POST | `/api/auth/refresh` | ❌ | Refresh token |
| GET | `/api/auth/profile` | ✓ | Get user profile |
| POST | `/api/auth/forgot-password` | ❌ | Password reset request |
| POST | `/api/auth/reset-password` | ❌ | Reset password |

### Inventory
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/inventory` | ✓ | Get all inventory items |
| POST | `/api/inventory` | ✓ | Add new item |
| PUT | `/api/inventory/:id` | ✓ | Update item |
| DELETE | `/api/inventory/:id` | ✓ | Delete item |

### Dashboard
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/dashboard` | ✓ | Get dashboard data |

### Alerts
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/alerts` | ✓ | Get all alerts |
| PATCH | `/api/alerts/:id/dismiss` | ✓ | Dismiss alert |

### Meals
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/meals/recommend` | ✓ | Get meal recommendations |
| GET | `/api/meals/recipe/:id` | ✓ | Get recipe details |
| POST | `/api/meals/saved/:id` | ✓ | Save meal |
| POST | `/api/meals/upload` | ✓ | Upload recipe (multipart) |

### Nutrition
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/nutrition/analyze` | ✓ | Analyze nutrition |
| GET | `/api/nutrition/report` | ✓ | Get nutrition report |

### Settings
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/settings/profile` | ✓ | Get profile |
| PUT | `/api/settings/profile` | ✓ | Update profile |
| PUT | `/api/settings/password` | ✓ | Change password |
| GET | `/api/settings/preferences` | ✓ | Get preferences |
| PUT | `/api/settings/preferences` | ✓ | Update preferences |
| GET | `/api/settings/health-profile` | ✓ | Get health condition & dietary preferences |
| PUT | `/api/settings/health-profile` | ✓ | Update health condition & dietary preferences |
| DELETE | `/api/settings/account` | ✓ | Delete account |

### AI Service Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/ai/scan-receipt` | OCR receipt scanning |
| POST | `/ai/recommend-meals` | AI meal recommendations |
| POST | `/ai/analyze-nutrition` | Nutrition analysis |
| POST | `/ai/condition-meal-plan` | Condition-based meal plans |
| POST | `/ai/expiry-tips` | Expiry tips |
| POST | `/ai/health-profile` | BMI calculation |
| POST | `/ai/wastage-report` | Wastage reporting |
| POST | `/ai/dashboard-summary` | Dashboard AI insights |
| POST | `/ai/chatbot` | AI chatbot |

---

## 📱 Frontend Screenshots

The FoodGuard frontend includes the following main screens:

1. **Landing Page** — Hero section, features, call-to-action
2. **Authentication** — Login, Signup, Forgot Password
3. **Dashboard** — Overview, stats, quick actions
4. **Inventory** — List, add, edit, delete items
5. **Meal Recommendations** — AI-powered suggestions
6. **Nutrition Analysis** — Detailed nutritional info
7. **Expiry Alerts** — Items about to expire
8. **Settings** — Profile, preferences, notifications

---

## 🔧 Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| `MONGO_URI missing` | Ensure `.env` file exists in `FoodGuard-Backend/` |
| `ECONNREFUSED 127.0.0.1:27017` | Start MongoDB or use Atlas URI |
| `Network Error` in frontend | Check backend is running on port 5001 |
| CORS errors | Ensure `CLIENT_URL` matches frontend URL |
| AI service not responding | Check API keys in `FoodGuard-AI/.env` |
| `ECONNREFUSED 127.0.0.1:8000` | Start FastAPI AI service on port 8000 |
| `401 Not authorized` | Token missing/expired — the app auto-logs-out on 401; sign in again |
| `Recipe shows wrong data` | Fixed — recipes are persisted per user, so the correct one always opens |
| **(Render)** `No open ports detected` | Backend start command must be `npm start` (not `npm run dev`); AI must use `--port $PORT`. **Do not set `PORT`/`APP_PORT`.** |
| **(Render)** `Could not import module "app.main"` | `FoodGuard-AI/app/main.py` was excluded by `.gitignore` — ensure it's committed (`git add -f FoodGuard-AI/app/main.py`) |
| **(Local)** `No suitable Python runtime` / pydantic build fails | You're on Python 3.14 — use **3.12** (`py -3.12 -m venv venv`) |
| **(Deploy)** CORS blocked / no `Access-Control-Allow-Origin` | Set backend `CLIENT_URL` to the exact frontend origin, **no trailing slash** |
| **(Deploy)** `Network Error` on login (services up) | Set Vercel `VITE_API_BASE` to the backend URL **and redeploy**; check Atlas allows `0.0.0.0/0` |

### Production Deployment (Live Setup)

The live system runs on **Vercel + Render + MongoDB Atlas**. Each service is a separate deployment from the **same GitHub repo** (set the **Root Directory** accordingly).

**1. MongoDB Atlas (database)**
- Create a free cluster + a database user.
- **Network Access → add `0.0.0.0/0`** (Render's IPs vary, so it must allow all).
- Connection string: `mongodb+srv://USER:PASS@cluster.xxxx.mongodb.net/foodguard?retryWrites=true&w=majority`

**2. Render — Backend (`FoodGuard-Backend`)**
- Build command: `npm install`
- **Start command: `npm start`** ⚠️ *(not `npm run dev` — nodemon is dev-only and causes "no open ports detected")*
- Env vars: `NODE_ENV=production`, `MONGO_URI`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `CLIENT_URL`, `FASTAPI_URL`
- ⚠️ **Do not set `PORT`** — Render assigns it automatically.
- `CLIENT_URL` must be the **exact** Vercel URL with **no trailing slash** (e.g. `https://food-guard-fypp.vercel.app`).

**3. Render — AI Service (`FoodGuard-AI`)**
- Build command: `pip install -r requirements.txt`
- **Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`**
- Env vars: `GROQ_API_KEY`, `PYTHON_VERSION=3.12.7` (optional: `FIREWORKS_API_KEY`, `GEMINI_API_KEY`, `SPOONACULAR_API_KEY`, `CALORIENINJAS_API_KEY`)
- ⚠️ **Do not set `APP_PORT`** — the start command uses `$PORT`.

**4. Vercel — Frontend (`FoodGuard-Frontend`)**
- Build command: `npm run build` · Output directory: `dist`
- Env var: **`VITE_API_BASE=https://foodguard-fyp.onrender.com/api`**
- ⚠️ **Redeploy after changing env vars** — Vite bakes them in at build time.

Then verify the deployment via the health endpoints: `/<backend>/api/health` and `/<ai>/health`.

### Getting Help

1. Check the console/terminal for error messages
2. Verify all `.env` files are properly configured
3. Ensure MongoDB is running
4. Check API key validity
5. Test AI service health: `curl http://localhost:8000/health`

---

## 🔮 Future Enhancements

### Planned Features

- [ ] **Mobile App** — React Native / Expo mobile application
- [ ] **PWA Support** — Progressive Web App for offline capability
- [ ] **Barcode Scanning** — Scan product barcodes for quick add
- [ ] **Shopping List** — Auto-generate shopping list from low inventory
- [ ] **Recipe Sharing** — Social features to share recipes
- [ ] **Multi-language** — Support for multiple languages
- [ ] **Push Notifications** — Native push notifications
- [ ] **Dietary Restrictions** — Support for allergies, vegan, keto, etc.
- [ ] **Meal Planning Calendar** — Weekly/monthly meal planning
- [ ] **Family Accounts** — Share inventory across family members

---

## 📄 License

This project is licensed under the **MIT License**.

---

## 👨‍💻 Authors

**Amna Zahid, Khadija Safdar & Aiza Rasool**
- Final Year BS Software Engineering Students
- Project: FoodGuard — AI-Powered Food Management System

---

## 👥 Project Team & Contributions

This project was developed as a Final Year Project for the BS Software Engineering degree. The work was divided based on specialized roles to ensure technical stability, efficient design, and comprehensive documentation.

| Team Member | Role | Key Contributions |
| :--- | :--- | :--- |
| **Amna Zahid** | **Lead Developer & AI Engineer** | Conceptualized project; authored proposal; designed UI/UX (Figma); developed frontend (React/Vite); architected FastAPI microservice; integrated AI providers (Fireworks, Groq, Gemini, Spoonacular, CalorieNinjas); implemented Stripe payment gateway; managed CI/CD deployment and technical report updates. |
| **Khadija Safdar** | **Backend & Frontend Developer** | Enhanced frontend responsiveness; developed core backend services; managed MongoDB database integration and backend-to-frontend API connectivity. |
| **Aiza Rasool** | **Documentation Lead** | Authored the initial project report; assisted in proposal writing; conducted research and created survey questionnaires for user feedback; collaborated on report revisions. |

---

## 🙏 Acknowledgments

- **Groq** — For providing free LLM API access
- **Google Gemini** — For AI vision and text capabilities
- **Fireworks AI** — For OCR (scan receipt) feature capability
- **MongoDB** — For database hosting support
- **Open Source Community** — For all the amazing libraries used
- **Spoonacular** — For Meal Recommendations capabilities
- **CalorieNinjas** — For Nutrition Analysis capabilities
- **Stripe** — For payment processing infrastructure

---

<p align="center">
  Made with ❤️ by Amna Zahid, Khadija Safdar, & Aiza Rasool
</p>
