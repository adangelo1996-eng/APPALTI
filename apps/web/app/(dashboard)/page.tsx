/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState } from "react";
import { Card } from "@components/ui/Card";
import { getSessionAndOrganization } from "@lib/auth/session";
import { apiRequest } from "@lib/api-client/client";

type ActivityItem = {
  id: string;
  action: string;
  target_type: string | null;
  user_email: string | null;
  created_at: string;
  metadata: Record<string, unknown> | null;
};

type DashboardData = {
  documents_count: number;
  tenders_count: number;
  sections_count: number;
  recent_activity: ActivityItem[];
};

const ACTION_LABELS: Record<string, string> = {
  "tender.created": "Nuovo bando creato",
  "document.uploaded": "Documento caricato",
  "document.ingested": "Documento processato",
  "document.failed": "Errore elaborazione documento",
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const { accessToken, organizationId } = await getSessionAndOrganization();
        const d = await apiRequest<DashboardData>("/api/v1/dashboard", {
          accessToken,
          organizationId,
        });
        setData(d);
      } catch (e: any) {
        setError(e?.message ?? "Errore caricamento dashboard.");
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-lg font-semibold text-slate-50">Workspace organizzazione</h1>
        <p className="mt-1 text-sm text-slate-400">
          Punto di controllo centrale per bandi, documenti di knowledge base e bozze di offerta
          tecnica.
        </p>
      </section>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <section className="grid gap-4 md:grid-cols-3">
        <Card
          title="Documenti knowledge base"
          description="Offerte tecniche passate, capitolati, CV e asset metodologici indicizzati."
        >
          <div className="mt-2 text-2xl font-semibold text-slate-50">
            {data ? data.documents_count : "—"}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {data && data.documents_count === 0
              ? "Carica i primi documenti per iniziare."
              : "Documenti nella knowledge base."}
          </p>
        </Card>
        <Card
          title="Bandi in lavorazione"
          description="Gare aperte per cui stai preparando l'offerta tecnica."
        >
          <div className="mt-2 text-2xl font-semibold text-slate-50">
            {data ? data.tenders_count : "—"}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {data && data.tenders_count === 0
              ? "Crea un nuovo bando dalla sezione Bandi."
              : "Bandi attivi."}
          </p>
        </Card>
        <Card
          title="Offerte tecniche generate"
          description="Versioni e sezioni generate dal copilot, pronte per revisione."
        >
          <div className="mt-2 text-2xl font-semibold text-slate-50">
            {data ? data.sections_count : "—"}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {data && data.sections_count === 0
              ? "Usa l'editor per generare le prime bozze."
              : "Sezioni generate."}
          </p>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card
          title="Timeline attività"
          description="Azioni recenti del team su documenti, bandi e sezioni generate."
        >
          <ul className="mt-2 space-y-2 text-xs text-slate-400">
            {!data && <li>Caricamento...</li>}
            {data && data.recent_activity.length === 0 && (
              <li>Nessuna attività ancora registrata. Saranno visibili upload, parsing e generazioni.</li>
            )}
            {data?.recent_activity.map((a) => (
              <li key={a.id} className="flex items-start justify-between gap-2 border-b border-borderSubtle pb-2">
                <div>
                  <span className="text-slate-200">{ACTION_LABELS[a.action] ?? a.action}</span>
                  {a.user_email && (
                    <span className="ml-1 text-slate-500">— {a.user_email}</span>
                  )}
                  {a.metadata && (a.metadata as any).filename && (
                    <span className="ml-1 text-slate-500">({(a.metadata as any).filename})</span>
                  )}
                </div>
                <span className="shrink-0 text-[10px] text-slate-600">
                  {new Date(a.created_at).toLocaleString("it-IT", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </li>
            ))}
          </ul>
        </Card>
        <Card
          title="Suggerimenti di utilizzo"
          description="Come sfruttare al massimo il copilot nella preparazione dell'offerta."
        >
          <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-400">
            <li>Carica prima le offerte storiche e la documentazione di metodologia.</li>
            <li>Analizza il bando per avere una struttura chiara dei criteri e punteggi.</li>
            <li>
              Usa l'editor a due pannelli per mantenere sempre visibili requisiti, fonti e testo
              generato.
            </li>
          </ul>
        </Card>
      </section>
    </div>
  );
}
