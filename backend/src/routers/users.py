from fastapi import APIRouter, Depends, status
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from src.dependencies.auth import get_current_user, require_admin
from src.models.schemas.user import UserRead, UserUpdate, UserAdminUpdate
from src.controllers.user import UserController
from src.database.session import get_db

router = APIRouter()

@router.get("/me", response_model=UserRead)
async def me(user = Depends(get_current_user)):
    return user

@router.get("/{id}", response_model=UserRead, dependencies=[Depends(get_current_user)])
async def get_user(id: UUID, db: AsyncSession = Depends(get_db)):
    return await UserController.get_user_by_id(db, id)

@router.get("", response_model=List[UserRead])
async def get_all_users(db: AsyncSession = Depends(get_db), _ = Depends(require_admin)):
    return await UserController.get_users(db)

@router.patch("/me", response_model=UserRead)
async def update_me(user_update: UserUpdate, user = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    # Uses UserUpdate which excludes 'role'
    return await UserController.update_user(db, user.id, user_update)

@router.patch("/{id}", response_model=UserRead, dependencies=[Depends(require_admin)])
async def update_user(id: UUID, user_update: UserAdminUpdate, db: AsyncSession = Depends(get_db)):
    # Uses UserAdminUpdate which includes 'role'
    return await UserController.update_user(db, id, user_update)

@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_me(user = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await UserController.delete_me(db, user)
    return None

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_admin)])
async def delete_user(id: UUID, db: AsyncSession = Depends(get_db)):
    await UserController.delete_user(db, id)
    return None
