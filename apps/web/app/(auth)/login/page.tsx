"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@lib/auth/supabaseClient";
import { Button } from "@components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    supabaseClient.auth.getSession().then(({ data }) => {
      if (data.session) {
        router.push("/");
      }
    });
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const { error } = await supabaseClient.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
      },
    });
    setLoading(false);
    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Controlla la tua casella email per completare l'accesso.");
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-surfaceElevated/70 p-8 shadow-2xl shadow-slate-950/60 backdrop-blur">
        <div className="mb-6 space-y-1 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/90 text-sm font-bold text-primary-foreground">
            RFP
          </div>
          <h1 className="text-lg font-semibold text-slate-50">Accedi a RFP AI Co-Pilot</h1>
          <p className="text-xs text-slate-400">
            Copilot specializzato per la redazione di offerte tecniche e gestione bandi.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1 text-sm">
            <label htmlFor="email" className="block text-slate-200">
              Email di lavoro
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nome.cognome@azienda.it"
              className="mt-1 w-full rounded-md border border-borderSubtle bg-surface px-3 py-2 text-sm text-slate-100 outline-none ring-primary/40 placeholder:text-slate-500 focus:ring-2"
            />
          </div>
          <Button type="submit" fullWidth disabled={loading}>
            {loading ? "Invio in corso..." : "Invia link di accesso"}
          </Button>
        </form>

        <p className="mt-4 text-center text-[11px] text-slate-500">
          Accesso passwordless via Supabase Auth. Ideale per team ufficio gare che collaborano su più
          gare contemporaneamente.
        </p>

        {message && (
          <p className="mt-3 text-center text-xs text-slate-300" role="status">
            {message}
          </p>
        )}
      </div>
    </main>
  );
}

