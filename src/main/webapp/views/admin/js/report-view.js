// Reports list with stats/filters/sorting + ROLE TOGGLE (All → Driver → Customer)
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // ----- Seed dataset (replace with API if available) -----
  const BASE = [
    {
      id: "RPT-2024-001",
      subject: "Vehicle breakdown during trip",
      category: "Vehicle Issue",
      status: "Pending",
      dateCreated: "2024-01-15 10:30 AM",
      reportedRole: "Driver",
      priority: "High",
    },
    {
      id: "RPT-2024-002",
      subject: "Inappropriate behavior",
      category: "User Behavior",
      status: "Reviewed",
      dateCreated: "2024-01-14 09:12 AM",
      reportedRole: "Customer",
      priority: "Medium",
    },
    {
      id: "RPT-2024-003",
      subject: "Payment not processed",
      category: "Payment Issue",
      status: "Resolved",
      dateCreated: "2024-01-13 01:22 PM",
      reportedRole: "Customer",
      priority: "Low",
    },
    {
      id: "RPT-2024-004",
      subject: "Unsafe driving reported",
      category: "Safety Concern",
      status: "Pending",
      dateCreated: "2024-01-12 05:40 PM",
      reportedRole: "Driver",
      priority: "High",
    },
    {
      id: "RPT-2024-005",
      subject: "App crashes on booking",
      category: "App Bug",
      status: "Reviewed",
      dateCreated: "2024-01-11 08:00 AM",
      reportedRole: "Customer",
      priority: "Medium",
    },
    {
      id: "RPT-2024-006",
      subject: "Vehicle cleanliness complaint",
      category: "Vehicle Issue",
      status: "Resolved",
      dateCreated: "2024-01-10 03:15 PM",
      reportedRole: "Driver",
      priority: "Low",
    },
    // If you added 007/008, include them here too:
    {
      id: "RPT-2024-007",
      subject: "Brake light not working",
      category: "Vehicle Issue",
      status: "Pending",
      dateCreated: "2024-01-09 02:45 PM",
      reportedRole: "Driver",
      priority: "Medium",
    },
    {
      id: "RPT-2024-008",
      subject: "Refund not reflected",
      category: "Payment Issue",
      status: "Reviewed",
      dateCreated: "2024-01-08 11:10 AM",
      reportedRole: "Customer",
      priority: "High",
    },
  ];

  // Merge with any per-report edits saved by report.html (sessionStorage rm_report_<id>)
  function mergedData() {
    return BASE.map((b) => {
      try {
        const saved = JSON.parse(sessionStorage.getItem(`rm_report_${b.id}`));
        return saved ? { ...b, ...saved } : b;
      } catch {
        return b;
      }
    });
  }

  // Nav helper (rows → detail)
  window.viewReport = function (id) {
    const fullId = /^\d+$/.test(String(id))
      ? `RPT-2024-${String(id).padStart(3, "0")}`
      : String(id);
    location.href = `report.html?id=${encodeURIComponent(fullId)}`;
  };

  // ----- ROLE TOGGLE -----
  let roleFilter = ""; // "" (All) | "Driver" | "Customer"
  function updateRoleToggleButton() {
    const btn = document.querySelector('[onclick="toggleFilter()"]');
    if (!btn) return;
    btn.textContent = roleFilter ? `Role: ${roleFilter}` : "Role: All";
  }
  window.toggleFilter = function () {
    roleFilter =
      roleFilter === "" ? "Driver" : roleFilter === "Driver" ? "Customer" : "";
    updateRoleToggleButton();
    render();
  };

  // ----- Rendering -----
  let sortKey = "dateCreated";
  let sortDir = "desc"; // 'asc' | 'desc'

  document.addEventListener("DOMContentLoaded", () => {
    bindFilters();
    bindSorting();
    updateRoleToggleButton();
    render();
  });

  function render() {
    const data = applyFilters(mergedData());
    renderStats(data);
    renderTable(data);
    updateSortIndicators();
  }

  // Stats reflect the CURRENT filtered subset
  function renderStats(rows) {
    const total = rows.length;
    const byStatus = countBy(rows, (r) => r.status);
    const tot = $("#statTotal"),
      pen = $("#statPending"),
      rev = $("#statReviewed"),
      res = $("#statResolved"),
      clo = $("#statClosed");
    if (tot) tot.textContent = total;
    if (pen) pen.textContent = byStatus["Pending"] || 0;
    if (rev) rev.textContent = byStatus["Reviewed"] || 0;
    if (res) res.textContent = byStatus["Resolved"] || 0;
    if (clo) clo.textContent = byStatus["Closed"] || 0;
  }

  function renderTable(rows) {
    rows = sortRows(rows);
    const tbody = $("#reportsTbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    for (const r of rows) {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${escape(r.id)}</td>
        <td>${escape(r.subject)}</td>
        <td>${badgeCategory(r.category)}</td>
        <td>${escape(r.reportedRole)}</td>
        <td>${escape(r.dateCreated)}</td>
        <td>${badgeStatus(r.status)}</td>
        <td>${badgePriority(r.priority)}</td>
        <td class="open-cell" title="Open">›</td>
      `;
      tr.addEventListener("click", () => viewReport(r.id));
      tbody.appendChild(tr);
    }
  }

  // ----- Filters -----
  function bindFilters() {
    const search = $("#reportSearch");
    const status = $("#statusFilter");
    const cat = $("#categoryFilter");
    const pri = $("#priorityFilter"); // may be absent
    const apply = $("#applyFiltersBtn"); // ✅ new

    if (search) search.addEventListener("input", render);
    if (status) status.addEventListener("change", render);
    if (cat) cat.addEventListener("change", render);
    if (pri) pri.addEventListener("change", render);
    if (apply) apply.addEventListener("click", render); // ✅ new
  }

  function applyFilters(rows) {
    const search = $("#reportSearch");
    const status = $("#statusFilter");
    const cat = $("#categoryFilter");
    const pri = $("#priorityFilter");

    const q = (search?.value || "").toLowerCase().trim();
    const st = status?.value || ""; // "pending" | "reviewed" | "resolved" | "" (all)
    const catv = cat?.value || ""; // "vehicle" | "behavior" | "payment" | "app" | "safety" | ""
    const prv = pri?.value || ""; // "Low"/"Medium"/"High"/"Urgent" if you add it

    return rows.filter((r) => {
      let ok = true;

      // Search across common fields
      if (q) {
        ok = [
          r.id,
          r.subject,
          r.category,
          r.reportedRole,
          r.dateCreated,
          r.status,
          r.priority,
        ].some((v) => String(v).toLowerCase().includes(q));
      }

      // Status dropdown
      if (ok && st) ok = String(r.status).toLowerCase() === st;

      // Category dropdown (value is lowercase keyword)
      if (ok && catv) ok = String(r.category).toLowerCase().includes(catv);

      // Priority dropdown (if present)
      if (ok && prv)
        ok = String(r.priority).toLowerCase() === prv.toLowerCase();

      // ROLE TOGGLE
      if (ok && roleFilter) ok = r.reportedRole === roleFilter;

      return ok;
    });
  }

  // ----- Sorting -----
  function bindSorting() {
    $$(".reports-table thead th[data-sort]").forEach((th) => {
      th.addEventListener("click", () => {
        const key = th.getAttribute("data-sort");
        if (sortKey === key) {
          sortDir = sortDir === "asc" ? "desc" : "asc";
        } else {
          sortKey = key;
          sortDir = key === "dateCreated" ? "desc" : "asc"; // sensible default
        }
        render();
      });
    });
  }
  function sortRows(rows) {
    const dir = sortDir === "asc" ? 1 : -1;
    const key = sortKey;
    return [...rows].sort((a, b) => {
      const va = normalize(a[key], key);
      const vb = normalize(b[key], key);
      if (va < vb) return -1 * dir;
      if (va > vb) return 1 * dir;
      return 0;
    });
  }
  function updateSortIndicators() {
    $$(".reports-table thead th").forEach((th) =>
      th.classList.remove("sort-asc", "sort-desc")
    );
    const th = $(`.reports-table thead th[data-sort="${sortKey}"]`);
    if (th) th.classList.add(sortDir === "asc" ? "sort-asc" : "sort-desc");
  }

  function normalize(v, key) {
    if (key === "dateCreated") {
      const d = Date.parse(v);
      return isNaN(d) ? 0 : d;
    }
    return String(v).toLowerCase();
  }

  // ----- Badges -----
  function badgePriority(p) {
    const cls =
      p === "Low"
        ? "pri-low"
        : p === "Medium"
        ? "pri-medium"
        : p === "High"
        ? "pri-high"
        : p === "Urgent"
        ? "pri-urgent"
        : "";
    return `<span class="badge ${cls}">${escape(p)}</span>`;
  }
  function badgeStatus(s) {
    const cls =
      s === "Pending"
        ? "st-pending"
        : s === "Reviewed"
        ? "st-reviewed"
        : s === "Resolved"
        ? "st-resolved"
        : s === "Closed"
        ? "st-closed"
        : "";
    return `<span class="badge ${cls}">${escape(s)}</span>`;
  }
  function badgeCategory(c) {
    return `<span class="badge">${escape(c)}</span>`;
  }

  // ----- Utils -----
  function countBy(arr, keyFn) {
    const out = Object.create(null);
    for (const x of arr) {
      const k = keyFn(x);
      out[k] = (out[k] || 0) + 1;
    }
    return out;
  }
  function escape(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }
})();
