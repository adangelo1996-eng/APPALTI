from __future__ import annotations

from typing import List

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.document import DocumentChunk
from app.services.document_ingestion.embeddings import embed_texts, vector_to_pg


class RetrievedChunk:
    def __init__(self, id: str, document_id: str, content: str, score: float):
        self.id = id
        self.document_id = document_id
        self.content = content
        self.score = score


async def retrieve_relevant_chunks(
    session: AsyncSession,
    *,
    organization_id: str,
    query_text: str,
    limit: int = 6,
) -> List[RetrievedChunk]:
    """
    Retrieval vettoriale semplice su document_chunks usando pgvector.
    Per ora usa lo stesso placeholder embedding della pipeline di ingestion.
    """

    query_vec = embed_texts([query_text])[0]
    q_pg = vector_to_pg(query_vec)

    sql = text(
        """
        SELECT id, document_id, content, (embedding <-> :qvec) AS distance
        FROM document_chunks
        WHERE organization_id = :org_id
        ORDER BY embedding <-> :qvec
        LIMIT :limit
        """
    )

    result = await session.execute(
        sql,
        {"qvec": q_pg, "org_id": organization_id, "limit": limit},
    )
    rows = result.fetchall()

    chunks: List[RetrievedChunk] = []
    for row in rows:
        chunk_id, doc_id, content, distance = row
        score = float(distance) if distance is not None else 0.0
        chunks.append(RetrievedChunk(str(chunk_id), str(doc_id), content, score))

    return chunks

