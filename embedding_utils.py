import os
from functools import lru_cache
from typing import List

import numpy as np
from sentence_transformers import SentenceTransformer

# all-MiniLM-L6-v2 → 384 dimensioni
EMBEDDING_MODEL_NAME = os.getenv(
    "EMBEDDING_MODEL_NAME",
    "sentence-transformers/all-MiniLM-L6-v2",
)
EMBEDDING_DIM = 384


@lru_cache(maxsize=1)
def get_model() -> SentenceTransformer:
    return SentenceTransformer(EMBEDDING_MODEL_NAME)


def generate_embedding(text: str) -> np.ndarray:
    """
    Restituisce un vettore normalizzato di dimensione 384 per una singola stringa.
    """
    model = get_model()
    emb = model.encode(
        [text],
        convert_to_numpy=True,
        normalize_embeddings=True,
        show_progress_bar=False,
    )
    return emb[0]


def batch_embeddings(chunks: List[str]) -> np.ndarray:
    """
    Restituisce matrice (n_chunks, 384) normalizzata.
    """
    if not chunks:
        return np.zeros((0, EMBEDDING_DIM), dtype="float32")
    model = get_model()
    embs = model.encode(
        chunks,
        batch_size=32,
        convert_to_numpy=True,
        normalize_embeddings=True,
        show_progress_bar=False,
    )
    if embs.shape[1] != EMBEDDING_DIM:
        raise RuntimeError(f"Expected dim {EMBEDDING_DIM}, got {embs.shape[1]}")
    return embs

