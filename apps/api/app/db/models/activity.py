from sqlalchemy import Column, DateTime, String, JSON, text
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base


class ActivityLog(Base):
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    organization_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    action = Column(String, nullable=False)
    target_type = Column(String, nullable=True)
    target_id = Column(UUID(as_uuid=True), nullable=True)
    metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=text("now()"), nullable=False)

