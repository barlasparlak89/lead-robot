const { createClient } = window.supabase;

const state = {
  supabase: null,
  allLeads: [],
  currentLead: null,
};

const translations = {
  tr: {
    login_title: "CRM Giris",
    login_subtitle: "Devam etmek icin admin bilgilerini gir.",
    login_email: "Email",
    login_email_placeholder: "ornek@email.com",
    login_password: "Sifre",
    login_password_placeholder: "Sifren",
    login_button: "Giris",
    brand_title: "Studio Legale",
    brand_subtitle: "CRM yonetim",
    menu_dashboard: "Dashboard",
    menu_leads: "Lead",
    menu_reports: "Raporlar",
    sidebar_quick: "Hizli notlar",
    sidebar_tip: "Filtre ve durum ile oncelikleri yonet.",
    logout: "Cikis",
    dashboard_title: "Lead Dashboard",
    last_refresh: "Son guncelleme",
    kpi_total: "Toplam lead",
    kpi_new: "Yeni",
    kpi_in_progress: "Islemde",
    kpi_completed: "Tamamlandi",
    kpi_rejected: "Reddedildi",
    search_placeholder: "Ad, email, telefon ile ara...",
    filter_all: "Tum durumlar",
    status_new: "Yeni",
    status_in_progress: "Islemde",
    status_completed: "Tamamlandi",
    status_rejected: "Reddedildi",
    th_name: "Ad Soyad",
    th_email: "Email",
    th_phone: "Telefon",
    th_amount: "Miktar",
    th_where: "Nerede",
    th_status: "Durum",
    th_date: "Tarih",
    th_actions: "Islemler",
    modal_title: "Lead detaylari",
    modal_name: "Ad Soyad:",
    modal_email: "Email:",
    modal_phone: "Telefon:",
    modal_amount: "Miktar:",
    modal_where: "Nerede:",
    modal_notes: "Not:",
    modal_status: "Durumu guncelle:",
    modal_save: "Kaydet",
    modal_close: "Kapat",
    btn_view: "Gor",
    btn_delete: "Sil",
    load_error: "Veriler yuklenemedi",
    update_error: "Durum guncellenemedi",
    delete_error: "Silme basarisiz",
    confirm_delete: "Bu lead silinsin mi?",
    invalid_credentials: "Gecersiz giris",
    config_missing: "Yapilandirma eksik. Yonetici ile iletisim kur.",
  },
  en: {
    login_title: "CRM Login",
    login_subtitle: "Enter admin credentials to continue.",
    login_email: "Email",
    login_email_placeholder: "name@example.com",
    login_password: "Password",
    login_password_placeholder: "Your password",
    login_button: "Sign in",
    brand_title: "Legal Office",
    brand_subtitle: "CRM admin",
    menu_dashboard: "Dashboard",
    menu_leads: "Leads",
    menu_reports: "Reports",
    sidebar_quick: "Quick notes",
    sidebar_tip: "Use filters and status to manage priorities.",
    logout: "Logout",
    dashboard_title: "Lead Dashboard",
    last_refresh: "Last update",
    kpi_total: "Total leads",
    kpi_new: "New",
    kpi_in_progress: "In progress",
    kpi_completed: "Completed",
    kpi_rejected: "Rejected",
    search_placeholder: "Search by name, email, phone...",
    filter_all: "All statuses",
    status_new: "New",
    status_in_progress: "In progress",
    status_completed: "Completed",
    status_rejected: "Rejected",
    th_name: "Name",
    th_email: "Email",
    th_phone: "Phone",
    th_amount: "Amount",
    th_where: "Where",
    th_status: "Status",
    th_date: "Date",
    th_actions: "Actions",
    modal_title: "Lead details",
    modal_name: "Name:",
    modal_email: "Email:",
    modal_phone: "Phone:",
    modal_amount: "Amount:",
    modal_where: "Where:",
    modal_notes: "Notes:",
    modal_status: "Update status:",
    modal_save: "Save",
    modal_close: "Close",
    btn_view: "View",
    btn_delete: "Delete",
    load_error: "Failed to load data",
    update_error: "Failed to update status",
    delete_error: "Delete failed",
    confirm_delete: "Delete this lead?",
    invalid_credentials: "Invalid credentials",
    config_missing: "Configuration missing. Contact admin.",
  },
};

let currentLang = localStorage.getItem("crm_lang") || "tr";

const t = (key) => translations[currentLang]?.[key] || key;

const applyTranslations = () => {
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.getAttribute("data-i18n");
    element.textContent = t(key);
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
    const key = element.getAttribute("data-i18n-placeholder");
    element.setAttribute("placeholder", t(key));
  });

  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.lang === currentLang);
  });
};

const setLang = (lang) => {
  currentLang = lang;
  localStorage.setItem("crm_lang", lang);
  applyTranslations();
  renderLeads(state.allLeads);
  updateStats();
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
  modalCloseBtn: document.getElementById("modalCloseBtn"),
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
      `<tr><td colspan="8">${t("load_error")}</td></tr>`;
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
  elements.lastRefresh.textContent = `${t("last_refresh")}: ${new Date().toLocaleTimeString("it-IT")}`;
};

const statusClass = (status) => status.toLowerCase().replace(/\s+/g, "-");
const statusLabel = (status) => {
  const map = {
    "Yeni": t("status_new"),
    "In Corso": t("status_in_progress"),
    "Completato": t("status_completed"),
    "Rifiutato": t("status_rejected"),
  };
  return map[status] || status;
};

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
      <td><span class="status-badge ${statusClass(lead.status)}">${statusLabel(lead.status)}</span></td>
      <td>${new Date(lead.created_at).toLocaleDateString("it-IT")}</td>
      <td>
        <div class="action-buttons">
          <button class="btn btn-view" onclick="openModal(${lead.id})">${t("btn_view")}</button>
          <button class="btn btn-delete" onclick="deleteLead(${lead.id})">${t("btn_delete")}</button>
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
    alert(t("update_error"));
    return;
  }

  elements.modal.hidden = true;
  fetchLeads();
};

const deleteLead = async (leadId) => {
  if (!confirm(t("confirm_delete"))) return;

  const { error } = await state.supabase.from("leads").delete().eq("id", leadId);

  if (error) {
    console.error("Error deleting lead:", error);
    alert(t("delete_error"));
    return;
  }

  fetchLeads();
};

elements.searchInput.addEventListener("input", filterLeads);
elements.statusFilter.addEventListener("change", filterLeads);
elements.closeModal.addEventListener("click", () => {
  elements.modal.hidden = true;
});

elements.modalCloseBtn.addEventListener("click", () => {
  elements.modal.hidden = true;
});

window.addEventListener("click", (e) => {
  if (e.target === elements.modal) {
    elements.modal.hidden = true;
  }
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !elements.modal.hidden) {
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
    showLoginError(t("invalid_credentials"));
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
    showLoginError(t("config_missing"));
  }
};

init();

document.querySelectorAll(".lang-btn").forEach((button) => {
  button.addEventListener("click", () => {
    setLang(button.dataset.lang);
  });
});

applyTranslations();
