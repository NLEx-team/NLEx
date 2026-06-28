from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from typing import List
from uuid import UUID
import logging

logger = logging.getLogger(__name__)

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

async def background_cache_schema(catalog_id: str):
    """
    Pre-warms the schema cache for a catalog: fetches schema, infers relationships,
    and generates embeddings in the background so the first user query is fast.
    """
    from src.database.session import AsyncSessionLocal
    from src.services.schema_service import SchemaService
    from src.services.relationship_inference_service import RelationshipInferenceService
    from src.services.llm_service import LLMService
    
    try:
        async with AsyncSessionLocal() as db:
            repo = CatalogRepository(db)
            db_service = DistributedDatabaseService(host="trino", port=settings.TRINO_PORT, user="trino")
            
            # Get the catalog to find its Trino name
            catalog = await repo.get_by_id(catalog_id)
            if not catalog:
                logger.warning(f"Pre-warm: catalog {catalog_id} not found")
                return
            
            trino_name = f"cat_{catalog.id.hex}"
            
            # Fetch LLM config for inference (use shared config)
            from sqlalchemy import select
            from src.database.models.llm_config import LlmConfiguration
            
            llm_result = await db.execute(
                select(LlmConfiguration).where(
                    LlmConfiguration.is_active == True,
                    LlmConfiguration.is_shared == True
                )
            )
            llm_config = llm_result.scalars().first()
            
            # Resolve proxy
            proxy_result = await db.execute(
                select(LlmConfiguration).where(
                    LlmConfiguration.is_proxy_shared == True
                )
            )
            proxy_config = proxy_result.scalars().first()
            resolved_proxy_url = None
            if proxy_config:
                if proxy_config.proxy_mode == 'custom':
                    resolved_proxy_url = proxy_config.proxy_url
                elif proxy_config.proxy_mode == 'system':
                    resolved_proxy_url = settings.SYSTEM_PROXY_URL
            
            # Use fast inference model for pre-warm
            inference_llm = LLMService(
                api_key=llm_config.api_key if llm_config else None,
                base_url=llm_config.base_url if llm_config else None,
                model=settings.LLM_MODEL_INFERENCE,
                proxy_url=resolved_proxy_url,
            )
            
            ss = SchemaService(db_service)
            ris = RelationshipInferenceService(ss, inference_llm)
            
            # This caches the result in _GLOBAL_SCHEMA_CACHE
            await ris.get_augmented_schema(trino_name)
            logger.info(f"Pre-warm: successfully cached schema for catalog '{catalog.name}' ({trino_name})")
    except Exception as e:
        logger.error(f"Pre-warm failed for catalog {catalog_id}: {e}", exc_info=True)

@router.post("", response_model=CatalogRead, status_code=status.HTTP_201_CREATED)
async def create_catalog(
    catalog_in: CatalogCreate,
    background_tasks: BackgroundTasks,
    service: CatalogService = Depends(get_catalog_service),
    _ = Depends(require_admin)
):
    try:
        catalog = await service.create_catalog(catalog_in)
        if catalog.status == "active":
            background_tasks.add_task(background_cache_schema, str(catalog.id))
        return catalog
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
    background_tasks: BackgroundTasks,
    service: CatalogService = Depends(get_catalog_service),
    _ = Depends(get_current_user)
):
    catalog = await service.sync_catalog(catalog_id)
    if catalog.status == "active":
        background_tasks.add_task(background_cache_schema, str(catalog.id))
    return catalog

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

