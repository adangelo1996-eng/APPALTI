import { supabaseClient } from "@lib/auth/supabaseClient";
import { apiRequest } from "@lib/api-client/client";

type MeResponse = {
  user: { id: string; email: string; full_name: string | null };
  memberships: { organization_id: string; role: string }[];
};

export type SessionOrganization = {
  accessToken: string;
  organizationId: string;
  organizationRole: string;
  user: MeResponse["user"];
  memberships: MeResponse["memberships"];
};

export async function getSessionAndOrganization(): Promise<SessionOrganization> {
  const {
    data: { session },
  } = await supabaseClient.auth.getSession();

  if (!session) {
    throw new Error("Sessione non valida. Accedi nuovamente.");
  }

  const accessToken = session.access_token;

  const me = await apiRequest<MeResponse>("/api/v1/auth/me", { accessToken });

  if (!me.memberships || me.memberships.length === 0) {
    throw new Error("Nessuna organizzazione associata al tuo utente.");
  }

  const organizationId = me.memberships[0]?.organization_id;

  if (!organizationId) {
    throw new Error("Organizzazione non valida per il tuo utente.");
  }

  const currentMembership =
    me.memberships.find((m) => m.organization_id === organizationId) ??
    me.memberships[0];

  return {
    accessToken,
    organizationId,
    organizationRole: currentMembership.role,
    user: me.user,
    memberships: me.memberships,
  };
}

