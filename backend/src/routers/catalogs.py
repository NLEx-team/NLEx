from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from uuid import UUID

from src.dependencies.auth import get_current_user
from src.database.models.user import User, UserRole
from src.database.session import get_db
from src.models.schemas.catalog import CatalogRead, CatalogCreate
from src.services.catalog_service import CatalogService
from src.repositories.catalog_repo import CatalogRepository
from src.services.distributed_db import DistributedDatabaseService
from src.utils.config import settings

router = APIRouter()

async def get_catalog_service(db = Depends(get_db)) -> CatalogService:
    repo = CatalogRepository(db)
    # We need a shared DistributedDatabaseService. 
    # For now, we'll instantiate it here or get from a dependency.
    # Usually it's better to have a singleton or a long-lived instance.
    db_service = DistributedDatabaseService(
        host="trino", # Should use settings.TRINO_HOST
        port=settings.TRINO_PORT,
        user="trino"
    )
    return CatalogService(repo, db_service)

def admin_only(user: User = Depends(get_current_user)):
    if user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can manage catalogs"
        )
    return user

@router.post("", response_model=CatalogRead, status_code=status.HTTP_201_CREATED)
async def create_catalog(
    catalog_in: CatalogCreate,
    service: CatalogService = Depends(get_catalog_service),
    _ = Depends(admin_only)
):
    try:
        return await service.create_catalog(catalog_in)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("", response_model=List[CatalogRead])
async def list_catalogs(
    service: CatalogService = Depends(get_catalog_service),
    _ = Depends(get_current_user) # Any logged in user can see catalogs? 
    # Or maybe only admin? User prompt says "only admin is able to connect new catalogs".
):
    return await service.list_catalogs()

@router.delete("/{catalog_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_catalog(
    catalog_id: UUID,
    service: CatalogService = Depends(get_catalog_service),
    _ = Depends(admin_only)
):
    success = await service.delete_catalog(catalog_id)
    if not success:
        raise HTTPException(status_code=404, detail="Catalog not found")

@router.post("/{catalog_id}/test", response_model=CatalogRead)
async def test_catalog(
    catalog_id: UUID,
    service: CatalogService = Depends(get_catalog_service),
    _ = Depends(admin_only)
):
    return await service.sync_catalog(catalog_id)
