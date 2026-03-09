document.addEventListener("DOMContentLoaded", () => {
  const tendersTableBody = document.getElementById("tenders-table-body");
  const tendersMessage = document.getElementById("tenders-message");
  const tenderSearchInput = document.getElementById("tender-search");
  const criteriaTableBody = document.getElementById("criteria-table-body");
  const criteriaSearchInput = document.getElementById("criteria-search");
  const criteriaSummary = document.getElementById("criteria-summary");
  const uploadForm = document.getElementById("tender-upload-form");
  const uploadMessage = document.getElementById("tender-upload-message");
  const uploadSubmitBtn = document.getElementById("tender-upload-submit");

  let tenders = [];
  let criteria = [];
  let selectedTenderId = null;

  // Mappa criteri mock per id bando, usata solo in modalità MOCK.
  const mockCriteriaByTenderId = {
    "1": [
      {
        id: "c10",
        code: "1.1",
        title: "Impostazione metodologica del servizio",
        description:
          "Approccio metodologico alla gestione del servizio di manutenzione programmata e correttiva.",
        max_score: 30,
        constraints: {
          items: ["Piano di manutenzione annuale", "Reportistica mensile di servizio"],
        },
        required_documents: {
          items: ["Piano manutentivo", "Esempio di report mensile"],
        },
        keywords: ["metodologia", "manutenzione", "report"],
        analysis_notes: "Verificare aderenza ai tempi del capitolato.",
        needs_review: false,
        order_index: 1,
      },
      {
        id: "c11",
        code: "1.2",
        title: "Organizzazione e presidio territoriale",
        description:
          "Distribuzione squadre operative, tempi di intervento, gestione reperibilità.",
        max_score: 20,
        constraints: { items: ["Tempo di intervento < 2 ore per chiamate urgenti"] },
        required_documents: {
          items: ["Mappa presidi territoriali", "Turni di reperibilità"],
        },
        keywords: ["organizzazione", "presidio", "tempi di intervento"],
        analysis_notes: null,
        needs_review: true,
        order_index: 2,
      },
    ],
    "2": [
      {
        id: "c1",
        code: "A.1",
        title: "Architettura soluzione data center",
        description:
          "Descrizione dell'architettura proposta, con evidenza di scalabilità e continuità di servizio.",
        max_score: 25,
        constraints: { items: ["Disponibilità H24", "Piano di capacity planning triennale"] },
        required_documents: {
          items: ["Schema architetturale", "Matrice requisiti tecnici"],
        },
        keywords: ["architettura", "scalabilità", "data center"],
        analysis_notes: "Valutare coerenza con capitolato tecnico.",
        needs_review: true,
        order_index: 1,
      },
      {
        id: "c2",
        code: "A.2",
        title: "Organizzazione del servizio",
        description:
          "Team di lavoro, presidio H24, processi di escalation e gestione ticket.",
        max_score: 20,
        constraints: { items: ["SLA risposta ticket critici < 30 minuti"] },
        required_documents: {
          items: ["Organigramma di servizio", "Procedura gestione incident"],
        },
        keywords: ["organizzazione", "SLA", "ticketing"],
        analysis_notes: null,
        needs_review: false,
        order_index: 2,
      },
    ],
    "3": [],
    "4": [],
  };

  async function ensureSessionOrRedirect() {
    try {
      const session = await getCurrentSession();
      if (!session) {
        window.location.href = "index.html";
      }
    } catch {
      window.location.href = "index.html";
    }
  }

  function renderTenders() {
    if (!tendersTableBody) return;

    const query = (tenderSearchInput?.value || "").toLowerCase();
    const filtered = tenders.filter((t) =>
      !query ? true : t.title.toLowerCase().includes(query),
    );

    if (filtered.length === 0) {
      tendersTableBody.innerHTML = `
        <tr>
          <td colspan="2" class="table-empty">
            Nessun bando corrisponde ai filtri correnti.
          </td>
        </tr>
      `;
      return;
    }

    tendersTableBody.innerHTML = "";
    filtered.forEach((t) => {
      const tr = document.createElement("tr");
      tr.className =
        "table-row" + (t.id === selectedTenderId ? " table-row-active" : "");
      tr.innerHTML = `
        <td>${t.title}</td>
        <td>${t.status}</td>
      `;
      tr.addEventListener("click", () => {
        if (selectedTenderId !== t.id) {
          selectedTenderId = t.id;
          renderTenders();
          loadCriteriaForSelected();
        }
      });
      tendersTableBody.appendChild(tr);
    });
  }

  function renderCriteria() {
    if (!criteriaTableBody) return;

    const query = (criteriaSearchInput?.value || "").toLowerCase();
    const filtered = criteria.filter((c) => {
      if (!query) return true;
      const haystack = `${c.code || ""} ${c.title} ${c.description || ""}`.toLowerCase();
      return haystack.includes(query);
    });

    if (filtered.length === 0) {
      const emptyMessage =
        criteria.length === 0
          ? "Seleziona un bando per visualizzare i criteri estratti."
          : "Nessun criterio corrisponde ai filtri correnti.";
      criteriaTableBody.innerHTML = `
        <tr>
          <td colspan="6" class="table-empty">${emptyMessage}</td>
        </tr>
      `;
    } else {
      criteriaTableBody.innerHTML = "";
      filtered.forEach((c) => {
        const tr = document.createElement("tr");
        if (c.needs_review) {
          tr.style.backgroundColor = "rgba(120, 53, 15, 0.45)";
        }
        tr.innerHTML = `
          <td>
            <div class="field-label small">${c.code || "—"}</div>
            <div>${c.title}</div>
            ${
              c.description
                ? `<p class="helper-text small" style="margin-top:4px;">${c.description}</p>`
                : ""
            }
          </td>
          <td>${c.max_score != null ? c.max_score : "—"}</td>
          <td>${renderList(c.constraints?.items)}</td>
          <td>${renderList(c.required_documents?.items)}</td>
          <td>${c.keywords && c.keywords.length ? c.keywords.join(", ") : "—"}</td>
          <td>
            ${
              c.needs_review
                ? '<div class="badge-warning" style="margin-bottom:4px;">Da verificare</div>'
                : ""
            }
            ${c.analysis_notes ? `<p class="helper-text small">${c.analysis_notes}</p>` : ""}
          </td>
        `;
        criteriaTableBody.appendChild(tr);
      });
    }

    if (criteriaSummary) {
      if (criteria.length > 0) {
        const total = criteria.reduce(
          (sum, c) => sum + (c.max_score != null ? c.max_score : 0),
          0,
        );
        criteriaSummary.textContent = `Punteggio totale individuato (somma criteri): ${total.toFixed(
          2,
        )} punti. I criteri evidenziati richiedono revisione manuale.`;
      } else {
        criteriaSummary.textContent = "";
      }
    }
  }

  function renderList(items) {
    if (!items || !items.length) {
      return "—";
    }
    return `<ul class="list-dots">${items
      .map((it) => `<li>${it}</li>`)
      .join("")}</ul>`;
  }

  async function loadTenders() {
    if (tendersMessage) {
      tendersMessage.textContent = "";
    }
    if (tendersTableBody) {
      tendersTableBody.innerHTML = `
        <tr>
          <td colspan="2" class="table-empty">Caricamento bandi in corso...</td>
        </tr>
      `;
    }

    try {
      await ensureSessionOrRedirect();

      // In modalità MOCK usiamo una lista di bandi finta, senza chiamare il backend.
      if (typeof USE_MOCK_AUTH !== "undefined" && USE_MOCK_AUTH) {
        tenders = [
          { id: "1", title: "Gara servizi manutenzione 2025", status: "in_progress" },
          { id: "2", title: "Fornitura sistemi ICT data center", status: "ready" },
          { id: "3", title: "Servizi di pulizia multisito triennio", status: "draft" },
          { id: "4", title: "Global service manutentivo ospedaliero", status: "in_review" },
        ];
      } else {
        const data = await getJson("/api/v1/tenders");
        tenders = Array.isArray(data) ? data : [];
      }

      if (tenders.length > 0 && !selectedTenderId) {
        selectedTenderId = tenders[0].id;
      }
      renderTenders();
      await loadCriteriaForSelected();
    } catch (err) {
      console.error(err);
      if (tendersMessage) {
        tendersMessage.textContent =
          err?.message || "Errore inatteso nel caricamento dei bandi.";
      }
    }
  }

  async function loadCriteriaForSelected() {
    if (!selectedTenderId) {
      criteria = [];
      renderCriteria();
      return;
    }
    if (criteriaTableBody) {
      criteriaTableBody.innerHTML = `
        <tr>
          <td colspan="6" class="table-empty">Caricamento criteri in corso...</td>
        </tr>
      `;
    }

    try {
      // In modalità MOCK leggiamo i criteri dalla mappa locale; altrimenti chiamiamo l'API reale.
      if (typeof USE_MOCK_AUTH !== "undefined" && USE_MOCK_AUTH) {
        criteria = mockCriteriaByTenderId[selectedTenderId] || [];
      } else {
        const data = await getJson(`/api/v1/tenders/${selectedTenderId}/criteria`);
        criteria = Array.isArray(data) ? data : [];
      }
      renderCriteria();
    } catch (err) {
      console.error(err);
      if (criteriaTableBody) {
        criteriaTableBody.innerHTML = `
          <tr>
            <td colspan="6" class="table-empty">
              ${err?.message || "Errore inatteso nel caricamento dei criteri."}
            </td>
          </tr>
        `;
      }
    }
  }

  async function handleUpload(event) {
    event.preventDefault();
    if (!uploadForm || !uploadSubmitBtn || !uploadMessage) return;

    const titleInput = document.getElementById("tender-title");
    const fileInput = document.getElementById("tender-file");
    if (!titleInput || !fileInput) return;

    const title = titleInput.value.trim();
    const file = fileInput.files && fileInput.files[0];

    if (!title || !file) {
      uploadMessage.textContent =
        "Inserisci un titolo interno e seleziona un file disciplinare.";
      uploadMessage.classList.remove("success");
      uploadMessage.classList.add("error");
      return;
    }

    uploadSubmitBtn.disabled = true;
    uploadMessage.textContent = "";
    uploadMessage.classList.remove("error", "success");

    try {
      await ensureSessionOrRedirect();

      if (typeof USE_MOCK_AUTH !== "undefined" && USE_MOCK_AUTH) {
        // In mock mode non carichiamo davvero il file:
        // aggiungiamo un nuovo bando e generiamo qualche criterio di esempio.
        const newId = String((tenders.length || 0) + 10);
        tenders.unshift({ id: newId, title, status: "in_progress" });
        mockCriteriaByTenderId[newId] = [
          {
            id: `c-${newId}-1`,
            code: "M.1",
            title: `Impostazione metodologica per ${title}`,
            description:
              "Descrizione di massima dell'impostazione metodologica proposta per il bando caricato.",
            max_score: 20,
            constraints: {
              items: ["Piano delle attività", "Cronoprogramma sintetico"],
            },
            required_documents: {
              items: ["Schema di piano delle attività"],
            },
            keywords: ["metodologia", "piano attività"],
            analysis_notes: "Mock: criteri generati a scopo dimostrativo.",
            needs_review: true,
            order_index: 1,
          },
          {
            id: `c-${newId}-2`,
            code: "M.2",
            title: "Organizzazione e ruoli chiave",
            description:
              "Struttura organizzativa di progetto, ruoli chiave e presidi di coordinamento.",
            max_score: 15,
            constraints: {
              items: ["Individuazione responsabile di commessa"],
            },
            required_documents: {
              items: ["CV ruoli chiave (mock)"],
            },
            keywords: ["organizzazione", "ruoli", "presidio"],
            analysis_notes: null,
            needs_review: false,
            order_index: 2,
          },
        ];

        selectedTenderId = newId;
        uploadMessage.textContent = "Bando mock aggiunto, criteri di esempio generati.";
        uploadMessage.classList.remove("error");
        uploadMessage.classList.add("success");
        titleInput.value = "";
        fileInput.value = "";
        renderTenders();
        await loadCriteriaForSelected();
      } else {
        const formData = new FormData();
        formData.append("title", title);
        formData.append("file", file);

        await postFormData("/api/v1/tenders/upload", formData);
        uploadMessage.textContent = "Bando caricato correttamente. Aggiorno l'elenco…";
        uploadMessage.classList.remove("error");
        uploadMessage.classList.add("success");

        titleInput.value = "";
        fileInput.value = "";
        await loadTenders();
      }
    } catch (err) {
      console.error(err);
      uploadMessage.textContent =
        err?.message || "Errore durante l’upload del bando. Riprova.";
      uploadMessage.classList.remove("success");
      uploadMessage.classList.add("error");
    } finally {
      uploadSubmitBtn.disabled = false;
    }
  }

  if (tenderSearchInput) {
    tenderSearchInput.addEventListener("input", renderTenders);
  }
  if (criteriaSearchInput) {
    criteriaSearchInput.addEventListener("input", renderCriteria);
  }
  if (uploadForm) {
    uploadForm.addEventListener("submit", handleUpload);
  }

  loadTenders();
});

