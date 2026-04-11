// report-view.js
(() => {
  const $ = (selector, root = document) => root.querySelector(selector);

  // ---------- Helpers ----------
  function escapeHTML(str) {
    return String(str ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function toDisplayId(reportId) {
    return `#${reportId}`;
  }

  function formatDate(ts) {
    if (!ts) return "—";

    const raw = String(ts).replace("T", " ").replace(".000Z", "");
    const date = new Date(raw);

    if (Number.isNaN(date.getTime())) {
      return raw;
    }

    return date.toLocaleString();
  }

  function categoryBadge(cat) {
    const c = (cat || "").toLowerCase();

    const label =
      c === "vehicle"
        ? "Vehicle Issue"
        : c === "behavior"
          ? "Behavior"
          : c === "payment"
            ? "Payment"
            : c === "app"
              ? "App Issue"
              : c === "safety"
                ? "Safety"
                : "Other";

    return `<span class="category-badge ${escapeHTML(c)}">${escapeHTML(label)}</span>`;
  }

  function statusBadge(status) {
    const s = (status || "Pending").toLowerCase();
    return `<span class="status-badge status-${escapeHTML(s)}">${escapeHTML(s)}</span>`;
  }

  function priorityBadge(priority) {
    const p = (priority || "Low").toLowerCase();
    return `<span class="priority-badge priority-${escapeHTML(p)}">${escapeHTML(p)}</span>`;
  }

  function normalizeRole(roleDb) {
    const r = String(roleDb || "").toUpperCase();

    return r === "DRIVER"
      ? "Driver"
      : r === "CUSTOMER"
        ? "Customer"
        : r === "COMPANY"
          ? "Company"
          : r;
  }

  // ---------- API ----------
  async function apiListReports({
    status = "",
    category = "",
    search = "",
  } = {}) {
    const qs = new URLSearchParams();

    if (status) qs.set("status", status);
    if (category) qs.set("category", category);
    if (search) qs.set("search", search);

    const res = await fetch(`/reports/list?${qs.toString()}`, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    const data = await res.json();

    if (!res.ok || data.status !== "success") {
      throw new Error(data.message || "Failed to load reports");
    }

    return data.reports || [];
  }

  async function apiGetReportStats() {
    const res = await fetch(`/reports/stats`, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    const data = await res.json();

    if (!res.ok || data.status !== "success") {
      throw new Error(data.message || "Failed to load report stats");
    }

    return data.stats || {};
  }

  // ---------- Filters ----------
  function getFilters() {
    return {
      search: ($("#reportSearch")?.value || "").trim(),
      status: $("#statusFilter")?.value || "",
      category: $("#categoryFilter")?.value || "",
    };
  }

  // ---------- Render Table ----------
  function getTbody() {
    return document.querySelector(".reports-table tbody");
  }

  function renderEmptyRow(message = "No reports found.") {
    const tbody = getTbody();
    if (!tbody) return;

    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="empty-state-cell">${escapeHTML(message)}</td>
      </tr>
    `;
  }

  function renderRows(rows) {
    const tbody = getTbody();
    if (!tbody) return;

    tbody.innerHTML = "";

    if (!rows.length) {
      renderEmptyRow();
      return;
    }

    rows.forEach((r) => {
      const reportId = r.reportId ?? r.report_id;
      const subject = r.subject || "";
      const cat = r.category || "";
      const role = normalizeRole(r.reportedRole || r.reported_role);
      const created = formatDate(r.createdAt || r.created_at);
      const status = r.status || "Pending";
      const priority = r.priority || "Low";

      const tr = document.createElement("tr");
      tr.addEventListener("click", () => window.viewReport(reportId));

      tr.innerHTML = `
        <td>${escapeHTML(toDisplayId(reportId))}</td>
        <td>${escapeHTML(subject)}</td>
        <td>${categoryBadge(cat)}</td>
        <td>${escapeHTML(role)}</td>
        <td>${escapeHTML(created)}</td>
        <td>${statusBadge(status)}</td>
        <td>${priorityBadge(priority)}</td>
        <td>
          <button
            class="btn-icon"
            onclick="viewReport(${reportId}); event.stopPropagation();"
            title="View"
            type="button"
          >
            <i class="fas fa-eye"></i>
          </button>
        </td>
      `;

      tbody.appendChild(tr);
    });
  }

  // ---------- Render Stats ----------
  function renderStats(stats) {
    $("#totalReports").textContent = stats.total ?? 0;
    $("#pendingReports").textContent = stats.pending ?? 0;
    $("#resolvedReports").textContent = stats.resolved ?? 0;
    $("#highPriorityReports").textContent = stats.highPriority ?? 0;
  }

  // ---------- Navigation ----------
  window.viewReport = function (idOrNumber) {
    const idParam = String(idOrNumber);
    window.location.href = `report.html?id=${encodeURIComponent(idParam)}`;
  };

  // ---------- Loaders ----------
  async function loadReports() {
    const { status, category, search } = getFilters();
    const rows = await apiListReports({ status, category, search });
    renderRows(rows);
  }

  async function loadReportStats() {
    const stats = await apiGetReportStats();
    renderStats(stats);
  }

  async function refreshPageData() {
    await Promise.all([loadReports(), loadReportStats()]);
  }

  // ---------- Events ----------
  function bindUI() {
    $("#applyFiltersBtn")?.addEventListener("click", () => {
      loadReports().catch((e) => {
        console.error(e);
        alert(e.message || "Failed to load reports");
      });
    });

    $("#statusFilter")?.addEventListener("change", () => {
      loadReports().catch((e) => console.error(e));
    });

    $("#categoryFilter")?.addEventListener("change", () => {
      loadReports().catch((e) => console.error(e));
    });

    $("#reportSearch")?.addEventListener("input", () => {
      clearTimeout(window.__rptSearchTimer);
      window.__rptSearchTimer = setTimeout(() => {
        loadReports().catch((e) => console.error(e));
      }, 250);
    });
  }

  // ---------- Init ----------
  window.addEventListener("DOMContentLoaded", () => {
    bindUI();

    refreshPageData().catch((e) => {
      console.error(e);
      renderEmptyRow("Failed to load reports.");
      alert(e.message || "Failed to load reports data");
    });
  });
})();
