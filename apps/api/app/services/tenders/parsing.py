import re
from typing import List, Optional, TypedDict, Any, Tuple


class ParsedCriterion(TypedDict, total=False):
    code: Optional[str]
    title: str
    description: str
    max_score: Optional[float]
    constraints: Any
    required_documents: Any
    keywords: List[str]
    analysis_notes: str
    needs_review: bool
    order_index: int


CRITERION_HEADING_RE = re.compile(
    r"^(?P<code>(?:[0-9]{1,2}\.?)+)\s*[-–]?\s*(?P<title>.+)$", re.IGNORECASE
)

SCORE_RE = re.compile(
    r"(?P<score>\d+(?:[.,]\d+)?)\s*(punti|pt|punteggio\s+massimo|punteggio\s+max)",
    re.IGNORECASE,
)

CONSTRAINT_HINTS = [
    "massimo",
    "massima",
    "minimo",
    "minima",
    "numero di pagine",
    "n. pagine",
    "pagine",
    "lunghezza",
    "formato",
    "caratteri",
    "interlinea",
]

EVIDENCE_HINTS = [
    "allegare",
    "allegati",
    "documentazione",
    "deve essere allegato",
    "deve allegare",
    "curriculum",
    "cv",
    "referenze",
    "attestato",
    "certificazione",
]

ITALIAN_STOPWORDS = {
    "il",
    "lo",
    "la",
    "i",
    "gli",
    "le",
    "un",
    "una",
    "di",
    "a",
    "da",
    "in",
    "con",
    "su",
    "per",
    "tra",
    "fra",
    "e",
    "ed",
    "che",
    "del",
    "della",
    "dei",
    "delle",
    "degli",
    "ai",
    "alle",
    "agli",
}


def _extract_score(text: str) -> Tuple[Optional[float], bool]:
    match = SCORE_RE.search(text)
    if not match:
        return None, False
    raw = match.group("score").replace(",", ".")
    try:
        return float(raw), True
    except ValueError:
        return None, False


def _extract_lines_by_hints(text: str, hints: List[str]) -> List[str]:
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    result: List[str] = []
    for ln in lines:
        lower = ln.lower()
        if any(h in lower for h in hints):
            result.append(ln)
    return result


def _extract_keywords(title: str, description: str, max_keywords: int = 8) -> List[str]:
    text = f"{title}\n{description}"
    tokens = re.findall(r"[A-Za-zÀ-ÖØ-öø-ÿ]{4,}", text)
    freq: dict[str, int] = {}
    for t in tokens:
        lower = t.lower()
        if lower in ITALIAN_STOPWORDS:
            continue
        freq[lower] = freq.get(lower, 0) + 1
    sorted_tokens = sorted(freq.items(), key=lambda x: x[1], reverse=True)
    return [t for t, _ in sorted_tokens[:max_keywords]]


def _build_analysis_notes(
    has_score: bool,
    constraints: List[str],
    evidence: List[str],
    used_fallback_structure: bool,
) -> Tuple[str, bool]:
    notes: List[str] = []
    needs_review = False

    if not has_score:
        notes.append(
            "Punteggio massimo non individuato in modo certo; verificare la sezione punteggio nel disciplinare."
        )
        needs_review = True

    if not constraints:
        notes.append("Vincoli formali (lunghezza, formato, ecc.) non chiaramente individuati.")
        needs_review = True

    if not evidence:
        notes.append(
            "Evidenze/documenti richiesti non chiaramente estratti; verificare eventuali allegati obbligatori."
        )
        needs_review = True

    if used_fallback_structure:
        notes.append(
            "La struttura dei criteri è stata ricostruita in modo approssimativo; controllare manualmente."
        )
        needs_review = True

    if not notes:
        notes.append(
            "Criterio estratto con buona confidenza; verificare comunque coerenza con il disciplinare."
        )

    return " ".join(notes), needs_review


def parse_tender_criteria(text: str) -> List[ParsedCriterion]:
    lines = [ln.strip() for ln in text.splitlines()]
    candidates: List[str] = [ln for ln in lines if len(ln) > 0]

    criteria: List[ParsedCriterion] = []
    current_raw: Optional[ParsedCriterion] = None

    for line in candidates:
        m = CRITERION_HEADING_RE.match(line)
        if m:
            if current_raw:
                criteria.append(current_raw)
            current_raw = ParsedCriterion(
                code=m.group("code"),
                title=m.group("title"),
                description="",
                max_score=None,
                order_index=len(criteria),
            )
        else:
            if current_raw:
                desc = current_raw.get("description", "")
                if desc:
                    desc = f"{desc}\n{line}"
                else:
                    desc = line
                current_raw["description"] = desc

    if current_raw:
        criteria.append(current_raw)

    used_fallback_structure = False

    if not criteria:
        para = text[:2000]
        criteria.append(
            ParsedCriterion(
                code=None,
                title="Criteri di valutazione",
                description=para,
                max_score=None,
                order_index=0,
            )
        )
        used_fallback_structure = True

    enriched: List[ParsedCriterion] = []
    for idx, crit in enumerate(criteria):
        desc = crit.get("description", "") or ""

        score, score_confident = _extract_score(desc)
        constraints = _extract_lines_by_hints(desc, CONSTRAINT_HINTS)
        evidence = _extract_lines_by_hints(desc, EVIDENCE_HINTS)
        keywords = _extract_keywords(crit["title"], desc)

        notes, needs_review = _build_analysis_notes(
            has_score=score_confident,
            constraints=constraints,
            evidence=evidence,
            used_fallback_structure=used_fallback_structure,
        )

        enriched.append(
            ParsedCriterion(
                code=crit.get("code"),
                title=crit["title"],
                description=desc,
                max_score=score,
                constraints={"items": constraints} if constraints else None,
                required_documents={"items": evidence} if evidence else None,
                keywords=keywords,
                analysis_notes=notes,
                needs_review=needs_review,
                order_index=idx,
            )
        )

    return enriched

