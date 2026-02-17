# Task Board (FastAPI + React/TS/Redux/Tailwind)

A modern, priority-aware Kanban board application designed for teams. Features a sleek dark mode UI, real-time optimistic updates, and powerful task management tools.

## Stack
- **Backend**: FastAPI, SQLAlchemy 2.0 (async, Postgres via asyncpg), Alembic, JWT Auth (python-jose + passlib)
- **Frontend**: React + TypeScript + Redux Toolkit + RTK Query + Tailwind CSS + React Router
- **UI/UX**: `@hello-pangea/dnd` for drag-and-drop, `react-icons` for typography, custom toast notifications

## Features

### Core Task Management
- **Kanban Board**: Drag-and-drop tasks between columns (Backlog, Ready, In Progress, Review, Done).
- **Task Details**: Rich text descriptions, priority levels (P0-P3), and size estimates.
- **Activity Feed**: Detailed audit log of all task changes (creation, moves, edits, comments).

### Productivity Tools
- **Focus Mode**: One-click filter to show only high-priority (P0/P1) and actionable tasks.
- **Search**: Real-time filtering by task title or description.
- **Bulk Actions**: Select multiple tasks to update status, priority, or delete in batches.
- **Optimistic UI**: Immediate feedback for actions with seamless rollback on errors.

### Security & UX
- **Authentication**: Secure JWT-based signup and login.
- **Modern UI**: Polished dark theme with consistent iconography and responsive layout.
- **Feedback**: specific toast notifications for success/error states.

## Screenshots

<div align="center">
  <img src="docs/screenshots/board.png" alt="Kanban Board" width="800" />
  <p><em>Interactive Kanban Board with Dark Mode</em></p>
</div>

<div align="center">
  <img src="docs/screenshots/timeline.png" alt="Activity Feed" width="800" />
  <p><em>Task Activity Timeline</em></p>
</div>

<div align="center">
  <img src="docs/screenshots/addTask.png" alt="Add Task Modal" width="400" />
  <img src="docs/screenshots/members.png" alt="Members Page" width="400" />
  <p><em>Task Creation & Team Management</em></p>
</div>

<div align="center">
  <img src="docs/screenshots/login.png" alt="Login Page" width="400" />
  <img src="docs/screenshots/signup.png" alt="Signup Page" width="400" />
  <p><em>Secure Authentication</em></p>
</div>

## Quick Start

### 1. Backend & Database (Docker)
Start the API and PostgreSQL database using Docker:
```bash
cp .env.example .env
docker-compose up --build
```
- **API**: http://localhost:8000 (docs at /docs)
- **Postgres**: localhost:5432

### 2. Frontend (Local)
The frontend is designed to run locally for the best development experience.
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```
- **App**: http://localhost:5173

## Authentication
The app uses JWT Bearer tokens with 7-day expiry.
- **Signup**: `/api/auth/signup`
- **Login**: `/api/auth/login` (Supports both username and email)

## Local Development (Without Docker)

### Prerequisites
- **Python 3.10+**
- **Node.js 18+**
- **PostgreSQL 14+** (Ensure it is running locally)

### Database Setup
1. Create a local PostgreSQL database named `taskboard`.
2. Update your `.env` file to point to `localhost` instead of `db`:
   ```bash
   DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/taskboard
   ```

### Backend Setup
```bash
# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r backend/requirements.txt

# Run migrations
cd backend && alembic upgrade head

# Start server
uvicorn app.main:app --reload --app-dir backend
```

### Frontend Setup
```bash
cd frontend

# Install dependencies (React, Vite, Tailwind, etc.)
npm install

# Setup environment variables
cp .env.example .env

# Start development server
npm run dev
```

## Architecture Highlights
- **Versioned Writes**: `Task.version` prevents overwrite conflicts in concurrent environments.
- **Deterministic Ordering**: Floating-point `ordering_index` allows O(1) reordering without cascading updates.
- **State Management**: Redux Toolkit for global state, RTK Query for efficient data fetching and caching.

## Project Structure
```
backend/
  app/
    models/          # SQLAlchemy models
    schemas/         # Pydantic schemas
    services/        # Business logic
    api/routes/      # FastAPI endpoints
    core/            # Config & Security

frontend/
  src/
    components/      # UI Components (Board, internal/external layouts)
    features/        # Redux slices & API definitions
    lib/             # Utilities
```
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
