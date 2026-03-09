import re
from typing import Any, Dict, List

from app.services.document_ingestion.parsers import extract_text_from_pdf
from app.services.document_ingestion.text_normalization import normalize_text


def _extract_criteria_blocks(text: str) -> List[Dict[str, Any]]:
    """
    Heuristically extract criteria blocks from normalized disciplinare text.
    Looks for lines starting with 'Criterio' and a point value.
    """
    lines = [ln.strip() for ln in text.splitlines()]
    criteria: List[Dict[str, Any]] = []
    current: Dict[str, Any] | None = None

    crit_pattern = re.compile(
        r"^(Criterio|CRITERIO)\s+(\d+[.\d]*)[:\-–]?\s*(.+?)(\d+(?:[.,]\d+)?)\s*(punti|pt)\b",
        re.IGNORECASE,
    )

    for ln in lines:
        if not ln:
            continue
        m = crit_pattern.match(ln)
        if m:
            if current:
                criteria.append(current)
            descr_raw = m.group(3).strip()
            punti_raw = m.group(4).replace(",", ".")
            try:
                punti_max = float(punti_raw)
            except ValueError:
                punti_max = None
            current = {
                "descrizione": descr_raw,
                "punti_max": punti_max,
                "sottocriteri": [],
            }
            continue

        # sottocriteri: bullet list under current criterio
        if current and (ln.startswith("-") or ln.startswith("•")):
            cleaned = ln.lstrip("-•").strip()
            if cleaned:
                current["sottocriteri"].append(cleaned)

    if current:
        criteria.append(current)

    return criteria


def _compute_totale_punti(text: str, criteria: List[Dict[str, Any]]) -> float | None:
    # explicit total if present
    total_pattern = re.compile(
        r"(totale|totali)\s+(?:punteggio|punti).*?(\d+(?:[.,]\d+)?)", re.IGNORECASE
    )
    m = total_pattern.search(text)
    if m:
        try:
            return float(m.group(2).replace(",", "."))
        except ValueError:
            pass

    # fallback: sum of per-criterion scores if available
    values = [c["punti_max"] for c in criteria if isinstance(c.get("punti_max"), (int, float, float))]
    if values:
        return float(sum(values))
    return None


def _extract_istruzioni_scrittura(text: str) -> str:
    """
    Extracts a paragraph around offerta tecnica / modalità / criteri di valutazione.
    """
    lower = text.lower()
    keywords = [
        "offerta tecnica",
        "offerta tecnico",
        "modalità di presentazione dell'offerta",
        "criteri di valutazione",
    ]
    idx = -1
    for kw in keywords:
        idx = lower.find(kw)
        if idx != -1:
            break
    if idx == -1:
        # fallback: first ~1500 chars
        return text[:1500]

    start = max(0, idx - 600)
    end = min(len(text), idx + 1200)
    return text[start:end].strip()


def analyze_bando_pdf(data: bytes) -> Dict[str, Any]:
    raw_text, _pages = extract_text_from_pdf(data)
    norm = normalize_text(raw_text)

    criteria_blocks = _extract_criteria_blocks(norm)
    if not criteria_blocks:
        # very weak structure: create a single generic criterio
        criteria_blocks = [
            {
                "descrizione": "Criteri di valutazione dell'offerta tecnica (estratti in forma libera).",
                "punti_max": None,
                "sottocriteri": [],
            }
        ]

    criteri_output = []
    for idx, c in enumerate(criteria_blocks, start=1):
        criteri_output.append(
            {
                "id": idx,
                "descrizione": c["descrizione"],
                "punti_max": c["punti_max"],
                "sottocriteri": c.get("sottocriteri", []),
            }
        )

    totale_punti = _compute_totale_punti(norm, criteria_blocks)
    istruzioni = _extract_istruzioni_scrittura(norm)

    return {
        "criteri": criteri_output,
        "totale_punti": totale_punti,
        "istruzioni_scrittura": istruzioni,
    }

