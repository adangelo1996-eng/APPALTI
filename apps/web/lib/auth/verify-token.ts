import { decodeJwt } from "jose";
import { NextRequest } from "next/server";

export type TokenUser = {
  id: string;
  email: string;
};

export function getTokenUser(request: NextRequest): TokenUser {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new AuthError("Token di autenticazione mancante.");
  }

  const token = authHeader.slice(7);

  try {
    const payload = decodeJwt(token);
    const id = payload.sub;
    const email = payload.email as string | undefined;

    if (!id || !email) {
      throw new AuthError("Token non valido: dati utente mancanti.");
    }

    const exp = payload.exp;
    if (typeof exp === "number" && Date.now() / 1000 > exp) {
      throw new AuthError("Token scaduto. Effettua nuovamente l'accesso.");
    }

    return { id, email };
  } catch (err) {
    if (err instanceof AuthError) throw err;
    throw new AuthError("Token non valido.");
  }
}

export function getOrganizationId(request: NextRequest): string {
  const orgId = request.headers.get("X-Organization-Id");
  if (!orgId) {
    throw new AuthError("Header X-Organization-Id obbligatorio.");
  }
  return orgId;
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}
