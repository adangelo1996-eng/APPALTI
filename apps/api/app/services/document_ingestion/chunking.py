from typing import Iterable, List


def simple_semantic_chunks(text: str, max_chars: int = 1200, overlap: int = 200) -> List[str]:
    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
    chunks: List[str] = []
    current = ""

    for para in paragraphs:
        if len(current) + len(para) + 2 <= max_chars:
            current = f"{current}\n\n{para}".strip()
        else:
            if current:
                chunks.append(current)
            current = para
    if current:
        chunks.append(current)

    with_overlap: List[str] = []
    prev_tail = ""
    for chunk in chunks:
        prefix = prev_tail
        if prefix:
            combined = f"{prefix}\n\n{chunk}"
        else:
            combined = chunk
        with_overlap.append(combined)
        prev_tail = chunk[-overlap:]

    return with_overlap


def iter_with_index(items: Iterable[str]):
    for idx, item in enumerate(items):
        yield idx, item

