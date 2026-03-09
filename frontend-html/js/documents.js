document.addEventListener("DOMContentLoaded", () => {
  const tableBody = document.getElementById("doc-table-body");
  const listMessage = document.getElementById("doc-list-message");
  const searchInput = document.getElementById("doc-search");
  const filterType = document.getElementById("doc-filter-type");
  const filterStatus = document.getElementById("doc-filter-status");
  const uploadForm = document.getElementById("doc-upload-form");
  const uploadMessage = document.getElementById("doc-upload-message");
  const uploadSubmitBtn = document.getElementById("doc-upload-submit");
  const fileInput = document.getElementById("doc-file");
  const typeSelect = document.getElementById("doc-type");

  const STATUS_CLASSES = {
    ready: "rounded-full bg-emerald-900/60 px-2 py-0.5 text-[11px] text-emerald-200",
    processing: "rounded-full bg-amber-900/60 px-2 py-0.5 text-[11px] text-amber-200",
    failed: "rounded-full bg-red-900/60 px-2 py-0.5 text-[11px] text-red-200",
    default: "rounded-full bg-slate-800 px-2 py-0.5 text-[11px] text-slate-200",
  };

  let documents = [];

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

  function renderDocuments() {
    if (!tableBody) return;

    const q = (searchInput?.value || "").toLowerCase();
    const type = filterType?.value || "all";
    const status = filterStatus?.value || "all";

    const filtered = documents.filter((doc) => {
      const matchesSearch =
        !q || (doc.title || "").toLowerCase().includes(q);
      const matchesType = type === "all" || doc.document_type === type;
      const matchesStatus = status === "all" || doc.status === status;
      return matchesSearch && matchesType && matchesStatus;
    });

    if (filtered.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="3" class="table-empty">
            Nessun documento corrisponde ai filtri correnti.
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = "";
    filtered.forEach((doc) => {
      const tr = document.createElement("tr");
      const cls =
        STATUS_CLASSES[doc.status] || STATUS_CLASSES.default;
      tr.innerHTML = `
        <td>${doc.title || "—"}</td>
        <td>${doc.document_type}</td>
        <td>
          <span class="${cls}">${doc.status}</span>
        </td>
      `;
      tableBody.appendChild(tr);
    });
  }

  async function loadDocuments() {
    if (tableBody) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="3" class="table-empty">
            Caricamento documenti in corso...
          </td>
        </tr>
      `;
    }
    if (listMessage) listMessage.textContent = "";

    try {
      await ensureSessionOrRedirect();

      // In modalità MOCK popoliamo una lista di documenti di esempio.
      if (typeof USE_MOCK_AUTH !== "undefined" && USE_MOCK_AUTH) {
        documents = [
          {
            id: "d1",
            title: "Offerta tecnica manutenzione 2023",
            document_type: "past_offer",
            status: "ready",
          },
          {
            id: "d2",
            title: "Capitolato ICT data center 2024",
            document_type: "tender",
            status: "processing",
          },
          {
            id: "d3",
            title: "CV Responsabile di Commessa",
            document_type: "cv",
            status: "ready",
          },
          {
            id: "d4",
            title: "Certificazione ISO 9001",
            document_type: "certification",
            status: "ready",
          },
        ];
      } else {
        // Modalità reale (quando sarà attiva l'API):
        // const data = await getJson("/api/v1/documents");
        // documents = Array.isArray(data) ? data : [];
        documents = [];
      }

      renderDocuments();
    } catch (err) {
      console.error(err);
      if (listMessage) {
        listMessage.textContent =
          err?.message ||
          "Errore imprevisto nel caricamento dei documenti. Riprova più tardi.";
      }
    }
  }

  async function handleUpload(event) {
    event.preventDefault();
    if (!uploadForm || !uploadSubmitBtn || !uploadMessage || !fileInput || !typeSelect) {
      return;
    }

    const file = fileInput.files && fileInput.files[0];
    const documentType = typeSelect.value;

    if (!file) {
      uploadMessage.textContent = "Seleziona un file da caricare.";
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
        // Mock: aggiungiamo subito un documento con stato \"processing\", che dopo poco diventa \"ready\".
        const newId = `d-${Date.now()}`;
        const newDoc = {
          id: newId,
          title: file.name,
          document_type: documentType,
          status: "processing",
        };
        documents.unshift(newDoc);
        renderDocuments();

        uploadMessage.textContent =
          "Documento mock caricato. Simulo l'elaborazione in background...";
        uploadMessage.classList.remove("error");
        uploadMessage.classList.add("success");
        fileInput.value = "";

        // Dopo 1.5 secondi segniamo il documento come pronto.
        setTimeout(() => {
          const idx = documents.findIndex((d) => d.id === newId);
          if (idx !== -1) {
            documents[idx] = {
              ...documents[idx],
              status: "ready",
            };
            renderDocuments();
          }
        }, 1500);
      } else {
        // Modalità reale (quando sarà attiva l'API):
        // const formData = new FormData();
        // formData.append("file", file);
        // formData.append("document_type", documentType);
        // await postFormData("/api/v1/documents/upload", formData);
        uploadMessage.textContent =
          "Upload reale non ancora configurato (mock attivo).";
        uploadMessage.classList.add("error");
      }
    } catch (err) {
      console.error(err);
      uploadMessage.textContent =
        err?.message || "Errore durante l’upload del documento.";
      uploadMessage.classList.remove("success");
      uploadMessage.classList.add("error");
    } finally {
      uploadSubmitBtn.disabled = false;
    }
  }

  if (searchInput) {
    searchInput.addEventListener("input", renderDocuments);
  }
  if (filterType) {
    filterType.addEventListener("change", renderDocuments);
  }
  if (filterStatus) {
    filterStatus.addEventListener("change", renderDocuments);
  }
  if (uploadForm) {
    uploadForm.addEventListener("submit", handleUpload);
  }

  loadDocuments();
});

