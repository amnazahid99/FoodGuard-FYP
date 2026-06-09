# FoodGuard Backend (MERN — Express + MongoDB)

MVC-structured Express API aligned with the **FoodGuard-Frontend-v2** Axios services.

## Quick start

```bash
cd FoodGuard-Backend
cp .env.example .env       # then edit MONGO_URI + JWT secrets
npm install
npm run dev                # starts on http://localhost:5000
```

Frontend `.env`:
```
VITE_API_URL=http://localhost:5000/api
```

## Project structure (MVC)

```
FoodGuard-Backend/
├── server.js                 # bootstrap
├── app.js                    # express app + routes mounting
├── config/db.js              # MongoDB connection
├── models/                   # Mongoose schemas (M)
│   ├── User.js
│   ├── InventoryItem.js
│   ├── Notification.js
│   ├── Alert.js
│   ├── Recipe.js
│   └── ContactMessage.js
├── controllers/              # request handlers (C)
│   ├── auth.controller.js
│   ├── inventory.controller.js
│   ├── dashboard.controller.js
│   ├── alerts.controller.js
│   ├── meals.controller.js
│   ├── nutrition.controller.js
│   ├── settings.controller.js
│   ├── notifications.controller.js
│   └── contact.controller.js
├── routes/                   # express routers (V — view = JSON)
│   └── *.routes.js
├── middleware/
│   ├── auth.js               # JWT protect
│   ├── upload.js             # multer
│   └── errorHandler.js
├── utils/generateToken.js
└── uploads/                  # served at /uploads
```

## Endpoint map (matches frontend services exactly)

| Method | Path | Auth |
|--------|------|------|
| POST   | /api/auth/signup            |  |
| POST   | /api/auth/login             |  |
| POST   | /api/auth/logout            |  |
| POST   | /api/auth/refresh           |  |
| GET    | /api/auth/profile           | ✓ |
| POST   | /api/auth/forgot-password   |  |
| POST   | /api/auth/reset-password    |  |
| GET    | /api/inventory              | ✓ |
| POST   | /api/inventory              | ✓ |
| PUT    | /api/inventory/:id          | ✓ |
| DELETE | /api/inventory/:id          | ✓ |
| GET    | /api/dashboard              | ✓ |
| GET    | /api/alerts                 | ✓ |
| PATCH  | /api/alerts/:id/dismiss     | ✓ |
| POST   | /api/meals/recommend        | ✓ |
| GET    | /api/meals/recipe/:id       | ✓ |
| POST   | /api/meals/saved/:id        | ✓ |
| POST   | /api/meals/upload           | ✓ (multipart) |
| POST   | /api/nutrition/analyze      | ✓ |
| GET    | /api/nutrition/report       | ✓ |
| GET    | /api/settings/profile       | ✓ |
| PUT    | /api/settings/profile       | ✓ |
| PUT    | /api/settings/password      | ✓ |
| GET    | /api/settings/preferences   | ✓ |
| PUT    | /api/settings/preferences   | ✓ |
| PUT    | /api/settings/notifications | ✓ |
| DELETE | /api/settings/account       | ✓ |
| POST   | /api/contact                |  |
| GET    | /api/notifications          | ✓ |
| PATCH  | /api/notifications/:id/read | ✓ |
| DELETE | /api/notifications          | ✓ |
| GET    | /api/health                 |  |

## Response shapes

All login/signup responses return `{ token, refreshToken, user }` — matching
the frontend `authService.login/signup` that destructures any of
`data.token | data.accessToken`, `data.user | data.profile`, `data.refreshToken`.

`GET /api/inventory` returns `{ items: [...] }`.
`POST /api/inventory` returns `{ item: {...} }`.
`GET /api/dashboard` returns `{ stats, inventoryBreakdown, weeklyTrend, upcomingItems, recentActivity, recipes }`.

## Auth

Stateless JWT in `Authorization: Bearer <token>`. Refresh tokens issued on
login/signup; frontend posts to `/api/auth/refresh` automatically on 401.

## Notes

- Nutrition + meal recommendations ship as deterministic stubs ready to be
  swapped for a real provider (e.g. Spoonacular / OpenAI).
- Forgot-password returns the reset token in dev mode (`NODE_ENV=development`)
  so you can test without an SMTP server. Wire `nodemailer` in
  `controllers/auth.controller.js` for production.
