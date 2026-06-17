import uuid
from sqlalchemy import Column, String, ForeignKey, DateTime, UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from src.database.session import Base

class DatabaseConnection(Base):
    __tablename__ = "database_connections"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    user = relationship("User")
