// Minimal, read-only single-report renderer (same pattern/feel as tickets).
(function () {
  const $ = (s, r = document) => r.querySelector(s);

  // Seed data (now includes 007 & 008)
  const REPORTS = {
    "RPT-2024-001": {
      id: "RPT-2024-001",
      subject: "Vehicle breakdown during trip",
      category: "Vehicle Issue",
      status: "Pending",
      dateCreated: "2024-01-15 10:30 AM",
      reportedRole: "Driver",
      priority: "High",
      desc: "Vehicle breakdown - Engine overheating during rental. Driver reported loss of power near Kadawatha.",
      images: [{ name: "engine-temp.jpg" }, { name: "tow-truck.jpg" }],
      reporter: {
        name: "John Smith",
        email: "john@example.com",
        phone: "+94 77 111 2222",
      },
    },
    "RPT-2024-002": {
      id: "RPT-2024-002",
      subject: "Inappropriate behavior",
      category: "User Behavior",
      status: "Reviewed",
      dateCreated: "2024-01-14 09:12 AM",
      reportedRole: "Customer",
      priority: "Medium",
      desc: "Driver reported verbally abusive behavior by customer during return. Account flagged for monitoring.",
      images: [],
      reporter: {
        name: "Chanuka Perera",
        email: "chanuka@example.com",
        phone: "+94 71 987 6543",
      },
    },
    "RPT-2024-003": {
      id: "RPT-2024-003",
      subject: "Payment not processed",
      category: "Payment Issue",
      status: "Resolved",
      dateCreated: "2024-01-13 01:22 PM",
      reportedRole: "Customer",
      priority: "Low",
      desc: "Customer claims payment failed but card was charged. Refund issued after reconciliation.",
      images: [{ name: "transaction-receipt.png" }],
      reporter: {
        name: "Meera Jay",
        email: "meera@example.com",
        phone: "+94 76 555 1234",
      },
    },
    "RPT-2024-004": {
      id: "RPT-2024-004",
      subject: "Unsafe driving reported",
      category: "Safety Concern",
      status: "Pending",
      dateCreated: "2024-01-12 05:40 PM",
      reportedRole: "Driver",
      priority: "High",
      desc: "Multiple users reported speeding and frequent lane changes on E03.",
      images: [],
      reporter: { name: "Anonymous", email: "", phone: "" },
    },
    "RPT-2024-005": {
      id: "RPT-2024-005",
      subject: "App crashes on booking",
      category: "App Bug",
      status: "Reviewed",
      dateCreated: "2024-01-11 08:00 AM",
      reportedRole: "Customer",
      priority: "Medium",
      desc: "Crash on booking confirm (Android 12). Likely permissions issue; logged to backlog.",
      images: [{ name: "android-stacktrace.txt" }],
      reporter: {
        name: "Supun Fernando",
        email: "supun@example.com",
        phone: "+94 77 222 3333",
      },
    },
    "RPT-2024-006": {
      id: "RPT-2024-006",
      subject: "Vehicle cleanliness complaint",
      category: "Vehicle Issue",
      status: "Resolved",
      dateCreated: "2024-01-10 03:15 PM",
      reportedRole: "Driver",
      priority: "Low",
      desc: "Interior not cleaned before pickup. Apology and credit issued; SOP refreshed.",
      images: [{ name: "seat-stain.jpg" }],
      reporter: {
        name: "Ishara N.",
        email: "ishara@example.com",
        phone: "+94 71 123 0000",
      },
    },

    // NEW:
    "RPT-2024-007": {
      id: "RPT-2024-007",
      subject: "Brake light not working",
      category: "Vehicle Issue",
      status: "Pending",
      dateCreated: "2024-01-09 02:45 PM",
      reportedRole: "Driver",
      priority: "Medium",
      desc: "Rear left brake light not functioning during pre-trip check. Needs bulb or wiring inspection.",
      images: [{ name: "rear-lamp.jpg" }],
      reporter: {
        name: "Dilshan K.",
        email: "dilshan@example.com",
        phone: "+94 71 234 5678",
      },
    },
    "RPT-2024-008": {
      id: "RPT-2024-008",
      subject: "Refund not reflected",
      category: "Payment Issue",
      status: "Reviewed",
      dateCreated: "2024-01-08 11:10 AM",
      reportedRole: "Customer",
      priority: "High",
      desc: "Customer says refund email received but balance not updated in wallet. Check gateway settlement.",
      images: [{ name: "refund-mail.png" }],
      reporter: {
        name: "Tharushi P.",
        email: "tharushi@example.com",
        phone: "+94 76 888 1212",
      },
    },
  };

  document.addEventListener("DOMContentLoaded", () => {
    const id = new URLSearchParams(location.search).get("id") || "RPT-2024-001";
    const r = REPORTS[id];
    if (!r) return renderEmpty(id);

    // Header+badges
    $("#subjectText").textContent = r.subject;
    $("#reportId").textContent = r.id;
    setChip("#categoryChip", r.category);
    setBadge("#priorityBadge", r.priority, {
      Low: "pri-low",
      Medium: "pri-medium",
      High: "pri-high",
      Urgent: "pri-urgent",
    });
    setBadge("#statusBadge", r.status, {
      Pending: "st-pending",
      Reviewed: "st-reviewed",
      Resolved: "st-resolved",
      Closed: "st-closed",
    });

    // Meta
    $("#dateCreated").textContent = r.dateCreated || "—";
    $("#reportedRole").textContent = r.reportedRole || "—";

    // Description
    $("#descriptionText").textContent = r.desc || "—";

    // Reporter
    $("#repName").textContent = r.reporter?.name || "—";
    $("#repName2").textContent = r.reporter?.name || "—";
    $("#repEmail").textContent = r.reporter?.email || "—";
    $("#repPhone").textContent = r.reporter?.phone || "—";

    // Images
    const grid = $("#imagesGrid");
    grid.innerHTML = "";
    (r.images || []).forEach((img) => {
      const card = document.createElement("div");
      card.className = "image-card";
      card.innerHTML = `<div>🖼️</div><div class="image-name">${escapeHTML(
        img.name || "image"
      )}</div>`;
      grid.appendChild(card);
    });
    if ((r.images || []).length === 0) {
      const card = document.createElement("div");
      card.className = "image-card";
      card.innerHTML = `<div>—</div><div class="image-name">No attachments</div>`;
      grid.appendChild(card);
    }
  });

  function setBadge(sel, text, map) {
    const el = $(sel);
    el.textContent = text;
    el.className = "badge " + (map[text] || "");
  }
  function setChip(sel, text) {
    const el = $(sel);
    el.textContent = text;
    el.className = "badge";
  }
  function renderEmpty(id) {
    document.querySelector(
      ".main-content"
    ).innerHTML = `<div class="card" style="text-align:center"><p>Report not found for id <b>${escapeHTML(
      id
    )}</b></p>
        <p><a href="report-view.html">Back to Reports</a></p></div>`;
  }
  function escapeHTML(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }
})();
