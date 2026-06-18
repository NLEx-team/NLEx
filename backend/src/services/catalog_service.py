import logging
from typing import List, Optional
from uuid import UUID

from src.database.models.catalog import Catalog, CatalogStatus
from src.repositories.catalog_repo import CatalogRepository
from src.services.distributed_db import DistributedDatabaseService
from src.models.schemas.catalog import CatalogCreate, CatalogConnection, DatabaseType

logger = logging.getLogger(__name__)

class CatalogService:
    def __init__(self, repository: CatalogRepository, db_service: DistributedDatabaseService):
        self.repository = repository
        self.db_service = db_service

    async def create_catalog(self, catalog_in: CatalogCreate) -> Catalog:
        # Check if already exists
        existing = await self.repository.get_by_name(catalog_in.name)
        if existing:
            raise ValueError(f"Catalog with name '{catalog_in.name}' already exists")

        db_obj = Catalog(
            name=catalog_in.name,
            type=catalog_in.type.value,
            url=catalog_in.url,
            user=catalog_in.user,
            password=catalog_in.password,
            status=CatalogStatus.INACTIVE
        )
        catalog = await self.repository.create(db_obj)
        
        # Try to connect in Trino
        await self.sync_catalog(catalog.id)
        return catalog

    async def sync_catalog(self, catalog_id: UUID) -> Catalog:
        """
        Attempts to register the catalog in Trino and updates its status.
        """
        catalog = await self.repository.get_by_id(catalog_id)
        if not catalog:
            raise ValueError("Catalog not found")

        try:
            # Prepare connection for Trino
            conn = CatalogConnection(
                type=DatabaseType(catalog.type),
                url=catalog.url,
                user=catalog.user,
                password=catalog.password
            )
            
            # 1. Drop if exists (to be sure)
            await self.db_service.disconnect_catalog(catalog.name)
            
            # 2. Connect
            await self.db_service.connect_catalog(catalog.name, conn)
            
            # 3. Verify (try to list schemas)
            await self.db_service.get_namespaces(catalog.name)
            
            # Success
            return await self.repository.update_status(catalog_id, CatalogStatus.ACTIVE)
        except Exception as e:
            logger.error(f"Failed to sync catalog {catalog.name}: {e}")
            return await self.repository.update_status(catalog_id, CatalogStatus.ERROR)

    async def get_active_catalogs(self) -> List[Catalog]:
        return await self.repository.list_active_catalogs()

    async def list_catalogs(self) -> List[Catalog]:
        return await self.repository.list_catalogs()

    async def delete_catalog(self, catalog_id: UUID) -> bool:
        catalog = await self.repository.get_by_id(catalog_id)
        if catalog:
            try:
                await self.db_service.disconnect_catalog(catalog.name)
            except Exception as e:
                logger.warning(f"Failed to disconnect catalog {catalog.name} from Trino during deletion: {e}")
        
        return await self.repository.delete(catalog_id)

    async def test_connection(self, catalog_id: UUID) -> bool:
        catalog = await self.sync_catalog(catalog_id)
        return catalog.status == CatalogStatus.ACTIVE
