async function authorizedFetch(path, options = {}) {
  const session = await getCurrentSession();
  if (!session || !session.access_token) {
    throw new Error("Sessione non valida: effettua nuovamente il login.");
  }

  const headers = new Headers(options.headers || {});
  headers.set("Authorization", `Bearer ${session.access_token}`);

  const url = `${API_BASE_URL}${path}`;
  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const text = await response.text();
    const message = text || `Richiesta fallita (${response.status})`;
    throw new Error(message);
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  return response.text();
}

async function getJson(path) {
  return authorizedFetch(path);
}

async function postFormData(path, formData) {
  return authorizedFetch(path, {
    method: "POST",
    body: formData,
  });
}

