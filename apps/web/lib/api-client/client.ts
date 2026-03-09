const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type ApiRequestOptions = {
  method?: HttpMethod;
  body?: unknown;
  accessToken?: string | null;
  organizationId?: string | null;
};

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (options.accessToken) {
    headers.Authorization = `Bearer ${options.accessToken}`;
  }
  if (options.organizationId) {
    headers["X-Organization-Id"] = options.organizationId;
  }

  let response: Response;

  try {
    response = await fetch(url, {
      method: options.method ?? "GET",
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      cache: "no-store",
    });
  } catch {
    throw new Error(
      "Impossibile contattare il server API. Verifica la connessione o riprova più tardi.",
    );
  }

  if (!response.ok) {
    let message = `Richiesta API fallita (${response.status})`;

    try {
      const data = await response.json();
      if (typeof data === "object" && data) {
        if ("detail" in data && typeof (data as any).detail === "string") {
          message = (data as any).detail;
        } else if ("message" in data && typeof (data as any).message === "string") {
          message = (data as any).message;
        }
      }
    } catch {
      const text = await response.text();
      if (text) {
        message = text;
      }
    }

    throw new Error(message);
  }

  return (await response.json()) as T;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export async function apiRequest<T>(
  path: string,
  options: {
    method?: HttpMethod;
    body?: unknown;
    accessToken?: string | null;
    organizationId?: string | null;
  } = {},
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (options.accessToken) {
    headers.Authorization = `Bearer ${options.accessToken}`;
  }
  if (options.organizationId) {
    headers["X-Organization-Id"] = options.organizationId;
  }

  const response = await fetch(url, {
    method: options.method ?? "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API error ${response.status}: ${text}`);
  }

  return (await response.json()) as T;
}

