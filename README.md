# RFP AI Co-Pilot

Web app full-stack TypeScript per la gestione di bandi di gara e la redazione assistita di offerte tecniche.

## Stack

- **Frontend + Backend**: Next.js 14 (App Router) + TypeScript
- **Database ORM**: Prisma (PostgreSQL)
- **Auth**: Supabase Auth (OTP login passwordless)
- **UI**: Tailwind CSS
- **Deploy**: Vercel

## Sviluppo locale

```bash
# 1. Installa dipendenze
cd apps/web
npm install

# 2. Configura variabili d'ambiente
# Copia .env.example in .env.local e compila i valori
cp .env.example .env.local

# 3. Genera il client Prisma
npx prisma generate

# 4. (Opzionale) Sincronizza schema DB
npx prisma db push

# 5. Avvia il dev server
npm run dev
```

L'app sara' disponibile su `http://localhost:3000`.

## Deploy su Vercel

1. Crea un nuovo progetto su [vercel.com](https://vercel.com)
2. Collega il repository Git
3. Nelle impostazioni del progetto, imposta **Root Directory** su `apps/web`
4. Configura le variabili d'ambiente nel pannello Vercel:
   - `DATABASE_URL` - connection string PostgreSQL (es. Supabase, Neon)
   - `NEXT_PUBLIC_SUPABASE_URL` - URL del progetto Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - chiave pubblica Supabase
5. Deploy automatico ad ogni push su branch principale

## Struttura del progetto

```
apps/
  web/                  # App Next.js (frontend + API routes)
    app/
      (auth)/login/     # Pagina di login
      (dashboard)/      # Dashboard, documenti, bandi
      editor/           # Editor offerta tecnica
      api/v1/           # API routes (auth, documents, tenders, generation)
    components/         # Componenti UI riutilizzabili
    lib/                # Prisma client, auth helpers, API client
    prisma/             # Schema database
  api/                  # [Legacy] Backend Python FastAPI
scripts/
  db-init.sql           # Schema SQL iniziale
```

## Variabili d'ambiente

| Variabile | Descrizione |
|-----------|-------------|
| `DATABASE_URL` | Connection string PostgreSQL |
| `NEXT_PUBLIC_SUPABASE_URL` | URL progetto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chiave anonima Supabase |
