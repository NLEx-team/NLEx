from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from src.database.models.catalog import Catalog, CatalogStatus
from uuid import UUID
from typing import List, Optional, Any, Dict

class CatalogRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, catalog_id: UUID) -> Optional[Catalog]:
        stmt = select(Catalog).where(Catalog.id == catalog_id)
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def get_by_name(self, name: str) -> Optional[Catalog]:
        stmt = select(Catalog).where(Catalog.name == name)
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def list_catalogs(self) -> List[Catalog]:
        stmt = select(Catalog)
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def list_active_catalogs(self) -> List[Catalog]:
        stmt = select(Catalog).where(Catalog.status == CatalogStatus.ACTIVE)
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def create(self, catalog: Catalog) -> Catalog:
        self.db.add(catalog)
        await self.db.commit()
        await self.db.refresh(catalog)
        return catalog

    async def update_status(self, catalog_id: UUID, status: CatalogStatus) -> Optional[Catalog]:
        stmt = update(Catalog).where(Catalog.id == catalog_id).values(status=status).returning(Catalog)
        result = await self.db.execute(stmt)
        await self.db.commit()
        return result.scalars().first()

    async def delete(self, catalog_id: UUID) -> bool:
        stmt = delete(Catalog).where(Catalog.id == catalog_id)
        result = await self.db.execute(stmt)
        await self.db.commit()
        return result.rowcount > 0
