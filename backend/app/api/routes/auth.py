from __future__ import annotations

from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.core.security import create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserRead, Token
from app.services import user_service

router = APIRouter()


@router.post("/signup", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def signup(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    # Check if user already exists
    existing_user = await user_service.get_user_by_email(db, user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    
    existing_username = await user_service.get_user_by_username(db, user_data.username)
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken",
        )
    
    user = await user_service.create_user(db, user_data)
    await db.commit()
    await db.refresh(user)
    return user


@router.post("/login", response_model=None)
async def login(response: Response, credentials: UserLogin, db: AsyncSession = Depends(get_db)):
    user = await user_service.authenticate_user(db, credentials.username, credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )

    # Set HttpOnly cookie
    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=True,
        samesite="lax",
        secure=False,  # Set to True in production (HTTPS)
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )

    return {"message": "Login successful", "user": user}


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(key="access_token")
    return {"message": "Logout successful"}


@router.get("/me", response_model=UserRead)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user


@router.get("/users", response_model=list[UserRead])
async def get_users(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    users = await user_service.get_users(db)
    return users
