import uuid
from sqlalchemy import Column, String, ForeignKey, DateTime, JSON, Text, UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from src.database.session import Base

class Chat(Base):
    __tablename__ = "chats"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    status = Column(String, default="IDLE", nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    connection_id = Column(UUID(as_uuid=True), ForeignKey("database_connections.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    user = relationship("User")
    connection = relationship("DatabaseConnection")
    drafts = relationship("Draft", back_populates="chat", cascade="all, delete-orphan")

class Draft(Base):
    __tablename__ = "drafts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    chat_id = Column(UUID(as_uuid=True), ForeignKey("chats.id"), nullable=False)
    status = Column(String, default="draft", nullable=False)
    sql = Column(Text, nullable=True)
    metrics = Column(JSON, default=list, nullable=False)
    dimensions = Column(JSON, default=list, nullable=False)
    filters = Column(JSON, default=list, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    chat = relationship("Chat", back_populates="drafts")
