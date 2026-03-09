from sqlalchemy import Column, DateTime, String, text
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base


class Organization(Base):
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    name = Column(String, nullable=False)
    slug = Column(String, unique=True, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=text("now()"), nullable=False)
    updated_at = Column(DateTime(timezone=True), nullable=True)

