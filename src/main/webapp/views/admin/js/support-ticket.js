// Support Ticket View — now loads/saves via backend servlets (JS-only integration)
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  // ----- State -----
  let ticket = null; // local view model
  let ticketIdNumeric = null; // numeric id used for updates/uploads

  // ----- Utils -----
  function qp(name) {
    return new URLSearchParams(location.search).get(name);
  }

  function escapeHTML(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function toast(msg) {
    const el = $("#toast");
    if (!el) {
      alert(msg);
      return;
    }
    el.textContent = msg;
    el.classList.add("show");
    setTimeout(() => el.classList.remove("show"), 1800);
  }

  // Map backend ticket -> frontend ticket object (keep your UI fields)
  function mapBackendToUI(data) {
    const t = data.ticket;
    const imageIds = data.imageIds || [];

    // Build images array expected by renderImages()
    const images = imageIds.map((id) => ({
      imageId: id,
      name: `image_${id}.jpg`,
      url: `/support/ticket/image/get?imageId=${id}`,
    }));

    return {
      id: `TKT-${new Date().getFullYear()}-${String(t.ticketId).padStart(
        3,
        "0"
      )}`, // display
      ticketId: t.ticketId, // numeric
      subject: t.subject || "",
      priority: t.priority || "Low",
      status: t.status || "Open",
      dateCreated: t.createdAt || "",
      userRole: t.actorType || "",
      bookingId: t.bookingId || "",
      desc: t.description || "",
      images,
      adminNotes: t.adminNotes || "",
      // if you later return customer info from backend, fill here:
      customer: t.customer || null,
    };
  }

  // ----- API calls -----
  async function apiGetTicket(idParam) {
    const res = await fetch(
      `/support/ticket/get?id=${encodeURIComponent(idParam)}`,
      {
        method: "GET",
        headers: { Accept: "application/json" },
      }
    );
    const data = await res.json();
    if (!res.ok || data.status !== "success") {
      throw new Error(data.message || "Ticket load failed");
    }
    return data;
  }

  async function apiUpdateTicket(payload) {
    const res = await fetch(`/support/ticket/update`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok || data.status !== "success") {
      throw new Error(data.message || "Update failed");
    }
    return data;
  }

  async function apiUploadImages(ticketId, files) {
    const fd = new FormData();
    fd.append("ticketId", String(ticketId));
    files.forEach((f) => fd.append("images", f));

    const res = await fetch(`/support/ticket/image/upload`, {
      method: "POST",
      body: fd,
    });
    const data = await res.json();
    if (!res.ok || data.status !== "success") {
      throw new Error(data.message || "Image upload failed");
    }
    return data.imageIds || [];
  }

  async function apiDeleteImage(imageId) {
    const res = await fetch(`/support/ticket/image/delete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ imageId }),
    });
    const data = await res.json();
    if (!res.ok || data.status !== "success") {
      throw new Error(data.message || "Delete failed");
    }
    return true;
  }

  // ----- Render -----
  function render() {
    if (!ticket) return;

    $("#ticketId") && ($("#ticketId").textContent = ticket.id);
    $("#ticketSubject") &&
      ($("#ticketSubject").textContent = ticket.subject || "");
    $("#dateCreated") &&
      ($("#dateCreated").textContent = ticket.dateCreated || "");
    $("#roleValue") && ($("#roleValue").textContent = ticket.userRole || "");
    $("#bookingIdValue") &&
      ($("#bookingIdValue").textContent = ticket.bookingId || "");

    // selects
    if ($("#prioritySelect")) $("#prioritySelect").value = ticket.priority;
    if ($("#statusSelect")) $("#statusSelect").value = ticket.status;

    // textareas
    $("#descriptionInput") &&
      ($("#descriptionInput").value = ticket.desc || "");
    $("#adminNotesInput") &&
      ($("#adminNotesInput").value = ticket.adminNotes || "");

    setPriorityBadge(ticket.priority);
    setStatusBadge(ticket.status);
    renderImages(ticket.images || []);

    renderCustomer(ticket.customer);
  }

  function renderCustomer(c) {
    // If your HTML has customer fields, fill them safely
    // If not present, this does nothing.
    if (!c) return;
    $("#customerName") && ($("#customerName").textContent = c.name || "");
    $("#customerEmail") && ($("#customerEmail").textContent = c.email || "");
    $("#customerPhone") && ($("#customerPhone").textContent = c.phone || "");
    $("#customerRentals") &&
      ($("#customerRentals").textContent = String(c.rentals ?? ""));
  }

  function renderImages(list) {
    const grid = $("#imagesGrid");
    if (!grid) return;

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

      card.querySelector(".remove").addEventListener("click", async () => {
        try {
          // If it has imageId -> delete from DB
          if (img.imageId) {
            await apiDeleteImage(img.imageId);
          }
          ticket.images.splice(idx, 1);
          renderImages(ticket.images);
          toast("Image removed");
        } catch (e) {
          console.error(e);
          toast(e.message || "Failed to remove image");
        }
      });

      grid.insertBefore(card, $("#addImageCard"));
    });
  }

  function setPriorityBadge(p) {
    const el = $("#priorityBadge");
    if (!el) return;
    el.textContent = p;
    el.className =
      "priority-badge " +
      (p === "Urgent"
        ? "p-urgent"
        : p === "High"
        ? "p-high"
        : p === "Medium"
        ? "p-medium"
        : "p-low");
  }

  function setStatusBadge(s) {
    const el = $("#statusBadge");
    if (!el) return;
    el.textContent = s;
    el.className =
      "status-badge " +
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
    $("#prioritySelect")?.addEventListener("change", (e) => {
      ticket.priority = e.target.value;
      setPriorityBadge(ticket.priority);
    });

    $("#statusSelect")?.addEventListener("change", (e) => {
      ticket.status = e.target.value;
      setStatusBadge(ticket.status);
    });

    $("#saveBtn")?.addEventListener("click", async () => {
      try {
        ticket.desc = $("#descriptionInput")?.value.trim() || "";
        ticket.adminNotes = $("#adminNotesInput")?.value.trim() || "";

        // Your update servlet expects ALL fields (as-is approach)
        await apiUpdateTicket({
          ticketId: ticketIdNumeric,
          subject: ticket.subject,
          description: ticket.desc,
          adminNotes: ticket.adminNotes,
          status: ticket.status, // DB enum values
          priority: ticket.priority, // DB enum values
          bookingId: ticket.bookingId || null,
        });

        toast("Ticket updated");
      } catch (e) {
        console.error(e);
        toast(e.message || "Update failed");
      }
    });

    $("#imageInput")?.addEventListener("change", async (e) => {
      try {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        // Upload immediately
        const newIds = await apiUploadImages(ticketIdNumeric, files);

        // Add to UI list
        newIds.forEach((id) => {
          ticket.images.unshift({
            imageId: id,
            name: `image_${id}.jpg`,
            url: `/support/ticket/image/get?imageId=${id}`,
          });
        });

        renderImages(ticket.images);
        toast("Image uploaded");
      } catch (err) {
        console.error(err);
        toast(err.message || "Upload failed");
      } finally {
        e.target.value = "";
      }
    });

    $("#addImageCard")?.addEventListener("click", () =>
      $("#imageInput")?.click()
    );

    $("#actionEmail")?.addEventListener("click", () => {
      const email = ticket.customer?.email || "";
      window.location.href = `mailto:${email}?subject=Regarding Ticket ${encodeURIComponent(
        ticket.id
      )}`;
    });

    $("#actionFollowup")?.addEventListener("click", () => {
      toast("Follow-up scheduled (demo)");
    });
    $("#actionEscalate")?.addEventListener("click", () => {
      toast("Escalated (demo)");
    });
    $("#actionClose")?.addEventListener("click", () => {
      ticket.status = "Closed";
      $("#statusSelect").value = "Closed";
      setStatusBadge("Closed");
      toast("Marked Closed (click Save to persist)");
    });
  }

  // ----- Boot -----
  async function boot() {
    try {
      bindEvents();

      const id = qp("id");
      if (!id) {
        toast("Missing ticket id");
        return;
      }

      const data = await apiGetTicket(id);
      ticket = mapBackendToUI(data);
      ticketIdNumeric = ticket.ticketId;

      render();
    } catch (e) {
      console.error(e);
      toast(e.message || "Failed to load ticket");
    }
  }

  window.addEventListener("DOMContentLoaded", boot);
})();
