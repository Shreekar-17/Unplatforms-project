# Team Task Board (FastAPI + React/TS/Redux/Tailwind)

This repo scaffolds a priority-aware Kanban board with optimistic UI, deterministic ordering, and per-task activity feeds.

## Stack
- Backend: FastAPI, SQLAlchemy 2.0 (async, Postgres via asyncpg), Alembic
- Frontend: React + TypeScript + Redux Toolkit + RTK Query + Tailwind + @dnd-kit (to be added)

## Run backend (dev)
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn app.main:app --reload --app-dir backend
```

## Run with Docker
```bash
cp .env.example .env
docker-compose up --build
```
API will be at http://localhost:8000, Postgres at localhost:5432.

## Run frontend (dev)
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```
Frontend will be at http://localhost:5173.

## Design notes (high level)
- Versioned writes (`Task.version`) to detect stale updates (409 on mismatch).
- Deterministic ordering: `ordering_index` float per column; server returns canonical values.
- Activity timeline: per-task `activity_seq` for stable sort even under concurrency.
- Priority queue: order by priority, then ordering_index, then id; exposed via `/api/queue/next` (to add).
- Optimistic UI: client applies change, rolls back on 409/500, shows conflict bar.

See also `docs/concurrency.md`, `docs/priority_queue.md`, and `docs/differentiators.md` for deeper notes.

## Next steps
- Add Alembic migrations.
- Add queue endpoint and bulk operations with partial success payloads.
- Scaffold frontend (Vite + RTK + Tailwind) and wire board, drag/drop, optimistic flows.
- Add tests (FastAPI TestClient) for version conflicts, ordering, activity ordering.
