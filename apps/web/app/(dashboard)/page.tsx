import { Card } from "@components/ui/Card";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-lg font-semibold text-slate-50">Workspace organizzazione</h1>
        <p className="mt-1 text-sm text-slate-400">
          Punto di controllo centrale per bandi, documenti di knowledge base e bozze di offerta
          tecnica.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card
          title="Documenti knowledge base"
          description="Offerte tecniche passate, capitolati, CV e asset metodologici indicizzati."
        >
          <div className="mt-2 text-2xl font-semibold text-slate-50">—</div>
          <p className="mt-1 text-xs text-slate-500">Carica i primi documenti per iniziare.</p>
        </Card>
        <Card
          title="Bandi in lavorazione"
          description="Gare aperte per cui stai preparando l’offerta tecnica."
        >
          <div className="mt-2 text-2xl font-semibold text-slate-50">—</div>
          <p className="mt-1 text-xs text-slate-500">Crea un nuovo bando dalla sezione Bandi.</p>
        </Card>
        <Card
          title="Offerte tecniche generate"
          description="Versioni e sezioni generate dal copilot, pronte per revisione."
        >
          <div className="mt-2 text-2xl font-semibold text-slate-50">—</div>
          <p className="mt-1 text-xs text-slate-500">
            Usa l’editor per consolidare i contributi del team.
          </p>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card
          title="Timeline attività"
          description="Azioni recenti del team su documenti, bandi e sezioni generate."
        >
          <ul className="mt-2 space-y-2 text-xs text-slate-400">
            <li>Nessuna attività ancora registrata. Saranno visibili upload, parsing e generazioni.</li>
          </ul>
        </Card>
        <Card
          title="Suggerimenti di utilizzo"
          description="Come sfruttare al massimo il copilot nella preparazione dell’offerta."
        >
          <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-400">
            <li>Carica prima le offerte storiche e la documentazione di metodologia.</li>
            <li>Analizza il bando per avere una struttura chiara dei criteri e punteggi.</li>
            <li>
              Usa l’editor a due pannelli per mantenere sempre visibili requisiti, fonti e testo
              generato.
            </li>
          </ul>
        </Card>
      </section>
    </div>
  );
}

