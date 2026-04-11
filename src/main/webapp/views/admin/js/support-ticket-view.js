// Support Tickets JS — backend-loaded list
class SupportTicketsManager {
  constructor() {
    this.tickets = [];
    this.filteredTickets = [];
    this.init();
  }

  // ---------- API ----------
  async fetchTickets({ status = "", role = "", priority = "" } = {}) {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (role) params.set("role", role);
    if (priority) params.set("priority", priority);

    const res = await fetch(`/support/tickets/list?${params.toString()}`, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    const data = await res.json();
    if (!res.ok || data.status !== "success") {
      throw new Error(data.message || "Failed to load tickets");
    }

    return data.tickets || [];
  }

  // ---------- Init ----------
  init() {
    this.bindUI();
    this.loadAndRender();
  }

  bindUI() {
    const statusFilter = document.getElementById("statusFilter");
    const roleFilter = document.getElementById("roleFilter");
    const priorityFilter = document.getElementById("priorityFilter");

    [statusFilter, roleFilter, priorityFilter].forEach((el) => {
      if (el) el.addEventListener("change", () => this.loadAndRender());
    });
  }

  readUIFilters() {
    return {
      status: document.getElementById("statusFilter")?.value || "",
      role: document.getElementById("roleFilter")?.value || "",
      priority: document.getElementById("priorityFilter")?.value || "",
    };
  }

  // ---------- Load + Render ----------
  async loadAndRender() {
    try {
      const { status, role, priority } = this.readUIFilters();

      this.tickets = await this.fetchTickets({
        status,
        role,
        priority,
      });

      this.filteredTickets = [...this.tickets];

      this.renderTickets();
      this.renderStats();
    } catch (err) {
      console.error(err);
      this.tickets = [];
      this.filteredTickets = [];
      this.renderTickets();
      this.renderStats();
      alert(err.message || "Failed to load tickets");
    }
  }

  // ---------- Rendering ----------
  renderTickets() {
    const tbody = document.querySelector(".tickets-table tbody");
    if (!tbody) return;

    tbody.innerHTML = "";

    this.filteredTickets.forEach((t) => tbody.appendChild(this.row(t)));
  }

  renderStats() {
    const total = this.tickets.length;
    const ongoing = this.tickets.filter((t) => t.status === "ongoing").length;
    const resolved = this.tickets.filter((t) => t.status === "resolved").length;
    const high = this.tickets.filter((t) => t.priority === "high").length;

    const set = (id, v) => {
      const el = document.getElementById(id);
      if (el) el.textContent = String(v);
    };

    set("stat-total", total);
    set("stat-ongoing", ongoing);
    set("stat-resolved", resolved);
    set("stat-high", high);
  }

  row(t) {
    const tr = document.createElement("tr");
    tr.addEventListener("click", () => this.openTicketView(t.ticketId));
    tr.innerHTML = `
      <td>#${t.ticketId}</td>
      <td>${escapeHTML(t.subject || "")}</td>
      <td><span class="status-badge status-${t.status}">${this.statusText(
        t.status,
      )}</span></td>
      <td>${this.cap(t.actorType || t.role || "")}</td>
      <td class="priority-${t.priority}">${String(
        t.priority || "",
      ).toUpperCase()}</td>
      <td>
        <button class="btn-icon" title="Open" onclick="viewTicket(${
          t.ticketId
        });event.stopPropagation();"><i class="fas fa-eye"></i></button>
      </td>`;
    return tr;
  }

  openTicketView(id) {
    const year = new Date().getFullYear();
    const ticketParam = `TKT-${year}-${String(id).padStart(3, "0")}`;
    location.href = `support-ticket.html?id=${encodeURIComponent(ticketParam)}`;
  }

  statusText(s) {
    return s === "pending"
      ? "Pending"
      : s === "ongoing"
        ? "Ongoing"
        : s === "resolved"
          ? "Resolved"
          : s === "closed"
            ? "Closed"
            : s;
  }

  cap(s) {
    if (!s) return "";
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
}

// Helper for inline button
window.viewTicket = function (id) {
  const mgr = window.__ticketsMgr;
  if (mgr) mgr.openTicketView(id);
};

function escapeHTML(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

window.addEventListener("DOMContentLoaded", () => {
  window.__ticketsMgr = new SupportTicketsManager();
});

// Optional compatibility helpers for existing inline onclick usage
window.applyTicketFilters = function () {
  if (window.__ticketsMgr) {
    window.__ticketsMgr.loadAndRender();
  }
};

window.clearTicketFilters = function () {
  const status = document.getElementById("statusFilter");
  const role = document.getElementById("roleFilter");
  const priority = document.getElementById("priorityFilter");

  if (status) status.value = "";
  if (role) role.value = "";
  if (priority) priority.value = "";

  if (window.__ticketsMgr) {
    window.__ticketsMgr.loadAndRender();
  }
};
