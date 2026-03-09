from sqlalchemy import Column, DateTime, ForeignKey, Numeric, Integer, String, Text, JSON, text
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship

from app.db.base import Base


class Tender(Base):
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organization.id"), nullable=False, index=True)
    creator_id = Column(UUID(as_uuid=True), ForeignKey("user.id"), nullable=False, index=True)
    title = Column(String, nullable=False)
    tender_code = Column(String, nullable=True)
    status = Column(String, nullable=False, default="draft")
    tender_document_id = Column(UUID(as_uuid=True), ForeignKey("document.id"), nullable=True)
    submission_deadline = Column(DateTime(timezone=True), nullable=True)
    metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=text("now()"), nullable=False)
    updated_at = Column(DateTime(timezone=True), nullable=True)

    criteria = relationship("TenderCriterion", back_populates="tender", cascade="all, delete-orphan")


class TenderCriterion(Base):
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    tender_id = Column(UUID(as_uuid=True), ForeignKey("tender.id"), nullable=False, index=True)
    organization_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    parent_id = Column(UUID(as_uuid=True), ForeignKey("tendercriterion.id"), nullable=True)
    code = Column(String, nullable=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    max_score = Column(Numeric, nullable=True)
    weight = Column(Numeric, nullable=True)
    constraints = Column(JSON, nullable=True)
    required_documents = Column(JSON, nullable=True)
    keywords = Column(ARRAY(String), nullable=True)
    analysis_notes = Column(Text, nullable=True)
    needs_review = Column(Integer, nullable=True)
    order_index = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=text("now()"), nullable=False)
    updated_at = Column(DateTime(timezone=True), nullable=True)

    tender = relationship("Tender", back_populates="criteria")

