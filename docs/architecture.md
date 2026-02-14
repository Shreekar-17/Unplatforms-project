# Architecture draft

## Backend (FastAPI)
- `app/core`: settings, database session
- `app/models`: SQLAlchemy models (`Task`, `Activity`, `Comment`)
- `app/schemas`: Pydantic DTOs
- `app/services`: business logic (tasks, activities, queue)
- `app/api`: routers for tasks, activities, comments; queue/bulk to be added

### Concurrency & optimistic control
- `Task.version` is checked on updates; mismatches yield 409.
- Activity ordering uses per-task `activity_seq` + timestamp for deterministic timelines.
- Ordering uses `ordering_index` (float gap strategy) and is returned by server after moves.

### Priority queue
- Priority enum P0..P3; tie-breakers: priority, ordering_index, id.
- `services/queue_service.py` centralizes comparator and query builder.

## Frontend (planned)
- React + TS + Redux Toolkit + RTK Query + Tailwind + @dnd-kit.
- Slices: tasks (entities + ordering per column + versions), activities (per-task paged feed), comments, bulk operations.
- Components: Board (columns/cards/drag-drop), Activity timeline, Bulk toolbar, Conflict bar.
- Optimistic flow: apply patch locally, queue rollback on failure, show conflict toast/bar.

## Build order
1) Finish migrations and queue/bulk APIs.
2) Add tests (service + API) for versioning, ordering, activity ordering, queue.
3) Scaffold frontend with Vite + Tailwind + RTK + @dnd-kit; render board read-only.
4) Add mutations with optimistic/rollback; drag-drop reorder.
5) Add activity feed + comments + lazy pagination.
6) Add bulk operations with partial success UI.
7) Polish: empty states, column summaries, conflict bar, docs.
