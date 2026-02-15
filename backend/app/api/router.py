from fastapi import APIRouter

from app.api.routes import tasks, activities, comments, auth

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(tasks.router, prefix="/tasks", tags=["tasks"])
api_router.include_router(activities.router, prefix="/activities", tags=["activities"])
api_router.include_router(comments.router, prefix="/comments", tags=["comments"])
