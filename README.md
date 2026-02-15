# Team Task Board (FastAPI + React/TS/Redux/Tailwind)

This repo scaffolds a priority-aware Kanban board with JWT authentication, optimistic UI, deterministic ordering, and per-task activity feeds.

## Stack
- Backend: FastAPI, SQLAlchemy 2.0 (async, Postgres via asyncpg), Alembic, JWT Auth (python-jose + passlib)
- Frontend: React + TypeScript + Redux Toolkit + RTK Query + Tailwind + React Router

## Quick Start with Docker (Recommended)
```bash
cp .env.example .env
docker-compose up --build
```
- API: http://localhost:8000 (docs at /docs)
- Frontend: http://localhost:5174 (or 5173 if available)
- Postgres: localhost:5432

## Authentication
The app uses JWT Bearer tokens with 7-day expiry. Protected routes require authentication.

**Note:** You can login with either your **username** OR **email** - both work!

### API Endpoints
- `POST /api/auth/signup` - Create new account (email, username, password, full_name)
- `POST /api/auth/login` - Login with username or email → returns JWT token
- `GET /api/auth/me` - Get current user info (requires Bearer token)

### Testing Auth
```bash
# Signup
curl -X POST http://localhost:8000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"testuser","password":"testpass123","full_name":"Test User"}'

# Login with username
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpass123"}'

# Login with email
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test@example.com","password":"testpass123"}'
  -d '{"username":"testuser","password":"testpass123"}'

# Get user info (use token from login response)
curl -X GET http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer <your_token_here>"
```

## Run backend (dev without Docker)
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
cd backend && alembic upgrade head
uvicorn app.main:app --reload --app-dir backend
```

## Run frontend (dev)
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```
Frontend will be at http://localhost:5173 or 5174.

## Design notes (high level)
- **JWT Authentication**: Bearer tokens with 7-day expiry, bcrypt password hashing
- **Versioned writes** (`Task.version`) to detect stale updates (409 on mismatch)
- **Deterministic ordering**: `ordering_index` float per column; server returns canonical values
- **Activity timeline**: per-task `activity_seq` for stable sort even under concurrency
- **Priority queue**: order by priority, then ordering_index, then id; exposed via `/api/queue/next` (to add)
- **Optimistic UI**: client applies change, rolls back on 409/500, shows conflict bar

See also `docs/concurrency.md`, `docs/priority_queue.md`, and `docs/differentiators.md` for deeper notes.

## Project Structure
```
backend/
  app/
    models/          # SQLAlchemy models (Task, Activity, Comment, User)
    schemas/         # Pydantic schemas
    services/        # Business logic (task_service, activity_service, user_service)
    api/routes/      # FastAPI routes (tasks, activities, comments, auth)
    core/            # Config, DB, security utilities
  alembic/           # Database migrations
  
frontend/
  src/
    components/      # React components (Board, Column, TaskCard, Login, Signup)
    features/        # Redux slices (tasks, auth)
    lib/             # API setup (RTK Query)
```

## Completed Features
✅ JWT-based authentication with signup/login
✅ Protected routes (frontend + backend)
✅ Task CRUD with versioned writes
✅ Activity logging with monotonic sequencing
✅ Priority-based task ordering
✅ Docker Compose setup
✅ Alembic migrations
✅ Frontend auth UI (Login, Signup)
✅ Token-based API calls

## Next Steps
- Add drag-and-drop (dnd-kit when versions stabilize)
- Queue endpoint `/api/queue/next`
- Bulk operations with partial success
- Activity feed UI with pagination
- Comments UI
- Conflict bar UI for version mismatches
- Tests (backend + frontend)
