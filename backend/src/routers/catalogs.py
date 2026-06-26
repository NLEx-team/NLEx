from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from uuid import UUID

from src.dependencies.auth import get_current_user, require_admin
from src.database.models.user import User, UserRole
from src.database.session import get_db
from src.models.schemas.catalog import CatalogRead, CatalogCreate, CatalogTestResult
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
        host="trino",
        port=settings.TRINO_PORT,
        user="trino"
    )
    return CatalogService(repo, db_service)

@router.post("", response_model=CatalogRead, status_code=status.HTTP_201_CREATED)
async def create_catalog(
    catalog_in: CatalogCreate,
    service: CatalogService = Depends(get_catalog_service),
    _ = Depends(require_admin)
):
    try:
        return await service.create_catalog(catalog_in)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("", response_model=List[CatalogRead])
async def list_catalogs(
    service: CatalogService = Depends(get_catalog_service),
    _ = Depends(get_current_user)
):
    return await service.list_catalogs()

@router.delete("/{catalog_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_catalog(
    catalog_id: UUID,
    service: CatalogService = Depends(get_catalog_service),
    _ = Depends(require_admin)
):
    success = await service.delete_catalog(catalog_id)
    if not success:
        raise HTTPException(status_code=404, detail="Catalog not found")

@router.post("/{catalog_id}/test", response_model=CatalogRead)
async def test_catalog(
    catalog_id: UUID,
    service: CatalogService = Depends(get_catalog_service),
    _ = Depends(get_current_user)
):
    return await service.sync_catalog(catalog_id)

@router.post("/{catalog_id}/ping", response_model=CatalogTestResult)
async def ping_catalog(
    catalog_id: UUID,
    service: CatalogService = Depends(get_catalog_service),
    _ = Depends(get_current_user)
):
    """Lightweight ping to measure connection latency. Available to all users."""
    result = await service.ping_catalog(catalog_id)
    return CatalogTestResult(**result)

@router.post("/test-connection", response_model=CatalogTestResult)
async def test_new_connection(
    catalog_in: CatalogCreate,
    service: CatalogService = Depends(get_catalog_service),
    _ = Depends(require_admin)
):
    result = await service.test_raw_connection(catalog_in)
    return CatalogTestResult(**result)

