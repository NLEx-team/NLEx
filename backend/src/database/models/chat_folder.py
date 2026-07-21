import uuid
from sqlalchemy import Column, String, ForeignKey, DateTime, UUID, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from src.database.session import Base

class ChatFolder(Base):
    __tablename__ = "chat_folders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    user = relationship("User")
    chats = relationship("Chat", back_populates="folder")
