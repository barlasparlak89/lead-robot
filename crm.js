const { createClient } = window.supabase;

const state = {
  supabase: null,
  allLeads: [],
  currentLead: null,
};

const elements = {
  loginScreen: document.getElementById("loginScreen"),
  loginForm: document.getElementById("loginForm"),
  loginEmail: document.getElementById("loginEmail"),
  loginPassword: document.getElementById("loginPassword"),
  loginError: document.getElementById("loginError"),
  crmApp: document.getElementById("crmApp"),
  logoutBtn: document.getElementById("logoutBtn"),
  leadsTable: document.getElementById("leadsTable"),
  searchInput: document.getElementById("searchInput"),
  statusFilter: document.getElementById("statusFilter"),
  modal: document.getElementById("modal"),
  closeModal: document.querySelector(".close"),
  totalCount: document.getElementById("totalCount"),
  newCount: document.getElementById("newCount"),
  inProgressCount: document.getElementById("inProgressCount"),
  completedCount: document.getElementById("completedCount"),
  rejectedCount: document.getElementById("rejectedCount"),
  lastRefresh: document.getElementById("lastRefresh"),
};

const showLogin = () => {
  elements.loginScreen.hidden = false;
  elements.crmApp.hidden = true;
};

const showApp = () => {
  elements.loginScreen.hidden = true;
  elements.crmApp.hidden = false;
};

const showLoginError = (message) => {
  elements.loginError.textContent = message;
  elements.loginError.hidden = false;
};

const clearLoginError = () => {
  elements.loginError.hidden = true;
};

const loadConfig = async () => {
  const response = await fetch("/api/config");
  if (!response.ok) {
    throw new Error("Config non disponibile");
  }
  return response.json();
};

const fetchLeads = async () => {
  const { data, error } = await state.supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching leads:", error);
    elements.leadsTable.innerHTML =
      '<tr><td colspan="8">Errore nel caricamento dei dati</td></tr>';
    return;
  }

  state.allLeads = data || [];
  updateStats();
  renderLeads(state.allLeads);
};

const updateStats = () => {
  elements.totalCount.textContent = state.allLeads.length;
  elements.newCount.textContent = state.allLeads.filter((l) => l.status === "Yeni").length;
  elements.inProgressCount.textContent = state.allLeads.filter(
    (l) => l.status === "In Corso"
  ).length;
  elements.completedCount.textContent = state.allLeads.filter(
    (l) => l.status === "Completato"
  ).length;
  elements.rejectedCount.textContent = state.allLeads.filter(
    (l) => l.status === "Rifiutato"
  ).length;
  elements.lastRefresh.textContent = `Ultimo aggiornamento: ${new Date().toLocaleTimeString("it-IT")}`;
};

const statusClass = (status) => status.toLowerCase().replace(/\s+/g, "-");

const renderLeads = (leads) => {
  if (leads.length === 0) {
    elements.leadsTable.innerHTML =
      '<tr><td colspan="8" style="text-align: center; color: var(--muted);">Nessun lead trovato</td></tr>';
    return;
  }

  elements.leadsTable.innerHTML = leads
    .map(
      (lead) => `
    <tr>
      <td>${lead.full_name}</td>
      <td>${lead.email}</td>
      <td>${lead.phone}</td>
      <td>€ ${Number(lead.loss_amount).toFixed(2)}</td>
      <td>${lead.loss_where}</td>
      <td><span class="status-badge ${statusClass(lead.status)}">${lead.status}</span></td>
      <td>${new Date(lead.created_at).toLocaleDateString("it-IT")}</td>
      <td>
        <div class="action-buttons">
          <button class="btn btn-view" onclick="openModal(${lead.id})">Vedi</button>
          <button class="btn btn-delete" onclick="deleteLead(${lead.id})">Cancella</button>
        </div>
      </td>
    </tr>
  `
    )
    .join("");
};

const filterLeads = () => {
  const search = elements.searchInput.value.toLowerCase();
  const status = elements.statusFilter.value;

  const filtered = state.allLeads.filter((lead) => {
    const matchesSearch =
      lead.full_name.toLowerCase().includes(search) ||
      lead.email.toLowerCase().includes(search) ||
      lead.phone.includes(search);
    const matchesStatus = status === "" || lead.status === status;
    return matchesSearch && matchesStatus;
  });

  renderLeads(filtered);
};

const openModal = async (leadId) => {
  state.currentLead = state.allLeads.find((l) => l.id === leadId);
  if (!state.currentLead) return;

  document.getElementById("modalName").textContent = state.currentLead.full_name;
  document.getElementById("modalEmail").textContent = state.currentLead.email;
  document.getElementById("modalPhone").textContent = state.currentLead.phone;
  document.getElementById("modalAmount").textContent = `€ ${Number(state.currentLead.loss_amount).toFixed(2)}`;
  document.getElementById("modalWhere").textContent = state.currentLead.loss_where;
  document.getElementById("modalNotes").textContent = state.currentLead.notes || "-";
  document.getElementById("modalStatusSelect").value = state.currentLead.status;

  document.getElementById("modalSaveBtn").onclick = saveStatus;
  elements.modal.hidden = false;
};

const saveStatus = async () => {
  if (!state.currentLead) return;

  const newStatus = document.getElementById("modalStatusSelect").value;
  const { error } = await state.supabase
    .from("leads")
    .update({ status: newStatus })
    .eq("id", state.currentLead.id);

  if (error) {
    console.error("Error updating status:", error);
    alert("Errore nell'aggiornamento dello stato");
    return;
  }

  elements.modal.hidden = true;
  fetchLeads();
};

const deleteLead = async (leadId) => {
  if (!confirm("Sei sicuro di voler cancellare questo lead?")) return;

  const { error } = await state.supabase.from("leads").delete().eq("id", leadId);

  if (error) {
    console.error("Error deleting lead:", error);
    alert("Errore nella cancellazione");
    return;
  }

  fetchLeads();
};

elements.searchInput.addEventListener("input", filterLeads);
elements.statusFilter.addEventListener("change", filterLeads);
elements.closeModal.addEventListener("click", () => {
  elements.modal.hidden = true;
});

window.addEventListener("click", (e) => {
  if (e.target === elements.modal) {
    elements.modal.hidden = true;
  }
});

elements.loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearLoginError();

  const email = elements.loginEmail.value.trim();
  const password = elements.loginPassword.value.trim();

  const { error } = await state.supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    showLoginError("Credenziali non valide");
    return;
  }
});

elements.logoutBtn.addEventListener("click", async () => {
  await state.supabase.auth.signOut();
  showLogin();
});

const init = async () => {
  try {
    const config = await loadConfig();
    state.supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);

    const { data } = await state.supabase.auth.getSession();
    if (data.session) {
      showApp();
      fetchLeads();
      setInterval(fetchLeads, 30000);
    } else {
      showLogin();
    }

    state.supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        showApp();
        fetchLeads();
      } else {
        showLogin();
      }
    });
  } catch (error) {
    showLoginError("Configurazione mancante. Contatta l'amministratore.");
  }
};

init();
