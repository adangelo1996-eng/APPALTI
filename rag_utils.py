import json
import os
import re
from io import BytesIO
from typing import Any, Dict, List, Tuple

import psycopg2
from pypdf import PdfReader

from embedding_utils import batch_embeddings, EMBEDDING_DIM


DATABASE_URL = os.getenv("DATABASE_URL")


def extract_text_from_pdf_bytes(data: bytes) -> str:
    reader = PdfReader(BytesIO(data))
    parts: List[str] = []
    for page in reader.pages:
        try:
            txt = page.extract_text() or ""
        except Exception:
            txt = ""
        parts.append(txt)
    text = "\n\n".join(parts)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def chunk_text(text: str, max_tokens: int = 500, overlap: int = 50) -> List[str]:
    """
    Chunking semantico approssimato:
    - split su confini di frase
    - aggrega fino a max_tokens parole
    - aggiunge overlap di 'overlap' parole tra chunk consecutivi
    """
    text = re.sub(r"\s+", " ", text).strip()
    if not text:
        return []

    sentences = re.split(r"(?<=[\.\!\?])\s+", text)

    chunks: List[str] = []
    current: List[str] = []
    tokens_count = 0

    for sent in sentences:
        sent = sent.strip()
        if not sent:
            continue
        sent_tokens = sent.split()
        if current and tokens_count + len(sent_tokens) > max_tokens:
            chunks.append(" ".join(current).strip())
            # overlap: prendi le ultime 'overlap' parole del chunk appena chiuso
            overlap_tokens = current[-1].split()[-overlap:] if overlap > 0 else []
            current = [" ".join(overlap_tokens)] if overlap_tokens else []
            tokens_count = len(overlap_tokens)
        current.append(sent)
        tokens_count += len(sent_tokens)

    if current:
        chunks.append(" ".join(current).strip())

    return [c for c in chunks if c]


def get_db_conn():
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL non configurato")
    return psycopg2.connect(DATABASE_URL)


def upsert_chunks_to_supabase(
    doc_id: str,
    filename: str,
    chunks: List[str],
    extra_metadata: Dict[str, Any] | None = None,
) -> int:
    """
    Salva i chunks in tabella 'documents' con embedding pgvector (384 dim).

    Schema atteso:
      documents(id uuid default, doc_id text, filename text, chunk_id int,
                content text, embedding vector(384), metadata jsonb, created_at timestamptz)
    """
    if not chunks:
        return 0

    embs = batch_embeddings(chunks)  # (n,384)

    conn = get_db_conn()
    try:
        with conn, conn.cursor() as cur:
            for idx, (chunk, emb) in enumerate(zip(chunks, embs)):
                vec_str = "[" + ",".join(f"{float(x):.6f}" for x in emb.tolist()) + "]"
                metadata = {
                    "doc_id": doc_id,
                    "chunk_id": idx,
                    "filename": filename,
                }
                if extra_metadata:
                    metadata.update(extra_metadata)
                cur.execute(
                    """
                    insert into documents (doc_id, filename, chunk_id, content, embedding, metadata)
                    values (%s, %s, %s, %s, %s::vector, %s::jsonb)
                    """,
                    (doc_id, filename, idx, chunk, vec_str, json.dumps(metadata, ensure_ascii=False)),
                )
    finally:
        conn.close()

    return len(chunks)


def retrieve_chunks(
    query: str,
    top_k: int = 5,
) -> List[Dict[str, Any]]:
    """
    Retrieval semantico da 'documents' usando cosine similarity.
    Facoltativamente potresti aggiungere boost keyword lato Python (non in questa prima iterazione).
    """
    from embedding_utils import generate_embedding

    q_emb = generate_embedding(query)
    vec_str = "[" + ",".join(f"{float(x):.6f}" for x in q_emb.tolist()) + "]"

    conn = get_db_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                select id, doc_id, filename, chunk_id, content,
                       1 - (embedding <=> %s::vector) as score
                from documents
                order by embedding <=> %s::vector
                limit %s
                """,
                (vec_str, vec_str, top_k),
            )
            rows = cur.fetchall()
    finally:
        conn.close()

    results: List[Dict[str, Any]] = []
    for row in rows:
        doc_pk, doc_id, filename, chunk_id, content, score = row
        base_score = float(score) if score is not None else 0.0
        results.append(
            {
                "id": str(doc_pk),
                "doc_id": doc_id,
                "source_doc": filename,
                "chunk_id": int(chunk_id),
                "content": content,
                "score": base_score,
            }
        )

    # Keyword boost opzionale lato Python:
    # se parole chiave della query compaiono nel chunk, aggiungi un piccolo bonus.
    query_tokens = {tok.lower() for tok in re.findall(r"\w{4,}", query)}
    if query_tokens:
        for r in results:
            text = (r["content"] or "").lower()
            matches = sum(1 for t in query_tokens if t in text)
            if matches > 0:
                bonus = min(0.05 * matches, 0.2)  # massimo +0.2
                r["score"] += bonus

    # Ordina nuovamente per score (discendente) e tronca a top_k
    results.sort(key=lambda x: x["score"], reverse=True)
    return results[:top_k]

