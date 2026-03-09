## Frontend HTML/CSS/JS per RFP AI Co-Pilot

Questa cartella contiene una versione **statica** dell'interfaccia bandi, costruita con HTML/CSS/JS puro che dialoga con le API FastAPI esistenti.

### Struttura

- `index.html`: pagina di login con invio link di accesso via Supabase (passwordless).
- `appalti.html`: pagina di gestione bandi e criteri, con:
  - upload disciplinare (`POST /api/v1/tenders/upload`);
  - elenco bandi (`GET /api/v1/tenders`);
  - criteri per bando (`GET /api/v1/tenders/{id}/criteria`).
- `css/`: stile base, layout e componenti.
- `js/config.js`: configurazione `API_BASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`.
- `js/api.js`: helper per chiamate alle API con bearer token Supabase.
- `js/auth.js`: logica di login via Supabase magic link.
- `js/appalti.js`: logica per caricamento bandi, criteri e upload disciplinare.

### Migrazione graduale

- **Fase 1**: tieni attivo il frontend Next.js esistente e usa questa cartella per sperimentare la versione statica (servendo i file con qualsiasi web server statico).
- **Fase 2**: punta gli utenti sperimentali a `index.html` / `appalti.html`, riusando lo stesso backend FastAPI e la stessa configurazione Supabase.
- **Fase 3**: una volta coperta tutta la funzionalità necessaria, puoi dismettere gradualmente le pagine Next.js corrispondenti, mantenendo invariato il backend (`/api/v1/...`).

