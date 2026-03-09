/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState } from "react";
import { Card } from "@components/ui/Card";
import { Button } from "@components/ui/Button";
import { getSessionAndOrganization } from "@lib/auth/session";
import { apiRequest } from "@lib/api-client/client";

type DocumentRow = {
  id: string;
  title: string | null;
  document_type: string;
  status: string;
};

const DOCUMENT_TYPES = [
  { value: "past_offer", label: "Offerta tecnica passata" },
  { value: "tender", label: "Capitolato / bando" },
  { value: "cv", label: "CV" },
  { value: "certification", label: "Certificazione" },
  { value: "methodology", label: "Metodologia" },
  { value: "reference", label: "Referenza" },
  { value: "org_chart", label: "Organigramma" },
  { value: "service_sheet", label: "Scheda servizio" },
  { value: "other", label: "Altro" },
];

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string | "all">("all");
  const [filterStatus, setFilterStatus] = useState<string | "all">("all");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState("past_offer");
  const [error, setError] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  async function loadDocuments() {
    setLoading(true);
    setError(null);
    setSessionError(null);

    try {
      const { accessToken, organizationId, organizationRole } = await getSessionAndOrganization();
      setIsAdmin(organizationRole === "admin");
      const data = await apiRequest<DocumentRow[]>("/api/v1/documents", {
        accessToken,
        organizationId,
      });
      setDocuments(data);
    } catch (e: any) {
      const message =
        e?.message ?? "Errore imprevisto nel caricamento dei documenti. Riprova più tardi.";

      if (message.toLowerCase().includes("sessione non valida")) {
        setSessionError(message);
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDocuments();
  }, []);

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      !searchTerm ||
      (doc.title ?? "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesType = filterType === "all" || doc.document_type === filterType;
    const matchesStatus = filterStatus === "all" || doc.status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setError(null);
    setSessionError(null);

    try {
      const { accessToken, organizationId, organizationRole } = await getSessionAndOrganization();
      setIsAdmin(organizationRole === "admin");
      const formData = new FormData();
      formData.append("file", file);
      formData.append("document_type", documentType);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/documents/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-Organization-Id": organizationId,
        },
        body: formData,
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Errore upload (${res.status})`);
      }

      setFile(null);
      await loadDocuments();
    } catch (e: any) {
      const message = e?.message ?? "Errore durante l’upload del documento.";

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
        <h1 className="text-lg font-semibold text-slate-50">Knowledge base documentale</h1>
        <p className="mt-1 text-sm text-slate-400">
          Gestisci lo storico documentale: offerte tecniche, capitolati, CV, certificazioni e asset metodologici.
        </p>
      </section>

      <Card
        title="Upload documenti"
        description="Carica PDF e DOCX; il sistema estrae testo, pulisce, chunkizza e genera embedding."
      >
        <form onSubmit={handleUpload} className="mt-2 flex flex-col gap-3 text-xs text-slate-300">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-slate-400">File PDF o DOCX</label>
            <input
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              disabled={isAdmin === false}
              className="block text-xs text-slate-300 file:mr-3 file:rounded-md file:border-0 file:bg-slate-800 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-slate-100 hover:file:bg-slate-700"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-slate-400">Tipologia documento</label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              disabled={isAdmin === false}
              className="w-full rounded-md border border-borderSubtle bg-surface px-3 py-1.5 text-xs text-slate-100 outline-none"
            >
              {DOCUMENT_TYPES.map((dt) => (
                <option key={dt.value} value={dt.value}>
                  {dt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] text-slate-500">
              Ogni documento viene indicizzato per il retrieval assistito nei criteri di valutazione.
            </p>
            <Button type="submit" disabled={!file || uploading} className="whitespace-nowrap">
              {uploading ? "Elaborazione..." : "Carica & indicizza"}
            </Button>
          </div>
          {isAdmin === false && (
            <p className="text-[11px] text-slate-500">
              Solo gli utenti con ruolo <span className="font-semibold">Admin</span> possono caricare
              nuovi documenti. Puoi comunque consultare la knowledge base esistente.
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

      <Card
        title="Elenco documenti"
        description="Vista tabellare con stato di elaborazione e tipologia, pronta per ricerca e filtri."
      >
        <div className="mt-2 space-y-3">
          <div className="flex flex-wrap items-end gap-3 px-1 text-[11px] text-slate-300">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-slate-400">Cerca per titolo</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Es. Offerta manutenzione, Capitolato ICT..."
                className="w-52 rounded-md border border-borderSubtle bg-surface px-2 py-1 text-[11px] text-slate-100 outline-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-slate-400">Tipologia</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-40 rounded-md border border-borderSubtle bg-surface px-2 py-1 text-[11px] text-slate-100 outline-none"
              >
                <option value="all">Tutte</option>
                {DOCUMENT_TYPES.map((dt) => (
                  <option key={dt.value} value={dt.value}>
                    {dt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-slate-400">Stato</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-36 rounded-md border border-borderSubtle bg-surface px-2 py-1 text-[11px] text-slate-100 outline-none"
              >
                <option value="all">Tutti</option>
                <option value="ready">Pronto</option>
                <option value="processing">In elaborazione</option>
                <option value="failed">Fallito</option>
              </select>
            </div>
          </div>

          <div className="overflow-hidden rounded-md border border-borderSubtle">
          <table className="min-w-full border-collapse text-xs">
            <thead className="bg-slate-900/70 text-slate-300">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Titolo</th>
                <th className="px-3 py-2 text-left font-medium">Tipologia</th>
                <th className="px-3 py-2 text-left font-medium">Stato</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={3} className="px-3 py-3 text-center text-slate-400">
                    Caricamento documenti in corso...
                  </td>
                </tr>
              )}
              {!loading && filteredDocuments.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-3 py-3 text-center text-slate-500">
                    Nessun documento corrisponde ai filtri correnti.
                  </td>
                </tr>
              )}
              {!loading &&
                filteredDocuments.map((doc) => (
                  <tr key={doc.id} className="border-t border-slate-800/80">
                    <td className="px-3 py-2 text-slate-100">{doc.title ?? "—"}</td>
                    <td className="px-3 py-2 text-slate-300">{doc.document_type}</td>
                    <td className="px-3 py-2">
                      <span
                        className={
                          doc.status === "ready"
                            ? "rounded-full bg-emerald-900/60 px-2 py-0.5 text-[11px] text-emerald-200"
                            : doc.status === "processing"
                              ? "rounded-full bg-amber-900/60 px-2 py-0.5 text-[11px] text-amber-200"
                              : doc.status === "failed"
                                ? "rounded-full bg-red-900/60 px-2 py-0.5 text-[11px] text-red-200"
                                : "rounded-full bg-slate-800 px-2 py-0.5 text-[11px] text-slate-200"
                        }
                      >
                        {doc.status}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          </div>
        </div>
      </Card>
    </div>
  );
}


