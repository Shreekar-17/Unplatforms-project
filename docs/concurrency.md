# Concurrency, optimistic updates, and conflicts

## Versioning
- `Task.version` increments on every mutation; clients must send `if_match`.
- Server rejects stale writes with HTTP 409.
- Responses include the new `version`; client only accepts state with `version` greater than its current.

## Ordering consistency
- `ordering_index` is a float gap value per column. Server returns canonical value after moves.
- Client reconciles ordering using server response; out-of-order responses are ignored if older version.
- Periodic normalization can compress indices if needed (not yet implemented).

## Activity ordering
- `activity_seq` is a per-task monotonic integer assigned server-side.
- Timeline sorted by `(activity_seq, created_at, id)` for deterministic display under concurrency.

## Optimistic flow (client-side)
1. Apply tentative change locally; stash previous state.
2. Send mutation with `if_match`.
3. On 2xx: merge response, discard stash.
4. On 409/5xx: rollback to stash, surface conflict bar, offer “refresh and reapply” action.

## Bulk operations and partial success
- Bulk endpoint returns `{ successes: [...], failures: [{id, error}] }`.
- Client applies optimistic bulk but reconciles per-task using the response; failed items roll back.
- Mixed outcomes do not corrupt ordering: server returns updated `ordering_index` for successes; failures keep prior ordering.

## Out-of-order responses
- Include `version` and `ordering_index` in responses.
- Client accepts newer versions only; stale responses are dropped.

## Conflict recovery
- Offer quick actions: reload latest, retry with latest version, or duplicate task with desired changes if locked.
