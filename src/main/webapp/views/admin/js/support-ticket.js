// Support Ticket View — loads by ?id=..., allows edits, persists to sessionStorage
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  // ----- Seed data (replace with API) -----
  const TICKETS = {
    "TKT-2024-001": {
      id: "TKT-2024-001",
      priority: "High",
      status: "In Progress",
      dateCreated: "2024-01-15 10:30 AM",
      userRole: "Customer",
      bookingId: "BK-2024-0156",
      desc: "Vehicle breakdown issue - Engine overheating during rental period. Customer was traveling from Colombo to Kandy when the issue occurred. Requesting immediate assistance and possible vehicle replacement.",
      images: [
        { name: "engine-issue-1.jpg" },
        { name: "dashboard-warning.jpg" },
      ],
      adminNotes:
        "Initial assessment completed. Contacted roadside assistance. Customer has been relocated to temporary accommodation. Replacement vehicle being arranged.",
      customer: {
        name: "John Perera",
        email: "john.perera@email.com",
        phone: "+94 77 123 4567",
        rentals: 12,
      },
    },
  };

  // ----- State -----
  let ticket = null;

  // ----- Init -----
  document.addEventListener("DOMContentLoaded", () => {
    if (document.querySelector(".sidebar"))
      document.body.classList.add("with-sidebar");

    const id = new URLSearchParams(location.search).get("id") || "TKT-2024-001";
    ticket = loadTicket(id) || TICKETS[id];
    if (!ticket) {
      renderEmpty(`Ticket not found for id ${id}`);
      return;
    }

    populate(ticket);
    bindEvents();
  });

  // ----- Render -----
  function populate(t) {
    // header
    $("#ticketId").textContent = t.id;
    setPriorityBadge(t.priority);
    setStatusBadge(t.status);

    // meta
    $("#dateCreated").textContent = t.dateCreated;
    $("#userRole").textContent = t.userRole;
    $("#bookingId").textContent = t.bookingId;

    // left panels
    $("#descriptionInput").value = t.desc || "";
    $("#adminNotesInput").value = t.adminNotes || "";
    renderImages(t.images || []);

    // right side
    $("#prioritySelect").value = t.priority;
    $("#statusSelect").value = t.status;

    // customer
    $("#custName").textContent = t.customer?.name || "—";
    $("#custEmail").textContent = t.customer?.email || "—";
    $("#custPhone").textContent = t.customer?.phone || "—";
    $("#custRentals").textContent =
      (t.customer?.rentals ?? "—") +
      (t.customer?.rentals != null ? " rentals" : "");
  }

  function renderImages(list) {
    const grid = $("#imagesGrid");
    grid
      .querySelectorAll(".image-card[data-kind='img']")
      .forEach((n) => n.remove());

    list.forEach((img, idx) => {
      const card = document.createElement("div");
      card.className = "image-card";
      card.dataset.kind = "img";
      card.innerHTML = `
        <button class="remove" title="Remove">×</button>
        <div class="image-icon"><img alt="" class="image-thumb" src="${
          img.url || ""
        }" onerror="this.replaceWith(document.createTextNode('🖼️'))"></div>
        <div class="image-name">${escapeHTML(img.name || "image")}</div>
      `;
      card.querySelector(".remove").addEventListener("click", () => {
        ticket.images.splice(idx, 1);
        renderImages(ticket.images);
        saveTicket(ticket);
        toast("Image removed");
      });
      grid.insertBefore(card, $("#addImageCard"));
    });
  }

  function setPriorityBadge(p) {
    const el = $("#priorityBadge");
    el.textContent = p;
    el.className =
      "badge " +
      (p === "Low"
        ? "pri-low"
        : p === "Medium"
        ? "pri-medium"
        : p === "High"
        ? "pri-high"
        : p === "Urgent"
        ? "pri-urgent"
        : "");
  }
  function setStatusBadge(s) {
    const el = $("#statusBadge");
    el.textContent = s;
    el.className =
      "badge " +
      (s === "Open"
        ? "st-open"
        : s === "In Progress"
        ? "st-progress"
        : s === "Resolved"
        ? "st-resolved"
        : s === "Closed"
        ? "st-closed"
        : "");
  }

  // ----- Events -----
  function bindEvents() {
    $("#prioritySelect").addEventListener("change", (e) => {
      ticket.priority = e.target.value;
      setPriorityBadge(ticket.priority);
    });
    $("#statusSelect").addEventListener("change", (e) => {
      ticket.status = e.target.value;
      setStatusBadge(ticket.status);
    });

    $("#saveBtn").addEventListener("click", () => {
      ticket.desc = $("#descriptionInput").value.trim();
      ticket.adminNotes = $("#adminNotesInput").value.trim();
      saveTicket(ticket);
      toast("Ticket saved");
    });

    $("#imageInput").addEventListener("change", async (e) => {
      const files = Array.from(e.target.files || []);
      if (!files.length) return;
      for (const f of files) {
        // For demo we keep just the name; you can also store base64 for persistence
        ticket.images.push({ name: f.name, url: URL.createObjectURL(f) });
      }
      renderImages(ticket.images);
      saveTicket(ticket);
      e.target.value = "";
    });

    $("#addImageCard").addEventListener("click", () =>
      $("#imageInput").click()
    );

    $("#actionEmail").addEventListener("click", () => {
      const email = ticket.customer?.email || "";
      window.location.href = `mailto:${email}?subject=Regarding Ticket ${encodeURIComponent(
        ticket.id
      )}`;
    });
    $("#actionFollowup").addEventListener("click", () => {
      toast("Follow-up scheduled (demo)");
    });
    $("#actionEscalate").addEventListener("click", () => {
      toast("Escalated to manager (demo)");
    });
    $("#actionClose").addEventListener("click", () => {
      ticket.status = "Closed";
      $("#statusSelect").value = "Closed";
      setStatusBadge("Closed");
      saveTicket(ticket);
      toast("Ticket closed");
    });
  }

  // ----- Storage -----
  function keyFor(id) {
    return `rm_ticket_${id}`;
  }
  function loadTicket(id) {
    try {
      return JSON.parse(sessionStorage.getItem(keyFor(id)));
    } catch {
      return null;
    }
  }
  function saveTicket(t) {
    sessionStorage.setItem(keyFor(t.id), JSON.stringify(t));
  }

  // ----- Utils -----
  function renderEmpty(msg) {
    $(
      ".main-content"
    ).innerHTML = `<div class="card" style="text-align:center"><p>${escapeHTML(
      msg
    )}</p><p><a href="support-ticket-view.html">Back to tickets</a></p></div>`;
  }
  function escapeHTML(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }
  function toast(message) {
    const el = document.createElement("div");
    el.textContent = message;
    el.style.cssText = `position:fixed;right:16px;bottom:16px;background:#0f172a;color:#fff;padding:10px 14px;border-radius:10px;box-shadow:0 12px 30px rgba(0,0,0,.25);z-index:2000;`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1600);
  }
})();
