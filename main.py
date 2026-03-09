import os
from typing import Any, Dict, List

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from rag_utils import extract_text_from_pdf_bytes, chunk_text, upsert_chunks_to_supabase, retrieve_chunks


app = FastAPI(title="RFP AI Co-Pilot – RAG Backend (Phase 1)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # restringi in produzione
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class RetrieveRequest(BaseModel):
    query: str
    top_k: int = 5


@app.get("/health")
def health() -> Dict[str, Any]:
    return {"status": "ok"}


@app.post("/ingest_pdf/{doc_id}")
async def ingest_pdf(doc_id: str, file: UploadFile = File(...)):
    """
    Ingestione di un PDF:
    - estrae testo
    - chunking (500 token, overlap 50)
    - embedding MiniLM (384 dim)
    - upsert in Supabase/Postgres 'documents'
    """
    if file.content_type not in ("application/pdf", "application/octet-stream"):
        raise HTTPException(status_code=400, detail="Solo PDF sono supportati.")

    raw = await file.read()
    if not raw:
        raise HTTPException(status_code=400, detail="File vuoto.")

    try:
        text = extract_text_from_pdf_bytes(raw)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"Errore parsing PDF: {exc}") from exc

    chunks = chunk_text(text, max_tokens=500, overlap=50)
    if not chunks:
        raise HTTPException(status_code=400, detail="Nessun chunk generato dal PDF.")

    try:
        stored = upsert_chunks_to_supabase(
            doc_id=doc_id,
            filename=file.filename,
            chunks=chunks,
            extra_metadata={"content_type": file.content_type},
        )
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"Errore salvataggio chunks: {exc}") from exc

    return {"doc_id": doc_id, "filename": file.filename, "chunks_stored": stored}


@app.post("/retrieve")
def retrieve(req: RetrieveRequest):
    """
    Retrieval semantico top-k:
    - input: query testuale
    - output: [{content, score, source_doc, chunk_id}, ...]
    """
    if not req.query or len(req.query.strip()) < 3:
        raise HTTPException(status_code=400, detail="Query troppo corta.")

    try:
        results = retrieve_chunks(req.query, top_k=req.top_k)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"Errore durante il retrieval: {exc}") from exc

    # riduci campi all'output richiesto
    payload: List[Dict[str, Any]] = []
    for r in results:
        payload.append(
            {
                "content": r["content"],
                "score": r["score"],
                "source_doc": r["source_doc"],
                "chunk_id": r["chunk_id"],
            }
        )
    return payload

