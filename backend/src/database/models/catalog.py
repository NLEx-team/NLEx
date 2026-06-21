import uuid
from sqlalchemy import Column, String, Enum as SQLEnum, DateTime, UUID
from sqlalchemy.sql import func
from src.database.session import Base
import enum

class CatalogStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    ERROR = "error"

class Catalog(Base):
    __tablename__ = "catalogs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, unique=True, index=True, nullable=False)
    type = Column(String, nullable=False)  # postgresql, mysql, etc.
    url = Column(String, nullable=False)
    user = Column(String, nullable=False)
    password = Column(String, nullable=False)
    status = Column(SQLEnum(CatalogStatus), default=CatalogStatus.INACTIVE, nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())
