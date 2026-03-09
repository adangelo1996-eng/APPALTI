from __future__ import annotations

from typing import List

from app.db.models.tender import TenderCriterion
from app.services.generation.prompts import SYSTEM_PROMPT
from app.services.retrieval.search import RetrievedChunk


def build_section_from_sources(
    *,
    criterion: TenderCriterion,
    sources: List[RetrievedChunk],
) -> tuple[str, dict]:
    """
    Generatore deterministico placeholder che costruisce un testo professionale
    basato esclusivamente sulle fonti fornite, senza inventare dati.
    """

    title_line = f"Risposta al criterio {criterion.code or ''} – {criterion.title}".strip()
    intro = (
        "L’offerta tecnica proposta affronta in modo strutturato i requisiti del criterio, "
        "fornendo una descrizione chiara dell’impostazione metodologica, dell’organizzazione del servizio "
        "e degli strumenti adottati."
    )

    evidence_blocks: List[str] = []
    for idx, src in enumerate(sources, start=1):
        snippet = src.content.strip().replace("\n", " ")
        if len(snippet) > 400:
            snippet = snippet[:400].rsplit(" ", 1)[0] + "..."
        evidence_blocks.append(f"- Evidenza {idx}: {snippet}")

    if evidence_blocks:
        evidence_section = (
            "Le seguenti evidenze interne sono rilevanti ai fini del criterio:\n"
            + "\n".join(evidence_blocks)
        )
    else:
        evidence_section = (
            "Non sono state individuate evidenze interne sufficientemente specifiche per questo criterio. "
            "È necessario integrare manualmente riferimenti a esperienze, metodologie e asset esistenti."
        )

    gap_notes = {}
    if not sources:
        gap_notes["insufficient_evidence"] = True
        gap_notes["message"] = (
            "La knowledge base non contiene contenuti chiaramente riconducibili al criterio; "
            "è sconsigliato generare testo automatizzato senza un arricchimento manuale."
        )

    body = (
        f"{title_line}\n\n"
        f"{intro}\n\n"
        "Struttura proposta della risposta:\n"
        "- Inquadramento del servizio e obiettivi in relazione al criterio.\n"
        "- Descrizione della metodologia operativa adottata.\n"
        "- Modello di governance, ruoli e responsabilità.\n"
        "- Meccanismi di controllo qualità e KPI utilizzati.\n"
        "- Strumenti, piattaforme e asset a supporto dell’erogazione.\n\n"
        f"{evidence_section}"
    )

    weakness_flags = {
        "sources_count": len(sources),
        "insufficient_evidence": bool(gap_notes.get("insufficient_evidence", False)),
    }
    if gap_notes:
        weakness_flags["notes"] = gap_notes["message"]

    return body, weakness_flags

