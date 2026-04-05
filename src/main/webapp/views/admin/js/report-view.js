// report-view.js (CONNECTED TO BACKEND) - matches report-view.html IDs
(() => {
  const $ = (s, r = document) => r.querySelector(s);

  let currentOpenReportId = null; // numeric report_id in DB

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
    // Display like #1 (your table sample uses #1)
    return `#${reportId}`;
  }

  function formatDate(ts) {
    // Backend may return "2026-01-04 12:34:56" or ISO-like; keep simple
    if (!ts) return "—";
    return String(ts).replace("T", " ").replace(".000Z", "");
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

    // your CSS uses: <span class="category-badge vehicle">Vehicle Issue</span>
    return `<span class="category-badge ${escapeHTML(c)}">${escapeHTML(
      label
    )}</span>`;
  }

  function statusBadge(status) {
    const s = (status || "Pending").toLowerCase(); // pending/reviewed/resolved/closed
    return `<span class="status-badge status-${escapeHTML(s)}">${escapeHTML(
      s
    )}</span>`;
  }

  function priorityBadge(priority) {
    const p = (priority || "Low").toLowerCase(); // low/medium/high/urgent
    return `<span class="priority-badge priority-${escapeHTML(p)}">${escapeHTML(
      p
    )}</span>`;
  }

  function normalizeRole(roleDb) {
    // DB stores DRIVER/CUSTOMER/COMPANY -> UI expects "Driver" etc.
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
    if (status) qs.set("status", status); // pending/reviewed/resolved/closed
    if (category) qs.set("category", category); // vehicle/behavior/payment/app/safety
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

  async function apiGetReport(idOrCode) {
    const res = await fetch(`/report/get?id=${encodeURIComponent(idOrCode)}`, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    const data = await res.json();
    if (!res.ok || data.status !== "success") {
      throw new Error(data.message || "Report not found");
    }
    return data; // {status, report, imageIds}
  }

  async function apiUpdateReport(reportId, status, priority) {
    const res = await fetch(`/report/update`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ reportId, status, priority }),
    });

    const data = await res.json();
    if (!res.ok || data.status !== "success") {
      throw new Error(data.message || "Update failed");
    }
    return data;
  }

  // ---------- Render Table ----------
  function getFilters() {
    return {
      search: ($("#reportSearch")?.value || "").trim(),
      status: $("#statusFilter")?.value || "",
      category: $("#categoryFilter")?.value || "",
    };
  }

  function getTbody() {
    // Your HTML: <table class="table reports-table"> ... <tbody> ...
    return document.querySelector(".reports-table tbody");
  }

  function renderRows(rows) {
    const tbody = getTbody();
    if (!tbody) return;

    tbody.innerHTML = "";

    rows.forEach((r) => {
      const reportId = r.reportId ?? r.report_id;
      const subject = r.subject || "";
      const cat = r.category || "";
      const role = normalizeRole(r.reportedRole || r.reported_role);
      const created = formatDate(r.createdAt || r.created_at);
      const status = r.status || "Pending";
      const priority = r.priority || "Low";

      const tr = document.createElement("tr");
      tr.addEventListener("click", () => viewReport(reportId));

      tr.innerHTML = `
        <td>${escapeHTML(toDisplayId(reportId))}</td>
        <td>${escapeHTML(subject)}</td>
        <td>${categoryBadge(cat)}</td>
        <td>${escapeHTML(role)}</td>
        <td>${escapeHTML(created)}</td>
        <td>${statusBadge(status)}</td>
        <td>${priorityBadge(priority)}</td>
        <td>
          <button class="btn-icon" onclick="viewReport(${reportId}); event.stopPropagation();" title="View">👁️</button>
        </td>
      `;

      tbody.appendChild(tr);
    });
  }

  // ---------- Modal ----------
  function openModal() {
    const modal = $("#reportModal");
    if (modal) modal.classList.add("show");
  }

  function closeModal() {
    const modal = $("#reportModal");
    if (modal) modal.classList.remove("show");
    currentOpenReportId = null;
  }

  function modalContentHTML(report, imageIds) {
    const rid = report.reportId;
    const images = (imageIds || []).map((imgId) => {
      const url = `/report/image/get?imageId=${imgId}`;
      return `
        <a class="evidence-item" href="${url}" target="_blank" rel="noopener">
          Evidence #${imgId}
        </a>`;
    });

    // status/priority selects for update
    const statusOptions = ["Pending", "Reviewed", "Resolved", "Closed"]
      .map(
        (s) =>
          `<option value="${s}" ${
            report.status === s ? "selected" : ""
          }>${s}</option>`
      )
      .join("");

    const priorityOptions = ["Low", "Medium", "High", "Urgent"]
      .map(
        (p) =>
          `<option value="${p}" ${
            report.priority === p ? "selected" : ""
          }>${p}</option>`
      )
      .join("");

    return `
      <div class="report-detail-grid">
        <div><strong>ID:</strong> ${escapeHTML(toDisplayId(rid))}</div>
        <div><strong>Category:</strong> ${escapeHTML(report.category)}</div>
        <div><strong>Status:</strong>
          <select id="modalStatusSelect" class="form-select">${statusOptions}</select>
        </div>
        <div><strong>Priority:</strong>
          <select id="modalPrioritySelect" class="form-select">${priorityOptions}</select>
        </div>

        <div style="grid-column:1/-1"><strong>Subject:</strong><br>${escapeHTML(
          report.subject
        )}</div>
        <div style="grid-column:1/-1"><strong>Description:</strong><br>${escapeHTML(
          report.description || "—"
        )}</div>

        <div style="grid-column:1/-1">
          <strong>Reporter:</strong><br>
          ${escapeHTML(report.reporterName || "—")} (${escapeHTML(
      report.reporterRole || "—"
    )})<br>
          ${escapeHTML(report.reporterEmail || "—")}<br>
          ${escapeHTML(report.reporterPhone || "—")}
        </div>

        <div style="grid-column:1/-1">
          <strong>Reported Party:</strong><br>
          ${escapeHTML(report.reportedRole)} (ID: ${escapeHTML(
      report.reportedId
    )})
        </div>

        <div style="grid-column:1/-1">
          <strong>Evidence:</strong><br>
          ${images.length ? images.join("") : "No evidence uploaded."}
        </div>
      </div>
    `;
  }

  // global (called by HTML inline onclick)
  // Redirect to report.html instead of opening a modal
  window.viewReport = function (idOrNumber) {
    const idParam = String(idOrNumber);
    window.location.href = `report.html?id=${encodeURIComponent(idParam)}`;
  };

  window.closeReportModal = function () {
    closeModal();
  };

  window.updateReportStatus = async function () {
    if (!currentOpenReportId) {
      alert("No report selected");
      return;
    }

    const status = $("#modalStatusSelect")?.value;
    const priority = $("#modalPrioritySelect")?.value;

    try {
      await apiUpdateReport(currentOpenReportId, status, priority);
      alert("Report updated");

      // refresh table using current filters
      await loadReports();
      closeModal();
    } catch (e) {
      console.error(e);
      alert(e.message || "Update failed");
    }
  };

  // ---------- Load ----------
  async function loadReports() {
    const { status, category, search } = getFilters();
    const rows = await apiListReports({ status, category, search });
    renderRows(rows);
  }

  function bindUI() {
    $("#applyFiltersBtn")?.addEventListener("click", () => {
      loadReports().catch((e) => alert(e.message || "Failed to load reports"));
    });

    // optional: live filter without pressing apply
    $("#statusFilter")?.addEventListener("change", () =>
      loadReports().catch(() => {})
    );
    $("#categoryFilter")?.addEventListener("change", () =>
      loadReports().catch(() => {})
    );

    // Search live typing
    $("#reportSearch")?.addEventListener("input", () => {
      // light debounce
      clearTimeout(window.__rptSearchTimer);
      window.__rptSearchTimer = setTimeout(
        () => loadReports().catch(() => {}),
        250
      );
    });

    // close modal by clicking backdrop
    $("#reportModal")?.addEventListener("click", (e) => {
      if (e.target?.id === "reportModal") closeModal();
    });
  }

  window.addEventListener("DOMContentLoaded", () => {
    bindUI();
    loadReports().catch((e) => {
      console.error(e);
      alert(e.message || "Failed to load reports");
    });
  });
})();
