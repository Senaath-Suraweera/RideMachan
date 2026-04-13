(function () {
  const API = (path) => `${path}`;

  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));

  let requests = [];
  let currentStatus = "PENDING";

  let alphaSort = "az";
  let dateSort = "new";
  let lastChanged = "date";

  let currentPage = 1;
  const pageSize = 10;

  document.addEventListener("DOMContentLoaded", async () => {
    if (document.querySelector(".sidebar")) {
      document.body.classList.add("with-sidebar");
    }

    bindStatusChips();
    bindSortChips();
    bindPagination();

    await loadRequests();
    render();
  });

  async function loadRequests() {
    try {
      const res = await fetch(
        API(
          `/api/admin/rental-company-requests?status=${encodeURIComponent(currentStatus)}`,
        ),
        { headers: { Accept: "application/json" } },
      );

      if (!res.ok) throw new Error(`Load failed (${res.status})`);

      const json = await res.json();
      const data = Array.isArray(json.data) ? json.data : [];

      requests = data.map((r) => ({
        id: Number(r.id),
        name: (r.name ?? "").trim(),
        email: (r.email ?? "").trim(),
        phone: (r.phone ?? "").trim(),
        city: (r.city ?? "").trim(),
        registrationnumber: (r.registrationnumber ?? "").trim(),
        description: (r.description ?? "").trim(),
        terms: (r.terms ?? "").trim(),
        status: (r.status ?? currentStatus).trim(),
        submittedRaw: r.submitted ?? "",
        submitted: formatDateTime(r.submitted ?? ""),
      }));
    } catch (e) {
      console.error(e);
      requests = [];
      toast(`Failed to load ${currentStatus.toLowerCase()} requests.`);
    }
  }

  function getAdminId() {
    try {
      const raw =
        sessionStorage.getItem("admin") || localStorage.getItem("admin");
      if (raw) {
        const obj = JSON.parse(raw);
        if (obj && (obj.adminid || obj.id)) {
          return Number(obj.adminid || obj.id);
        }
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
    if (!res.ok) {
      throw new Error(json?.message || `Approve failed (${res.status})`);
    }

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
    if (!res.ok) {
      throw new Error(json?.message || `Reject failed (${res.status})`);
    }

    return json;
  }

  function alphaCmp(a, b) {
    const cmp = (a.name || "").localeCompare(b.name || "");
    return alphaSort === "az" ? cmp : -cmp;
  }

  function dateCmp(a, b) {
    const ta = Date.parse(a.submittedRaw || "") || 0;
    const tb = Date.parse(b.submittedRaw || "") || 0;
    const diff = tb - ta;
    return dateSort === "new" ? diff : -diff;
  }

  function getSortedRequests() {
    let sorted = [...requests];

    if (lastChanged === "alpha") {
      sorted = stableSort(sorted, dateCmp);
      sorted = stableSort(sorted, alphaCmp);
    } else {
      sorted = stableSort(sorted, alphaCmp);
      sorted = stableSort(sorted, dateCmp);
    }

    return sorted;
  }

  function render() {
    const sorted = getSortedRequests();
    const total = sorted.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    const pageItems = sorted.slice(start, end);

    const tbody = $("#requestsTbody");
    if (!tbody) return;

    tbody.innerHTML = "";

    if (!pageItems.length) {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td colspan="7">
          No ${currentStatus.toLowerCase()} requests.
        </td>
      `;
      tbody.appendChild(tr);
    } else {
      pageItems.forEach((req, index) => {
        tbody.appendChild(row(req, start + index));
      });
    }

    renderPagination(total, totalPages, pageItems.length, start);
  }

  function row(req, absoluteIndex) {
    const tr = document.createElement("tr");
    tr.dataset.id = String(req.id);

    const isPending = req.status === "PENDING";
    const statusClass = req.status === "REJECTED" ? "rejected" : "pending";

    tr.innerHTML = `
      <td class="row-index">
        <a href="#" class="go-view">#${absoluteIndex + 1}</a>
      </td>
      <td>
        <span class="company-name go-view">${escapeHTML(req.name || "(no name)")}</span>
      </td>
      <td>
        ${
          req.email
            ? `<a href="mailto:${escapeAttr(req.email)}">${escapeHTML(req.email)}</a>`
            : `<span class="muted">—</span>`
        }
      </td>
      <td>
        ${req.phone ? escapeHTML(req.phone) : `<span class="muted">—</span>`}
      </td>
      <td>
        <span class="status-badge ${statusClass}">${escapeHTML(req.status)}</span>
      </td>
      <td>
        ${req.submitted ? escapeHTML(req.submitted) : `<span class="muted">—</span>`}
      </td>
      <td>
        ${
          isPending
            ? `
              <div class="actions">
                <button type="button" class="btn btn-accept">Accept</button>
                <button type="button" class="btn btn-reject">Reject</button>
              </div>
            `
            : `<span class="muted">No actions</span>`
        }
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

    if (isPending) {
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

          if (currentStatus === "PENDING") {
            removeRequest(req.id);
          } else {
            await loadRequests();
            render();
          }
        } catch (err) {
          console.error(err);
          alert(err.message || "Reject failed");
          btn.disabled = false;
        }
      });
    }

    return tr;
  }

  function removeRequest(id) {
    requests = requests.filter((r) => r.id !== id);
    render();
  }

  function goToRequestView(req) {
    sessionStorage.setItem("selectedRequest", JSON.stringify(req));

    const url = new URL("rental-company-request-view.html", location.href);
    url.searchParams.set("requestId", String(req.id));
    url.searchParams.set("requestStatus", String(req.status || "PENDING"));
    url.searchParams.set("source", "registration-request");
    location.href = url.toString();
  }

  function bindStatusChips() {
    $("#statusFilter")?.addEventListener("click", async (e) => {
      const btn = e.target.closest(".chip");
      if (!btn) return;

      const nextStatus = btn.dataset.status;
      if (!nextStatus || nextStatus === currentStatus) return;

      currentStatus = nextStatus;
      currentPage = 1;
      setActive("#statusFilter", btn);

      await loadRequests();
      render();
    });
  }

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

  function bindPagination() {
    $("#prevPageBtn")?.addEventListener("click", () => {
      if (currentPage > 1) {
        currentPage -= 1;
        render();
      }
    });

    $("#nextPageBtn")?.addEventListener("click", () => {
      const totalPages = Math.max(
        1,
        Math.ceil(getSortedRequests().length / pageSize),
      );
      if (currentPage < totalPages) {
        currentPage += 1;
        render();
      }
    });
  }

  function renderPagination(total, totalPages, shownCount, startIndex) {
    const info = $("#paginationInfo");
    const pageNumbers = $("#pageNumbers");
    const prevBtn = $("#prevPageBtn");
    const nextBtn = $("#nextPageBtn");
    const bar = $("#paginationBar");

    if (!info || !pageNumbers || !prevBtn || !nextBtn || !bar) return;

    if (total === 0) {
      info.textContent = "Showing 0 of 0";
      pageNumbers.innerHTML = "";
      prevBtn.disabled = true;
      nextBtn.disabled = true;
      return;
    }

    const from = startIndex + 1;
    const to = startIndex + shownCount;
    info.textContent = `Showing ${from}-${to} of ${total}`;

    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= totalPages;

    pageNumbers.innerHTML = "";

    const pages = buildPageList(totalPages, currentPage);
    pages.forEach((page) => {
      if (page === "...") {
        const span = document.createElement("span");
        span.className = "page-number";
        span.textContent = "...";
        span.style.pointerEvents = "none";
        span.style.opacity = "0.7";
        pageNumbers.appendChild(span);
        return;
      }

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "page-number" + (page === currentPage ? " active" : "");
      btn.textContent = String(page);
      btn.addEventListener("click", () => {
        currentPage = page;
        render();
      });
      pageNumbers.appendChild(btn);
    });
  }

  function buildPageList(totalPages, currentPageValue) {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages = [1];

    if (currentPageValue > 3) pages.push("...");

    const start = Math.max(2, currentPageValue - 1);
    const end = Math.min(totalPages - 1, currentPageValue + 1);

    for (let i = start; i <= end; i += 1) {
      pages.push(i);
    }

    if (currentPageValue < totalPages - 2) pages.push("...");

    pages.push(totalPages);
    return pages;
  }

  function setActive(groupSel, btn) {
    $$(groupSel + " .chip").forEach((c) => c.classList.remove("active"));
    btn.classList.add("active");
  }

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
    return d.toLocaleString();
  }

  function toast(message) {
    const el = document.createElement("div");
    el.textContent = message;
    el.style.cssText = `
      position: fixed;
      right: 16px;
      bottom: 16px;
      background: #0f172a;
      color: #fff;
      padding: 10px 14px;
      border-radius: 10px;
      box-shadow: 0 12px 30px rgba(0,0,0,.25);
      z-index: 2000;
    `;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1800);
  }
})();
