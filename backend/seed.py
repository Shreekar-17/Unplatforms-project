import asyncio
import logging
import sys
import os

# Ensure the backend directory is in the python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import delete, select
from app.core.db import AsyncSessionLocal
from app.core.security import get_password_hash
from app.models.user import User
from app.models.task import Task, Status, Priority
from app.models.comment import Comment
from app.models.activity import Activity, ActivityType

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def clean_db(session):
    logger.info("Cleaning database...")
    await session.execute(delete(Activity))
    await session.execute(delete(Comment))
    await session.execute(delete(Task))
    await session.execute(delete(User))
    await session.commit()
    logger.info("Database cleaned.")

async def seed_db(session):
    logger.info("Seeding database...")

    # Create Users
    hashed_password = get_password_hash("password")
    
    admin = User(
        email="admin@example.com",
        username="admin",
        hashed_password=hashed_password,
        full_name="Admin User",
        is_active=True
    )
    
    member1 = User(
        email="member1@example.com",
        username="member1",
        hashed_password=hashed_password,
        full_name="Team Member 1",
        is_active=True
    )
    
    member2 = User(
        email="member2@example.com",
        username="member2",
        hashed_password=hashed_password,
        full_name="Team Member 2",
        is_active=True
    )
    
    session.add_all([admin, member1, member2])
    await session.commit()
    
    # Refresh users to get IDs
    stmt = select(User).where(User.username.in_(["admin", "member1", "member2"]))
    users = await session.execute(stmt)
    users_map = {u.username: u for u in users.scalars().all()}
    
    admin_user = users_map["admin"]
    
    # Create Tasks
    tasks = [
        Task(
            title="Research new UI library",
            description="Evaluate different UI libraries for the next major version update. Compare Material UI, Chakra UI, and Shadcn/ui.",
            status=Status.BACKLOG,
            priority=Priority.P3,
            owner=admin_user.username,
            ordering_index=1000.0,
            tags={"labels": ["research", "frontend"]},
            estimate=3
        ),
        Task(
            title="Design System Update",
            description="Update the design system tokens to support dark mode consistently across all components.",
            status=Status.READY,
            priority=Priority.P2,
            owner="member1",
            ordering_index=2000.0,
            tags={"labels": ["design", "css"]},
            estimate=5
        ),
        Task(
            title="Fix Login Bug",
            description="Users compliant about intermittent login failures when using Safari. Investigate auth token cookie settings.",
            status=Status.IN_PROGRESS,
            priority=Priority.P0,
            owner="admin",
            ordering_index=3000.0,
            tags={"labels": ["bug", "auth", "critical"]},
            estimate=2
        ),
        Task(
            title="Refactor Sidebar",
            description="The sidebar component has become too large. Split it into smaller sub-components for better maintainability.",
            status=Status.IN_PROGRESS,
            priority=Priority.P1,
            owner="member2",
            ordering_index=3100.0,
            tags={"labels": ["refactor", "frontend"]},
            estimate=4
        ),
        Task(
            title="API Rate Limiting",
            description="Implement rate limiting on public API endpoints to prevent abuse.",
            status=Status.REVIEW,
            priority=Priority.P1,
            owner="member1",
            ordering_index=4000.0,
            tags={"labels": ["backend", "security"]},
            estimate=3
        ),
        Task(
            title="Initial Setup",
            description="Set up the project repository, CI/CD pipelines, and initial documentation.",
            status=Status.DONE,
            priority=Priority.P2,
            owner="admin",
            ordering_index=5000.0,
            tags={"labels": ["devops"]},
            estimate=1
        )
    ]
    
    session.add_all(tasks)
    await session.commit()
    
    # Refresh tasks to get IDs for relations
    stmt = select(Task).where(Task.title == "Fix Login Bug")
    bug_task_result = await session.execute(stmt)
    bug_task = bug_task_result.scalar_one()

    # Add Comments
    comments = [
        Comment(
            task_id=bug_task.id,
            body="I investigated this and it seems related to SameSite cookie attribute.",
            actor="member1"
        ),
        Comment(
            task_id=bug_task.id,
            body="Good catch. Can you deploy a fix to staging?",
            actor="admin"
        )
    ]
    session.add_all(comments)
    
    # Add Activity
    activities = [
        Activity(
            task_id=bug_task.id,
            type=ActivityType.CREATED,
            payload={"title": bug_task.title},
            actor="admin",
            activity_seq=1
        ),
        Activity(
            task_id=bug_task.id,
            type=ActivityType.UPDATED,
            payload={"field": "status", "old": "Backlog", "new": "In Progress"},
            actor="admin",
            activity_seq=2
        ),
        Activity(
            task_id=bug_task.id,
            type=ActivityType.COMMENTED,
            payload={},
            actor="member1",
            activity_seq=3
        )
    ]
    session.add_all(activities)
    
    await session.commit()
    logger.info("Database seeded successfully!")

async def main():
    async with AsyncSessionLocal() as session:
        try:
            await clean_db(session)
            await seed_db(session)
        except Exception as e:
            logger.error(f"An error occurred: {e}")
            await session.rollback()
            raise
        finally:
            await session.close()

if __name__ == "__main__":
    asyncio.run(main())
