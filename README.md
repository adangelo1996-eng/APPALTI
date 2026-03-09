Appalti – RFP AI Co-Pilot
==========================

Questo progetto contiene:

- **Frontend** Next.js (App Router) in `apps/web`
- **Backend** FastAPI in `apps/api`

L’obiettivo è assistere nella gestione bandi, knowledge base documentale e redazione di offerte tecniche.

## 1. Prerequisiti

- Node.js 18+ e npm
- Python 3.11+
- Postgres in esecuzione (es. in locale su `localhost:5432`)
- Un progetto Supabase configurato (Auth + Storage)

## 2. Configurazione ambiente

Nella root del progetto copia il file `.env.example` in `.env`:

```bash
cp .env.example .env
```

Poi imposta:

- `DATABASE_URL`: stringa di connessione Postgres (es. `postgresql+asyncpg://appalti:appalti@localhost:5432/appalti`)
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET` con i valori del tuo progetto Supabase
- `NEXT_PUBLIC_API_BASE_URL`: in sviluppo tipicamente `http://localhost:8000`
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`: stessi valori di Supabase lato browser

### 2.1. Database di sviluppo rapido

Esempio comando `psql` per creare utente e database:

```sql
CREATE USER appalti WITH PASSWORD 'appalti';
CREATE DATABASE appalti OWNER appalti;
GRANT ALL PRIVILEGES ON DATABASE appalti TO appalti;
```

Poi applica le migrazioni/schema come previsto dal backend (o importa lo schema esistente se già fornito).

## 3. Avvio backend (FastAPI)

Dal path `apps/api`:

```bash
cd apps/api
python -m venv .venv
source .venv/bin/activate  # su Windows: .venv\Scripts\activate
pip install -r requirements.txt

uvicorn app.main:app --reload --port 8000
```

Questo esporrà:

- `GET http://localhost:8000/health`
- API REST sotto `http://localhost:8000/api/v1/...` (usate dal frontend)
- documentazione OpenAPI su `http://localhost:8000/docs`

## 4. Avvio frontend (Next.js)

Dal path `apps/web`:

```bash
cd apps/web
npm install
npm run dev
```

Il frontend sarà disponibile su:

- `http://localhost:3000/login` (schermata di login Supabase)
- `http://localhost:3000/` (dashboard dopo login)

Assicurati che:

- il backend sia raggiungibile a `NEXT_PUBLIC_API_BASE_URL` (per default `http://localhost:8000`)
- le variabili Supabase siano corrette (in caso contrario Supabase lancerà errori espliciti).

## 5. Flusso per un primo test visivo

1. Avvia Postgres e assicurati che `DATABASE_URL` sia corretta.
2. Avvia il **backend** come descritto sopra.
3. Avvia il **frontend** con `npm run dev` in `apps/web`.
4. Apri `http://localhost:3000/login`:
   - inserisci l’email di lavoro configurata in Supabase,
   - completa il login tramite il magic link.
5. Una volta autenticato:
   - nella **Topbar** vedrai workspace e ruolo (es. `· Admin` se admin),
   - nella sidebar puoi navigare tra:
     - `Knowledge base`: upload/filtri documenti (solo Admin può caricare; tutti possono consultare),
     - `Bandi & criteri`: upload disciplinari, tabella bandi, criteri con filtri,
     - `Offerta tecnica`: editor a due pannelli, storico versioni sezioni.

Se qualcosa non funziona (errori di rete o auth), controlla:

- log del backend in console (uvicorn),
- console del browser per eventuali messaggi di errore espliciti dal frontend.

RFP AI Co-Pilot
================

MVP multi-tenant SaaS per gestione gare d’appalto, ingestion documentale, RAG e copilot di scrittura per offerte tecniche.

## Struttura del progetto

- `apps/web`: frontend Next.js (App Router) + TypeScript + Tailwind.
- `apps/api`: backend FastAPI in Python.
- `scripts`: script di avvio e inizializzazione database.

## Requisiti

- Node.js LTS
- Python 3.11+
- Account Supabase con Postgres + pgvector abilitato

## Setup rapido

1. Copia `env.example` in `.env` e compila i valori richiesti.
2. Inizializza il database con `scripts/db-init.sql`.
3. Avvia il backend FastAPI.
4. Avvia il frontend Next.js.

Dettagli più specifici sono nei README di `apps/web` e `apps/api`.

