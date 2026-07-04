from enum import Enum
from typing import Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class DatabaseType(str, Enum):
    POSTGRESQL = "postgresql"
    SQLITE = "sqlite"
    MYSQL = "mysql"
    CLICKHOUSE = "clickhouse"
    ORACLE = "oracle"
    MONGODB = "mongodb"
    MINIO = "minio"

class CatalogStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    ERROR = "error"

class CatalogConnection(BaseModel):
    type: DatabaseType
    url: str
    user: str
    password: str

class CatalogCreate(CatalogConnection):
    name: str

class CatalogRead(BaseModel):
    # NOTE: deliberately does NOT expose `password`. GET /catalogs is available
    # to any authenticated user, so the connection secret must never be
    # serialized back to clients. Mirrors the frontend CatalogRead contract.
    id: UUID
    name: str
    type: DatabaseType
    url: str
    user: str
    status: CatalogStatus
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class CatalogTestResult(BaseModel):
    success: bool
    latency_ms: Optional[int] = None
    error: Optional[str] = None

