document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("login-form");
  const emailInput = document.getElementById("email");
  const submitBtn = document.getElementById("login-submit");
  const messageEl = document.getElementById("login-message");

  if (!form || !emailInput || !submitBtn || !messageEl) {
    return;
  }

  async function handleLogin(event) {
    event.preventDefault();
    const email = emailInput.value.trim();
    if (!email) {
      messageEl.textContent = "Inserisci un'email valida.";
      messageEl.classList.remove("success");
      messageEl.classList.add("error");
      return;
    }

    submitBtn.disabled = true;
    messageEl.textContent = "";
    messageEl.classList.remove("error", "success");

    // Modalità MOCK: nessuna chiamata a Supabase, salvo una finta sessione e vado su appalti.
    if (typeof USE_MOCK_AUTH !== "undefined" && USE_MOCK_AUTH) {
      try {
        setMockSession(email);
        messageEl.textContent = "Accesso mock eseguito. Reindirizzamento in corso...";
        messageEl.classList.add("success");
        window.location.href = "appalti.html";
      } finally {
        submitBtn.disabled = false;
      }
      return;
    }

    // Modalità reale con Supabase
    try {
      if (!window.supabase) {
        throw new Error("Libreria Supabase non caricata.");
      }
      if (!window._supabaseClient) {
        if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
          throw new Error("Parametri Supabase mancanti.");
        }
        window._supabaseClient = window.supabase.createClient(
          window.SUPABASE_URL,
          window.SUPABASE_ANON_KEY,
        );
      }
      const { error } = await window._supabaseClient.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin + "/frontend-html/appalti.html",
        },
      });

      if (error) {
        throw error;
      }

      messageEl.textContent =
        "Controlla la tua casella email per completare l'accesso.";
      messageEl.classList.remove("error");
      messageEl.classList.add("success");
    } catch (err) {
      console.error(err);
      messageEl.textContent =
        err?.message ||
        "Si è verificato un errore durante l'invio del link di accesso.";
      messageEl.classList.remove("success");
      messageEl.classList.add("error");
    } finally {
      submitBtn.disabled = false;
    }
  }

  form.addEventListener("submit", handleLogin);
});

