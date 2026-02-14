# Priority queue and deterministic ordering

## Comparator (highest priority first)
1) `priority` enum order: P0 < P1 < P2 < P3 (lower is higher priority)
2) `ordering_index` (float) within the column/queue
3) `id` (UUID) as final deterministic tie-breaker

## Data structure
- Database: `ORDER BY priority, ordering_index, id` provides stable, deterministic listing.
- In-memory alternative: min-heap with the same comparator (O(log n) push/pop).

## Queue endpoint (planned)
- `/api/queue/next?limit=20&status=Ready,In%20Progress` returns tasks sorted by comparator.
- Supports filters by status/tags/owner to surface “next best tasks”.

## Rationale
- Using DB ordering keeps queue consistent across instances and avoids cache divergence.
- Including `id` in the comparator eliminates non-determinism under concurrency.
