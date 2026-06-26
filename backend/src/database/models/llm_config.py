import uuid
from sqlalchemy import Column, String, Boolean, ForeignKey, DateTime, UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from src.database.session import Base

class LlmConfiguration(Base):
    __tablename__ = "llm_configurations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    admin_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    base_url = Column(String, nullable=False)
    api_key = Column(String, nullable=False)
    model_name = Column(String, nullable=False)
    is_shared = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    proxy_url = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    admin = relationship("User")
