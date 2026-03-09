// Configurazione base per l'app HTML/JS
// NOTA: FastAPI può ancora non essere attivo; qui configuriamo Supabase per il login reale.

const API_BASE_URL = window.API_BASE_URL || "http://localhost:8000";

// Toggle globale: quando true, il login e le pagine usano solo mock locale.
// Ora abilitiamo l'autenticazione reale via Supabase, quindi imposta a false.
const USE_MOCK_AUTH = false;

// Parametri Supabase reali (publishable/anon key)
const SUPABASE_URL = "https://xofqdtflnchbjaklrebr.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_si6hejIEh3azkR3wgueBzw_ZshVktea";

// Espone anche su window per uso in altri script (auth.js).
window.SUPABASE_URL = SUPABASE_URL;
window.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;

// Chiave usata per salvare la \"sessione\" mock nel localStorage.
const MOCK_SESSION_KEY = "rfp_mock_session";

// --- Modalità MOCK ---------------------------------------------------------

function setMockSession(email) {
  const mockSession = {
    user: { email },
    access_token: "mock-access-token",
    created_at: new Date().toISOString(),
  };
  try {
    window.localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(mockSession));
  } catch {
    // ignore storage errors in mock mode
  }
}

function clearMockSession() {
  try {
    window.localStorage.removeItem(MOCK_SESSION_KEY);
  } catch {
    // ignore
  }
}

async function getCurrentSession() {
  if (USE_MOCK_AUTH) {
    try {
      const raw = window.localStorage.getItem(MOCK_SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  // --- Modalità reale con Supabase -----------------------------------------
  if (!window.supabase) {
    throw new Error("Libreria Supabase non caricata.");
  }
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Parametri Supabase mancanti: verifica js/config.js.");
  }

  if (!window._supabaseClient) {
    window._supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  const { data, error } = await window._supabaseClient.auth.getSession();
  if (error) {
    throw error;
  }
  return data.session || null;
}


