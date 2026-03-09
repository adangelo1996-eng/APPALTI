/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState } from "react";
import { Card } from "@components/ui/Card";
import { Button } from "@components/ui/Button";
import { getSessionAndOrganization } from "@lib/auth/session";
import { apiRequest } from "@lib/api-client/client";

type TenderRow = {
  id: string;
  title: string;
};

type CriterionRow = {
  id: string;
  code: string | null;
  title: string;
};

type SourceSnippet = {
  id: string;
  document_id: string;
  document_title: string | null;
  document_type: string | null;
  content: string;
  score: number;
};

type SectionModel = {
  id: string;
  tender_id: string;
  tender_criterion_id: string;
  version: number;
  status: string;
  generated_text: string;
  weakness_flags: Record<string, unknown> | null;
};

type CriterionContext = {
  id: string;
  code: string | null;
  title: string;
  description: string | null;
  max_score: number | null;
  analysis_notes: string | null;
  needs_review: boolean | null;
};

export default function EditorPage() {
  const [tenders, setTenders] = useState<TenderRow[]>([]);
  const [criteria, setCriteria] = useState<CriterionRow[]>([]);
  const [selectedTenderId, setSelectedTenderId] = useState<string | null>(null);
  const [selectedCriterionId, setSelectedCriterionId] = useState<string | null>(null);

  const [criterionContext, setCriterionContext] = useState<CriterionContext | null>(null);
  const [sources, setSources] = useState<SourceSnippet[]>([]);
  const [section, setSection] = useState<SectionModel | null>(null);
  const [sectionHistory, setSectionHistory] = useState<SectionModel[]>([]);
  const [draftText, setDraftText] = useState("");

  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);

  async function loadTenders() {
    setLoading(true);
    setError(null);
    setSessionError(null);

    try {
      const { accessToken, organizationId } = await getSessionAndOrganization();
      const data = await apiRequest<
        { id: string; title: string; status: string }[]
      >("/api/v1/tenders", {
        accessToken,
        organizationId,
      });
      const mapped = data.map((t) => ({ id: t.id, title: t.title }));
      setTenders(mapped);
      if (mapped.length > 0 && !selectedTenderId) {
        setSelectedTenderId(mapped[0].id);
      }
    } catch (e: any) {
      const message = e?.message ?? "Errore inatteso nel caricamento dei bandi.";
      if (message.toLowerCase().includes("sessione non valida")) {
        setSessionError(message);
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadCriteria(tenderId: string) {
    setError(null);
    setSessionError(null);

    try {
      const { accessToken, organizationId } = await getSessionAndOrganization();
      const data = await apiRequest<any[]>(
        `/api/v1/tenders/${tenderId}/criteria`,
        { accessToken, organizationId },
      );
      const mapped: CriterionRow[] = data.map((c) => ({
        id: c.id,
        code: c.code,
        title: c.title,
      }));
      setCriteria(mapped);
      if (mapped.length > 0 && !selectedCriterionId) {
        setSelectedCriterionId(mapped[0].id);
      }
    } catch (e: any) {
      const message = e?.message ?? "Errore inatteso nel caricamento dei criteri.";
      if (message.toLowerCase().includes("sessione non valida")) {
        setSessionError(message);
      } else {
        setError(message);
      }
    }
  }

  async function loadGenerationContext(criterionId: string) {
    setError(null);
    setSessionError(null);

    try {
      const { accessToken, organizationId } = await getSessionAndOrganization();
      const [context, history] = await Promise.all([
        apiRequest<{
          criterion: CriterionContext;
          sources: SourceSnippet[];
          section: SectionModel | null;
        }>(`/api/v1/generation/criteria/${criterionId}`, {
          accessToken,
          organizationId,
        }),
        apiRequest<SectionModel[]>(`/api/v1/generation/criteria/${criterionId}/sections`, {
          accessToken,
          organizationId,
        }),
      ]);
      setCriterionContext(context.criterion);
      setSources(context.sources);
      setSection(context.section);
      setDraftText(context.section?.generated_text ?? "");
      setSectionHistory(history);
    } catch (e: any) {
      const message =
        e?.message ?? "Errore inatteso nel caricamento del contesto di generazione.";
      if (message.toLowerCase().includes("sessione non valida")) {
        setSessionError(message);
      } else {
        setError(message);
      }
    }
  }

  useEffect(() => {
    loadTenders();
  }, []);

  useEffect(() => {
    if (selectedTenderId) {
      setCriteria([]);
      setSelectedCriterionId(null);
      loadCriteria(selectedTenderId);
    } else {
      setCriteria([]);
    }
  }, [selectedTenderId]);

  useEffect(() => {
    if (selectedCriterionId) {
      loadGenerationContext(selectedCriterionId);
    } else {
      setCriterionContext(null);
      setSources([]);
      setSection(null);
      setDraftText("");
    }
  }, [selectedCriterionId]);

  const handleGenerate = async () => {
    if (!selectedCriterionId) return;
    setGenerating(true);
    setError(null);
    setSessionError(null);

    try {
      const { accessToken, organizationId } = await getSessionAndOrganization();
      const data = await apiRequest<SectionModel>(
        `/api/v1/generation/criteria/${selectedCriterionId}/draft`,
        { method: "POST", accessToken, organizationId },
      );
      setSection(data);
      setDraftText(data.generated_text);
      await loadGenerationContext(selectedCriterionId);
    } catch (e: any) {
      const message = e?.message ?? "Errore durante la generazione della sezione.";
      if (message.toLowerCase().includes("sessione non valida")) {
        setSessionError(message);
      } else {
        setError(message);
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!section) return;
    setSaving(true);
    setError(null);
    setSessionError(null);

    try {
      const { accessToken, organizationId } = await getSessionAndOrganization();
      const data = await apiRequest<SectionModel>(
        `/api/v1/generation/sections/${section.id}`,
        {
          method: "PUT",
          accessToken,
          organizationId,
          body: { text: draftText, status: section.status },
        },
      );
      setSection(data);
    } catch (e: any) {
      const message = e?.message ?? "Errore durante il salvataggio della sezione.";
      if (message.toLowerCase().includes("sessione non valida")) {
        setSessionError(message);
      } else {
        setError(message);
      }
    } finally {
      setSaving(false);
    }
  };

  const statusLabel =
    section?.status === "approved"
      ? "Approvata"
      : section?.status === "in_review"
        ? "In revisione"
        : "Bozza";

  return (
    <div className="space-y-6">
      <section className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-50">Editor offerta tecnica</h1>
          <p className="mt-1 text-sm text-slate-400">
            Workspace a due pannelli pensato per redigere le risposte ai criteri, mantenendo sempre
            visibili requisiti e fonti interne.
          </p>
        </div>
      </section>

      {sessionError && (
        <p className="text-xs text-amber-300">
          {sessionError} Vai alla pagina di login per ri-autenticarti.
        </p>
      )}
      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.5fr)_minmax(0,0.5fr)]">
        <Card
          title="Struttura bando & fonti"
          description="Seleziona un bando e un criterio; a seguire vedrai dettagli del criterio e le fonti interne suggerite."
        >
          <div className="flex flex-col gap-3 text-xs text-slate-300">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-slate-400">Bando</label>
              <select
                value={selectedTenderId ?? ""}
                onChange={(e) => {
                  setSelectedTenderId(e.target.value || null);
                  setSelectedCriterionId(null);
                }}
                className="w-full rounded-md border border-borderSubtle bg-surface px-3 py-1.5 text-xs text-slate-100 outline-none"
              >
                {tenders.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-slate-400">Criterio</label>
              <div className="flex max-h-40 flex-col gap-1 overflow-y-auto rounded-md border border-borderSubtle bg-surface">
                {criteria.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCriterionId(c.id)}
                    className={`flex w-full items-start justify-between px-3 py-2 text-left text-[11px] ${
                      selectedCriterionId === c.id
                        ? "bg-slate-800 text-slate-50"
                        : "bg-transparent text-slate-300 hover:bg-slate-900/60"
                    }`}
                  >
                    <span className="line-clamp-2">
                      <span className="mr-1 text-slate-400">{c.code ?? ""}</span>
                      {c.title}
                    </span>
                  </button>
                ))}
                {criteria.length === 0 && (
                  <div className="px-3 py-3 text-[11px] text-slate-500">
                    Nessun criterio disponibile per il bando selezionato.
                  </div>
                )}
              </div>
            </div>

            {criterionContext && (
              <div className="rounded-md border border-borderSubtle bg-surface px-3 py-2 text-[11px]">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <div className="font-semibold text-slate-100">
                    {criterionContext.code ?? ""} {criterionContext.title}
                  </div>
                  {criterionContext.max_score !== null && (
                    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-200">
                      Max {criterionContext.max_score} pt
                    </span>
                  )}
                </div>
                {criterionContext.description && (
                  <p className="mb-2 whitespace-pre-wrap text-[11px] text-slate-400">
                    {criterionContext.description}
                  </p>
                )}
                {criterionContext.analysis_notes && (
                  <p className="text-[11px] text-amber-300">
                    {criterionContext.analysis_notes}
                  </p>
                )}
              </div>
            )}

            <div className="mt-1">
              <div className="mb-1 text-[11px] font-semibold text-slate-200">
                Fonti interne suggerite
              </div>
              <div className="max-h-44 space-y-2 overflow-y-auto rounded-md border border-borderSubtle bg-surface px-3 py-2">
                {sources.length === 0 && (
                  <p className="text-[11px] text-slate-500">
                    Nessuna fonte ancora associata. Genera una bozza per avviare il retrieval.
                  </p>
                )}
                {sources.map((s) => (
                  <div
                    key={s.id}
                    className="rounded-md border border-slate-800 bg-slate-950/40 p-2 text-[11px] text-slate-300"
                  >
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <div className="truncate font-medium">
                        {s.document_title ?? "Documento senza titolo"}
                      </div>
                      <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-200">
                        score {s.score.toFixed(2)}
                      </span>
                    </div>
                    <p className="line-clamp-3 text-[11px] text-slate-400">{s.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card
          title="Testo generato & revisione"
          description="Genera, modifica e salva la risposta tecnica per il criterio selezionato."
        >
          <div className="flex flex-col gap-3 text-xs text-slate-300">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span>Stato sezione:</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] ${
                    section?.status === "approved"
                      ? "bg-emerald-900/70 text-emerald-100"
                      : section?.status === "in_review"
                        ? "bg-sky-900/70 text-sky-100"
                        : "bg-slate-800 text-slate-200"
                  }`}
                >
                  {statusLabel}
                </span>
                {section && (
                  <span className="text-[10px] text-slate-500">v{section.version}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  disabled={generating || !selectedCriterionId}
                  onClick={handleGenerate}
                >
                  {generating ? "Rigenerazione..." : section ? "Rigenera bozza" : "Genera bozza"}
                </Button>
                <Button
                  type="button"
                  disabled={saving || !draftText}
                  onClick={handleSave}
                  className="whitespace-nowrap"
                >
                  {saving ? "Salvataggio..." : "Salva sezione"}
                </Button>
              </div>
            </div>

            <div>
              <textarea
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                placeholder={
                  selectedCriterionId
                    ? "Genera una bozza per iniziare a lavorare sul testo del criterio."
                    : "Seleziona prima un bando e un criterio."
                }
                className="h-80 w-full resize-none rounded-md border border-borderSubtle bg-surface px-3 py-2 text-xs text-slate-100 outline-none"
              />
            </div>

            {sectionHistory.length > 0 && (
              <div className="mt-1 rounded-md border border-borderSubtle bg-surface px-3 py-2 text-[11px] text-slate-300">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="font-semibold text-slate-200">Storico versioni</span>
                  <span className="text-[10px] text-slate-500">
                    {sectionHistory.length} versione{sectionHistory.length > 1 ? "i" : ""}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {sectionHistory.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setSection(s);
                        setDraftText(s.generated_text);
                      }}
                      className={`rounded-md border px-2 py-1 text-[10px] ${
                        section?.id === s.id
                          ? "border-sky-500 bg-sky-950/40 text-sky-100"
                          : "border-slate-700 bg-slate-900/40 text-slate-200 hover:bg-slate-800/60"
                      }`}
                    >
                      v{s.version} · {s.status === "approved" ? "Approvata" : s.status}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-[10px] text-slate-500">
                  Seleziona una versione per rivederne il contenuto e, se necessario, usarla come
                  base per ulteriori modifiche.
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
