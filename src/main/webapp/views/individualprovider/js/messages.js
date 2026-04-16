// =========================================================
// RideMachan – Messaging & Notification System (Frontend)
// =========================================================
// DEBUG VERSION — console logs added to trace session flow
// =========================================================

const ACTOR_LABELS = {
  ADMIN: "Admin",
  COMPANY: "Rental Company",
  DRIVER: "Driver",
  CUSTOMER: "Customer",
  MAINTENANCE: "Maintenance Staff",
  PROVIDER: "Vehicle Provider",
};

class MessagingSystem {
  constructor() {
    console.log("[DEBUG] MessagingSystem constructor called");
    this.ws = null;
    this.currentConversationId = null;
    this.conversations = [];
    this.messages = [];
    this.actorType = null;
    this.actorId = null;
    this.allowedTypes = [];
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.messageLimit = 50;
    this.messageOffset = 0;
    this.notifDropdownOpen = false;
    this.notifPollingInterval = null;

    this.init();
  }

  // ───────────────────────────────────────────
  // Initialisation
  // ───────────────────────────────────────────

  async init() {
    console.log("[DEBUG] init() started");
    try {
      await this.getSessionInfo();

      // ── GUARD: stop everything if session failed ──
      if (!this.actorType || this.actorId == null || isNaN(this.actorId)) {
        console.error(
          "[DEBUG] init() ABORTING — session data missing after getSessionInfo()",
          { actorType: this.actorType, actorId: this.actorId },
        );
        return;
      }

      console.log("[DEBUG] init() — session OK, proceeding with setup", {
        actorType: this.actorType,
        actorId: this.actorId,
      });

      this.setupEventListeners();
      console.log("[DEBUG] init() — event listeners attached");

      await this.loadConversations();
      console.log("[DEBUG] init() — conversations loaded");

      this.openInitialConversationFromUrlOrStorage();

      await this.loadAllowedTypes();
      console.log("[DEBUG] init() — allowed types loaded:", this.allowedTypes);

      this.loadNotificationCount();
      console.log("[DEBUG] init() — notification count requested");

      this.connectWebSocket();
      console.log("[DEBUG] init() — WebSocket connection initiated");

      // Poll notifications every 30 seconds as fallback
      this.notifPollingInterval = setInterval(
        () => this.loadNotificationCount(),
        30000,
      );
      console.log("[DEBUG] init() complete");
    } catch (e) {
      console.error("[DEBUG] init() FATAL ERROR:", e);
    }
  }

  async getSessionInfo() {
    console.log("[DEBUG] getSessionInfo() — fetching /api/session ...");
    try {
      const resp = await fetch("/api/session", { credentials: "include" });
      console.log("[DEBUG] getSessionInfo() — response status:", resp.status);

      if (!resp.ok) {
        console.error(
          "[DEBUG] getSessionInfo() — NOT OK, status:",
          resp.status,
          "— redirecting to login",
        );
        window.location.href = "/login.html";
        throw new Error("Not authenticated (status " + resp.status + ")");
      }

      const rawText = await resp.text();
      console.log("[DEBUG] getSessionInfo() — raw response body:", rawText);

      let data;
      try {
        data = JSON.parse(rawText);
      } catch (parseErr) {
        console.error(
          "[DEBUG] getSessionInfo() — JSON parse FAILED on:",
          rawText,
          parseErr,
        );
        throw parseErr;
      }

      console.log(
        "[DEBUG] getSessionInfo() — parsed JSON:",
        JSON.stringify(data),
      );
      console.log(
        "[DEBUG] getSessionInfo() — data.actorType:",
        data.actorType,
        "(type:",
        typeof data.actorType,
        ")",
      );
      console.log(
        "[DEBUG] getSessionInfo() — data.actorId:",
        data.actorId,
        "(type:",
        typeof data.actorId,
        ")",
      );

      if (!data.actorType) {
        console.error(
          "[DEBUG] getSessionInfo() — actorType is MISSING or FALSY in response",
        );
        throw new Error("actorType missing from session response");
      }
      if (data.actorId === undefined || data.actorId === null) {
        console.error(
          "[DEBUG] getSessionInfo() — actorId is MISSING or NULL in response",
        );
        throw new Error("actorId missing from session response");
      }

      this.actorType = data.actorType.toUpperCase();
      this.actorId = parseInt(data.actorId, 10);

      console.log("[DEBUG] getSessionInfo() — FINAL VALUES SET:", {
        actorType: this.actorType,
        actorId: this.actorId,
      });

      if (isNaN(this.actorId)) {
        console.error(
          "[DEBUG] getSessionInfo() — actorId parsed to NaN! Raw value was:",
          data.actorId,
        );
        throw new Error("actorId is NaN");
      }
    } catch (e) {
      console.error("[DEBUG] getSessionInfo() — EXCEPTION:", e);
      if (!e.message?.includes("Not authenticated")) {
        window.location.href = "/login.html";
      }
      throw e; // re-throw so init() catches it and stops
    }
  }

  // ───────────────────────────────────────────
  // Event Listeners
  // ───────────────────────────────────────────

  setupEventListeners() {
    document
      .getElementById("newConversationBtn")
      ?.addEventListener("click", () => this.openNewConversationModal());
    document
      .getElementById("closeModalBtn")
      ?.addEventListener("click", () => this.closeNewConversationModal());
    document
      .getElementById("cancelModalBtn")
      ?.addEventListener("click", () => this.closeNewConversationModal());
    document
      .querySelector(".modal-overlay")
      ?.addEventListener("click", () => this.closeNewConversationModal());
    document
      .getElementById("userTypeSelect")
      ?.addEventListener("change", (e) =>
        this.loadUsersForType(e.target.value),
      );
    document
      .getElementById("startConversationBtn")
      ?.addEventListener("click", () => this.createNewConversation());
    document
      .getElementById("conversationSearch")
      ?.addEventListener("input", (e) =>
        this.filterConversations(e.target.value),
      );

    // Notification bell
    document
      .getElementById("notifToggleBtn")
      ?.addEventListener("click", (e) => {
        e.stopPropagation();
        this.toggleNotifDropdown();
      });
    document
      .getElementById("markAllReadBtn")
      ?.addEventListener("click", () => this.markAllNotificationsRead());

    // Close dropdown on outside click
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".notification-bell")) {
        this.closeNotifDropdown();
      }
    });
  }

  // ───────────────────────────────────────────
  // Permissions – load allowed target types
  // ───────────────────────────────────────────

  async loadAllowedTypes() {
    console.log(
      "[DEBUG] loadAllowedTypes() — fetching /api/chat/allowedTypes ...",
    );
    try {
      const resp = await fetch("/api/chat/allowedTypes", {
        credentials: "include",
      });
      console.log("[DEBUG] loadAllowedTypes() — response status:", resp.status);
      const data = await resp.json();
      console.log(
        "[DEBUG] loadAllowedTypes() — response data:",
        JSON.stringify(data),
      );
      if (data.ok) {
        this.allowedTypes = data.types;
        console.log(
          "[DEBUG] loadAllowedTypes() — allowed types set:",
          this.allowedTypes,
        );
      } else {
        console.warn("[DEBUG] loadAllowedTypes() — response ok=false:", data);
      }
    } catch (e) {
      console.error("[DEBUG] loadAllowedTypes() — EXCEPTION:", e);
    }
  }

  // ───────────────────────────────────────────
  // WebSocket
  // ───────────────────────────────────────────

  connectWebSocket() {
    console.log("[DEBUG] connectWebSocket() called", {
      actorType: this.actorType,
      actorId: this.actorId,
    });

    if (!this.actorType || this.actorId == null || isNaN(this.actorId)) {
      console.error(
        "[DEBUG] connectWebSocket() — CANNOT CONNECT, actor info missing!",
        { actorType: this.actorType, actorId: this.actorId },
      );
      return;
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log("[DEBUG] connectWebSocket() — already connected, skipping");
      return;
    }

    try {
      const proto = location.protocol === "https:" ? "wss:" : "ws:";
      const url = `${proto}//${location.host}/ws/chat/${this.actorType}/${this.actorId}`;
      console.log("[DEBUG] connectWebSocket() — opening WS to:", url);
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log("[DEBUG] WS onopen — connected successfully to:", url);
        this.reconnectAttempts = 0;
      };
      this.ws.onmessage = (e) => {
        console.log("[DEBUG] WS onmessage — raw data:", e.data);
        this.handleWsMessage(e.data);
      };
      this.ws.onerror = (e) => {
        console.error("[DEBUG] WS onerror:", e);
      };
      this.ws.onclose = (e) => {
        console.warn(
          "[DEBUG] WS onclose — code:",
          e.code,
          "reason:",
          e.reason,
          "clean:",
          e.wasClean,
        );
        this.attemptReconnect();
      };
    } catch (e) {
      console.error("[DEBUG] connectWebSocket() — EXCEPTION:", e);
    }
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = 2000 * this.reconnectAttempts;
      console.log(
        "[DEBUG] attemptReconnect() — attempt",
        this.reconnectAttempts,
        "of",
        this.maxReconnectAttempts,
        "in",
        delay,
        "ms",
      );
      setTimeout(() => this.connectWebSocket(), delay);
    } else {
      console.error(
        "[DEBUG] attemptReconnect() — MAX ATTEMPTS REACHED, giving up",
      );
    }
  }

  handleWsMessage(raw) {
    try {
      const data = JSON.parse(raw);
      console.log("[DEBUG] handleWsMessage() — parsed:", JSON.stringify(data));

      if (data.type === "NEW_MESSAGE") {
        const msg = data.message;
        console.log(
          "[DEBUG] handleWsMessage() — NEW_MESSAGE for convId:",
          msg.conversationId,
          "current convId:",
          this.currentConversationId,
        );
        if (msg.conversationId === this.currentConversationId) {
          this.addMessageToChat(msg);
          this.scrollToBottom();
          this.markAsRead(this.currentConversationId, msg.messageId);
        }
        this.loadConversations(); // refresh sidebar
      }

      if (data.type === "NOTIFICATION") {
        console.log(
          "[DEBUG] handleWsMessage() — NOTIFICATION received:",
          data.notification,
        );
        this.loadNotificationCount();
        const n = data.notification;
        this.showToast(n.title, "info");
      }
    } catch (e) {
      console.error("[DEBUG] handleWsMessage() — parse error:", e, "raw:", raw);
    }
  }

  // ───────────────────────────────────────────
  // Conversations
  // ───────────────────────────────────────────

  async loadConversations() {
    console.log(
      "[DEBUG] loadConversations() — fetching /api/chat/conversations ...",
    );
    const container = document.getElementById("conversationsList");
    try {
      const resp = await fetch("/api/chat/conversations", {
        credentials: "include",
      });
      console.log(
        "[DEBUG] loadConversations() — response status:",
        resp.status,
      );

      if (!resp.ok) {
        const errText = await resp.text();
        console.error("[DEBUG] loadConversations() — NOT OK, body:", errText);
        throw new Error(
          resp.status === 401
            ? "Not authenticated"
            : "Failed to load (status " + resp.status + ")",
        );
      }

      const data = await resp.json();
      console.log(
        "[DEBUG] loadConversations() — response data:",
        JSON.stringify(data),
      );

      if (data.ok) {
        this.conversations = data.conversations || [];
        console.log(
          "[DEBUG] loadConversations() — loaded",
          this.conversations.length,
          "conversations",
        );
        this.renderConversations();
      } else {
        console.warn("[DEBUG] loadConversations() — ok=false:", data);
      }
    } catch (e) {
      console.error("[DEBUG] loadConversations() — EXCEPTION:", e);
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-exclamation-triangle"></i>
          <p>Error loading conversations</p>
          <p style="font-size:12px;margin-top:8px;color:#f72585;">${e.message}</p>
          <button class="btn btn-primary" onclick="messagingSystem.loadConversations()" style="margin-top:16px;">
            <i class="fas fa-redo"></i> Retry
          </button>
        </div>`;
    }
  }

  renderConversations() {
    const container = document.getElementById("conversationsList");

    if (!this.conversations.length) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-inbox"></i>
          <p>No conversations yet</p>
          <p style="font-size:12px;margin-top:8px;">Start a new conversation to get started</p>
        </div>`;
      return;
    }

    container.innerHTML = this.conversations
      .map((conv) => {
        const isActive = conv.conversationId === this.currentConversationId;
        const title = conv.title || "Conversation";
        const preview = conv.lastMessage || "No messages yet";
        const time = this.formatTime(conv.lastTime);
        const badgeType = conv.otherType || conv.type;
        const badgeClass = `badge-${badgeType in ACTOR_LABELS ? badgeType : "default"}`;
        const badgeLabel = ACTOR_LABELS[badgeType] || conv.type;
        const unread = conv.unreadCount || 0;

        return `
        <div class="conversation-item ${isActive ? "active" : ""} ${unread > 0 ? "unread" : ""}"
             data-conversation-id="${conv.conversationId}"
             onclick="messagingSystem.selectConversation(${conv.conversationId})">
          <div class="conversation-header">
            <div class="conversation-name">
              ${this.esc(title)}
              <span class="conversation-type-badge ${badgeClass}">${badgeLabel}</span>
            </div>
            <span class="conversation-time">${time}</span>
          </div>
          <div class="conversation-preview">${this.esc(preview)}</div>
          ${unread > 0 ? `<span class="unread-count-badge">${unread}</span>` : ""}
        </div>`;
      })
      .join("");
  }

  filterConversations(term) {
    const items = document.querySelectorAll(".conversation-item");
    const t = term.toLowerCase().trim();
    items.forEach((item) => {
      const text = item.textContent.toLowerCase();
      item.style.display = text.includes(t) ? "block" : "none";
    });
  }

  async selectConversation(convId) {
    console.log("[DEBUG] selectConversation() — convId:", convId);
    this.currentConversationId = convId;
    this.messageOffset = 0;
    this.messages = [];

    document
      .querySelectorAll(".conversation-item")
      .forEach((el) => el.classList.remove("active"));
    document
      .querySelector(`[data-conversation-id="${convId}"]`)
      ?.classList.add("active");

    await this.loadMessages(convId);
    this.renderChatArea();
    this.scrollToBottom();
  }

  // ───────────────────────────────────────────
  // Messages
  // ───────────────────────────────────────────

  async loadMessages(convId) {
    console.log(
      "[DEBUG] loadMessages() — convId:",
      convId,
      "limit:",
      this.messageLimit,
      "offset:",
      this.messageOffset,
    );
    try {
      const url = `/api/chat/messages?conversationId=${convId}&limit=${this.messageLimit}&offset=${this.messageOffset}`;
      console.log("[DEBUG] loadMessages() — fetching:", url);
      const resp = await fetch(url, { credentials: "include" });
      console.log("[DEBUG] loadMessages() — response status:", resp.status);

      const data = await resp.json();
      console.log(
        "[DEBUG] loadMessages() — response ok:",
        data.ok,
        "message count:",
        data.messages?.length,
      );

      if (data.ok) {
        this.messages = data.messages.reverse(); // oldest first
        console.log(
          "[DEBUG] loadMessages() — messages reversed, count:",
          this.messages.length,
        );
        if (this.messages.length > 0) {
          const lastMsgId = this.messages[this.messages.length - 1].messageId;
          console.log(
            "[DEBUG] loadMessages() — marking read, lastMsgId:",
            lastMsgId,
          );
          this.markAsRead(convId, lastMsgId);
        }
      } else {
        console.warn("[DEBUG] loadMessages() — ok=false:", data);
      }
    } catch (e) {
      console.error("[DEBUG] loadMessages() — EXCEPTION:", e);
    }
  }

  renderChatArea() {
    const area = document.getElementById("chatArea");
    if (!this.currentConversationId) {
      area.innerHTML = `
        <div class="no-conversation-selected">
          <i class="fas fa-comments"></i>
          <h3>Select a conversation</h3>
          <p>Choose a conversation from the sidebar or start a new one</p>
        </div>`;
      return;
    }

    const conv = this.conversations.find(
      (c) => c.conversationId === this.currentConversationId,
    );
    const title = conv?.title || "Chat";
    const otherType = conv?.otherType;
    const otherLabel = ACTOR_LABELS[otherType] || "";

    area.innerHTML = `
      <div class="chat-header">
        <div class="chat-user-info">
          <div class="chat-user-avatar">${this.getInitials(title)}</div>
          <div class="chat-user-details">
            <h3>${this.esc(title)}</h3>
            <p>${otherLabel || conv?.type || "Conversation"}</p>
          </div>
        </div>
        <div class="chat-actions">
          <button onclick="messagingSystem.refreshMessages()" title="Refresh">
            <i class="fas fa-sync-alt"></i>
          </button>
        </div>
      </div>
      <div class="messages-container-chat" id="messagesContainer">
        ${this.renderMessages()}
      </div>
      <div class="message-input-container">
        <div class="message-input-wrapper">
          <div class="message-input-box">
            <textarea id="messageInput" placeholder="Type a message..." rows="1"
              onkeypress="messagingSystem.handleInputKeypress(event)"
              oninput="messagingSystem.autoResize(this)"></textarea>
            <button class="attachment-btn" onclick="messagingSystem.handleAttachment()" title="Attach file">
              <i class="fas fa-paperclip"></i>
            </button>
          </div>
          <button class="send-button" onclick="messagingSystem.sendMessage()" id="sendBtn">
            <i class="fas fa-paper-plane"></i>
          </button>
        </div>
      </div>`;
  }

  renderMessages() {
    if (!this.messages.length) {
      return `<div class="empty-state">
        <i class="fas fa-comment-slash"></i><p>No messages yet</p>
        <p style="font-size:12px;margin-top:8px;">Start the conversation!</p>
      </div>`;
    }

    let html = "";
    let lastDate = null;

    this.messages.forEach((msg) => {
      const dateStr = this.getDateString(msg.sentAt);
      if (dateStr !== lastDate) {
        html += `<div class="date-separator">${dateStr}</div>`;
        lastDate = dateStr;
      }
      const isSent =
        msg.senderType === this.actorType && msg.senderId === this.actorId;
      const name = msg.senderName || `${msg.senderType} #${msg.senderId}`;
      const time = this.formatMessageTime(msg.sentAt);
      const initials = this.getInitials(name);

      html += `
        <div class="message ${isSent ? "sent" : "received"}">
          <div class="message-avatar">${initials}</div>
          <div class="message-content-wrapper">
            ${!isSent ? `<div class="message-sender">${this.esc(name)}</div>` : ""}
            <div class="message-bubble">${this.esc(msg.content)}</div>
            <div class="message-time">${time}</div>
          </div>
        </div>`;
    });

    return html;
  }

  addMessageToChat(message) {
    console.log(
      "[DEBUG] addMessageToChat() — message:",
      JSON.stringify(message),
    );
    this.messages.push(message);
    const container = document.getElementById("messagesContainer");
    if (!container) return;

    const isSent =
      message.senderType === this.actorType &&
      message.senderId === this.actorId;

    console.log("[DEBUG] addMessageToChat() — isSent check:", {
      msgSenderType: message.senderType,
      myActorType: this.actorType,
      msgSenderId: message.senderId,
      myActorId: this.actorId,
      isSent,
    });

    const name =
      message.senderName || `${message.senderType} #${message.senderId}`;
    const time = this.formatMessageTime(message.sentAt);

    container.insertAdjacentHTML(
      "beforeend",
      `
      <div class="message ${isSent ? "sent" : "received"}">
        <div class="message-avatar">${this.getInitials(name)}</div>
        <div class="message-content-wrapper">
          ${!isSent ? `<div class="message-sender">${this.esc(name)}</div>` : ""}
          <div class="message-bubble">${this.esc(message.content)}</div>
          <div class="message-time">${time}</div>
        </div>
      </div>`,
    );
  }

  sendMessage() {
    const input = document.getElementById("messageInput");
    const content = input?.value?.trim();
    console.log("[DEBUG] sendMessage() called", {
      content: content,
      convId: this.currentConversationId,
      wsState: this.ws?.readyState,
      actorType: this.actorType,
      actorId: this.actorId,
    });

    if (!content || !this.currentConversationId) {
      console.warn(
        "[DEBUG] sendMessage() — aborted: no content or no conversation selected",
      );
      return;
    }

    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error(
        "[DEBUG] sendMessage() — WS not open! readyState:",
        this.ws?.readyState,
        "(0=CONNECTING, 1=OPEN, 2=CLOSING, 3=CLOSED)",
      );
      this.showToast("Connection lost. Reconnecting...", "error");
      this.connectWebSocket();
      return;
    }

    const payload = JSON.stringify({
      type: "SEND_MESSAGE",
      conversationId: this.currentConversationId,
      content: content,
    });
    console.log("[DEBUG] sendMessage() — sending WS payload:", payload);
    this.ws.send(payload);
    input.value = "";
    this.autoResize(input);
  }

  handleInputKeypress(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      this.sendMessage();
    }
  }

  autoResize(ta) {
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
  }

  handleAttachment() {
    this.showToast("Attachment feature coming soon!", "info");
  }

  refreshMessages() {
    if (this.currentConversationId) {
      this.loadMessages(this.currentConversationId).then(() => {
        this.renderChatArea();
        this.scrollToBottom();
      });
    }
  }

  scrollToBottom() {
    setTimeout(() => {
      const c = document.getElementById("messagesContainer");
      if (c) c.scrollTop = c.scrollHeight;
    }, 100);
  }

  async markAsRead(convId, msgId) {
    console.log("[DEBUG] markAsRead() — convId:", convId, "msgId:", msgId);
    try {
      const resp = await fetch("/api/chat/markRead", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        credentials: "include",
        body: `conversationId=${convId}&lastMessageId=${msgId}`,
      });
      console.log("[DEBUG] markAsRead() — response status:", resp.status);
    } catch (e) {
      console.error("[DEBUG] markAsRead() — EXCEPTION:", e);
    }
  }

  // ───────────────────────────────────────────
  // New Conversation Modal (permission-aware)
  // ───────────────────────────────────────────

  openNewConversationModal() {
    console.log(
      "[DEBUG] openNewConversationModal() — allowedTypes:",
      this.allowedTypes,
    );
    const modal = document.getElementById("newConversationModal");
    modal?.classList.add("active");

    // Populate user-type dropdown with ONLY allowed types
    const select = document.getElementById("userTypeSelect");
    select.innerHTML = '<option value="">-- Select Type --</option>';

    this.allowedTypes.forEach((type) => {
      const label = ACTOR_LABELS[type] || type;
      select.innerHTML += `<option value="${type}">${label}</option>`;
    });

    document.getElementById("userSelect").innerHTML =
      '<option value="">-- Select a user type first --</option>';

    // Show info
    const info = document.getElementById("permissionInfo");
    const infoText = document.getElementById("permissionInfoText");
    if (this.allowedTypes.length === 0) {
      info.style.display = "flex";
      infoText.textContent =
        "You do not have permission to start new conversations.";
    } else {
      info.style.display = "flex";
      const names = this.allowedTypes
        .map((t) => ACTOR_LABELS[t] || t)
        .join(", ");
      infoText.textContent = `You can message: ${names}`;
    }
  }

  closeNewConversationModal() {
    document.getElementById("newConversationModal")?.classList.remove("active");
  }

  async loadUsersForType(userType) {
    console.log("[DEBUG] loadUsersForType() — userType:", userType);
    const select = document.getElementById("userSelect");
    if (!userType) {
      select.innerHTML =
        '<option value="">-- Select a user type first --</option>';
      return;
    }

    select.innerHTML = '<option value="">Loading...</option>';

    try {
      const url = `/api/chat/users?type=${userType}`;
      console.log("[DEBUG] loadUsersForType() — fetching:", url);
      const resp = await fetch(url, { credentials: "include" });
      console.log("[DEBUG] loadUsersForType() — response status:", resp.status);
      const data = await resp.json();
      console.log(
        "[DEBUG] loadUsersForType() — response data:",
        JSON.stringify(data),
      );

      if (data.ok && data.users.length > 0) {
        select.innerHTML = '<option value="">-- Select User --</option>';
        data.users.forEach((u) => {
          // Don't show yourself
          if (userType === this.actorType && u.id === this.actorId) return;
          select.innerHTML += `<option value="${u.id}">${this.esc(u.name)} (ID: ${u.id})</option>`;
        });
      } else if (data.ok) {
        select.innerHTML = '<option value="">No users found</option>';
      } else {
        select.innerHTML = `<option value="">Error: ${data.error || "Failed"}</option>`;
      }
    } catch (e) {
      console.error("[DEBUG] loadUsersForType() — EXCEPTION:", e);
      select.innerHTML = '<option value="">Error loading users</option>';
    }
  }

  async createNewConversation() {
    const userType = document.getElementById("userTypeSelect").value;
    const userId = document.getElementById("userSelect").value;
    console.log("[DEBUG] createNewConversation() —", {
      userType,
      userId,
      myActorType: this.actorType,
      myActorId: this.actorId,
    });

    if (!userType || !userId) {
      this.showToast("Please select both user type and user", "error");
      return;
    }

    try {
      const body = `toType=${userType}&toId=${userId}`;
      console.log(
        "[DEBUG] createNewConversation() — POST /api/chat/direct, body:",
        body,
      );
      const resp = await fetch("/api/chat/direct", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        credentials: "include",
        body: body,
      });

      console.log(
        "[DEBUG] createNewConversation() — response status:",
        resp.status,
      );
      const data = await resp.json();
      console.log(
        "[DEBUG] createNewConversation() — response data:",
        JSON.stringify(data),
      );

      if (resp.status === 403) {
        this.showToast(
          data.error || "Not allowed to message this user type",
          "error",
        );
        return;
      }

      if (data.ok) {
        this.closeNewConversationModal();
        await this.loadConversations();
        this.selectConversation(data.conversationId);
        this.showToast("Conversation created!", "success");
      } else {
        this.showToast(data.error || "Failed to create conversation", "error");
      }
    } catch (e) {
      console.error("[DEBUG] createNewConversation() — EXCEPTION:", e);
      this.showToast("Failed to create conversation", "error");
    }
  }

  // ───────────────────────────────────────────
  // Notifications
  // ───────────────────────────────────────────

  async loadNotificationCount() {
    try {
      const resp = await fetch("/api/chat/notifications/count", {
        credentials: "include",
      });
      const data = await resp.json();
      console.log(
        "[DEBUG] loadNotificationCount() — status:",
        resp.status,
        "data:",
        JSON.stringify(data),
      );
      if (data.ok) {
        const badge = document.getElementById("notifBadge");
        if (data.count > 0) {
          badge.textContent = data.count > 99 ? "99+" : data.count;
          badge.style.display = "flex";
        } else {
          badge.style.display = "none";
        }
      }
    } catch (e) {
      console.error("[DEBUG] loadNotificationCount() — EXCEPTION:", e);
    }
  }

  toggleNotifDropdown() {
    const dd = document.getElementById("notifDropdown");
    this.notifDropdownOpen = !this.notifDropdownOpen;
    if (this.notifDropdownOpen) {
      dd.classList.add("active");
      this.loadNotifications();
    } else {
      dd.classList.remove("active");
    }
  }

  closeNotifDropdown() {
    this.notifDropdownOpen = false;
    document.getElementById("notifDropdown")?.classList.remove("active");
  }

  async loadNotifications() {
    console.log("[DEBUG] loadNotifications() — fetching ...");
    const list = document.getElementById("notifList");
    try {
      const resp = await fetch("/api/chat/notifications?limit=20&offset=0", {
        credentials: "include",
      });
      const data = await resp.json();
      console.log(
        "[DEBUG] loadNotifications() — status:",
        resp.status,
        "count:",
        data.notifications?.length,
      );

      if (data.ok && data.notifications.length > 0) {
        list.innerHTML = data.notifications
          .map((n) => {
            const icon = this.getNotifIcon(n.type);
            const time = this.formatTime(n.createdAt);
            return `
            <div class="notif-item ${n.isRead ? "" : "unread"}" 
                 onclick="messagingSystem.handleNotifClick(${n.notificationId}, '${n.referenceType}', ${n.referenceId})">
              <div class="notif-icon"><i class="fas ${icon}"></i></div>
              <div class="notif-content">
                <div class="notif-title">${this.esc(n.title)}</div>
                <div class="notif-body">${this.esc(n.body)}</div>
                <div class="notif-time">${time}</div>
              </div>
            </div>`;
          })
          .join("");
      } else {
        list.innerHTML =
          '<div class="notif-empty"><i class="fas fa-bell-slash" style="font-size:32px;opacity:0.3;margin-bottom:12px;"></i><br>No notifications</div>';
      }
    } catch (e) {
      console.error("[DEBUG] loadNotifications() — EXCEPTION:", e);
      list.innerHTML =
        '<div class="notif-empty">Error loading notifications</div>';
    }
  }

  getNotifIcon(type) {
    const icons = {
      NEW_MESSAGE: "fa-comment",
      SYSTEM: "fa-cog",
      BOOKING: "fa-calendar",
      TICKET: "fa-ticket-alt",
      REPORT: "fa-flag",
      MAINTENANCE: "fa-wrench",
      GENERAL: "fa-bell",
    };
    return icons[type] || "fa-bell";
  }

  async handleNotifClick(notifId, refType, refId) {
    console.log("[DEBUG] handleNotifClick() —", { notifId, refType, refId });
    // Mark notification read
    try {
      await fetch("/api/chat/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        credentials: "include",
        body: `notificationId=${notifId}`,
      });
    } catch (e) {
      /* ignore */
    }

    // Navigate to conversation if applicable
    if (refType === "CONVERSATION" && refId) {
      this.closeNotifDropdown();
      this.selectConversation(refId);
    }

    this.loadNotificationCount();
    this.loadNotifications();
  }

  async markAllNotificationsRead() {
    console.log("[DEBUG] markAllNotificationsRead() called");
    try {
      await fetch("/api/chat/notifications/readAll", {
        method: "POST",
        credentials: "include",
      });
      this.loadNotificationCount();
      this.loadNotifications();
    } catch (e) {
      console.error("[DEBUG] markAllNotificationsRead() — EXCEPTION:", e);
    }
  }

  // ───────────────────────────────────────────
  // Utility
  // ───────────────────────────────────────────

  getInitials(name) {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  }

  esc(text) {
    if (!text) return "";
    const d = document.createElement("div");
    d.textContent = text;
    return d.innerHTML;
  }

  formatTime(ts) {
    if (!ts || ts === "null") return "";
    const date = new Date(ts);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return "Just now";
    if (diff < 3600000) return Math.floor(diff / 60000) + "m ago";
    if (date.toDateString() === now.toDateString())
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

    if (diff < 604800000)
      return date.toLocaleDateString("en-US", { weekday: "short" });
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  formatMessageTime(ts) {
    if (!ts || ts === "null") return "";
    return new Date(ts).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  getDateString(ts) {
    if (!ts || ts === "null") return "";
    const date = new Date(ts);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
    });
  }

  showToast(msg, type = "info") {
    const container = document.getElementById("toastContainer");
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    const icon =
      type === "success"
        ? "fa-check-circle"
        : type === "error"
          ? "fa-exclamation-circle"
          : "fa-info-circle";
    toast.innerHTML = `<i class="fas ${icon}"></i> ${this.esc(msg)}`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(40px)";
      toast.style.transition = "all 0.3s";
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  destroy() {
    console.log("[DEBUG] destroy() called — cleaning up WS and polling");
    if (this.ws) this.ws.close();
    if (this.notifPollingInterval) clearInterval(this.notifPollingInterval);
  }

  openInitialConversationFromUrlOrStorage() {
    const urlParams = new URLSearchParams(window.location.search);
    const fromUrl = urlParams.get("conversationId");
    const fromStorage = sessionStorage.getItem("openConversationId");
    const rawId = fromUrl || fromStorage;

    if (!rawId) return;

    sessionStorage.removeItem("openConversationId");

    const conversationId = parseInt(rawId, 10);
    if (isNaN(conversationId)) return;

    const exists = this.conversations.some(
      (c) => c.conversationId === conversationId,
    );

    if (exists) {
      this.selectConversation(conversationId);
    }
  }
}

// ── Instantiate ──
console.log("[DEBUG] Creating MessagingSystem instance...");
const messagingSystem = new MessagingSystem();

window.addEventListener("beforeunload", () => {
  if (messagingSystem) messagingSystem.destroy();
});
