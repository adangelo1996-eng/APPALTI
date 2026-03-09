from sqlalchemy import Column, DateTime, String, text
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base


class User(Base):
    id = Column(UUID(as_uuid=True), primary_key=True)
    email = Column(String, unique=True, nullable=False, index=True)
    full_name = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=text("now()"), nullable=False)
    updated_at = Column(DateTime(timezone=True), nullable=True)


class Membership(Base):
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    organization_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    role = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=text("now()"), nullable=False)
    updated_at = Column(DateTime(timezone=True), nullable=True)

