export type ParsedCriterion = {
  code: string | null;
  title: string;
  description: string;
  maxScore: number | null;
  constraints: { items: string[] } | null;
  requiredDocuments: { items: string[] } | null;
  keywords: string[];
  analysisNotes: string;
  needsReview: boolean;
  orderIndex: number;
};

const CRITERION_HEADING_RE =
  /^(?<code>(?:\d{1,2}\.?)+)\s*[-–]?\s*(?<title>.+)$/i;

const SCORE_RE =
  /(?<score>\d+(?:[.,]\d+)?)\s*(punti|pt|punteggio\s+massimo|punteggio\s+max)/i;

const CONSTRAINT_HINTS = [
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
];

const EVIDENCE_HINTS = [
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
];

const ITALIAN_STOPWORDS = new Set([
  "il", "lo", "la", "i", "gli", "le", "un", "una", "di", "a", "da", "in",
  "con", "su", "per", "tra", "fra", "e", "ed", "che", "del", "della", "dei",
  "delle", "degli", "ai", "alle", "agli",
]);

function extractScore(text: string): { score: number | null; confident: boolean } {
  const match = SCORE_RE.exec(text);
  if (!match?.groups?.score) return { score: null, confident: false };
  const raw = match.groups.score.replace(",", ".");
  const val = parseFloat(raw);
  return isNaN(val) ? { score: null, confident: false } : { score: val, confident: true };
}

function extractLinesByHints(text: string, hints: string[]): string[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => {
      if (!l) return false;
      const lower = l.toLowerCase();
      return hints.some((h) => lower.includes(h));
    });
}

function extractKeywords(title: string, description: string, max = 8): string[] {
  const text = `${title}\n${description}`;
  const tokens = text.match(/[A-Za-zÀ-ÖØ-öø-ÿ]{4,}/g) ?? [];
  const freq = new Map<string, number>();
  for (const t of tokens) {
    const lower = t.toLowerCase();
    if (ITALIAN_STOPWORDS.has(lower)) continue;
    freq.set(lower, (freq.get(lower) ?? 0) + 1);
  }
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([word]) => word);
}

function buildAnalysisNotes(opts: {
  hasScore: boolean;
  constraints: string[];
  evidence: string[];
  usedFallback: boolean;
}): { notes: string; needsReview: boolean } {
  const lines: string[] = [];
  let needsReview = false;

  if (!opts.hasScore) {
    lines.push(
      "Punteggio massimo non individuato in modo certo; verificare la sezione punteggio nel disciplinare.",
    );
    needsReview = true;
  }
  if (opts.constraints.length === 0) {
    lines.push("Vincoli formali (lunghezza, formato, ecc.) non chiaramente individuati.");
    needsReview = true;
  }
  if (opts.evidence.length === 0) {
    lines.push(
      "Evidenze/documenti richiesti non chiaramente estratti; verificare eventuali allegati obbligatori.",
    );
    needsReview = true;
  }
  if (opts.usedFallback) {
    lines.push(
      "La struttura dei criteri è stata ricostruita in modo approssimativo; controllare manualmente.",
    );
    needsReview = true;
  }
  if (lines.length === 0) {
    lines.push(
      "Criterio estratto con buona confidenza; verificare comunque coerenza con il disciplinare.",
    );
  }

  return { notes: lines.join(" "), needsReview };
}

export function parseTenderCriteria(text: string): ParsedCriterion[] {
  const lines = text.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);

  type RawCriterion = { code: string | null; title: string; description: string };
  const rawCriteria: RawCriterion[] = [];
  let current: RawCriterion | null = null;

  for (const line of lines) {
    const m = CRITERION_HEADING_RE.exec(line);
    if (m?.groups) {
      if (current) rawCriteria.push(current);
      current = {
        code: m.groups.code,
        title: m.groups.title,
        description: "",
      };
    } else if (current) {
      current.description = current.description
        ? `${current.description}\n${line}`
        : line;
    }
  }
  if (current) rawCriteria.push(current);

  let usedFallback = false;

  if (rawCriteria.length === 0) {
    rawCriteria.push({
      code: null,
      title: "Criteri di valutazione",
      description: text.slice(0, 2000),
    });
    usedFallback = true;
  }

  return rawCriteria.map((crit, idx) => {
    const desc = crit.description ?? "";
    const { score, confident } = extractScore(desc);
    const constraints = extractLinesByHints(desc, CONSTRAINT_HINTS);
    const evidence = extractLinesByHints(desc, EVIDENCE_HINTS);
    const keywords = extractKeywords(crit.title, desc);
    const { notes, needsReview } = buildAnalysisNotes({
      hasScore: confident,
      constraints,
      evidence,
      usedFallback,
    });

    return {
      code: crit.code,
      title: crit.title,
      description: desc,
      maxScore: score,
      constraints: constraints.length > 0 ? { items: constraints } : null,
      requiredDocuments: evidence.length > 0 ? { items: evidence } : null,
      keywords,
      analysisNotes: notes,
      needsReview,
      orderIndex: idx,
    };
  });
}
