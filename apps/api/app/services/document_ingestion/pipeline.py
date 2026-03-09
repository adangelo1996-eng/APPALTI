from typing import Literal

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.activity import ActivityLog
from app.db.models.document import Document, DocumentChunk
from app.services.document_ingestion.parsers import extract_text_from_pdf, extract_text_from_docx
from app.services.document_ingestion.text_normalization import normalize_text
from app.services.document_ingestion.chunking import simple_semantic_chunks
from app.services.document_ingestion.embeddings import embed_texts, vector_to_pg
from app.services.storage import upload_file_to_storage, StorageError


SupportedDocType = Literal["pdf", "docx"]


async def ingest_document(
    session: AsyncSession,
    *,
    organization_id: str,
    uploader_id: str,
    filename: str,
    content_type: str,
    data: bytes,
    document_type: str,
) -> Document:
    """
    Pipeline sincrona di ingestion per un documento:
    - crea record documento in stato 'processing'
    - carica il file originale in Supabase Storage
    - estrae il testo, normalizza, chunkizza, genera embedding
    - persiste chunks e aggiorna stato a 'ready' oppure 'failed'.

    In futuro la parte CPU/IO-bound potrà essere spostata in un job asincrono
    mantenendo questa funzione come orchestratore.
    """

    ext: SupportedDocType
    if content_type == "application/pdf" or filename.lower().endswith(".pdf"):
        ext = "pdf"
    elif (
        content_type
        in {
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/msword",
        }
        or filename.lower().endswith(".docx")
    ):
        ext = "docx"
    else:
        raise ValueError("Unsupported file type")

    doc = Document(
        organization_id=organization_id,
        uploader_id=uploader_id,
        title=filename,
        file_path="",  # valorizzato dopo upload su Storage
        document_type=document_type,
        status="processing",
    )
    session.add(doc)
    await session.flush()

    try:
        storage_path = upload_file_to_storage(
            organization_id=str(organization_id),
            document_id=str(doc.id),
            filename=filename,
            data=data,
            content_type=content_type,
        )
        doc.file_path = storage_path

        if ext == "pdf":
            raw_text, pages = extract_text_from_pdf(data)
        else:
            raw_text, pages = extract_text_from_docx(data)

        normalized = normalize_text(raw_text)
        chunks = simple_semantic_chunks(normalized)
        vectors = embed_texts(chunks)

        for idx, (chunk_text, vec) in enumerate(zip(chunks, vectors)):
            chunk = DocumentChunk(
                document_id=doc.id,
                organization_id=organization_id,
                chunk_index=idx,
                content=chunk_text,
                embedding=vector_to_pg(vec),
            )
            session.add(chunk)

        doc.status = "ready"
        doc.pages_count = pages
        doc.raw_text = normalized

        uploaded_log = ActivityLog(
            organization_id=organization_id,
            user_id=uploader_id,
            action="document.uploaded",
            target_type="document",
            target_id=doc.id,
            metadata={"filename": filename, "document_type": document_type},
        )
        session.add(uploaded_log)

        ingested_log = ActivityLog(
            organization_id=organization_id,
            user_id=uploader_id,
            action="document.ingested",
            target_type="document",
            target_id=doc.id,
            metadata={"filename": filename, "document_type": document_type},
        )
        session.add(ingested_log)

        await session.commit()
        await session.refresh(doc)
    except (StorageError, Exception) as exc:  # noqa: BLE001
        doc.status = "failed"
        doc.error_message = str(exc)
        fail_log = ActivityLog(
            organization_id=organization_id,
            user_id=uploader_id,
            action="document.failed",
            target_type="document",
            target_id=doc.id,
            metadata={"filename": filename, "error": str(exc)},
        )
        session.add(fail_log)
        await session.commit()
        await session.refresh(doc)
        raise

    return doc

