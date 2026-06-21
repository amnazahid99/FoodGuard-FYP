# FoodGuard Frontend

React + Vite frontend for FoodGuard — an intelligent food management system.

## Features

- **Authentication** — JWT-based signup, login, logout with refresh tokens
- **Dashboard** — Statistics, charts, and expiry insights
- **Inventory Management** — Add, remove, consume items; search and filter
- **Receipt Scanning (OCR)** — Upload receipt images for automatic item extraction via Fireworks AI
- **AI Meal Recommendations** — Personalized recipes based on inventory, dietary preferences, and health conditions
- **7-Day Meal Planning** — Condition-based meal plans (diabetes, weight loss, etc.)
- **AI Chatbot** — Interactive cooking and nutrition assistant
- **Dark/Light Theme** — Full theme toggle with persistent preference

## Tech Stack

| Technology | Purpose |
|------------|---------|
| React 18 | UI Framework |
| Vite | Build Tool |
| React Router | Navigation |
| Tailwind CSS | Styling |
| Recharts | Data Visualization |
| Framer Motion | Animations |
| Axios | HTTP Client |

## Setup

```bash
cd FoodGuard-Frontend
npm install
npm run dev
```

Open http://localhost:5173

## Environment Variables

Create `.env` file:

```env
VITE_API_URL=http://localhost:5001/api
VITE_STRIPE_PUBLISHABLE_KEY=  # Optional - for payments
```

## Theme System

The app supports dark and light themes. Theme preferences are persisted in localStorage.

- `src/styles/theme/lightTheme.js` — Light theme color tokens
- `src/contexts/ThemeContext.jsx` — Theme context provider
- `src/components/layout/ThemeToggle.jsx` — Theme toggle component