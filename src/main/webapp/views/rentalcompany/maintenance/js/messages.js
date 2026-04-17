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

    this.init();
  }

  async init() {
    try {
      await this.getSessionInfo();

      if (!this.actorType || this.actorId == null || isNaN(this.actorId)) {
        return;
      }

      this.setupEventListeners();
      await this.loadConversations();
      this.openInitialConversationFromUrlOrStorage();
      await this.loadAllowedTypes();
      this.connectWebSocket();
    } catch (e) {
      console.error("Messaging init failed:", e);
    }
  }

  async getSessionInfo() {
    try {
      const resp = await fetch("/api/session", { credentials: "include" });

      if (!resp.ok) {
        window.location.href = "/login.html";
        throw new Error("Not authenticated");
      }

      const data = await resp.json();

      if (
        !data.actorType ||
        data.actorId === undefined ||
        data.actorId === null
      ) {
        throw new Error("Session actor details missing");
      }

      this.actorType = String(data.actorType).toUpperCase();
      this.actorId = parseInt(data.actorId, 10);

      if (isNaN(this.actorId)) {
        throw new Error("Invalid actor ID");
      }
    } catch (e) {
      if (!String(e.message).includes("Not authenticated")) {
        window.location.href = "/login.html";
      }
      throw e;
    }
  }

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
  }

  async loadAllowedTypes() {
    try {
      const resp = await fetch("/api/chat/allowedTypes", {
        credentials: "include",
      });
      const data = await resp.json();

      if (data.ok) {
        this.allowedTypes = data.types || [];
      }
    } catch (e) {
      console.error("Failed to load allowed types:", e);
    }
  }

  connectWebSocket() {
    if (!this.actorType || this.actorId == null || isNaN(this.actorId)) return;

    if (this.ws && this.ws.readyState === WebSocket.OPEN) return;

    try {
      const proto = location.protocol === "https:" ? "wss:" : "ws:";
      const url = `${proto}//${location.host}/ws/chat/${this.actorType}/${this.actorId}`;
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (e) => {
        this.handleWsMessage(e.data);
      };

      this.ws.onerror = (e) => {
        console.error("WebSocket error:", e);
      };

      this.ws.onclose = () => {
        this.attemptReconnect();
      };
    } catch (e) {
      console.error("WebSocket connection failed:", e);
    }
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = 2000 * this.reconnectAttempts;
      setTimeout(() => this.connectWebSocket(), delay);
    }
  }

  handleWsMessage(raw) {
    try {
      const data = JSON.parse(raw);

      if (data.type === "NEW_MESSAGE") {
        const msg = data.message;

        if (msg.conversationId === this.currentConversationId) {
          this.addMessageToChat(msg);
          this.scrollToBottom();
          this.markAsRead(this.currentConversationId, msg.messageId);
        }

        this.loadConversations();
      }
    } catch (e) {
      console.error("Failed to parse WebSocket message:", e, raw);
    }
  }

  async loadConversations() {
    const container = document.getElementById("conversationsList");

    try {
      const resp = await fetch("/api/chat/conversations", {
        credentials: "include",
      });

      if (!resp.ok) {
        throw new Error(
          resp.status === 401
            ? "Not authenticated"
            : `Failed to load conversations (${resp.status})`,
        );
      }

      const data = await resp.json();

      if (data.ok) {
        this.conversations = data.conversations || [];
        this.renderConversations();
      } else {
        throw new Error(data.error || "Failed to load conversations");
      }
    } catch (e) {
      console.error("Failed to load conversations:", e);
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-exclamation-triangle"></i>
          <p>Error loading conversations</p>
          <p style="font-size:12px;margin-top:8px;color:#f72585;">${this.esc(e.message)}</p>
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
                <span class="conversation-type-badge ${badgeClass}">${this.esc(badgeLabel)}</span>
              </div>
              <span class="conversation-time">${this.esc(time)}</span>
            </div>
            <div class="conversation-preview">${this.esc(preview)}</div>
            ${unread > 0 ? `<span class="unread-count-badge">${unread}</span>` : ""}
          </div>`;
      })
      .join("");
  }

  filterConversations(term) {
    const items = document.querySelectorAll(".conversation-item");
    const value = term.toLowerCase().trim();

    items.forEach((item) => {
      const text = item.textContent.toLowerCase();
      item.style.display = text.includes(value) ? "block" : "none";
    });
  }

  async selectConversation(convId) {
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

  async loadMessages(convId) {
    try {
      const resp = await fetch(
        `/api/chat/messages?conversationId=${convId}&limit=${this.messageLimit}&offset=${this.messageOffset}`,
        { credentials: "include" },
      );

      const data = await resp.json();

      if (data.ok) {
        this.messages = (data.messages || []).reverse();

        if (this.messages.length > 0) {
          const lastMsgId = this.messages[this.messages.length - 1].messageId;
          this.markAsRead(convId, lastMsgId);
        }
      } else {
        throw new Error(data.error || "Failed to load messages");
      }
    } catch (e) {
      console.error("Failed to load messages:", e);
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
            <p>${this.esc(otherLabel || conv?.type || "Conversation")}</p>
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
      return `
        <div class="empty-state">
          <i class="fas fa-comment-slash"></i>
          <p>No messages yet</p>
          <p style="font-size:12px;margin-top:8px;">Start the conversation!</p>
        </div>`;
    }

    let html = "";
    let lastDate = null;

    this.messages.forEach((msg) => {
      const dateStr = this.getDateString(msg.sentAt);

      if (dateStr !== lastDate) {
        html += `<div class="date-separator">${this.esc(dateStr)}</div>`;
        lastDate = dateStr;
      }

      const isSent =
        msg.senderType === this.actorType && msg.senderId === this.actorId;

      const name = msg.senderName || `${msg.senderType} #${msg.senderId}`;
      const time = this.formatMessageTime(msg.sentAt);
      const initials = this.getInitials(name);

      html += `
        <div class="message ${isSent ? "sent" : "received"}">
          <div class="message-avatar">${this.esc(initials)}</div>
          <div class="message-content-wrapper">
            ${!isSent ? `<div class="message-sender">${this.esc(name)}</div>` : ""}
            <div class="message-bubble">${this.esc(msg.content)}</div>
            <div class="message-time">${this.esc(time)}</div>
          </div>
        </div>`;
    });

    return html;
  }

  addMessageToChat(message) {
    this.messages.push(message);

    const container = document.getElementById("messagesContainer");
    if (!container) return;

    const isSent =
      message.senderType === this.actorType &&
      message.senderId === this.actorId;

    const name =
      message.senderName || `${message.senderType} #${message.senderId}`;
    const time = this.formatMessageTime(message.sentAt);

    container.insertAdjacentHTML(
      "beforeend",
      `
      <div class="message ${isSent ? "sent" : "received"}">
        <div class="message-avatar">${this.esc(this.getInitials(name))}</div>
        <div class="message-content-wrapper">
          ${!isSent ? `<div class="message-sender">${this.esc(name)}</div>` : ""}
          <div class="message-bubble">${this.esc(message.content)}</div>
          <div class="message-time">${this.esc(time)}</div>
        </div>
      </div>`,
    );
  }

  sendMessage() {
    const input = document.getElementById("messageInput");
    const content = input?.value?.trim();

    if (!content || !this.currentConversationId) return;

    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.showToast("Connection lost. Reconnecting...", "error");
      this.connectWebSocket();
      return;
    }

    this.ws.send(
      JSON.stringify({
        type: "SEND_MESSAGE",
        conversationId: this.currentConversationId,
        content,
      }),
    );

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
      const container = document.getElementById("messagesContainer");
      if (container) container.scrollTop = container.scrollHeight;
    }, 100);
  }

  async markAsRead(convId, msgId) {
    try {
      await fetch("/api/chat/markRead", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        credentials: "include",
        body: `conversationId=${encodeURIComponent(convId)}&lastMessageId=${encodeURIComponent(msgId)}`,
      });
    } catch (e) {
      console.error("Failed to mark messages as read:", e);
    }
  }

  openNewConversationModal() {
    const modal = document.getElementById("newConversationModal");
    modal?.classList.add("active");

    const select = document.getElementById("userTypeSelect");
    select.innerHTML = '<option value="">-- Select Type --</option>';

    this.allowedTypes.forEach((type) => {
      const label = ACTOR_LABELS[type] || type;
      select.innerHTML += `<option value="${this.esc(type)}">${this.esc(label)}</option>`;
    });

    document.getElementById("userSelect").innerHTML =
      '<option value="">-- Select a user type first --</option>';

    const info = document.getElementById("permissionInfo");
    const infoText = document.getElementById("permissionInfoText");

    if (this.allowedTypes.length === 0) {
      info.style.display = "flex";
      infoText.textContent =
        "You do not have permission to start new conversations.";
    } else {
      info.style.display = "flex";
      infoText.textContent = `You can message: ${this.allowedTypes
        .map((t) => ACTOR_LABELS[t] || t)
        .join(", ")}`;
    }
  }

  closeNewConversationModal() {
    document.getElementById("newConversationModal")?.classList.remove("active");
  }

  async loadUsersForType(userType) {
    const select = document.getElementById("userSelect");

    if (!userType) {
      select.innerHTML =
        '<option value="">-- Select a user type first --</option>';
      return;
    }

    select.innerHTML = '<option value="">Loading...</option>';

    try {
      const resp = await fetch(
        `/api/chat/users?type=${encodeURIComponent(userType)}`,
        {
          credentials: "include",
        },
      );

      const data = await resp.json();

      if (data.ok && data.users.length > 0) {
        select.innerHTML = '<option value="">-- Select User --</option>';

        data.users.forEach((u) => {
          if (userType === this.actorType && u.id === this.actorId) return;

          select.innerHTML += `<option value="${u.id}">${this.esc(u.name)} (ID: ${u.id})</option>`;
        });
      } else if (data.ok) {
        select.innerHTML = '<option value="">No users found</option>';
      } else {
        select.innerHTML = `<option value="">Error: ${this.esc(data.error || "Failed")}</option>`;
      }
    } catch (e) {
      console.error("Failed to load users:", e);
      select.innerHTML = '<option value="">Error loading users</option>';
    }
  }

  async createNewConversation() {
    const userType = document.getElementById("userTypeSelect").value;
    const userId = document.getElementById("userSelect").value;

    if (!userType || !userId) {
      this.showToast("Please select both user type and user", "error");
      return;
    }

    try {
      const resp = await fetch("/api/chat/direct", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        credentials: "include",
        body: `toType=${encodeURIComponent(userType)}&toId=${encodeURIComponent(userId)}`,
      });

      const data = await resp.json();

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
      console.error("Failed to create conversation:", e);
      this.showToast("Failed to create conversation", "error");
    }
  }

  getInitials(name) {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  esc(text) {
    if (text == null) return "";
    const div = document.createElement("div");
    div.textContent = String(text);
    return div.innerHTML;
  }

  formatTime(ts) {
    if (!ts || ts === "null") return "";
    const date = new Date(ts);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;

    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

    if (diff < 604800000) {
      return date.toLocaleDateString("en-US", { weekday: "short" });
    }

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
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
    if (!container) return;

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
    if (this.ws) this.ws.close();
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

const messagingSystem = new MessagingSystem();

window.addEventListener("beforeunload", () => {
  if (messagingSystem) messagingSystem.destroy();
});
