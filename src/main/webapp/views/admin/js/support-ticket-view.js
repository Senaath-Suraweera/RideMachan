// Support Tickets JS — adds ROLE TOGGLE (All → Driver → Customer) on top of your current logic
class SupportTicketsManager {
  constructor() {
    this.tickets = [
      {
        id: 1,
        subject: "Vehicle breakdown during trip",
        status: "pending",
        role: "driver",
        priority: "high",
        dateCreated: "2024-01-15",
        customerName: "John Smith",
        description: "...",
        bookingId: "BK-2024-0156",
      },
      {
        id: 2,
        subject: "Payment processing issue",
        status: "resolved",
        role: "customer",
        priority: "medium",
        dateCreated: "2024-01-14",
        customerName: "Sarah Wilson",
        description: "...",
        bookingId: "BK-2024-0155",
      },
      {
        id: 3,
        subject: "App crashes on booking",
        status: "ongoing",
        role: "customer",
        priority: "medium",
        dateCreated: "2024-01-13",
        customerName: "Mike Johnson",
        description: "...",
        bookingId: "BK-2024-0154",
      },
      {
        id: 4,
        subject: "Inappropriate customer behavior",
        status: "pending",
        role: "driver",
        priority: "high",
        dateCreated: "2024-01-12",
        customerName: "David Lee",
        description: "...",
        bookingId: "BK-2024-0153",
      },
      {
        id: 5,
        subject: "Vehicle cleanliness complaint",
        status: "resolved",
        role: "customer",
        priority: "low",
        dateCreated: "2024-01-11",
        customerName: "Emma Davis",
        description: "...",
        bookingId: "BK-2024-0152",
      },
      {
        id: 6,
        subject: "Billing discrepancy",
        status: "ongoing",
        role: "customer",
        priority: "medium",
        dateCreated: "2024-01-10",
        customerName: "Alex Kumar",
        description: "...",
        bookingId: "BK-2024-0151",
      },
      {
        id: 7,
        subject: "GPS tracking not working",
        status: "pending",
        role: "driver",
        priority: "medium",
        dateCreated: "2024-01-09",
        customerName: "Maria Santos",
        description: "...",
        bookingId: "BK-2024-0150",
      },
      {
        id: 8,
        subject: "Account verification issue",
        status: "resolved",
        role: "customer",
        priority: "low",
        dateCreated: "2024-01-08",
        customerName: "James Wilson",
        description: "...",
        bookingId: "BK-2024-0149",
      },
    ];
    this.filteredTickets = [...this.tickets];

    // --- Role toggle state ---
    this.roleToggle = ""; // "" (All) | "driver" | "customer"

    this.init();
  }

  init() {
    this.renderTickets();
    this.renderStats();
    this.updateRoleToggleButton();

    // close modal when clicking backdrop
    window.addEventListener("click", (e) => {
      const filterModal = document.getElementById("filterModal");
      if (e.target === filterModal) this.closeFilterModal();
    });

    // if user uses the Role dropdown, clear the toggle (to avoid conflicts)
    const roleSel = document.getElementById("roleFilter");
    roleSel?.addEventListener("change", () => {
      this.roleToggle = "";
      this.updateRoleToggleButton();
    });
  }

  // ---------- Rendering ----------
  renderTickets() {
    const tbody = document.querySelector(".tickets-table tbody");
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
    tr.addEventListener("click", () => this.openTicketView(t.id));
    tr.innerHTML = `
      <td>#${t.id}</td>
      <td>${escapeHTML(t.subject)}</td>
      <td><span class="status-badge status-${t.status}">${this.statusText(
      t.status
    )}</span></td>
      <td>${this.cap(t.role)}</td>
      <td class="priority-${t.priority}">${t.priority.toUpperCase()}</td>
      <td>
        <button class="btn-icon" title="Open" onclick="viewTicket(${
          t.id
        });event.stopPropagation();">👁️</button>
      </td>`;
    return tr;
  }

  openTicketView(id) {
    const ticketParam = `TKT-2024-${String(id).padStart(3, "0")}`;
    location.href = `support-ticket.html?id=${encodeURIComponent(ticketParam)}`;
  }

  // ---------- Filters ----------
  // Read current dropdown values
  readUIFilters() {
    return {
      s: document.getElementById("statusFilter")?.value || "", // "pending"|"ongoing"|"resolved"|""
      r: document.getElementById("roleFilter")?.value || "", // "customer"|"driver"|"company"|""
      p: document.getElementById("priorityFilter")?.value || "", // "low"|"medium"|"high"|""
    };
  }

  // Centralized filter computation (includes role toggle)
  computeFilteredTickets({ s, r, p }) {
    const role = this.roleToggle || r; // toggle overrides dropdown when set
    return this.tickets.filter(
      (t) =>
        (!s || t.status === s) &&
        (!role || t.role === role) &&
        (!p || t.priority === p)
    );
  }

  applyTicketFilters() {
    this.filteredTickets = this.computeFilteredTickets(this.readUIFilters());
    this.renderTickets();
  }

  clearTicketFilters() {
    const ids = ["statusFilter", "roleFilter", "priorityFilter"];
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });
    this.roleToggle = ""; // also clear the toggle
    this.updateRoleToggleButton();
    this.filteredTickets = [...this.tickets];
    this.renderTickets();
  }

  // ---------- Role Toggle ----------
  toggleRole() {
    const cycle = ["", "driver", "customer"]; // All → Driver → Customer
    const next = cycle[(cycle.indexOf(this.roleToggle) + 1) % cycle.length];
    this.roleToggle = next;

    // Clear role dropdown to avoid clashes; toggle is the source of truth while active
    const roleSel = document.getElementById("roleFilter");
    if (roleSel) roleSel.value = "";

    this.updateRoleToggleButton();

    // Recompute with current dropdowns (status/priority) + toggle
    this.filteredTickets = this.computeFilteredTickets(this.readUIFilters());
    this.renderTickets();
  }

  updateRoleToggleButton() {
    const btn = document.getElementById("roleToggleBtn");
    if (!btn) return;
    btn.textContent = `Role: ${
      this.roleToggle ? this.cap(this.roleToggle) : "All"
    }`;
    btn.setAttribute("aria-pressed", this.roleToggle ? "true" : "false");
  }

  // ---------- Modal (unchanged) ----------
  toggleFilter() {
    const m = document.getElementById("filterModal");
    if (!m) return;
    m.style.display = "flex";
    m.classList.add("show");
    document.body.style.overflow = "hidden";
  }
  closeFilterModal() {
    const m = document.getElementById("filterModal");
    if (!m) return;
    m.style.display = "none";
    m.classList.remove("show");
    document.body.style.overflow = "";
  }

  // ---------- utils ----------
  statusText(s) {
    return (
      { pending: "Pending", ongoing: "In Progress", resolved: "Resolved" }[s] ||
      s
    );
  }
  cap(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
}

function viewTicket(id) {
  window.supportTicketsManager?.openTicketView(id);
}
function toggleFilter() {
  window.supportTicketsManager?.toggleFilter();
}
function applyTicketFilters() {
  window.supportTicketsManager?.applyTicketFilters();
}
function clearTicketFilters() {
  window.supportTicketsManager?.clearTicketFilters();
}
function closeFilterModal() {
  window.supportTicketsManager?.closeFilterModal();
}

// NEW: Role toggle bridge for the button
function toggleRole() {
  window.supportTicketsManager?.toggleRole();
}

function escapeHTML(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

document.addEventListener("DOMContentLoaded", () => {
  window.supportTicketsManager = new SupportTicketsManager();
});
