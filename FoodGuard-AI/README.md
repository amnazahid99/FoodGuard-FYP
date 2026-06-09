# 🤖 FoodGuard-AI Service

<p align="center">
  <img src="https://img.shields.io/badge/FastAPI-Python-blue" alt="FastAPI">
  <img src="https://img.shields.io/badge/Python-3.11+-yellow" alt="Python">
  <img src="https://img.shields.io/badge/AI-Groq%20%2B%20Gemini-green" alt="AI APIs">
  <img src="https://img.shields.io/badge/License-MIT-yellow" alt="License">
</p>

> AI Microservice for FoodGuard — Provides intelligent features including meal recommendations, nutrition analysis, receipt scanning (OCR), health profiling, and more.

---

## 📋 Table of Contents

- [🧠 Overview](#-overview)
- [🏗️ Architecture](#️-architecture)
- [✨ Features](#-features)
- [📦 Dependencies](#-dependencies)
- [⚙️ Environment Setup](#️-environment-setup)
- [🚀 Running the Service](#-running-the-service)
- [🔗 API Endpoints](#-api-endpoints)
- [💡 Request/Response Examples](#-requestresponse-examples)
- [🔧 Troubleshooting](#-troubleshooting)
- [📄 License](#-license)

---

## 🧠 Overview

FoodGuard-AI is a **FastAPI-based microservice** that powers all the intelligent features of the FoodGuard system. It acts as an abstraction layer over external AI APIs, providing a unified interface for:

- **Natural Language Processing** via Groq (Llama, Mixtral models)
- **Computer Vision** via Google Gemini
- **External Food APIs** (Spoonacular, CalorieNinjas) as fallbacks

The service is **stateless** — it doesn't connect to MongoDB; it only processes requests from the Express backend and returns AI-generated responses.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Express.js Backend                          │
│                      :5001                                       │
└─────────────────────────────┬───────────────────────────────────┘
                              │ HTTP / REST
┌─────────────────────────────▼───────────────────────────────────┐
│                   FoodGuard-AI Service (Python)                  │
│                      :8000                                        │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    FastAPI App                               ││
│  ├─────────────────────────────────────────────────────────────┤│
│  │  Routes (OCR, Meals, Nutrition, Health, etc.)             ││
│  ├─────────────────────────────────────────────────────────────┤│
│  │  Services Layer                                             ││
│  │  ├── groq_service.py     → Llama-3.3-70b-versatile         ││
│  │  ├── gemini_service.py  → Gemini Vision (OCR)               ││
│  │  ├── prompt_engine.py  → AI prompt templates              ││
│  │  └── external_apis.py   → Spoonacular, CalorieNinjas       ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Technology | Purpose |
|------------|---------|
| **Python 3.11+** | Runtime |
| **FastAPI** | Web Framework |
| **Uvicorn** | ASGI Server |
| **Pydantic** | Data Validation |
| **Groq** | LLM (Llama-3.3-70b-versatile) |
| **Google Gemini** | Vision & Text AI |
| **httpx** | Async HTTP Client |

---

## ✨ Features

| Feature | Endpoint | Description |
|---------|----------|-------------|
| **F1: Receipt Scanning (OCR)** | `POST /ai/scan-receipt` | Extract item details from receipt images using Gemini Vision |
| **F2: Meal Recommendations** | `POST /ai/recommend-meals` | AI-powered meal suggestions based on available inventory |
| **F3: Nutrition Analysis** | `POST /ai/analyze-nutrition` | Detailed nutritional breakdown of meals/ingredients |
| **F4: Condition-Based Meal Plans** | `POST /ai/condition-meal-plan` | Generate meal plans for dietary conditions (diabetes, weight loss, etc.) |
| **F5: Expiry Tips** | `POST /ai/expiry-tips` | AI-generated tips for handling expiring items |
| **F6: Health Profile (BMI)** | `POST /ai/health-profile` | Calculate BMI and provide diet recommendations |
| **F7: Wastage Reporting** | `POST /ai/wastage-report` | Analyze and report food wastage patterns |
| **Dashboard Summary** | `POST /ai/dashboard-summary` | AI-generated insights for the dashboard |
| **AI Chatbot** | `POST /ai/chatbot` | Interactive chatbot for food-related queries |

### Feature Mapping

The features are numbered according to the FYP requirements:

- **F1** → Receipt Scanning (OCR)
- **F2** → Meal Recommendations  
- **F3** → Nutrition Analysis
- **F4** → Condition-Based Meal Plans
- **F5** → Expiry Tips
- **F6** → Health Profile (BMI)
- **F7** → Wastage Reporting

---

## 📦 Dependencies

```txt
fastapi==0.115.0
uvicorn==0.31.0
pydantic==2.9.0
pydantic-settings==2.5.0
python-dotenv==1.0.1
httpx==0.27.2
aiofiles==24.1.0
python-json-logger==2.0.7
redis==5.2.0
google-generativeai==0.8.3
groq==0.4.2
requests==2.31.0
```

### Installing Dependencies

```bash
# Using uv (recommended)
uv sync

# Or using pip
pip install -r requirements.txt
```

---

## ⚙️ Environment Setup

### Required API Keys

1. **Groq API Key** — Get from [console.groq.com](https://console.groq.com)
2. **Google Gemini API Key** — Get from [aistudio.google.com](https://aistudio.google.com/app/apikey)
3. **Fireworks API Key** — Get from [https://app.fireworks.ai/](https://docs.fireworks.ai/api-reference/create-api-key)

### Optional API Keys

3. **Spoonacular API Key** — Get from [spoonacular.com/food-api](https://spoonacular.com/food-api) (for enhanced recipe data)
4. **CalorieNinjas API Key** — Get from [calorieninjas.com/api](https://calorieninjas.com/api) (for calorie info)

### Creating .env File

Create `FoodGuard-AI/.env`:

```env
# ===========================================
# Required API Keys
# ===========================================

# Groq API (required) - Get from https://console.groq.com
GROQ_API_KEY=your-groq-api-key-here

# Gemini API (required) - Get from https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your-gemini-api-key-here

# ===========================================
# Optional API Keys
# ===========================================

# Spoonacular API (optional) - Get from https://spoonacular.com/food-api
SPOONACULAR_API_KEY=your-spoonacular-api-key-here

# CalorieNinjas API (optional) - Get from https://calorieninjas.com/api
CALORIENINJAS_API_KEY=your-calorieninjas-api-key-here

# ===========================================
# Server Settings
# ===========================================
APP_HOST=0.0.0.0
APP_PORT=8000
LOG_LEVEL=INFO
```

> ⚠️ **Note:** The service will NOT start without `GROQ_API_KEY` and `GEMINI_API_KEY` — these are validated by Pydantic at boot.

---

## 🚀 Running the Service

### Option 1: Using Make (from project root)

```bash
# Install AI dependencies and run
make run-ai
```

### Option 2: Manual Setup

```bash
# Navigate to AI service directory
cd FoodGuard-AI

# Install dependencies
uv sync

# Run the service
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Verify It's Running

```bash
# Health check
curl http://localhost:8000/health

# Root endpoint
curl http://localhost:8000/
```

Expected response for health check:
```json
{
  "status": "healthy",
  "groq_api": true,
  "gemini_api": true,
  "timestamp": "2024-01-01T12:00:00"
}
```

---

## 🔗 API Endpoints

All endpoints are under the `/ai/` prefix.

| Method | Endpoint | Feature | Description |
|--------|----------|---------|-------------|
| POST | `/ai/scan-receipt` | F1 | OCR receipt scanning |
| POST | `/ai/recommend-meals` | F2 | AI meal recommendations |
| POST | `/ai/analyze-nutrition` | F3 | Nutrition analysis |
| POST | `/ai/condition-meal-plan` | F4 | Condition-based meal plans |
| POST | `/ai/expiry-tips` | F5 | Expiry tips |
| POST | `/ai/health-profile` | F6 | BMI calculation & recommendations |
| POST | `/ai/wastage-report` | F7 | Wastage reporting |
| POST | `/ai/dashboard-summary` | — | Dashboard AI insights |
| POST | `/ai/chatbot` | — | AI chatbot |

### Request Format

All endpoints accept JSON bodies. Example:

```json
{
  "inventory": [
    {"name": "Chicken", "quantity": 500, "unit": "g", "category": "protein"},
    {"name": "Rice", "quantity": 1, "unit": "kg", "category": "grains"}
  ],
  "preferences": ["quick", "healthy"]
}
```

---

## 💡 Request/Response Examples

### F2: Meal Recommendations

**Request:**
```json
POST /ai/recommend-meals
{
  "inventory": [
    {"name": "Chicken", "quantity": 500, "unit": "g", "category": "protein"},
    {"name": "Broccoli", "quantity": 200, "unit": "g", "category": "vegetables"}
  ],
  "mealType": "dinner",
  "servings": 2
}
```

**Response:**
```json
{
  "success": true,
  "meals": [
    {
      "name": "Grilled Chicken with Broccoli",
      "description": "Simple and healthy grilled chicken served with steamed broccoli",
      "ingredients": [
        {"item": "Chicken", "amount": "400g"},
        {"item": "Broccoli", "amount": "200g"}
      ],
      "instructions": [
        "Season chicken with salt, pepper, and olive oil",
        "Grill for 6-7 minutes per side",
        "Steam broccoli until tender",
        "Serve together"
      ],
      "nutrition": {
        "calories": 420,
        "protein": "45g",
        "carbs": "10g",
        "fat": "18g"
      },
      "prepTime": "25 minutes"
    }
  ]
}
```

### F6: Health Profile (BMI)

**Request:**
```json
POST /ai/health-profile
{
  "weight": 70,
  "height": 1.65,
  "age": 25,
  "gender": "female",
  "activityLevel": "moderate"
}
```

**Response:**
```json
{
  "success": true,
  "bmi": 25.7,
  "category": "Overweight",
  "recommendations": [
    "Aim for 150 minutes of moderate exercise per week",
    "Reduce caloric intake by 300-500 calories daily",
    "Increase protein intake to support metabolism",
    "Focus on whole grains and vegetables"
  ],
  "dailyCalories": 1800
}
```

---

## 🔧 Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| `GROQ_API_KEY is required` | Add your Groq API key to `.env` |
| `GEMINI_API_KEY is required` | Add your Gemini API key to `.env` |
| `ModuleNotFoundError` | Run `uv sync` to install dependencies |
| `Connection refused :8000` | Ensure the service is running |
| `CORS errors` | Check that backend `FASTAPI_URL` matches |

### Health Check

Check if APIs are working:

```bash
curl http://localhost:8000/health
```

If `groq_api` or `gemini_api` is `false`, check your API keys.

### Testing Endpoints

Use the sample requests in `sample_requests.json`:

```bash
curl -X POST http://localhost:8000/ai/recommend-meals \
  -H "Content-Type: application/json" \
  -d @sample_requests.json
```

---

## 📄 License

This project is part of **FoodGuard** and is licensed under the **MIT License**.

---

## 👥 Author

- **Amna Zahid** — AI Service Development

<p align="center">
  Made with ❤️
</p>
