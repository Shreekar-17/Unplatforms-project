from __future__ import annotations

import uuid
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.schemas.user import UserCreate
from app.core.security import get_password_hash, verify_password


async def get_user_by_email(session: AsyncSession, email: str) -> Optional[User]:
    result = await session.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def get_user_by_username(session: AsyncSession, username: str) -> Optional[User]:
    result = await session.execute(select(User).where(User.username == username))
    return result.scalar_one_or_none()


async def get_user_by_id(session: AsyncSession, user_id: uuid.UUID) -> Optional[User]:
    result = await session.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def create_user(session: AsyncSession, user_data: UserCreate) -> User:
    hashed_password = get_password_hash(user_data.password)
    user = User(
        email=user_data.email,
        username=user_data.username,
        full_name=user_data.full_name,
        hashed_password=hashed_password,
    )
    session.add(user)
    await session.flush()
    return user


async def authenticate_user(session: AsyncSession, username_or_email: str, password: str) -> Optional[User]:
    # Try to find user by username first, then by email
    user = await get_user_by_username(session, username_or_email)
    if not user:
        user = await get_user_by_email(session, username_or_email)
    
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user
