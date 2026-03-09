import os
from pathlib import Path

import requests


API_URL = os.getenv("API_URL", "http://localhost:8000")


def ingest(pdf_path: Path, doc_id: str):
    assert pdf_path.exists(), f"{pdf_path} non trovato"
    with pdf_path.open("rb") as f:
        files = {"file": (pdf_path.name, f, "application/pdf")}
        resp = requests.post(f"{API_URL}/ingest_pdf/{doc_id}", files=files, timeout=300)
    resp.raise_for_status()
    print("Ingest response:", resp.json())


def retrieve(query: str, top_k: int = 5):
    resp = requests.post(
        f"{API_URL}/retrieve",
        json={"query": query, "top_k": top_k},
        timeout=120,
    )
    resp.raise_for_status()
    results = resp.json()
    print(f"\nQuery: {query}")
    print(f"Top {len(results)} risultati:")
    for i, r in enumerate(results, start=1):
        snippet = (r["content"] or "")[:200].replace("\n", " ")
        print(f"{i}. score={r['score']:.3f} source={r['source_doc']} chunk_id={r['chunk_id']}")
        print("   ", snippet)


if __name__ == "__main__":
    base = Path("apps/api/test_data")
    pdf1 = base / "IDD0_20262991536.pdf"
    pdf2 = base / "bando_altro.pdf"  # opzionale, se esiste

    # Ingestione (esegui una volta per documento)
    if pdf1.exists():
        ingest(pdf1, doc_id="IDD0_20262991536")
    if pdf2.exists():
        ingest(pdf2, doc_id="bando_altro")

    # Query di test
    retrieve("esperienza tecnica gare vinte", top_k=5)
    retrieve("metodologia di erogazione del servizio", top_k=5)
    retrieve("governance del progetto e ruoli", top_k=5)

