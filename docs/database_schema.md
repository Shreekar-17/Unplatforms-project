# Database Schema

This document outlines the database schema for the Task Board application.

## Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    USERS {
        uuid id PK
        string username UK
        string email UK
        string hashed_password
        string full_name
        boolean is_active
        datetime created_at
        datetime updated_at
    }

    TASKS {
        uuid id PK
        string title
        text description
        string status "Default: Backlog"
        string priority "Enum: P0, P1, P2, P3"
        float ordering_index "For deterministic ordering"
        string owner "Nullable key to Users (logical)"
        jsonb tags
        int estimate
        int version "Optimistic locking"
        datetime created_at
        datetime updated_at
    }

    ACTIVITIES {
        uuid id PK
        uuid task_id FK
        string type "created, updated, moved, etc."
        jsonb payload
        string actor "Username snapshot"
        int activity_seq "Monotonic sequence per task"
        datetime created_at
    }

    COMMENTS {
        uuid id PK
        uuid task_id FK
        text body
        string actor "Username snapshot"
        int version
        datetime created_at
    }

    TASKS ||--o{ ACTIVITIES : "has"
    TASKS ||--o{ COMMENTS : "has"
    USERS ||--o{ TASKS : "owns (logically)"
    
```

## Tables Detail

### `users`
Stores user authentication and profile information.
- **id**: Unique identifier (UUID).
- **username**: Unique username for login and display.
- **email**: Unique email address.
- **hashed_password**: Bcrypt hash of the password.

### `tasks`
The core entity representing a unit of work.
- **status**: Current column in the Kanban board (Backlog, Ready, In Progress, Review, Done).
- **ordering_index**: A floating-point number used to determine the order of tasks within a column.
- **version**: Incremented on every update to prevent lost updates (Optimistic Concurrency Control).

### `activities`
An append-only log of all actions performed on a task.
- **payload**: JSONB field storing details about the change (e.g., old vs new values).
- **activity_seq**: A sequence number monotonic relative to the task, ensuring a consistent history timeline.

### `comments`
User comments attached to a task.
- **actor**: Snapshots the username of the commenter at the time of creation.
