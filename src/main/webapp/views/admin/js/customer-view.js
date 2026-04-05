// js/customer-view.js  (API-wired version)
(function () {
  const API_BASE = "/api/admin/customers";

  const $ = (s) => document.querySelector(s);
  const esc = (s) =>
    String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");

  const q = new URLSearchParams(location.search);
  const id = Number(q.get("id"));

  function initials(n) {
    return String(n || "—")
      .trim()
      .split(/\s+/)
      .map((p) => p[0] || "")
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  function render(c) {
    const mount = $("#customerView");
    if (!mount) return;

    const status = String(c.status || "—").toLowerCase();
    const joined = c.joinDate || "—";

    mount.innerHTML = `
      <div class="profile-header">
        <div class="profile-avatar"><span>${esc(initials(c.name))}</span></div>
        <div class="profile-basic">
          <h2>${esc(c.name || "—")}</h2>
          <div class="profile-meta">
            <span>📍 ${esc(c.location || "—")}</span>
            <span>📅 Joined ${esc(joined)}</span>
            <span>🚗 ${Number(c.bookings) || 0} bookings</span>
            <span>⭐ ${(Number(c.rating) || 0).toFixed(1)} (${Number(c.reviews) || 0} reviews)</span>
          </div>
          <div class="profile-desc">${esc(c.description || "—")}</div>
        </div>
        <div class="profile-contact">
          <div>📞 ${esc(c.phone || "—")}</div>
          <div>📧 ${esc(c.email || "—")}</div>
          <div class="status-badge ${
            status === "inactive" ? "status-inactive" : ""
          }">
            ${esc(status.toUpperCase())}
          </div>
        </div>
      </div>
    `;

    // Load iframe pages with the customerId (your existing flow)
    // NOTE: Your booking iframe pages must call admin bookings endpoints in their JS.
    const qs = new URLSearchParams({
      customerId: String(c.id),
      customerName: c.name || "",
    });

    $("#ongoingFrame").src = `ongoing-bookings.html?${qs.toString()}`;
    $("#pastFrame").src = `past-bookings.html?${qs.toString()}`;

    // Ban button wiring
    wireBanButton(c);
  }

  async function fetchCustomer(customerId) {
    const res = await fetch(`${API_BASE}/${customerId}`, {
      credentials: "include",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  function wireTabs() {
    const tabs = document.querySelectorAll(".tab");
    const panels = {
      ongoing: document.getElementById("panel-ongoing"),
      past: document.getElementById("panel-past"),
    };

    tabs.forEach((btn) => {
      btn.addEventListener("click", () => {
        tabs.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        const key = btn.getAttribute("data-tab");
        Object.values(panels).forEach((p) => p.classList.remove("active"));
        panels[key]?.classList.add("active");
      });
    });
  }

  function toast(message) {
    const el = document.createElement("div");
    el.textContent = message;
    el.style.cssText = `position:fixed;right:16px;bottom:16px;background:#2c3e50;color:#fff;padding:10px 14px;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,.2);z-index:1001;`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2200);
  }

  function wireBanButton(customer) {
    const btn = document.getElementById("banCustomerBtn");
    if (!btn) return;

    const isBanned = String(customer.status || "").toLowerCase() === "banned";
    btn.textContent = isBanned ? "Unban Customer" : "Ban Customer";

    btn.onclick = async () => {
      try {
        const next = isBanned ? "active" : "banned";

        const res = await fetch(`${API_BASE}/${customer.id}/status`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ status: next }),
        });

        const out = await res.json().catch(() => ({}));
        if (!res.ok || !out.success) {
          throw new Error(out.error || `HTTP ${res.status}`);
        }

        toast(next === "banned" ? "Customer banned" : "Customer unbanned");
        // refresh view
        const fresh = await fetchCustomer(customer.id);
        render(fresh);
      } catch (e) {
        console.error(e);
        toast("Failed to update status");
      }
    };
  }

  document.addEventListener("DOMContentLoaded", async () => {
    // back button
    document
      .getElementById("backToCustomersBtn")
      ?.addEventListener("click", () => {
        window.location.href = "customers.html";
      });

    if (!Number.isFinite(id)) {
      $("#customerView").innerHTML =
        `<p style="margin:0;color:#374151;">Missing customer id.</p>`;
      return;
    }

    try {
      // Prefer server truth
      const customer = await fetchCustomer(id);
      render(customer);
      wireTabs();
    } catch (e) {
      console.error(e);
      $("#customerView").innerHTML =
        `<p style="margin:0;color:#b91c1c;">Failed to load customer ${esc(
          id,
        )}. Check session/login and API.</p>`;
    }
  });
})();
