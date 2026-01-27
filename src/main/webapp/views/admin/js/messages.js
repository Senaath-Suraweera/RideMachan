// Messages Page JavaScript - RideMachan Messaging System

class MessagingSystem {
  constructor() {
    this.ws = null;
    this.currentConversationId = null;
    this.conversations = [];
    this.messages = [];
    this.actorType = null;
    this.actorId = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.messageOffset = 0;
    this.messageLimit = 50;

    this.init();
  }

  init() {
    this.getSessionInfo().then(() => {
      this.setupEventListeners();
      this.loadConversations();
    });
  }

  // Get session information
  async getSessionInfo() {
    // Try to get from sessionStorage first
    let actorType = sessionStorage.getItem("actorType");
    let actorId = sessionStorage.getItem("actorId");

    // If not in sessionStorage, try to fetch from server session
    if (!actorType || !actorId) {
      try {
        const response = await fetch("/api/session", {
          method: "GET",
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          actorType = data.actorType;
          actorId = data.actorId;

          // Store for future use
          sessionStorage.setItem("actorType", actorType);
          sessionStorage.setItem("actorId", actorId);
        }
      } catch (error) {
        console.error("Failed to get session info:", error);
      }
    }

    this.actorType = actorType || "ADMIN";
    this.actorId = parseInt(actorId) || 1;

    console.log("Session Info:", {
      actorType: this.actorType,
      actorId: this.actorId,
    });
  }

  // Setup all event listeners
  setupEventListeners() {
    // New conversation button
    document
      .getElementById("newConversationBtn")
      ?.addEventListener("click", () => {
        this.openNewConversationModal();
      });

    // Modal controls
    document.getElementById("closeModalBtn")?.addEventListener("click", () => {
      this.closeNewConversationModal();
    });

    document.getElementById("cancelModalBtn")?.addEventListener("click", () => {
      this.closeNewConversationModal();
    });

    document.querySelector(".modal-overlay")?.addEventListener("click", () => {
      this.closeNewConversationModal();
    });

    // User type selection
    document
      .getElementById("userTypeSelect")
      ?.addEventListener("change", (e) => {
        this.loadUsersForType(e.target.value);
      });

    // Start conversation
    document
      .getElementById("startConversationBtn")
      ?.addEventListener("click", () => {
        this.createNewConversation();
      });

    // Search conversations
    document
      .getElementById("conversationSearch")
      ?.addEventListener("input", (e) => {
        this.filterConversations(e.target.value);
      });

    // Handle Enter key in search
    document
      .getElementById("conversationSearch")
      ?.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
        }
      });
  }

  // WebSocket connection
  connectWebSocket() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    try {
      // Determine WebSocket protocol based on page protocol
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";

      // Build WebSocket URL
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws/chat/${this.actorType}/${this.actorId}`;

      console.log("Connecting to WebSocket:", wsUrl);

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log("WebSocket connected successfully");
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        console.log("WebSocket message received:", event.data);
        this.handleWebSocketMessage(event.data);
      };

      this.ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      this.ws.onclose = (event) => {
        console.log(
          "WebSocket disconnected. Code:",
          event.code,
          "Reason:",
          event.reason
        );
        this.attemptReconnect();
      };
    } catch (error) {
      console.error("Error connecting to WebSocket:", error);
      this.showError("WebSocket connection failed: " + error.message);
    }
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Reconnecting... Attempt ${this.reconnectAttempts}`);
      setTimeout(() => this.connectWebSocket(), 2000 * this.reconnectAttempts);
    }
  }

  handleWebSocketMessage(data) {
    try {
      const message = JSON.parse(data);

      if (message.type === "NEW_MESSAGE") {
        const newMsg = message.message;

        // Add message to current conversation if it matches
        if (newMsg.conversationId === this.currentConversationId) {
          this.addMessageToChat(newMsg);
          this.scrollToBottom();

          // Mark as read
          this.markAsRead(this.currentConversationId, newMsg.messageId);
        }

        // Update conversation in sidebar
        this.loadConversations();
      }
    } catch (error) {
      console.error("Error handling WebSocket message:", error);
    }
  }

  // Load conversations list
  async loadConversations() {
    const listContainer = document.getElementById("conversationsList");

    try {
      console.log("Loading conversations...");

      const response = await fetch("/api/chat/conversations", {
        method: "GET",
        credentials: "include",
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Not authenticated. Please login again.");
        }
        throw new Error(`Failed to load conversations: ${response.status}`);
      }

      const data = await response.json();
      console.log("Conversations data:", data);

      if (data.ok) {
        this.conversations = data.conversations || [];
        this.renderConversations();

        // Connect WebSocket after loading conversations
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
          this.connectWebSocket();
        }
      } else {
        throw new Error(data.error || "Failed to load conversations");
      }
    } catch (error) {
      console.error("Error loading conversations:", error);

      listContainer.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-exclamation-triangle"></i>
          <p>Error loading conversations</p>
          <p style="font-size: 12px; margin-top: 8px; color: #f72585;">${error.message}</p>
          <button class="btn btn-primary" onclick="messagingSystem.loadConversations()" style="margin-top: 16px;">
            <i class="fas fa-redo"></i> Retry
          </button>
        </div>
      `;
    }
  }

  // Render conversations in sidebar
  renderConversations() {
    const listContainer = document.getElementById("conversationsList");

    if (!this.conversations || this.conversations.length === 0) {
      listContainer.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-inbox"></i>
          <p>No conversations yet</p>
          <p style="font-size: 12px; margin-top: 8px;">Start a new conversation to get started</p>
        </div>
      `;
      return;
    }

    let html = "";
    this.conversations.forEach((conv) => {
      const isActive = conv.conversationId === this.currentConversationId;
      const title = conv.title || this.getConversationTitle(conv);
      const preview = conv.lastMessage || "No messages yet";
      const time = this.formatTime(conv.lastTime);

      html += `
        <div class="conversation-item ${isActive ? "active" : ""}" 
             data-conversation-id="${conv.conversationId}"
             onclick="messagingSystem.selectConversation(${
               conv.conversationId
             })">
          <div class="conversation-header">
            <div class="conversation-name">
              ${this.escapeHtml(title)}
              <span class="conversation-type-badge">${conv.type}</span>
            </div>
            <span class="conversation-time">${time}</span>
          </div>
          <div class="conversation-preview">${this.escapeHtml(preview)}</div>
        </div>
      `;
    });

    listContainer.innerHTML = html;
  }

  getConversationTitle(conv) {
    // For direct conversations, we'd typically show the other person's name
    // This would require additional data from the backend
    return conv.type === "DIRECT"
      ? "Direct Message"
      : conv.title || "Conversation";
  }

  // Filter conversations by search term
  filterConversations(searchTerm) {
    const items = document.querySelectorAll(".conversation-item");
    const term = searchTerm.toLowerCase().trim();

    items.forEach((item) => {
      const name = item
        .querySelector(".conversation-name")
        .textContent.toLowerCase();
      const preview = item
        .querySelector(".conversation-preview")
        .textContent.toLowerCase();

      if (name.includes(term) || preview.includes(term)) {
        item.style.display = "block";
      } else {
        item.style.display = "none";
      }
    });
  }

  // Select a conversation
  async selectConversation(conversationId) {
    this.currentConversationId = conversationId;
    this.messageOffset = 0;
    this.messages = [];

    // Update active state in sidebar
    document.querySelectorAll(".conversation-item").forEach((item) => {
      item.classList.remove("active");
    });
    document
      .querySelector(`[data-conversation-id="${conversationId}"]`)
      ?.classList.add("active");

    // Load messages
    await this.loadMessages(conversationId);
    this.renderChatArea();
    this.scrollToBottom();
  }

  // Load messages for a conversation
  async loadMessages(conversationId) {
    try {
      const response = await fetch(
        `/api/chat/messages?conversationId=${conversationId}&limit=${this.messageLimit}&offset=${this.messageOffset}`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to load messages");
      }

      const data = await response.json();

      if (data.ok) {
        // Reverse to get chronological order (oldest to newest)
        this.messages = data.messages.reverse();

        // Mark last message as read
        if (this.messages.length > 0) {
          const lastMessage = this.messages[this.messages.length - 1];
          this.markAsRead(conversationId, lastMessage.messageId);
        }
      }
    } catch (error) {
      console.error("Error loading messages:", error);
      this.showError("Failed to load messages");
    }
  }

  // Render the chat area
  renderChatArea() {
    const chatArea = document.getElementById("chatArea");

    if (!this.currentConversationId) {
      chatArea.innerHTML = `
        <div class="no-conversation-selected">
          <i class="fas fa-comments"></i>
          <h3>Select a conversation</h3>
          <p>Choose a conversation from the sidebar or start a new one</p>
        </div>
      `;
      return;
    }

    const conversation = this.conversations.find(
      (c) => c.conversationId === this.currentConversationId
    );
    const title = conversation
      ? this.getConversationTitle(conversation)
      : "Chat";

    chatArea.innerHTML = `
      <div class="chat-header">
        <div class="chat-user-info">
          <div class="chat-user-avatar">
            ${this.getInitials(title)}
          </div>
          <div class="chat-user-details">
            <h3>${this.escapeHtml(title)}</h3>
            <p>${conversation?.type || "Conversation"}</p>
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
            <textarea 
              id="messageInput" 
              placeholder="Type a message..." 
              rows="1"
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
      </div>
    `;
  }

  // Render messages HTML
  renderMessages() {
    if (this.messages.length === 0) {
      return `
        <div class="empty-state">
          <i class="fas fa-comment-slash"></i>
          <p>No messages yet</p>
          <p style="font-size: 12px; margin-top: 8px;">Start the conversation!</p>
        </div>
      `;
    }

    let html = "";
    let lastDate = null;

    this.messages.forEach((msg, index) => {
      const messageDate = this.getDateString(msg.sentAt);

      // Add date separator if date changed
      if (messageDate !== lastDate) {
        html += `<div class="date-separator">${messageDate}</div>`;
        lastDate = messageDate;
      }

      const isSent =
        msg.senderType === this.actorType && msg.senderId === this.actorId;
      const senderName = this.getSenderName(msg);
      const time = this.formatMessageTime(msg.sentAt);
      const initials = this.getInitials(senderName);

      html += `
        <div class="message ${isSent ? "sent" : "received"}">
          <div class="message-avatar">${initials}</div>
          <div class="message-content-wrapper">
            ${
              !isSent
                ? `<div class="message-sender">${this.escapeHtml(
                    senderName
                  )}</div>`
                : ""
            }
            <div class="message-bubble">${this.escapeHtml(msg.content)}</div>
            <div class="message-time">${time}</div>
          </div>
        </div>
      `;
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
    const senderName = this.getSenderName(message);
    const time = this.formatMessageTime(message.sentAt);
    const initials = this.getInitials(senderName);

    const messageHTML = `
      <div class="message ${isSent ? "sent" : "received"}">
        <div class="message-avatar">${initials}</div>
        <div class="message-content-wrapper">
          ${
            !isSent
              ? `<div class="message-sender">${this.escapeHtml(
                  senderName
                )}</div>`
              : ""
          }
          <div class="message-bubble">${this.escapeHtml(message.content)}</div>
          <div class="message-time">${time}</div>
        </div>
      </div>
    `;

    container.insertAdjacentHTML("beforeend", messageHTML);
  }

  getSenderName(message) {
    // In a real app, we'd fetch actual user names
    return `${message.senderType} #${message.senderId}`;
  }

  getInitials(name) {
    if (!name) return "?";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  // Send a message
  sendMessage() {
    const input = document.getElementById("messageInput");
    const content = input?.value?.trim();

    if (!content || !this.currentConversationId) {
      return;
    }

    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.showError("Connection lost. Reconnecting...");
      this.connectWebSocket();
      return;
    }

    const messageData = {
      type: "SEND_MESSAGE",
      conversationId: this.currentConversationId,
      content: content,
    };

    try {
      this.ws.send(JSON.stringify(messageData));
      input.value = "";
      this.autoResize(input);
    } catch (error) {
      console.error("Error sending message:", error);
      this.showError("Failed to send message");
    }
  }

  handleInputKeypress(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  autoResize(textarea) {
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
  }

  handleAttachment() {
    // Placeholder for attachment functionality
    alert("Attachment feature coming soon!");
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
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 100);
  }

  // Mark conversation as read
  async markAsRead(conversationId, messageId) {
    try {
      await fetch("/api/chat/markRead", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        credentials: "include",
        body: `conversationId=${conversationId}&lastMessageId=${messageId}`,
      });
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  }

  // New conversation modal
  openNewConversationModal() {
    document.getElementById("newConversationModal")?.classList.add("active");
    document.getElementById("userTypeSelect").value = "";
    document.getElementById("userSelect").innerHTML =
      '<option value="">-- Select a user type first --</option>';
  }

  closeNewConversationModal() {
    document.getElementById("newConversationModal")?.classList.remove("active");
  }

  // Load users for selected type
  async loadUsersForType(userType) {
    const userSelect = document.getElementById("userSelect");

    if (!userType) {
      userSelect.innerHTML =
        '<option value="">-- Select a user type first --</option>';
      return;
    }

    userSelect.innerHTML = '<option value="">Loading...</option>';

    // In a real application, you would fetch actual users from an API
    // For now, we'll create mock data
    setTimeout(() => {
      userSelect.innerHTML = `
        <option value="">-- Select User --</option>
        <option value="1">Sample User 1 (${userType})</option>
        <option value="2">Sample User 2 (${userType})</option>
        <option value="3">Sample User 3 (${userType})</option>
      `;
    }, 300);
  }

  // Create new conversation
  async createNewConversation() {
    const userType = document.getElementById("userTypeSelect").value;
    const userId = document.getElementById("userSelect").value;

    if (!userType || !userId) {
      alert("Please select both user type and user");
      return;
    }

    try {
      const response = await ("/api/chat/direct",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        credentials: "include",
        body: `toType=${userType}&toId=${userId}`,
      });

      if (!response.ok) {
        throw new Error("Failed to create conversation");
      }

      const data = await response.json();

      if (data.ok) {
        this.closeNewConversationModal();
        await this.loadConversations();
        this.selectConversation(data.conversationId);
      }
    } catch (error) {
      console.error("Error creating conversation:", error);
      this.showError("Failed to create conversation");
    }
  }

  // Utility functions
  formatTime(timestamp) {
    if (!timestamp || timestamp === "null") return "";

    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    // Less than 1 minute
    if (diff < 60000) {
      return "Just now";
    }

    // Less than 1 hour
    if (diff < 3600000) {
      const mins = Math.floor(diff / 60000);
      return `${mins}m ago`;
    }

    // Today
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    // Yesterday
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }

    // This week
    if (diff < 604800000) {
      return date.toLocaleDateString("en-US", { weekday: "short" });
    }

    // Older
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  formatMessageTime(timestamp) {
    if (!timestamp || timestamp === "null") return "";

    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  getDateString(timestamp) {
    if (!timestamp || timestamp === "null") return "";

    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year:
          date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
      });
    }
  }

  escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  showError(message) {
    // Simple error display - you can enhance this
    console.error(message);

    // You could add a toast notification here
    const errorDiv = document.createElement("div");
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #f72585;
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      z-index: 10000;
      animation: slideInRight 0.3s ease;
    `;
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);

    setTimeout(() => {
      errorDiv.style.animation = "slideOutRight 0.3s ease";
      setTimeout(() => errorDiv.remove(), 300);
    }, 3000);
  }

  // Cleanup on page unload
  destroy() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

// Initialize the messaging system
let messagingSystem;

document.addEventListener("DOMContentLoaded", () => {
  // FOR TESTING: Set default session if not exists
  // Remove this in production - session should come from login
  if (!sessionStorage.getItem("actorType")) {
    sessionStorage.setItem("actorType", "ADMIN");
    sessionStorage.setItem("actorId", "1");
    console.warn("Using default session data for testing");
  }

  messagingSystem = new MessagingSystem();
});

// Cleanup on page unload
window.addEventListener("beforeunload", () => {
  if (messagingSystem) {
    messagingSystem.destroy();
  }
});
