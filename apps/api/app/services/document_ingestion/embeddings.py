from typing import List


EMBEDDING_DIM = 768


def embed_texts(chunks: List[str]) -> List[List[float]]:
    # Placeholder deterministico: in produzione sostituire con chiamata a modello di embedding.
    vectors: List[List[float]] = []
    for text in chunks:
        base = sum(ord(c) for c in text[:200]) % 1000
        vec = [0.0] * EMBEDDING_DIM
        vec[0] = float(base)
        vectors.append(vec)
    return vectors


def vector_to_pg(v: List[float]) -> str:
    return "[" + ",".join(f"{x:.6f}" for x in v) + "]"

