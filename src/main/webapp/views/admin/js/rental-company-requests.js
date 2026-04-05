(function () {
  // ✅ Same-origin (works on localhost, deployed server, different ports via reverse proxy etc.)
  const API = (path) => `${path}`;

  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));

  let requests = [];

  // ===== Sort state =====
  let alphaSort = "az"; // 'az' | 'za'
  let dateSort = "new"; // 'new' | 'old'
  let lastChanged = "date"; // 'alpha' | 'date'

  document.addEventListener("DOMContentLoaded", async () => {
    if (document.querySelector(".sidebar")) {
      document.body.classList.add("with-sidebar");
    }

    bindSortChips();

    await loadPendingRequests();
    render();
  });

  async function loadPendingRequests() {
    try {
      const res = await fetch(
        API("/api/admin/rental-company-requests?status=PENDING"),
        { headers: { Accept: "application/json" } },
      );

      if (!res.ok) throw new Error(`Load failed (${res.status})`);

      const json = await res.json();
      const data = Array.isArray(json.data) ? json.data : [];

      // Backend fields: id, name, email, phone, city, registrationnumber, description, terms, submitted
      // ✅ No dummy values: keep empty strings if missing (frontend can display blank)
      requests = data.map((r) => ({
        id: Number(r.id),
        name: (r.name ?? "").trim(),
        email: (r.email ?? "").trim(),
        phone: (r.phone ?? "").trim(),
        city: (r.city ?? "").trim(),
        registrationnumber: (r.registrationnumber ?? "").trim(),
        description: (r.description ?? "").trim(),
        terms: (r.terms ?? "").trim(),
        submittedRaw: r.submitted ?? "",
        submitted: formatDateTime(r.submitted ?? ""),
      }));
    } catch (e) {
      console.error(e);
      requests = []; // ✅ no fallback dummy data
      toast("Failed to load pending requests. Check server/API.");
    }
  }

  function getAdminId() {
    // Try common places you might store admin info
    try {
      const raw =
        sessionStorage.getItem("admin") || localStorage.getItem("admin");
      if (raw) {
        const obj = JSON.parse(raw);
        if (obj && (obj.adminid || obj.id))
          return Number(obj.adminid || obj.id);
      }
    } catch {}

    const direct =
      sessionStorage.getItem("adminId") ||
      localStorage.getItem("adminId") ||
      "1";

    const n = Number(direct);
    return Number.isFinite(n) ? n : 1;
  }

  async function approveRequest(requestId) {
    const adminId = getAdminId();
    const url = API(
      `/api/admin/rental-company-requests/approve?id=${encodeURIComponent(
        requestId,
      )}&adminId=${encodeURIComponent(adminId)}`,
    );

    const res = await fetch(url, {
      method: "POST",
      headers: { Accept: "application/json" },
    });

    const json = await res.json().catch(() => null);
    if (!res.ok)
      throw new Error(json?.message || `Approve failed (${res.status})`);

    return json;
  }

  async function rejectRequest(requestId, reason) {
    const adminId = getAdminId();
    const url = API(
      `/api/admin/rental-company-requests/reject?id=${encodeURIComponent(
        requestId,
      )}&adminId=${encodeURIComponent(adminId)}`,
    );

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ reason: reason || "" }),
    });

    const json = await res.json().catch(() => null);
    if (!res.ok)
      throw new Error(json?.message || `Reject failed (${res.status})`);

    return json;
  }

  // ===== Comparators =====
  function alphaCmp(a, b) {
    const cmp = (a.name || "").localeCompare(b.name || "");
    return alphaSort === "az" ? cmp : -cmp;
  }
  function dateCmp(a, b) {
    // Use raw for stable compare; fallback 0 if invalid
    const ta = Date.parse(a.submittedRaw || "") || 0;
    const tb = Date.parse(b.submittedRaw || "") || 0;
    const diff = tb - ta;
    return dateSort === "new" ? diff : -diff;
  }

  // ===== Render table =====
  function render() {
    let sorted = [...requests];

    if (lastChanged === "alpha") {
      sorted = stableSort(sorted, dateCmp);
      sorted = stableSort(sorted, alphaCmp);
    } else {
      sorted = stableSort(sorted, alphaCmp);
      sorted = stableSort(sorted, dateCmp);
    }

    const tbody = $("#requestsTbody");
    if (!tbody) return;

    tbody.innerHTML = "";

    if (!sorted.length) {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td colspan="6" style="padding:16px;text-align:center;color:#64748b;">
        No pending requests.
      </td>`;
      tbody.appendChild(tr);
      return;
    }

    sorted.forEach((req, i) => tbody.appendChild(row(req, i)));
  }

  function row(req, i) {
    const tr = document.createElement("tr");
    tr.dataset.id = String(req.id);

    tr.innerHTML = `
      <td class="row-index"><a href="#" class="go-view">#${i + 1}</a></td>
      <td><span class="company-name go-view">${escapeHTML(req.name || "(no name)")}</span></td>
      <td>${
        req.email
          ? `<a href="mailto:${escapeAttr(req.email)}">${escapeHTML(req.email)}</a>`
          : `<span style="color:#94a3b8;">—</span>`
      }</td>
      <td>${req.phone ? escapeHTML(req.phone) : `<span style="color:#94a3b8;">—</span>`}</td>
      <td>${req.submitted ? escapeHTML(req.submitted) : `<span style="color:#94a3b8;">—</span>`}</td>
      <td>
        <div class="actions">
          <button type="button" class="btn btn-accept">Accept</button>
          <button type="button" class="btn btn-reject">Reject</button>
        </div>
      </td>
    `;

    tr.addEventListener("click", (e) => {
      if (e.target.closest(".actions")) return;
      goToRequestView(req);
    });

    tr.querySelectorAll(".go-view").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        goToRequestView(req);
      });
    });

    tr.querySelector(".btn-accept").addEventListener("click", async (e) => {
      e.stopPropagation();
      const btn = e.currentTarget;
      btn.disabled = true;

      try {
        const result = await approveRequest(req.id);
        toast(
          `Accepted: ${req.name || "Company"} (Company ID: ${result.companyid})`,
        );
        removeRequest(req.id);
      } catch (err) {
        console.error(err);
        alert(err.message || "Approve failed");
        btn.disabled = false;
      }
    });

    tr.querySelector(".btn-reject").addEventListener("click", async (e) => {
      e.stopPropagation();

      const reason = prompt(
        `Reject request from "${req.name || "this company"}"?\nEnter reason (optional):`,
      );
      if (reason === null) return;

      const btn = e.currentTarget;
      btn.disabled = true;

      try {
        await rejectRequest(req.id, reason);
        toast(`Rejected: ${req.name || "Company"}`);
        removeRequest(req.id);
      } catch (err) {
        console.error(err);
        alert(err.message || "Reject failed");
        btn.disabled = false;
      }
    });

    return tr;
  }

  function removeRequest(id) {
    requests = requests.filter((r) => r.id !== id);
    render();
  }

  // ===== Navigation =====
  function goToRequestView(req) {
    // ✅ Store full request object (including description + terms) for the view page
    sessionStorage.setItem("selectedRequest", JSON.stringify(req));

    // Keep your existing behavior: route to rental-company-view.html with requestId
    const url = new URL("rental-company-view.html", location.href);
    url.searchParams.set("requestId", String(req.id));
    location.href = url.toString();
  }

  // ===== Chips =====
  function bindSortChips() {
    $("#alphaSort")?.addEventListener("click", (e) => {
      const btn = e.target.closest(".chip");
      if (!btn) return;
      alphaSort = btn.dataset.sort;
      lastChanged = "alpha";
      setActive("#alphaSort", btn);
      render();
    });

    $("#dateSort")?.addEventListener("click", (e) => {
      const btn = e.target.closest(".chip");
      if (!btn) return;
      dateSort = btn.dataset.sort;
      lastChanged = "date";
      setActive("#dateSort", btn);
      render();
    });
  }

  function setActive(groupSel, btn) {
    $$(groupSel + " .chip").forEach((c) => c.classList.remove("active"));
    btn.classList.add("active");
  }

  // ===== Utils =====
  function stableSort(arr, cmp) {
    return arr
      .map((v, i) => ({ v, i }))
      .sort((a, b) => cmp(a.v, b.v) || a.i - b.i)
      .map((o) => o.v);
  }

  function escapeHTML(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }
  function escapeAttr(s) {
    return String(s).replaceAll('"', "&quot;").replaceAll("<", "&lt;");
  }

  function formatDateTime(raw) {
    const t = Date.parse(raw);
    if (!Number.isFinite(t)) return raw ? String(raw) : "";
    const d = new Date(t);

    // Simple readable format (browser locale)
    // Example: 1/27/2026, 2:15 PM
    return d.toLocaleString();
  }

  function toast(message) {
    const el = document.createElement("div");
    el.textContent = message;
    el.style.cssText = `
      position: fixed; right: 16px; bottom: 16px; background: #0f172a; color: #fff;
      padding: 10px 14px; border-radius: 10px; box-shadow: 0 12px 30px rgba(0,0,0,.25);
      z-index: 2000;`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1800);
  }
})();
