(function () {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const chatUI = {
    placeholder: $(".conversation-placeholder"),
    chat: $("#chatInterface"),
    list: $("#chatMessages"),
    input: $("#messageInput"),
    headerName: $("#chatContactName"),
    headerStatus: $("#chatContactStatus"),
    headerAvatar: $("#chatAvatarText"),
  };

  let currentConversationId = null;
  let currentContactDomKey = null; // keeps your existing contact highlighting
  let ws = null;

  function actorType() {
    return ($("#rmActorType")?.value || "ADMIN").toUpperCase();
  }
  function actorId() {
    return parseInt($("#rmActorId")?.value || "1", 10);
  }

  function apiBase() {
    // Same host/app. If your app context is different, update here.
    return "/api/chat";
  }

  function wsUrl() {
    const proto = location.protocol === "https:" ? "wss" : "ws";
    return `${proto}://${location.host}/ws/chat/${actorType()}/${actorId()}`;
  }

  function escapeHTML(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function formatTimeFromSentAt(sentAt) {
    // sentAt from DB like "2026-01-11 10:15:00.0" (timestamp string)
    const d = new Date(sentAt);
    if (isNaN(d.getTime())) return "";
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  }

  function initials(name) {
    return name
      .split(/\s+/)
      .map((n) => n[0] || "")
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }

  function scrollToBottom() {
    chatUI.list.scrollTop = chatUI.list.scrollHeight;
  }

  function appendMessageBubble(m) {
    const mine = m.senderType === actorType() && m.senderId === actorId();

    const bubble = document.createElement("div");
    bubble.className = `message ${mine ? "outgoing" : "incoming"}`;
    bubble.innerHTML = `
      <div class="message-text">${escapeHTML(m.content)}</div>
      <div class="message-meta">${escapeHTML(
        formatTimeFromSentAt(m.sentAt)
      )}</div>
    `;
    chatUI.list.appendChild(bubble);
  }

  async function loadMessages(conversationId) {
    const url = `${apiBase()}/messages?actorType=${encodeURIComponent(
      actorType()
    )}&actorId=${actorId()}&conversationId=${conversationId}&limit=100&offset=0`;

    const res = await fetch(url, { credentials: "include" });
    const data = await res.json();

    // Controller returns DESC; show ASC in UI
    const msgs = (data.messages || []).slice().reverse();

    chatUI.list.innerHTML = "";
    msgs.forEach(appendMessageBubble);
    scrollToBottom();

    // mark read using last message id
    const last = msgs[msgs.length - 1];
    if (last) {
      await fetch(`${apiBase()}/markRead`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body:
          `actorType=${encodeURIComponent(actorType())}` +
          `&actorId=${actorId()}` +
          `&conversationId=${conversationId}` +
          `&lastMessageId=${last.messageId}`,
        credentials: "include",
      });
    }
  }

  function connectWs() {
    try {
      ws = new WebSocket(wsUrl());

      ws.onopen = () => console.log("WS connected");
      ws.onclose = () => console.log("WS disconnected");
      ws.onerror = (e) => console.log("WS error", e);

      ws.onmessage = async (evt) => {
        // Expect: {"type":"NEW_MESSAGE","message":{...}}
        let msg;
        try {
          const data = JSON.parse(evt.data);
          if (data.type !== "NEW_MESSAGE") return;
          msg = data.message;
        } catch {
          return;
        }

        // If message belongs to currently open conversation -> append live
        if (
          currentConversationId &&
          msg.conversationId === currentConversationId
        ) {
          appendMessageBubble(msg);
          scrollToBottom();

          // mark read immediately
          await fetch(`${apiBase()}/markRead`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body:
              `actorType=${encodeURIComponent(actorType())}` +
              `&actorId=${actorId()}` +
              `&conversationId=${currentConversationId}` +
              `&lastMessageId=${msg.messageId}`,
            credentials: "include",
          });
        } else {
          // else show unread badge on contact (simple UI)
          if (currentContactDomKey) {
            // you can improve: find correct contact by mapping conversation->contact
          }
        }
      };
    } catch (e) {
      console.log("WS init failed", e);
    }
  }

  // PUBLIC FUNCTIONS (your HTML uses these names) :contentReference[oaicite:13]{index=13}
  window.selectContact = async function (contactKey) {
    const item = $(`.contact-item[data-contact="${contactKey}"]`);
    if (!item) return;

    // UI active state
    $$(".contact-item").forEach((el) => el.classList.remove("active"));
    item.classList.add("active");

    // Hide unread badge
    const badge = $(".unread-badge", item);
    if (badge) badge.remove();

    // Header
    const name = $(".contact-name", item)?.textContent?.trim() || "Unknown";
    const isOnline = $(".contact-status", item)?.classList.contains("online");
    chatUI.headerName.textContent = name;
    chatUI.headerStatus.textContent = isOnline ? "Online" : "Offline";
    chatUI.headerAvatar.textContent = initials(name);

    // Show chat panel
    chatUI.placeholder.style.display = "none";
    chatUI.chat.style.display = "grid";

    currentContactDomKey = contactKey;

    // IMPORTANT:
    // Your current HTML uses fake IDs like "admin-mike".
    // For real DB chat, you need real target actorType + actorId.
    //
    // Quick solution for now:
    // Add data attributes to contact-item:
    //   data-actor-type="ADMIN"
    //   data-actor-id="2"
    //
    const toType = (
      item.getAttribute("data-actor-type") || "ADMIN"
    ).toUpperCase();
    const toId = parseInt(item.getAttribute("data-actor-id") || "2", 10);

    // Create (or reuse) direct conversation in DB
    const res = await fetch(`${apiBase()}/direct`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body:
        `actorType=${encodeURIComponent(actorType())}` +
        `&actorId=${actorId()}` +
        `&toType=${encodeURIComponent(toType)}` +
        `&toId=${toId}`,
      credentials: "include",
    });
    const data = await res.json();

    currentConversationId = data.conversationId;
    sessionStorage.setItem(
      "rm_last_conversation",
      String(currentConversationId)
    );

    await loadMessages(currentConversationId);
  };

  window.sendMessage = function () {
    if (!ws || ws.readyState !== 1) return;
    if (!currentConversationId) return;

    const text = (chatUI.input.value || "").trim();
    if (!text) return;

    const payload = JSON.stringify({
      type: "SEND_MESSAGE",
      conversationId: currentConversationId,
      content: text,
    });

    ws.send(payload);
    chatUI.input.value = "";
  };

  window.handleEnterKey = function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      window.sendMessage();
    }
  };

  window.clearChat = function () {
    // UI-only clear (does not delete DB history)
    chatUI.list.innerHTML = "";
  };

  window.archiveChat = function () {
    // Optional feature: you can later implement “archived” in DB
    toast("Conversation archived");
  };

  // Keep your existing filters
  window.filterMessages = function (tab) {
    $$(".message-tabs .tab-btn").forEach((b) =>
      b.classList.toggle("active", b.dataset.tab === tab)
    );
    $$(".category-section").forEach((sec) => (sec.style.display = ""));
    if (tab === "users") {
      $$(".category-section").forEach((sec) => {
        const title =
          $(".category-title", sec)?.textContent?.trim().toLowerCase() || "";
        const isUserGroup = title === "admins" || title === "drivers";
        sec.style.display = isUserGroup ? "" : "none";
      });
    }
  };

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

  document.addEventListener("DOMContentLoaded", () => {
    connectWs();

    // Auto-select first contact like your current behavior
    const first = $(".contact-item.active") || $(".contact-item");
    if (first) window.selectContact(first.dataset.contact);
  });
})();
