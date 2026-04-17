// report-view.js
(() => {
  const $ = (selector, root = document) => root.querySelector(selector);

  // ---------- Pagination State ----------
  let currentRows = [];
  let currentPage = 1;
  let pageSize = 10;

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
    // Cache full list for paging + re-render current page
    currentRows = rows || [];
    renderCurrentPage();
    renderPagination();
  }

  function renderCurrentPage() {
    const tbody = getTbody();
    if (!tbody) return;

    const total = currentRows.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    if (currentPage > totalPages) currentPage = totalPages;

    tbody.innerHTML = "";

    if (!total) {
      renderEmptyRow();
      return;
    }

    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    const pageRows = currentRows.slice(start, end);

    pageRows.forEach((r) => {
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

  // ---------- Pagination ----------
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

  function renderPagination() {
    const info = $("#reportsPaginationInfo");
    const pagesEl = $("#reportsPages");
    if (!info || !pagesEl) return;

    const total = currentRows.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    if (currentPage > totalPages) currentPage = totalPages;

    if (total === 0) {
      info.innerHTML = `Showing <strong>0</strong> of <strong>0</strong>`;
      pagesEl.innerHTML = "";
      return;
    }

    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, total);
    info.innerHTML = `Showing <strong>${start}–${end}</strong> of <strong>${total}</strong> reports`;

    pagesEl.innerHTML = buildPageButtons(currentPage, totalPages);
    pagesEl.querySelectorAll("button[data-page]").forEach((b) => {
      b.addEventListener("click", () => {
        if (b.disabled || b.classList.contains("active")) return;
        const p = parseInt(b.getAttribute("data-page"), 10);
        if (!Number.isNaN(p)) {
          currentPage = p;
          renderCurrentPage();
          renderPagination();
        }
      });
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
  async function loadReports({ resetPage = true } = {}) {
    if (resetPage) currentPage = 1;
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

    $("#reportsPageSize")?.addEventListener("change", (e) => {
      pageSize = parseInt(e.target.value, 10) || 10;
      currentPage = 1;
      renderCurrentPage();
      renderPagination();
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
