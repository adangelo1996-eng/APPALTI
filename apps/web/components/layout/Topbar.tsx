"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@lib/auth/supabaseClient";
import { apiRequest } from "@lib/api-client/client";
import { Button } from "@components/ui/Button";

type OrganizationItem = {
  id: string;
  name: string;
  slug: string | null;
  role: string;
};

export function Topbar() {
  const [organizations, setOrganizations] = useState<OrganizationItem[]>([]);
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const {
        data: { session },
      } = await supabaseClient.auth.getSession();
      if (!session) {
        setUserEmail(null);
        setOrganizations([]);
        setCurrentOrgId(null);
        return;
      }

      setUserEmail(session.user.email ?? null);

      const accessToken = session.access_token;
      const me = await apiRequest<{
        user: { id: string; email: string; full_name: string | null };
        memberships: { organization_id: string; role: string }[];
      }>("/api/v1/auth/me", { accessToken });

      if (me.memberships.length === 0) {
        setOrganizations([]);
        setCurrentOrgId(null);
        return;
      }

      const orgs = await apiRequest<{ items: OrganizationItem[] }>("/api/v1/organizations/my", {
        accessToken,
      });
      setOrganizations(orgs.items);
      setCurrentOrgId(orgs.items[0]?.id ?? null);
    }

    load().catch((err) => {
      setError(err?.message ?? "Impossibile caricare dati utente e workspace.");
      // eslint-disable-next-line no-console
      console.error("Failed to load topbar data", err);
    });
  }, []);

  const initials = userEmail ? userEmail.charAt(0).toUpperCase() : "?";

  const handleLogout = async () => {
    await supabaseClient.auth.signOut();
    router.push("/login");
  };

  return (
    <header className="flex h-14 items-center justify-between border-b border-borderSubtle bg-surface/80 px-4 backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="text-xs uppercase tracking-wide text-slate-400">Workspace</div>
        <select
          value={currentOrgId ?? ""}
          onChange={(e) => setCurrentOrgId(e.target.value)}
          className="rounded-md border border-borderSubtle bg-surfaceElevated px-3 py-1 text-xs text-slate-100 outline-none"
        >
          {organizations.map((org) => (
            <option key={org.id} value={org.id}>
              {org.name} {org.role === "admin" ? "· Admin" : ""}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-3">
        {error && (
          <span className="hidden text-[11px] text-amber-300 sm:inline">
            {error} Alcune funzionalità potrebbero non essere disponibili.
          </span>
        )}
        <Button variant="ghost" className="text-xs text-slate-300">
          Feedback
        </Button>
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/90 text-[11px] font-semibold text-primary-foreground">
            {initials}
          </div>
          <div className="hidden sm:block">
            <div className="truncate max-w-[180px] text-[11px]">{userEmail ?? "Utente"}</div>
            <div className="text-[10px] text-slate-500">Ufficio gare</div>
          </div>
          <Button
            type="button"
            variant="ghost"
            className="text-[11px] text-slate-400"
            onClick={handleLogout}
          >
            Esci
          </Button>
        </div>
      </div>
    </header>
  );
}

