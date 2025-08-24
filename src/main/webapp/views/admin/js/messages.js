(function () {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // --- Simple in-memory + session persistence store ---
  const STORE_KEY = "rm_messages_store_v1";
  let store = loadStore() || seedStore();

  // Track UI state
  let currentContactId = null;
  const chatUI = {
    placeholder: $(".conversation-placeholder"),
    chat: $("#chatInterface"),
    list: $("#chatMessages"),
    input: $("#messageInput"),
    headerName: $("#chatContactName"),
    headerStatus: $("#chatContactStatus"),
    headerAvatar: $("#chatAvatarText"),
  };

  // Init on DOM ready
  document.addEventListener("DOMContentLoaded", () => {
    // Auto-select last opened or the .active item
    const last = sessionStorage.getItem("rm_last_contact");
    const firstActive = $(".contact-item.active");
    const firstAny = $(".contact-item");

    if (last && $(`.contact-item[data-contact="${last}"]`)) {
      selectContact(last);
    } else if (firstActive) {
      selectContact(firstActive.dataset.contact);
    } else if (firstAny) {
      selectContact(firstAny.dataset.contact);
    }
  });

  /* =======================
   * Public functions (used by inline HTML handlers)
   * ======================= */

  window.filterMessages = function (tab) {
    // Set active tab UI
    $$(".message-tabs .tab-btn").forEach((b) =>
      b.classList.toggle("active", b.dataset.tab === tab)
    );

    // Show all categories by default
    $$(".category-section").forEach((sec) => (sec.style.display = ""));

    if (tab === "users") {
      // Only Admins + Drivers groups visible
      $$(".category-section").forEach((sec) => {
        const title =
          $(".category-title", sec)?.textContent?.trim().toLowerCase() || "";
        const isUserGroup = title === "admins" || title === "drivers";
        sec.style.display = isUserGroup ? "" : "none";
      });
    }
  };

  // Single button cycles through: all → unread → read
  let readMode = "all";
  window.filterByRead = function () {
    readMode =
      readMode === "all" ? "unread" : readMode === "unread" ? "read" : "all";
    const btn = $(".read-filter .filter-btn");
    if (btn) {
      btn.textContent =
        readMode === "all"
          ? "Read/Unread Logins"
          : readMode === "unread"
          ? "Unread only"
          : "Read only";
    }

    $$(".contact-item").forEach((item) => {
      const hasUnread = !!$(".unread-badge", item);
      item.style.display =
        readMode === "all"
          ? ""
          : readMode === "unread"
          ? hasUnread
            ? ""
            : "none"
          : !hasUnread
          ? ""
          : "none";
    });
  };

  window.selectContact = function (contactId) {
    const item = $(`.contact-item[data-contact="${contactId}"]`);
    if (!item) return;

    // Mark active
    $$(".contact-item").forEach((el) => el.classList.remove("active"));
    item.classList.add("active");

    // Hide unread badge (mark as read)
    const badge = $(".unread-badge", item);
    if (badge) badge.remove();

    // Populate header from DOM
    const name = $(".contact-name", item)?.textContent?.trim() || "Unknown";
    const isOnline = $(".contact-status", item)?.classList.contains("online");
    chatUI.headerName.textContent = name;
    chatUI.headerStatus.textContent = isOnline ? "Online" : "Offline";
    chatUI.headerAvatar.textContent = initials(name);

    // Show chat UI
    chatUI.placeholder.style.display = "none";
    chatUI.chat.style.display = "grid";

    // Render messages
    currentContactId = contactId;
    sessionStorage.setItem("rm_last_contact", currentContactId);
    renderMessages(contactId);
  };

  window.sendMessage = function () {
    if (!currentContactId) return;
    const text = (chatUI.input.value || "").trim();
    if (!text) return;

    const msg = {
      from: "me",
      text,
      at: Date.now(),
    };
    ensureThread(currentContactId).push(msg);
    saveStore();

    chatUI.input.value = "";
    appendMessage(msg);
    scrollToBottom();
  };

  window.handleEnterKey = function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      window.sendMessage();
    }
  };

  window.clearChat = function () {
    if (!currentContactId) return;
    store.threads[currentContactId] = [];
    saveStore();
    chatUI.list.innerHTML = "";
  };

  window.archiveChat = function () {
    // Simple visual confirmation (you can replace with real API call)
    toast("Conversation archived");
  };

  /* =======================
   * Internal helpers
   * ======================= */

  function renderMessages(contactId) {
    const msgs = ensureThread(contactId);
    chatUI.list.innerHTML = "";
    msgs.forEach(appendMessage);
    scrollToBottom();
  }

  function appendMessage(m) {
    const bubble = document.createElement("div");
    bubble.className = `message ${m.from === "me" ? "outgoing" : "incoming"}`;
    bubble.innerHTML = `
      <div class="message-text">${escapeHTML(m.text)}</div>
      <div class="message-meta">${formatTime(m.at)}</div>
    `;
    chatUI.list.appendChild(bubble);
  }

  function scrollToBottom() {
    chatUI.list.scrollTop = chatUI.list.scrollHeight;
  }

  function ensureThread(contactId) {
    if (!store.threads[contactId]) store.threads[contactId] = [];
    return store.threads[contactId];
  }

  function initials(name) {
    return name
      .split(/\s+/)
      .map((n) => n[0] || "")
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }

  function formatTime(ts) {
    const d = new Date(ts || Date.now());
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  }

  function escapeHTML(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  // Tiny toast
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

  /* =======================
   * Store (session persistence)
   * ======================= */
  function loadStore() {
    try {
      return JSON.parse(sessionStorage.getItem(STORE_KEY));
    } catch {
      return null;
    }
  }
  function saveStore() {
    sessionStorage.setItem(STORE_KEY, JSON.stringify(store));
  }
  function seedStore() {
    // Seed with a few example messages for demo contacts present in HTML
    return {
      threads: {
        "admin-mike": [
          {
            from: "them",
            text: "Morning! Could you check the new bookings?",
            at: Date.now() - 3600_000,
          },
          {
            from: "me",
            text: "On it. I’ll update you in 10 minutes.",
            at: Date.now() - 3400_000,
          },
        ],
        "admin-sarah": [
          {
            from: "them",
            text: "Reminder: Review pending verifications.",
            at: Date.now() - 7200_000,
          },
        ],
        "abc-rentals": [
          {
            from: "them",
            text: "We pushed an updated rate card.",
            at: Date.now() - 5600_000,
          },
        ],
        "michael-johnson": [
          {
            from: "them",
            text: "Started my shift. Any priority rides?",
            at: Date.now() - 2600_000,
          },
        ],
      },
    };
  }
})();
