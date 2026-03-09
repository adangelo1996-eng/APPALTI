from typing import List

from fastapi import APIRouter, Depends, File, Form, UploadFile
from pydantic import BaseModel
from sqlalchemy import select

from app.api.deps import DbSession, CurrentUser, get_current_organization_id
from app.db.models.activity import ActivityLog
from app.db.models.document import Document
from app.db.models.tender import Tender, TenderCriterion
from app.services.document_ingestion.pipeline import ingest_document
from app.services.tenders.parsing import parse_tender_criteria


router = APIRouter(prefix="/tenders", tags=["tenders"])


class TenderSummary(BaseModel):
    id: str
    title: str
    status: str


class TenderCriterionModel(BaseModel):
    id: str
    code: str | None
    title: str
    description: str | None
    max_score: float | None
    constraints: dict | None
    required_documents: dict | None
    keywords: list[str] | None
    analysis_notes: str | None
    needs_review: bool | None
    order_index: int | None


@router.get("", response_model=List[TenderSummary])
async def list_tenders(
    db: DbSession,
    current_user: CurrentUser,
    organization_id: str = Depends(get_current_organization_id),
):
    stmt = (
        select(Tender)
        .where(Tender.organization_id == organization_id)
        .order_by(Tender.created_at.desc())
    )
    result = await db.execute(stmt)
    tenders = result.scalars().all()
    return [
        TenderSummary(
            id=str(t.id),
            title=t.title,
            status=t.status,
        )
        for t in tenders
    ]


@router.get("/{tender_id}/criteria", response_model=List[TenderCriterionModel])
async def get_tender_criteria(
    tender_id: str,
    db: DbSession,
    current_user: CurrentUser,
    organization_id: str = Depends(get_current_organization_id),
):
    stmt = select(TenderCriterion).where(
        TenderCriterion.tender_id == tender_id,
        TenderCriterion.organization_id == organization_id,
    ).order_by(TenderCriterion.order_index)
    result = await db.execute(stmt)
    criteria = result.scalars().all()
    return [
        TenderCriterionModel(
            id=str(c.id),
            code=c.code,
            title=c.title,
            description=c.description,
            max_score=float(c.max_score) if c.max_score is not None else None,
             constraints=c.constraints,
             required_documents=c.required_documents,
             keywords=c.keywords,
             analysis_notes=c.analysis_notes,
             needs_review=bool(c.needs_review) if c.needs_review is not None else None,
            order_index=c.order_index,
        )
        for c in criteria
    ]


@router.post("/upload", response_model=TenderSummary)
async def upload_tender(
    file: UploadFile = File(...),
    title: str = Form(...),
    db: DbSession,
    current_user: CurrentUser,
    organization_id: str = Depends(get_current_organization_id),
):
    data = await file.read()
    doc = await ingest_document(
        db,
        organization_id=organization_id,
        uploader_id=current_user.id,
        filename=file.filename,
        content_type=file.content_type or "",
        data=data,
        document_type="tender",
    )

    tender = Tender(
        organization_id=organization_id,
        creator_id=current_user.id,
        title=title,
        status="in_progress",
        tender_document_id=doc.id,
    )
    db.add(tender)
    await db.flush()

    parsed_criteria = parse_tender_criteria(doc.raw_text or "")
    for pc in parsed_criteria:
        crit = TenderCriterion(
            tender_id=tender.id,
            organization_id=organization_id,
            code=pc.get("code"),
            title=pc["title"],
            description=pc.get("description"),
            max_score=pc.get("max_score"),
            constraints=pc.get("constraints"),
            required_documents=pc.get("required_documents"),
            keywords=pc.get("keywords"),
            analysis_notes=pc.get("analysis_notes"),
            needs_review=1 if pc.get("needs_review") else 0,
            order_index=pc.get("order_index"),
        )
        db.add(crit)

    log = ActivityLog(
        organization_id=organization_id,
        user_id=current_user.id,
        action="tender.created",
        target_type="tender",
        target_id=tender.id,
        metadata={"title": title, "filename": file.filename},
    )
    db.add(log)

    await db.commit()
    await db.refresh(tender)

    return TenderSummary(
        id=str(tender.id),
        title=tender.title,
        status=tender.status,
    )

