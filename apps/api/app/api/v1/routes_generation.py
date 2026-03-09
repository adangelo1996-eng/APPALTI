from typing import List

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select

from app.api.deps import DbSession, CurrentUser, get_current_organization_id
from app.db.models.document import Document, DocumentChunk
from app.db.models.generation import GeneratedSection, SourceReference
from app.db.models.tender import TenderCriterion, Tender
from app.services.generation.generator import build_section_from_sources
from app.services.retrieval.search import retrieve_relevant_chunks


router = APIRouter(prefix="/generation", tags=["generation"])


class SourceSnippet(BaseModel):
    id: str
    document_id: str
    document_title: str | None
    document_type: str | None
    content: str
    score: float


class GeneratedSectionModel(BaseModel):
    id: str
    tender_id: str
    tender_criterion_id: str
    version: int
    status: str
    generated_text: str
    weakness_flags: dict | None


class CriterionGenerationPayload(BaseModel):
    criterion: dict
    sources: List[SourceSnippet]
    section: GeneratedSectionModel | None


@router.get("/criteria/{criterion_id}", response_model=CriterionGenerationPayload)
async def get_criterion_generation_context(
    criterion_id: str,
    db: DbSession,
    current_user: CurrentUser,
    organization_id: str = Depends(get_current_organization_id),
):
    crit_stmt = select(TenderCriterion, Tender).join(Tender, Tender.id == TenderCriterion.tender_id).where(
        TenderCriterion.id == criterion_id,
        TenderCriterion.organization_id == organization_id,
    )
    crit_res = await db.execute(crit_stmt)
    row = crit_res.first()
    if not row:
        from fastapi import HTTPException, status

        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Criterion not found")

    criterion, tender = row

    # Latest generated section for this criterion, if any
    sec_stmt = (
        select(GeneratedSection)
        .where(
            GeneratedSection.tender_criterion_id == criterion.id,
            GeneratedSection.organization_id == organization_id,
        )
        .order_by(GeneratedSection.version.desc())
        .limit(1)
    )
    sec_res = await db.execute(sec_stmt)
    section = sec_res.scalar_one_or_none()

    # Sources linked to the latest section (if exists)
    sources: List[SourceSnippet] = []
    if section:
        refs_stmt = (
            select(SourceReference, DocumentChunk, Document)
            .join(DocumentChunk, DocumentChunk.id == SourceReference.document_chunk_id)
            .join(Document, Document.id == DocumentChunk.document_id)
            .where(SourceReference.generated_section_id == section.id)
        )
        refs_res = await db.execute(refs_stmt)
        for ref, chunk, doc in refs_res.all():
            sources.append(
                SourceSnippet(
                    id=str(chunk.id),
                    document_id=str(doc.id),
                    document_title=doc.title,
                    document_type=doc.document_type,
                    content=chunk.content[:600],
                    score=float(ref.relevance_score) if ref.relevance_score is not None else 0.0,
                )
            )

    return CriterionGenerationPayload(
        criterion={
            "id": str(criterion.id),
            "code": criterion.code,
            "title": criterion.title,
            "description": criterion.description,
            "max_score": float(criterion.max_score) if criterion.max_score is not None else None,
            "analysis_notes": criterion.analysis_notes,
            "needs_review": bool(criterion.needs_review) if criterion.needs_review is not None else None,
        },
        sources=sources,
        section=GeneratedSectionModel(
            id=str(section.id),
            tender_id=str(section.tender_id),
            tender_criterion_id=str(section.tender_criterion_id),
            version=section.version,
            status=section.status,
            generated_text=section.generated_text,
            weakness_flags=section.weakness_flags or {},
        )
        if section
        else None,
    )


@router.get("/criteria/{criterion_id}/sections", response_model=List[GeneratedSectionModel])
async def list_sections_for_criterion(
    criterion_id: str,
    db: DbSession,
    current_user: CurrentUser,
    organization_id: str = Depends(get_current_organization_id),
):
    stmt = (
        select(GeneratedSection)
        .where(
            GeneratedSection.tender_criterion_id == criterion_id,
            GeneratedSection.organization_id == organization_id,
        )
        .order_by(GeneratedSection.version.asc())
    )
    res = await db.execute(stmt)
    sections = res.scalars().all()
    return [
        GeneratedSectionModel(
            id=str(s.id),
            tender_id=str(s.tender_id),
            tender_criterion_id=str(s.tender_criterion_id),
            version=s.version,
            status=s.status,
            generated_text=s.generated_text,
            weakness_flags=s.weakness_flags or {},
        )
        for s in sections
    ]


@router.post("/criteria/{criterion_id}/draft", response_model=GeneratedSectionModel)
async def generate_draft_for_criterion(
    criterion_id: str,
    db: DbSession,
    current_user: CurrentUser,
    organization_id: str = Depends(get_current_organization_id),
):
    crit_stmt = select(TenderCriterion, Tender).join(Tender, Tender.id == TenderCriterion.tender_id).where(
        TenderCriterion.id == criterion_id,
        TenderCriterion.organization_id == organization_id,
    )
    crit_res = await db.execute(crit_stmt)
    row = crit_res.first()
    if not row:
        from fastapi import HTTPException, status

        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Criterion not found")

    criterion, tender = row

    query_text = f"{criterion.code or ''} {criterion.title}\n{criterion.description or ''}"
    chunks = await retrieve_relevant_chunks(
        db,
        organization_id=str(organization_id),
        query_text=query_text,
        limit=6,
    )

    generated_text, weakness_flags = build_section_from_sources(criterion=criterion, sources=chunks)

    # Determine next version
    existing_stmt = (
        select(GeneratedSection.version)
        .where(
            GeneratedSection.tender_criterion_id == criterion.id,
            GeneratedSection.organization_id == organization_id,
        )
        .order_by(GeneratedSection.version.desc())
        .limit(1)
    )
    existing_res = await db.execute(existing_stmt)
    last_version = existing_res.scalar_one_or_none()
    next_version = int(last_version or 0) + 1

    section = GeneratedSection(
        tender_id=tender.id,
        tender_criterion_id=criterion.id,
        organization_id=organization_id,
        author_id=current_user.id,
        version=next_version,
        status="draft",
        generated_text=generated_text,
        weakness_flags=weakness_flags,
    )
    db.add(section)
    await db.flush()

    # Save source references
    for ch in chunks:
        ref = SourceReference(
            generated_section_id=section.id,
            document_chunk_id=ch.id,
            organization_id=organization_id,
            relevance_score=ch.score,
            usage_type="evidence",
        )
        db.add(ref)

    await db.commit()
    await db.refresh(section)

    return GeneratedSectionModel(
        id=str(section.id),
        tender_id=str(section.tender_id),
        tender_criterion_id=str(section.tender_criterion_id),
        version=section.version,
        status=section.status,
        generated_text=section.generated_text,
        weakness_flags=section.weakness_flags or {},
    )


class SectionUpdateRequest(BaseModel):
    text: str
    status: str | None = None


@router.put("/sections/{section_id}", response_model=GeneratedSectionModel)
async def update_section_text(
    section_id: str,
    payload: SectionUpdateRequest,
    db: DbSession,
    current_user: CurrentUser,
    organization_id: str = Depends(get_current_organization_id),
):
    stmt = select(GeneratedSection).where(
        GeneratedSection.id == section_id,
        GeneratedSection.organization_id == organization_id,
    )
    res = await db.execute(stmt)
    section = res.scalar_one_or_none()
    if not section:
        from fastapi import HTTPException, status

        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Section not found")

    section.generated_text = payload.text
    if payload.status:
        section.status = payload.status

    await db.commit()
    await db.refresh(section)

    return GeneratedSectionModel(
        id=str(section.id),
        tender_id=str(section.tender_id),
        tender_criterion_id=str(section.tender_criterion_id),
        version=section.version,
        status=section.status,
        generated_text=section.generated_text,
        weakness_flags=section.weakness_flags or {},
    )

