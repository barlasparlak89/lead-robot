const SUPABASE_URL = process.env.SUPABASE_URL || "https://cqlklhzkcfxkelyliurj.supabase.co";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "sb_publishable_y8bDIsh_zVbbOxkKmqWgKA_KTi_VpJT";

const { createClient } = window.supabase;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let allLeads = [];
let currentLead = null;

const elements = {
  leadsTable: document.getElementById("leadsTable"),
  searchInput: document.getElementById("searchInput"),
  statusFilter: document.getElementById("statusFilter"),
  modal: document.getElementById("modal"),
  closeModal: document.querySelector(".close"),
  totalCount: document.getElementById("totalCount"),
  newCount: document.getElementById("newCount"),
  inProgressCount: document.getElementById("inProgressCount"),
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

const fetchLeads = async () => {
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching leads:", error);
    elements.leadsTable.innerHTML =
      '<tr><td colspan="8">Errore nel caricamento dei dati</td></tr>';
    return;
  }

  allLeads = data || [];
  updateStats();
  renderLeads(allLeads);
};

const updateStats = () => {
  elements.totalCount.textContent = allLeads.length;
  elements.newCount.textContent = allLeads.filter((l) => l.status === "Yeni").length;
  elements.inProgressCount.textContent = allLeads.filter(
    (l) => l.status === "In Corso"
  ).length;
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
      <td><span class="status-badge ${lead.status}">${lead.status}</span></td>
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

  const filtered = allLeads.filter((lead) => {
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
  currentLead = allLeads.find((l) => l.id === leadId);
  if (!currentLead) return;

  document.getElementById("modalName").textContent = currentLead.full_name;
  document.getElementById("modalEmail").textContent = currentLead.email;
  document.getElementById("modalPhone").textContent = currentLead.phone;
  document.getElementById("modalAmount").textContent = `€ ${Number(currentLead.loss_amount).toFixed(2)}`;
  document.getElementById("modalWhere").textContent = currentLead.loss_where;
  document.getElementById("modalNotes").textContent = currentLead.notes || "-";
  document.getElementById("modalStatusSelect").value = currentLead.status;

  document.getElementById("modalSaveBtn").onclick = saveStatus;
  elements.modal.hidden = false;
};

const saveStatus = async () => {
  if (!currentLead) return;

  const newStatus = document.getElementById("modalStatusSelect").value;
  const { error } = await supabase
    .from("leads")
    .update({ status: newStatus })
    .eq("id", currentLead.id);

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

  const { error } = await supabase.from("leads").delete().eq("id", leadId);

  if (error) {
    console.error("Error deleting lead:", error);
    alert("Errore nella cancellazione");
    return;
  }

  fetchLeads();
};

// Initial load
fetchLeads();

// Refresh every 30 seconds
setInterval(fetchLeads, 30000);
