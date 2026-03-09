import { NextResponse } from "next/server";
import { AuthError } from "@lib/auth/verify-token";

export function jsonError(message: string, status: number) {
  return NextResponse.json({ detail: message }, { status });
}

export function handleApiError(err: unknown) {
  if (err instanceof AuthError) {
    return jsonError(err.message, 401);
  }
  console.error("API error:", err);
  const message = err instanceof Error ? err.message : "Errore interno del server.";
  return jsonError(message, 500);
}
