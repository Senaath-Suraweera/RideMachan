// report.js (CONNECTED TO BACKEND) - matches report.html IDs
(() => {
  const $ = (s, r = document) => r.querySelector(s);

  function qp(name) {
    return new URLSearchParams(location.search).get(name);
  }

  function escapeHTML(str) {
    return String(str ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function toDisplayId(reportId) {
    const year = new Date().getFullYear();
    return `RPT-${year}-${String(reportId).padStart(3, "0")}`;
  }

  function formatDate(ts) {
    if (!ts) return "—";
    return String(ts).replace("T", " ").replace(".000Z", "");
  }

  function setBadge(el, text, cls) {
    if (!el) return;
    el.textContent = text || "—";
    el.className = cls;
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
    return data; // {report, imageIds}
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
    if (!res.ok || data.status !== "success")
      throw new Error(data.message || "Update failed");
    return data;
  }

  async function apiDeleteReport(reportId) {
    const res = await fetch(`/report/delete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ reportId }),
    });
    const data = await res.json();
    if (!res.ok || data.status !== "success")
      throw new Error(data.message || "Delete failed");
    return data;
  }

  function renderImages(imageIds) {
    const grid = $("#imagesGrid");
    if (!grid) return;

    grid.innerHTML = "";

    if (!imageIds || !imageIds.length) {
      grid.innerHTML = `<div class="muted">No evidence uploaded.</div>`;
      return;
    }

    imageIds.forEach((imgId) => {
      const url = `/report/image/get?imageId=${imgId}`;
      const card = document.createElement("a");
      card.href = url;
      card.target = "_blank";
      card.rel = "noopener";
      card.className = "img-card";
      card.innerHTML = `
        <div class="img-icn">🖼️</div>
        <div class="img-name">Evidence #${escapeHTML(imgId)}</div>
      `;
      grid.appendChild(card);
    });
  }

  async function boot() {
    try {
      const id = qp("id");
      if (!id) {
        alert("Missing report id");
        return;
      }

      const data = await apiGetReport(id);
      const r = data.report;
      const imageIds = data.imageIds || [];

      $("#subjectText").textContent = r.subject || "—";
      $("#reportId").textContent = toDisplayId(r.reportId);

      // category chip
      $("#categoryChip").textContent = (r.category || "—").toUpperCase();

      // badges (classes come from your report.css)
      setBadge(
        $("#priorityBadge"),
        r.priority,
        `badge pri-${String(r.priority || "Low").toLowerCase()}`
      );
      setBadge(
        $("#statusBadge"),
        r.status,
        `badge st-${String(r.status || "Pending").toLowerCase()}`
      );

      // set dropdown values from DB values
      $("#statusSelect").value = r.status || "Pending";
      $("#prioritySelect").value = r.priority || "Low";

      $("#saveBtn").addEventListener("click", async () => {
        try {
          const newStatus = $("#statusSelect").value;
          const newPriority = $("#prioritySelect").value;

          await apiUpdateReport(r.reportId, newStatus, newPriority);

          // update the badges immediately
          $("#statusBadge").textContent = newStatus;
          $("#priorityBadge").textContent = newPriority;

          alert("Updated!");
        } catch (e) {
          alert(e.message || "Update failed");
        }
      });

      $("#deleteBtn").addEventListener("click", async () => {
        if (!confirm("Delete this report permanently?")) return;
        try {
          await apiDeleteReport(r.reportId);
          alert("Deleted!");
          window.location.href = "report-view.html";
        } catch (e) {
          alert(e.message || "Delete failed");
        }
      });

      $("#dateCreated").textContent = formatDate(r.createdAt);
      $("#reportedRole").textContent = `${r.reportedRole || "—"} (ID: ${
        r.reportedId ?? "—"
      })`;

      $("#repName").textContent = r.reporterName || "—";
      $("#repName2").textContent = r.reporterName || "—";
      $("#repEmail").textContent = r.reporterEmail || "—";
      $("#repPhone").textContent = r.reporterPhone || "—";

      $("#descriptionText").textContent = r.description || "—";

      renderImages(imageIds);
    } catch (e) {
      console.error(e);
      alert(e.message || "Failed to load report");
    }
  }

  window.addEventListener("DOMContentLoaded", boot);
})();
