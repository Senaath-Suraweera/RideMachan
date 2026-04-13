(function () {
  const $ = (s, root = document) => root.querySelector(s);

  const REQUESTS_API = "/api/admin/rental-company-requests";

  document.addEventListener("DOMContentLoaded", async () => {
    if (document.querySelector(".sidebar")) {
      document.body.classList.add("with-sidebar");
    }

    const { requestId, requestStatus } = getParams();

    let request = getSavedRequest();

    if (!request || Number(request.id) !== requestId) {
      request = await fetchRequestById(requestId, requestStatus);
    }

    if (!request) {
      renderEmpty(
        'Request not found. <a href="rental-company-requests.html">Back to Requests</a>',
      );
      hideActionButtons();
      return;
    }

    render(request);
    wireActions(request);
  });

  function getParams() {
    const q = new URLSearchParams(location.search);
    const requestId = Number(q.get("requestId"));
    const requestStatus = (q.get("requestStatus") || "").trim().toUpperCase();

    return {
      requestId: Number.isFinite(requestId) ? requestId : null,
      requestStatus: requestStatus || "PENDING",
    };
  }

  function getSavedRequest() {
    try {
      const raw = sessionStorage.getItem("selectedRequest");
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  async function fetchRequestById(requestId, status) {
    if (!requestId) return null;

    const statusesToTry = uniqueStatuses([
      status,
      "PENDING",
      "REJECTED",
      "APPROVED",
    ]);

    for (const currentStatus of statusesToTry) {
      try {
        const res = await fetch(
          `${REQUESTS_API}?status=${encodeURIComponent(currentStatus)}`,
          { headers: { Accept: "application/json" } },
        );

        if (!res.ok) continue;

        const json = await res.json();
        const data = Array.isArray(json.data) ? json.data : [];
        const found = data.find(
          (item) => Number(item.id) === Number(requestId),
        );

        if (found) {
          return normalizeRequest(found);
        }
      } catch (e) {
        console.error("Failed to fetch request list:", e);
      }
    }

    return null;
  }

  function uniqueStatuses(values) {
    return [...new Set(values.filter(Boolean))];
  }

  function normalizeRequest(r) {
    return {
      id: Number(r.id),
      name: (r.name ?? "").trim(),
      email: (r.email ?? "").trim(),
      phone: (r.phone ?? "").trim(),
      city: (r.city ?? "").trim(),
      registrationnumber: (r.registrationnumber ?? "").trim(),
      description: (r.description ?? "").trim(),
      terms: (r.terms ?? "").trim(),
      status: (r.status ?? "PENDING").trim(),
      submittedRaw: r.submitted ?? "",
      submitted: formatDateTime(r.submitted ?? ""),
    };
  }

  function render(req) {
    const mount = $("#requestView");
    if (!mount) return;

    const initials = String(req.name || "")
      .split(/\s+/)
      .filter(Boolean)
      .map((p) => p[0] || "")
      .join("")
      .slice(0, 2)
      .toUpperCase();

    const statusClass = String(req.status || "PENDING").toLowerCase();

    mount.innerHTML = `
      <section class="profile-header">
        <div class="profile-logo">${escapeHTML(initials || "RC")}</div>
        <div class="profile-info">
          <h2>${escapeHTML(req.name || "Rental Company Request")}</h2>
          <div class="profile-subtext">
            <span class="status-badge ${statusClass}">${escapeHTML(req.status || "PENDING")}</span>
            <span>Request ID: #${escapeHTML(String(req.id || ""))}</span>
          </div>
          <div class="profile-description">
            Submitted on ${escapeHTML(req.submitted || "—")}
          </div>
        </div>
      </section>

      <section class="info-grid">
        <div class="info-section">
          <h3>Company Details</h3>
          <div class="info-item">
            <span class="info-label">Company Name</span>
            <span class="info-value">${escapeHTML(req.name || "—")}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Registration No</span>
            <span class="info-value">${escapeHTML(req.registrationnumber || "—")}</span>
          </div>
          <div class="info-item">
            <span class="info-label">City</span>
            <span class="info-value">${escapeHTML(req.city || "—")}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Status</span>
            <span class="info-value">${escapeHTML(req.status || "—")}</span>
          </div>
        </div>

        <div class="info-section">
          <h3>Contact Details</h3>
          <div class="info-item">
            <span class="info-label">Email</span>
            <span class="info-value">${req.email ? `<a href="mailto:${escapeAttr(req.email)}">${escapeHTML(req.email)}</a>` : "—"}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Phone</span>
            <span class="info-value">${escapeHTML(req.phone || "—")}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Submitted</span>
            <span class="info-value">${escapeHTML(req.submitted || "—")}</span>
          </div>
        </div>
      </section>

      <section class="content-card">
        <h3>Description</h3>
        <div class="content-placeholder">${escapeHTML(req.description || "No description provided.")}</div>
      </section>

      <section class="content-card">
        <h3>Terms</h3>
        <div class="content-placeholder">${escapeHTML(req.terms || "No terms provided.")}</div>
      </section>
    `;

    if (req.status !== "PENDING") {
      hideActionButtons();
    }
  }

  function wireActions(req) {
    const approveBtn = $("#approveRequestBtn");
    const rejectBtn = $("#rejectRequestBtn");

    if (!approveBtn || !rejectBtn) return;
    if (req.status !== "PENDING") return;

    approveBtn.addEventListener("click", async () => {
      approveBtn.disabled = true;
      rejectBtn.disabled = true;

      try {
        const result = await approveRequest(req.id);
        toast(
          `Approved: ${req.name || "Company"} (Company ID: ${result.companyid})`,
        );
        sessionStorage.removeItem("selectedRequest");
        location.href = "rental-company-requests.html";
      } catch (err) {
        console.error(err);
        alert(err.message || "Approve failed");
        approveBtn.disabled = false;
        rejectBtn.disabled = false;
      }
    });

    rejectBtn.addEventListener("click", async () => {
      const reason = prompt(
        `Reject request from "${req.name || "this company"}"?\nEnter reason (optional):`,
      );
      if (reason === null) return;

      approveBtn.disabled = true;
      rejectBtn.disabled = true;

      try {
        await rejectRequest(req.id, reason);
        toast(`Rejected: ${req.name || "Company"}`);
        sessionStorage.removeItem("selectedRequest");
        location.href = "rental-company-requests.html";
      } catch (err) {
        console.error(err);
        alert(err.message || "Reject failed");
        approveBtn.disabled = false;
        rejectBtn.disabled = false;
      }
    });
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

    const res = await fetch(
      `/api/admin/rental-company-requests/approve?id=${encodeURIComponent(
        requestId,
      )}&adminId=${encodeURIComponent(adminId)}`,
      {
        method: "POST",
        headers: { Accept: "application/json" },
      },
    );

    const json = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(json?.message || `Approve failed (${res.status})`);
    }

    return json;
  }

  async function rejectRequest(requestId, reason) {
    const adminId = getAdminId();

    const res = await fetch(
      `/api/admin/rental-company-requests/reject?id=${encodeURIComponent(
        requestId,
      )}&adminId=${encodeURIComponent(adminId)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ reason: reason || "" }),
      },
    );

    const json = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(json?.message || `Reject failed (${res.status})`);
    }

    return json;
  }

  function hideActionButtons() {
    const actions = $("#topbarActions");
    if (actions) {
      actions.style.display = "none";
    }
  }

  function renderEmpty(message) {
    const mount = $("#requestView");
    if (!mount) return;

    mount.innerHTML = `
      <div class="empty-state">${message}</div>
    `;
  }

  function formatDateTime(raw) {
    const t = Date.parse(raw);
    if (!Number.isFinite(t)) return raw ? String(raw) : "";
    return new Date(t).toLocaleString();
  }

  function escapeHTML(s) {
    return String(s || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function escapeAttr(s) {
    return String(s || "")
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;")
      .replaceAll("<", "&lt;");
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
