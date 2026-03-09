RFP AI Co-Pilot – Frontend (apps/web)
=====================================

Frontend Next.js (App Router) che fornisce:

- schermata di login con Supabase Auth (magic link),
- dashboard workspace organizzazione,
- gestione knowledge base documenti, bandi e editor offerta tecnica.

## Variabili d'ambiente necessarie

Per far funzionare correttamente il frontend sono richieste le seguenti variabili (in `.env` o simile):

- `NEXT_PUBLIC_SUPABASE_URL`: URL del progetto Supabase.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: chiave anonima pubblica Supabase.
- `NEXT_PUBLIC_API_BASE_URL`: base URL del backend applicativo (es. `http://localhost:8000`).

In produzione queste variabili **devono** essere configurate; in caso contrario l'applicazione segnalerà errori espliciti sull'assenza di Supabase.

## Avvio in sviluppo

1. Posizionati nella root della repo e assicurati di avere le variabili d'ambiente configurate.
2. Installa le dipendenze:

   ```bash
   cd apps/web
   npm install
   ```

3. Avvia il dev server:

   ```bash
   npm run dev
   ```

4. Apri `http://localhost:3000/login` per eseguire l’accesso.

## Backlog funzionalità frontend

Alcune possibili estensioni da implementare in cicli successivi:

- Filtri e ricerca su documenti, bandi e criteri (per titolo, stato, tipologia).
- Gestione ruoli e permessi lato UI (azioni diverse per admin/editor).
- Storico versioni delle sezioni e confronto tra versioni di bozza/offerta.
- Miglioramenti di performance (paginazione tabelle, lazy loading dei dati più pesanti).

