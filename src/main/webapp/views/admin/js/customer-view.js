// customer-view.js
(function () {
  // ---- Local canonical dataset (fallback if sessionStorage doesn't have it) ----
  const DATA = [
    {
      id: 1,
      name: "John Doe",
      nic: "123456789V",
      email: "john.doe@email.com",
      phone: "+94 77 123 4567",
      joinDate: "2023-01-15",
      bookings: 25,
      location: "Colombo",
      rating: 4.8,
      reviews: 18,
      status: "active",
      description: "Frequent customer with excellent payment history",
    },
    {
      id: 2,
      name: "Michael Chen",
      nic: "987654321V",
      email: "michael.chen@email.com",
      phone: "+94 71 555 0123",
      joinDate: "2023-11-10",
      bookings: 8,
      location: "Galle",
      rating: 4.2,
      reviews: 5,
      status: "active",
      description: "New customer showing promising booking patterns",
    },
    {
      id: 3,
      name: "Sarah Johnson",
      nic: "456789123V",
      email: "sarah.j@email.com",
      phone: "+94 76 987 6543",
      joinDate: "2023-09-22",
      bookings: 12,
      location: "Kandy",
      rating: 4.6,
      reviews: 8,
      status: "active",
      description: "Reliable customer, always on time for pickups",
    },
    // ... (same shape as your customers seed)
  ];

  const DEFAULTS = {
    id: 0,
    name: "—",
    nic: "—",
    email: "—",
    phone: "—",
    joinDate: "—",
    bookings: 0,
    location: "—",
    rating: 0,
    reviews: 0,
    status: "—",
    description: "—",
  };

  const $ = (s) => document.querySelector(s);
  const esc = (s) =>
    String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  const q = new URLSearchParams(location.search);
  const id = Number(q.get("id"));

  function getNormalizedCustomer(id) {
    const base = DATA.find((c) => c.id === id) || null;

    let saved = null;
    try {
      const raw = sessionStorage.getItem("selectedCustomer");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Number(parsed.id) === id) saved = parsed;
      }
    } catch (_) {}

    if (!base && !saved) return null;
    return { ...DEFAULTS, ...(base || {}), ...(saved || {}) };
  }

  function initials(n) {
    return String(n)
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
    mount.innerHTML = `
      <div class="profile-header">
        <div class="profile-avatar"><span>${esc(initials(c.name))}</span></div>
        <div class="profile-basic">
          <h2>${esc(c.name)}</h2>
          <div class="profile-meta">
            <span>📍 ${esc(c.location)}</span>
            <span>📅 Joined ${esc(c.joinDate)}</span>
            <span>🚗 ${Number(c.bookings) || 0} bookings</span>
            <span>⭐ ${(Number(c.rating) || 0).toFixed(1)} (${
      Number(c.reviews) || 0
    } reviews)</span>
          </div>
          <div class="profile-desc">${esc(c.description)}</div>
        </div>
        <div class="profile-contact">
          <div>📞 ${esc(c.phone)}</div>
          <div>📧 ${esc(c.email)}</div>
          <div class="status-badge ${
            c.status === "inactive" ? "status-inactive" : ""
          }">
            ${esc(String(c.status).toUpperCase())}
          </div>
        </div>
      </div>
    `;

    // Load the two booking pages with context
    const qs = new URLSearchParams({
      customerId: String(c.id),
      customerName: c.name,
    });
    $("#ongoingFrame").src = `ongoing-bookings.html?${qs}`;
    $("#pastFrame").src = `past-bookings.html?${qs}`;
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

  document.addEventListener("DOMContentLoaded", () => {
    if (!Number.isFinite(id)) {
      $(
        "#customerView"
      ).innerHTML = `<p style="margin:0;color:#374151;">Missing customer id.</p>`;
      return;
    }
    const customer = getNormalizedCustomer(id);
    if (!customer) {
      $(
        "#customerView"
      ).innerHTML = `<p style="margin:0;color:#374151;">Customer not found for id ${esc(
        id
      )}.</p>`;
      return;
    }
    render(customer);
    wireTabs();

    // --- Back Button ---
    document
      .getElementById("backToCustomersBtn")
      ?.addEventListener("click", () => {
        window.location.href = "customers.html";
      });
  });
})();
