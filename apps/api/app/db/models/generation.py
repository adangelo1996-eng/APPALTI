from sqlalchemy import Column, DateTime, ForeignKey, Numeric, Integer, String, Text, JSON, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base import Base


class GeneratedSection(Base):
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    tender_id = Column(UUID(as_uuid=True), ForeignKey("tender.id"), nullable=False, index=True)
    tender_criterion_id = Column(
        UUID(as_uuid=True), ForeignKey("tender_criteria.id"), nullable=False, index=True
    )
    organization_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    author_id = Column(UUID(as_uuid=True), ForeignKey("user.id"), nullable=False, index=True)
    version = Column(Integer, nullable=False)
    status = Column(String, nullable=False, default="draft")
    generated_text = Column(Text, nullable=False)
    notes = Column(Text, nullable=True)
    quality_score = Column(Numeric, nullable=True)
    weakness_flags = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=text("now()"), nullable=False)
    updated_at = Column(DateTime(timezone=True), nullable=True)

    sources = relationship("SourceReference", back_populates="section", cascade="all, delete-orphan")


class SourceReference(Base):
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    generated_section_id = Column(
        UUID(as_uuid=True), ForeignKey("generatedsection.id"), nullable=False, index=True
    )
    document_chunk_id = Column(
        UUID(as_uuid=True), ForeignKey("documentchunk.id"), nullable=False, index=True
    )
    organization_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    relevance_score = Column(Numeric, nullable=True)
    usage_type = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=text("now()"), nullable=False)

    section = relationship("GeneratedSection", back_populates="sources")

