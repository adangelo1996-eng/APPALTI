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
  status: string;
};

type CriterionRow = {
  id: string;
  code: string | null;
  title: string;
  description: string | null;
  max_score: number | null;
  constraints: { items?: string[] } | null;
  required_documents: { items?: string[] } | null;
  keywords: string[] | null;
  analysis_notes: string | null;
  needs_review: boolean | null;
  order_index: number | null;
};

export default function TendersPage() {
  const [tenders, setTenders] = useState<TenderRow[]>([]);
  const [criteria, setCriteria] = useState<CriterionRow[]>([]);
  const [selectedTenderId, setSelectedTenderId] = useState<string | null>(null);
  const [tenderSearch, setTenderSearch] = useState("");
  const [criteriaSearch, setCriteriaSearch] = useState("");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const totalScore = criteria.reduce((sum, c) => sum + (c.max_score ?? 0), 0);

  async function loadTenders() {
    setLoading(true);
    setError(null);
    setSessionError(null);

    try {
      const { accessToken, organizationId, organizationRole } = await getSessionAndOrganization();
      setIsAdmin(organizationRole === "admin");
      const data = await apiRequest<TenderRow[]>("/api/v1/tenders", {
        accessToken,
        organizationId,
      });
      setTenders(data);
      if (data.length > 0 && !selectedTenderId) {
        setSelectedTenderId(data[0].id);
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
      const { accessToken, organizationId, organizationRole } = await getSessionAndOrganization();
      setIsAdmin(organizationRole === "admin");
      const data = await apiRequest<CriterionRow[]>(
        `/api/v1/tenders/${tenderId}/criteria`,
        {
          accessToken,
          organizationId,
        },
      );
      setCriteria(data);
    } catch (e: any) {
      const message = e?.message ?? "Errore inatteso nel caricamento dei criteri.";

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
      loadCriteria(selectedTenderId);
    } else {
      setCriteria([]);
    }
  }, [selectedTenderId]);

  const filteredTenders = tenders.filter((t) =>
    !tenderSearch
      ? true
      : t.title.toLowerCase().includes(tenderSearch.toLowerCase()),
  );

  const filteredCriteria = criteria.filter((c) => {
    if (!criteriaSearch) return true;
    const haystack = `${c.code ?? ""} ${c.title} ${c.description ?? ""}`.toLowerCase();
    return haystack.includes(criteriaSearch.toLowerCase());
  });

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title) return;
    setUploading(true);
    setError(null);
    setSessionError(null);

    try {
      const { accessToken, organizationId, organizationRole } = await getSessionAndOrganization();
      setIsAdmin(organizationRole === "admin");
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/tenders/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-Organization-Id": organizationId,
        },
        body: formData,
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Errore upload bando (${res.status})`);
      }

      setTitle("");
      setFile(null);
      await loadTenders();
    } catch (e: any) {
      const message = e?.message ?? "Errore durante l’upload del bando.";

      if (message.toLowerCase().includes("sessione non valida")) {
        setSessionError(message);
      } else {
        setError(message);
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-lg font-semibold text-slate-50">Bandi e criteri di valutazione</h1>
        <p className="mt-1 text-sm text-slate-400">
          Carica disciplinari e capitolati, estrai automaticamente criteri, sub-criteri, punteggi e requisiti documentali.
        </p>
      </section>

      <Card title="Parsing bando" description="Upload disciplinare e generazione struttura criteri.">
        <form onSubmit={handleUpload} className="mt-2 flex flex-col gap-3 text-xs text-slate-300">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-slate-400">Titolo interno bando</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Gara servizi manutenzione 2025"
              disabled={isAdmin === false}
              className="w-full rounded-md border border-borderSubtle bg-surface px-3 py-1.5 text-xs text-slate-100 outline-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-slate-400">File disciplinare (PDF o DOCX)</label>
            <input
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              disabled={isAdmin === false}
              className="block text-xs text-slate-300 file:mr-3 file:rounded-md file:border-0 file:bg-slate-800 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-slate-100 hover:file:bg-slate-700"
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] text-slate-500">
              L’AI analizza il disciplinare e costruisce una tabella criteri navigabile.
            </p>
            <Button type="submit" disabled={!file || !title || uploading || isAdmin === false}>
              {uploading ? "Analisi in corso..." : "Crea bando da disciplinare"}
            </Button>
          </div>
          {isAdmin === false && (
            <p className="text-[11px] text-slate-500">
              Solo gli utenti con ruolo <span className="font-semibold">Admin</span> possono creare
              nuovi bandi. Puoi comunque consultare i bandi e i relativi criteri esistenti.
            </p>
          )}
          {sessionError && (
            <p className="text-[11px] text-amber-300">
              {sessionError} Vai alla pagina di login per ri-autenticarti.
            </p>
          )}
          {error && <p className="text-[11px] text-red-400">{error}</p>}
        </form>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.45fr)_minmax(0,0.55fr)]">
        <Card
          title="Elenco bandi"
          description="Lista bandi attivi, con stato di avanzamento dell’offerta tecnica."
        >
          <div className="mt-2 space-y-3">
            <div className="flex items-end gap-3 px-1 text-[11px] text-slate-300">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-slate-400">Cerca bando</label>
                <input
                  type="text"
                  value={tenderSearch}
                  onChange={(e) => setTenderSearch(e.target.value)}
                  placeholder="Es. Gara manutenzione, Fornitura servizi..."
                  className="w-52 rounded-md border border-borderSubtle bg-surface px-2 py-1 text-[11px] text-slate-100 outline-none"
                />
              </div>
            </div>

            <div className="overflow-hidden rounded-md border border-borderSubtle">
            <table className="min-w-full border-collapse text-xs">
              <thead className="bg-slate-900/70 text-slate-300">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Titolo</th>
                  <th className="px-3 py-2 text-left font-medium">Stato</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={2} className="px-3 py-3 text-center text-slate-400">
                      Caricamento bandi in corso...
                    </td>
                  </tr>
                )}
                {!loading && filteredTenders.length === 0 && (
                  <tr>
                    <td colSpan={2} className="px-3 py-3 text-center text-slate-500">
                      Nessun bando corrisponde ai filtri correnti.
                    </td>
                  </tr>
                )}
                {!loading &&
                  filteredTenders.map((t) => (
                    <tr
                      key={t.id}
                      className={`cursor-pointer border-t border-slate-800/80 ${
                        selectedTenderId === t.id ? "bg-slate-900/60" : "hover:bg-slate-900/40"
                      }`}
                      onClick={() => setSelectedTenderId(t.id)}
                    >
                      <td className="px-3 py-2 text-slate-100">{t.title}</td>
                      <td className="px-3 py-2 text-slate-300">{t.status}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
            </div>
          </div>
        </Card>

        <Card
          title="Criteri di valutazione"
          description="Struttura criteri e sub-criteri estratta dal disciplinare, con punteggi, vincoli ed evidenze richieste."
        >
          <div className="mt-2 space-y-3">
            <div className="flex items-end gap-3 px-1 text-[11px] text-slate-300">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-slate-400">Filtra criteri</label>
                <input
                  type="text"
                  value={criteriaSearch}
                  onChange={(e) => setCriteriaSearch(e.target.value)}
                  placeholder="Codice o titolo criterio..."
                  className="w-64 rounded-md border border-borderSubtle bg-surface px-2 py-1 text-[11px] text-slate-100 outline-none"
                />
              </div>
            </div>

            <div className="max-h-[380px] overflow-y-auto rounded-md border border-borderSubtle">
            <table className="min-w-full border-collapse text-xs">
              <thead className="bg-slate-900/70 text-slate-300">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Criterio / sub-criterio</th>
                  <th className="px-3 py-2 text-left font-medium">Punteggio max</th>
                  <th className="px-3 py-2 text-left font-medium">Vincoli</th>
                  <th className="px-3 py-2 text-left font-medium">Evidenze richieste</th>
                  <th className="px-3 py-2 text-left font-medium">Keyword</th>
                  <th className="px-3 py-2 text-left font-medium">Note / review</th>
                </tr>
              </thead>
              <tbody>
                {filteredCriteria.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-3 text-center text-slate-500">
                      {criteria.length === 0
                        ? "Seleziona un bando per visualizzare i criteri estratti."
                        : "Nessun criterio corrisponde ai filtri correnti."}
                    </td>
                  </tr>
                )}
                {filteredCriteria.map((c) => (
                  <tr
                    key={c.id}
                    className={`border-t border-slate-800/80 align-top ${
                      c.needs_review ? "bg-amber-950/30" : ""
                    }`}
                  >
                    <td className="px-3 py-2 text-slate-100">
                      <div className="text-[11px] text-slate-400">{c.code ?? "—"}</div>
                      <div className="font-medium">{c.title}</div>
                      {c.description && (
                        <p className="mt-1 line-clamp-3 text-[11px] text-slate-500">
                          {c.description}
                        </p>
                      )}
                    </td>
                    <td className="px-3 py-2 text-slate-300">
                      {c.max_score !== null ? c.max_score : "—"}
                    </td>
                    <td className="px-3 py-2 text-[11px] text-slate-400">
                      {c.constraints?.items && c.constraints.items.length > 0
                        ? c.constraints.items.map((ln, i) => (
                            <div key={i} className="mb-1">
                              • {ln}
                            </div>
                          ))
                        : "—"}
                    </td>
                    <td className="px-3 py-2 text-[11px] text-slate-400">
                      {c.required_documents?.items && c.required_documents.items.length > 0
                        ? c.required_documents.items.map((ln, i) => (
                            <div key={i} className="mb-1">
                              • {ln}
                            </div>
                          ))
                        : "—"}
                    </td>
                    <td className="px-3 py-2 text-[11px] text-slate-300">
                      {c.keywords && c.keywords.length > 0 ? c.keywords.join(", ") : "—"}
                    </td>
                    <td className="px-3 py-2 text-[11px] text-slate-300">
                      {c.needs_review && (
                        <div className="mb-1 inline-flex items-center rounded-full bg-amber-900/70 px-2 py-0.5 text-[10px] text-amber-100">
                          Da verificare
                        </div>
                      )}
                      {c.analysis_notes && (
                        <p className="mt-1 text-[11px] text-slate-400">{c.analysis_notes}</p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        </Card>
      </div>

      {criteria.length > 0 && (
        <p className="text-xs text-slate-400">
          Punteggio totale individuato (somma criteri):{" "}
          <span className="font-semibold text-slate-100">{totalScore.toFixed(2)}</span> punti.
          I criteri evidenziati richiedono revisione manuale.
        </p>
      )}
    </div>
  );
}


