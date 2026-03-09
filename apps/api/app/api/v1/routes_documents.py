from typing import List

from fastapi import APIRouter, Depends, File, Form, UploadFile
from pydantic import BaseModel
from sqlalchemy import select

from app.api.deps import DbSession, CurrentUser, get_current_organization_id
from app.db.models.document import Document
from app.services.document_ingestion.pipeline import ingest_document


router = APIRouter(prefix="/documents", tags=["documents"])


class DocumentSummary(BaseModel):
    id: str
    title: str | None
    document_type: str
    status: str


class DocumentDetail(BaseModel):
    id: str
    title: str | None
    document_type: str
    status: str
    pages_count: int | None
    language: str | None
    raw_text: str | None


@router.get("", response_model=List[DocumentSummary])
async def list_documents(
    db: DbSession,
    current_user: CurrentUser,
    organization_id: str = Depends(get_current_organization_id),
):
    stmt = (
        select(Document)
        .where(Document.organization_id == organization_id)
        .order_by(Document.created_at.desc())
    )
    result = await db.execute(stmt)
    docs = result.scalars().all()
    return [
        DocumentSummary(
            id=str(d.id),
            title=d.title,
            document_type=d.document_type,
            status=d.status,
        )
        for d in docs
    ]


@router.get("/{document_id}", response_model=DocumentDetail)
async def get_document(
    document_id: str,
    db: DbSession,
    current_user: CurrentUser,
    organization_id: str = Depends(get_current_organization_id),
):
    stmt = select(Document).where(
        Document.id == document_id,
        Document.organization_id == organization_id,
    )
    result = await db.execute(stmt)
    doc = result.scalar_one_or_none()
    if not doc:
        from fastapi import HTTPException, status

        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    return DocumentDetail(
        id=str(doc.id),
        title=doc.title,
        document_type=doc.document_type,
        status=doc.status,
        pages_count=doc.pages_count,
        language=doc.language,
        raw_text=doc.raw_text,
    )


@router.post("/upload", response_model=DocumentDetail)
async def upload_document(
    file: UploadFile = File(...),
    document_type: str = Form(...),
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
        document_type=document_type,
    )
    return DocumentDetail(
        id=str(doc.id),
        title=doc.title,
        document_type=doc.document_type,
        status=doc.status,
        pages_count=doc.pages_count,
        language=doc.language,
        raw_text=doc.raw_text,
    )

