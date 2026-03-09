from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, JSON, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base import Base


class Document(Base):
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organization.id"), nullable=False, index=True)
    uploader_id = Column(UUID(as_uuid=True), ForeignKey("user.id"), nullable=False, index=True)
    title = Column(String, nullable=True)
    file_path = Column(String, nullable=False)
    document_type = Column(String, nullable=False)
    status = Column(String, nullable=False)
    language = Column(String, nullable=True)
    pages_count = Column(Integer, nullable=True)
    raw_text = Column(Text, nullable=True)
    metadata = Column(JSON, nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=text("now()"), nullable=False)
    updated_at = Column(DateTime(timezone=True), nullable=True)

    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")


class DocumentChunk(Base):
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    document_id = Column(UUID(as_uuid=True), ForeignKey("document.id"), nullable=False, index=True)
    organization_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    chunk_index = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    # embedding gestita da pgvector; SQLAlchemy la tratterà come Text generic, le query vettoriali saranno fatte via testo SQL.
    embedding = Column(String, nullable=True)
    section_title = Column(String, nullable=True)
    page_start = Column(Integer, nullable=True)
    page_end = Column(Integer, nullable=True)
    metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=text("now()"), nullable=False)

    document = relationship("Document", back_populates="chunks")

