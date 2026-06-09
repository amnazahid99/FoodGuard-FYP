# FoodGuard — run all three services with one command.
#
# Quick start:
#   make install   # one-time: install deps for AI + Backend + Frontend
#   make up        # install-if-needed, then run all three together
#
# AI service needs Python 3.11–3.13 (your default python3 is 3.14, which
# cannot build pydantic-core). Override with: make install PYTHON=python3.12

SHELL := /bin/bash
PYTHON ?= python3.11
.DEFAULT_GOAL := help

.PHONY: help install install-ai install-backend install-frontend ensure-deps \
        up run run-ai run-backend run-frontend build check-mongo mongo stop clean

help:
	@echo ""
	@echo "FoodGuard — available commands:"
	@echo "  make install       Install deps for all three services (one-time)"
	@echo "  make up            Install if needed + run all three   (recommended)"
	@echo "  make run           Run all three together (Ctrl+C stops all)"
	@echo "  make run-ai        Run only the FastAPI AI service  (:8000)"
	@echo "  make run-backend   Run only the Express backend      (:5001)"
	@echo "  make run-frontend  Run only the React frontend       (:3000)"
	@echo "  make mongo         Start MongoDB in Docker (port 27017)"
	@echo "  make build         Production build of the frontend"
	@echo "  make stop          Kill anything on :8000 :5001 :3000"
	@echo "  make clean         Remove venv, node_modules, dist"
	@echo ""
	@echo "  AI requires Python 3.11-3.13 (current PYTHON=$(PYTHON))"
	@echo ""

# ---------------- install ----------------
install: install-ai install-backend install-frontend
	@echo "✓ All dependencies installed. Run 'make up' to start everything."

install-ai:
	@command -v $(PYTHON) >/dev/null 2>&1 || { echo "✗ $(PYTHON) not found. Install Python 3.11-3.13, or run: make install PYTHON=python3.12"; exit 1; }
	cd FoodGuard-AI && { test -d venv || $(PYTHON) -m venv venv; } && ./venv/bin/pip install --quiet --upgrade pip && ./venv/bin/pip install -r requirements.txt
	@echo "✓ AI service ready (FoodGuard-AI/venv)"

install-backend:
	cd FoodGuard-Backend && npm install --no-audit --no-fund
	@echo "✓ Backend ready"

install-frontend:
	cd FoodGuard-Frontend && npm install --no-audit --no-fund
	@echo "✓ Frontend ready"

# ---------------- run ----------------
ensure-deps:
	@test -d FoodGuard-AI/venv || test -d FoodGuard-AI/.venv || $(MAKE) install-ai
	@test -d FoodGuard-Backend/node_modules  || $(MAKE) install-backend
	@test -d FoodGuard-Frontend/node_modules || $(MAKE) install-frontend

up: ensure-deps run

run: check-mongo
	@test -d FoodGuard-AI/venv || test -d FoodGuard-AI/.venv || { echo "✗ AI venv missing — run 'make install' first"; exit 1; }
	@echo "▶ AI :8000  |  Backend :5001  |  Frontend :3000   (press Ctrl+C to stop all)"
	@trap 'kill 0' INT TERM EXIT; \
		if [ -d FoodGuard-AI/venv ]; then \
			( cd FoodGuard-AI && exec ./venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload ) & \
		else \
			( cd FoodGuard-AI && exec ./.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload ) & \
		fi; \
		( cd FoodGuard-Backend && exec npm run dev ) & \
		( cd FoodGuard-Frontend && exec npm run dev ) & \
		wait

run-ai:
	cd FoodGuard-AI && ./venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

run-backend:
	cd FoodGuard-Backend && npm run dev

run-frontend:
	cd FoodGuard-Frontend && npm run dev

# ---------------- misc ----------------
build:
	cd FoodGuard-Frontend && npm run build

check-mongo:
	@pgrep -x mongod >/dev/null 2>&1 && echo "✓ MongoDB is running" || echo "⚠️  MongoDB not detected — start it ('make mongo' for Docker, or 'brew services start mongodb-community'). The backend needs it."

mongo:
	@docker start foodguard-mongo 2>/dev/null || docker run -d --name foodguard-mongo -p 27017:27017 mongo:7
	@echo "✓ MongoDB running on :27017 (container: foodguard-mongo)"

stop:
	@powershell -Command "Get-NetTCPConnection -LocalPort 8000,5001,3000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $$_.OwningProcess -Force -ErrorAction SilentlyContinue }" 2>/dev/null || true
	@echo "✓ Stopped services on :8000 :5001 :3000"

clean:
	rm -rf FoodGuard-AI/venv FoodGuard-Backend/node_modules FoodGuard-Frontend/node_modules FoodGuard-Frontend/dist
	@echo "✓ Cleaned venv, node_modules, dist"
