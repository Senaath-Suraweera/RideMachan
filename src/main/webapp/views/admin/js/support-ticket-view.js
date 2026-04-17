// Support Tickets JS — backend-loaded list
class SupportTicketsManager {
  constructor() {
    this.tickets = [];
    this.filteredTickets = [];
    this.currentPage = 1;
    this.pageSize = 10;
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
      if (el)
        el.addEventListener("change", () => {
          this.currentPage = 1;
          this.loadAndRender();
        });
    });

    const pageSizeSel = document.getElementById("ticketsPageSize");
    if (pageSizeSel) {
      pageSizeSel.addEventListener("change", (e) => {
        this.pageSize = parseInt(e.target.value, 10) || 10;
        this.currentPage = 1;
        this.renderTickets();
        this.renderPagination();
      });
    }
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
      this.renderPagination();
    } catch (err) {
      console.error(err);
      this.tickets = [];
      this.filteredTickets = [];
      this.renderTickets();
      this.renderStats();
      this.renderPagination();
      alert(err.message || "Failed to load tickets");
    }
  }

  // ---------- Rendering ----------
  renderTickets() {
    const tbody = document.querySelector(".tickets-table tbody");
    if (!tbody) return;

    tbody.innerHTML = "";

    const total = this.filteredTickets.length;
    const totalPages = Math.max(1, Math.ceil(total / this.pageSize));
    if (this.currentPage > totalPages) this.currentPage = totalPages;

    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    const pageItems = this.filteredTickets.slice(start, end);

    if (pageItems.length === 0) {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td colspan="6" class="empty-state-cell" style="text-align:center;padding:24px;color:var(--text-light);">No tickets found.</td>`;
      tbody.appendChild(tr);
      return;
    }

    pageItems.forEach((t) => tbody.appendChild(this.row(t)));
  }

  renderPagination() {
    const info = document.getElementById("ticketsPaginationInfo");
    const pagesEl = document.getElementById("ticketsPages");
    if (!info || !pagesEl) return;

    const total = this.filteredTickets.length;
    const totalPages = Math.max(1, Math.ceil(total / this.pageSize));
    if (this.currentPage > totalPages) this.currentPage = totalPages;

    if (total === 0) {
      info.innerHTML = `Showing <strong>0</strong> of <strong>0</strong>`;
      pagesEl.innerHTML = "";
      return;
    }

    const start = (this.currentPage - 1) * this.pageSize + 1;
    const end = Math.min(this.currentPage * this.pageSize, total);
    info.innerHTML = `Showing <strong>${start}–${end}</strong> of <strong>${total}</strong> tickets`;

    pagesEl.innerHTML = buildPageButtons(this.currentPage, totalPages);
    attachPageButtonHandlers(pagesEl, (p) => {
      this.currentPage = p;
      this.renderTickets();
      this.renderPagination();
    });
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

/**
 * Builds pagination button HTML.
 * Strategy: always show first & last; show current +/- 1; ellipsis for gaps.
 */
function buildPageButtons(current, totalPages) {
  const parts = [];
  const btn = (page, label, { active = false, disabled = false } = {}) =>
    `<button type="button" class="pagination-btn${active ? " active" : ""}" data-page="${page}"${disabled ? " disabled" : ""}>${label}</button>`;

  parts.push(
    btn(current - 1, '<i class="fas fa-chevron-left"></i>', {
      disabled: current <= 1,
    }),
  );

  const pages = new Set([1, totalPages, current - 1, current, current + 1]);
  const visible = [...pages]
    .filter((p) => p >= 1 && p <= totalPages)
    .sort((a, b) => a - b);

  let prev = 0;
  for (const p of visible) {
    if (p - prev > 1) {
      parts.push(`<span class="pagination-ellipsis">…</span>`);
    }
    parts.push(btn(p, String(p), { active: p === current }));
    prev = p;
  }

  parts.push(
    btn(current + 1, '<i class="fas fa-chevron-right"></i>', {
      disabled: current >= totalPages,
    }),
  );

  return parts.join("");
}

function attachPageButtonHandlers(container, onSelect) {
  container.querySelectorAll("button[data-page]").forEach((b) => {
    b.addEventListener("click", () => {
      if (b.disabled || b.classList.contains("active")) return;
      const p = parseInt(b.getAttribute("data-page"), 10);
      if (!Number.isNaN(p)) onSelect(p);
    });
  });
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
