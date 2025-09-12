// Messages JavaScript
document.addEventListener("DOMContentLoaded", function () {
  initializeConversations();
  initializeChat();
  initializeSearch();
  autoResizeTextarea();
  simulateRealTimeMessages();
});

// Initialize conversation functionality
function initializeConversations() {
  const conversationItems = document.querySelectorAll(".conversation-item");

  conversationItems.forEach((item) => {
    item.addEventListener("click", function () {
      selectConversation(this);
    });
  });
}

// Initialize chat functionality
function initializeChat() {
  const messageInput = document.getElementById("messageInput");
  const sendButton = document.getElementById("sendButton");

  // Update send button state based on input
  messageInput.addEventListener("input", function () {
    updateSendButtonState();
  });

  // Send message on Enter (but allow Shift+Enter for new line)
  messageInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
}

// Initialize search functionality
function initializeSearch() {
  const searchInput = document.getElementById("conversationSearch");
  let searchTimeout;

  searchInput.addEventListener("input", function () {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      searchConversations(this.value);
    }, 300);
  });
}

// Auto-resize textarea
function autoResizeTextarea() {
  const textarea = document.getElementById("messageInput");

  textarea.addEventListener("input", function () {
    this.style.height = "auto";
    this.style.height = Math.min(this.scrollHeight, 120) + "px";
  });
}

// Select conversation
function selectConversation(conversationElement) {
  // Remove active class from all conversations
  document.querySelectorAll(".conversation-item").forEach((item) => {
    item.classList.remove("active");
  });

  // Add active class to selected conversation
  conversationElement.classList.add("active");

  // Mark as read
  conversationElement.classList.remove("unread");
  const unreadBadge = conversationElement.querySelector(".unread-badge");
  if (unreadBadge) {
    unreadBadge.remove();
  }

  // Update chat header
  const conversationId = conversationElement.dataset.conversation;
  updateChatHeader(conversationElement);

  // Load messages for this conversation
  loadMessages(conversationId);

  // Update chat info panel
  updateChatInfo(conversationElement);
}

// Update chat header
function updateChatHeader(conversationElement) {
  const contactName =
    conversationElement.querySelector(".conversation-name").textContent;
  const avatar =
    conversationElement.querySelector(".avatar-circle").textContent;
  const statusIndicator =
    conversationElement.querySelector(".status-indicator").classList;

  // Update header info
  document.querySelector(".chat-header .contact-name").textContent =
    contactName;
  document.querySelector(".chat-header .avatar-circle").textContent = avatar;

  // Update status
  const chatStatusIndicator = document.querySelector(
    ".chat-header .status-indicator"
  );
  chatStatusIndicator.className = "status-indicator";
  if (statusIndicator.contains("online"))
    chatStatusIndicator.classList.add("online");
  else if (statusIndicator.contains("away"))
    chatStatusIndicator.classList.add("away");
  else chatStatusIndicator.classList.add("offline");

  // Update status text
  let statusText = "Offline";
  if (statusIndicator.contains("online")) statusText = "Online";
  else if (statusIndicator.contains("away")) statusText = "Away";

  const contactType = contactName.includes("Support")
    ? "Support"
    : contactName.includes("Customer")
    ? "Customer"
    : "Rental Company";

  document.querySelector(
    ".contact-status"
  ).textContent = `${statusText} • ${contactType}`;
}

// Load messages for conversation
function loadMessages(conversationId) {
  // In a real app, this would fetch messages from the server
  // For demo purposes, we'll show different message sets

  const chatMessages = document.getElementById("chatMessages");

  // Clear existing messages except the current ones (for demo)
  // In a real app, you'd replace all messages

  console.log(`Loading messages for conversation ${conversationId}`);

  // Scroll to bottom
  setTimeout(() => {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }, 100);
}

// Update chat info panel
function updateChatInfo(conversationElement) {
  const contactName =
    conversationElement.querySelector(".conversation-name").textContent;
  const avatar =
    conversationElement.querySelector(".avatar-circle").textContent;

  // Update contact profile in info panel
  document.querySelector(".contact-profile h4").textContent = contactName;
  document.querySelector(".profile-avatar .avatar-circle").textContent = avatar;

  // Update contact details (would come from API in real app)
  const contactDetails = {
    "RentaCar Solutions": {
      email: "contact@rentacarsolutions.com",
      phone: "+94 11 234 5678",
      location: "Colombo, Sri Lanka",
      license: "BL-2024001234",
    },
    "John Smith (Customer)": {
      email: "john.smith@email.com",
      phone: "+94 77 123 4567",
      location: "Kandy, Sri Lanka",
      license: "N/A",
    },
    // Add more contacts as needed
  };

  const details = contactDetails[contactName] || {
    email: "N/A",
    phone: "N/A",
    location: "N/A",
    license: "N/A",
  };

  const detailItems = document.querySelectorAll(
    ".contact-details-section .detail-item"
  );
  detailItems[0].querySelector("span").textContent = details.email;
  detailItems[1].querySelector("span").textContent = details.phone;
  detailItems[2].querySelector("span").textContent = details.location;
  detailItems[3].querySelector("span").textContent = details.license;
}

// Send message
function sendMessage() {
  const messageInput = document.getElementById("messageInput");
  const messageText = messageInput.value.trim();

  if (!messageText) return;

  // Create message element
  const messageElement = createMessageElement(
    "outgoing",
    messageText,
    new Date()
  );

  // Add to chat
  const chatMessages = document.getElementById("chatMessages");
  const typingIndicator = document.getElementById("typingIndicator");
  chatMessages.insertBefore(messageElement, typingIndicator);

  // Clear input
  messageInput.value = "";
  messageInput.style.height = "auto";
  updateSendButtonState();

  // Scroll to bottom
  chatMessages.scrollTop = chatMessages.scrollHeight;

  // Update conversation preview
  updateConversationPreview(messageText);

  // Simulate typing indicator and response
  setTimeout(() => {
    showTypingIndicator();
    setTimeout(() => {
      hideTypingIndicator();
      simulateIncomingMessage();
    }, 2000);
  }, 500);
}

// Create message element
function createMessageElement(type, text, timestamp) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${type}`;

  const timeString = timestamp.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (type === "incoming") {
    messageDiv.innerHTML = `
            <div class="message-avatar">
                <div class="avatar-circle">RC</div>
            </div>
            <div class="message-content">
                <div class="message-bubble">
                    <p>${text}</p>
                </div>
                <div class="message-time">Today ${timeString}</div>
            </div>
        `;
  } else {
    messageDiv.innerHTML = `
            <div class="message-content">
                <div class="message-bubble">
                    <p>${text}</p>
                </div>
                <div class="message-time">Today ${timeString}</div>
            </div>
        `;
  }

  // Add animation
  messageDiv.style.opacity = "0";
  messageDiv.style.transform = "translateY(20px)";

  setTimeout(() => {
    messageDiv.style.opacity = "1";
    messageDiv.style.transform = "translateY(0)";
    messageDiv.style.transition = "all 0.3s ease";
  }, 10);

  return messageDiv;
}

// Update conversation preview
function updateConversationPreview(messageText) {
  const activeConversation = document.querySelector(
    ".conversation-item.active"
  );
  if (activeConversation) {
    const preview = activeConversation.querySelector(".conversation-preview");
    preview.textContent =
      messageText.length > 50
        ? messageText.substring(0, 50) + "..."
        : messageText;

    const time = activeConversation.querySelector(".conversation-time");
    time.textContent = "now";

    // Move conversation to top
    const conversationsList = document.getElementById("conversationsList");
    conversationsList.insertBefore(
      activeConversation,
      conversationsList.firstChild
    );
  }
}

// Show/hide typing indicator
function showTypingIndicator() {
  const typingIndicator = document.getElementById("typingIndicator");
  typingIndicator.style.display = "flex";

  const chatMessages = document.getElementById("chatMessages");
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function hideTypingIndicator() {
  const typingIndicator = document.getElementById("typingIndicator");
  typingIndicator.style.display = "none";
}

// Simulate incoming message
function simulateIncomingMessage() {
  const responses = [
    "Thank you for your message! I'll get back to you shortly.",
    "That sounds great! Let me check the availability and get back to you.",
    "I understand your concern. Let me discuss this with our team.",
    "Absolutely! We can arrange that for you.",
    "Thank you for choosing our service. We appreciate your business!",
  ];

  const randomResponse =
    responses[Math.floor(Math.random() * responses.length)];
  const messageElement = createMessageElement(
    "incoming",
    randomResponse,
    new Date()
  );

  const chatMessages = document.getElementById("chatMessages");
  const typingIndicator = document.getElementById("typingIndicator");
  chatMessages.insertBefore(messageElement, typingIndicator);

  chatMessages.scrollTop = chatMessages.scrollHeight;

  // Update conversation with new message
  updateConversationWithIncoming(randomResponse);
}

// Update conversation with incoming message
function updateConversationWithIncoming(messageText) {
  const activeConversation = document.querySelector(
    ".conversation-item.active"
  );
  if (activeConversation) {
    const preview = activeConversation.querySelector(".conversation-preview");
    preview.textContent =
      messageText.length > 50
        ? messageText.substring(0, 50) + "..."
        : messageText;

    const time = activeConversation.querySelector(".conversation-time");
    time.textContent = "now";
  }
}

// Update send button state
function updateSendButtonState() {
  const messageInput = document.getElementById("messageInput");
  const sendButton = document.getElementById("sendButton");

  if (messageInput.value.trim()) {
    sendButton.disabled = false;
    sendButton.style.background = "#1abc9c";
  } else {
    sendButton.disabled = true;
    sendButton.style.background = "#bdc3c7";
  }
}

// Search conversations
function searchConversations(query) {
  const conversations = document.querySelectorAll(".conversation-item");

  conversations.forEach((conversation) => {
    const name = conversation
      .querySelector(".conversation-name")
      .textContent.toLowerCase();
    const preview = conversation
      .querySelector(".conversation-preview")
      .textContent.toLowerCase();

    if (
      name.includes(query.toLowerCase()) ||
      preview.includes(query.toLowerCase())
    ) {
      conversation.style.display = "flex";
    } else {
      conversation.style.display = query ? "none" : "flex";
    }
  });
}

// Filter conversations
function filterConversations(filter) {
  // Update active filter tab
  document.querySelectorAll(".filter-tab").forEach((tab) => {
    tab.classList.remove("active");
  });
  document.querySelector(`[data-filter="${filter}"]`).classList.add("active");

  const conversations = document.querySelectorAll(".conversation-item");

  conversations.forEach((conversation) => {
    let shouldShow = true;

    switch (filter) {
      case "unread":
        shouldShow = conversation.classList.contains("unread");
        break;
      case "important":
        shouldShow = conversation.classList.contains("important");
        break;
      case "all":
      default:
        shouldShow = true;
        break;
    }

    conversation.style.display = shouldShow ? "flex" : "none";
  });
}

// Toggle chat info panel
function toggleChatInfo() {
  const infoPanel = document.getElementById("chatInfoPanel");
  infoPanel.classList.toggle("active");

  // Update layout on desktop
  if (window.innerWidth > 1200) {
    const messagesLayout = document.querySelector(".messages-layout");
    if (infoPanel.classList.contains("active")) {
      messagesLayout.style.gridTemplateColumns = "350px 1fr 300px";
    } else {
      messagesLayout.style.gridTemplateColumns = "350px 1fr";
    }
  }
}

// Toggle important flag
function toggleImportant() {
  const activeConversation = document.querySelector(
    ".conversation-item.active"
  );
  if (activeConversation) {
    activeConversation.classList.toggle("important");

    const importantFlag = activeConversation.querySelector(".important-flag");
    if (activeConversation.classList.contains("important")) {
      if (!importantFlag) {
        const meta = activeConversation.querySelector(".conversation-meta");
        const flag = document.createElement("span");
        flag.className = "important-flag";
        flag.textContent = "⭐";
        meta.appendChild(flag);
      }
    } else {
      if (importantFlag) {
        importantFlag.remove();
      }
    }
  }
}

// Handle key press in message input
function handleKeyPress(event) {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
}

// Attach file functionality
function attachFile() {
  // In a real app, this would open a file picker
  alert("File attachment feature would be implemented here");
}

// Add emoji functionality
function addEmoji() {
  // In a real app, this would open an emoji picker
  const messageInput = document.getElementById("messageInput");
  messageInput.value += "😊";
  messageInput.focus();
  updateSendButtonState();
}

// New message modal functions
function startNewConversation() {
  const modal = document.getElementById("newMessageModal");
  modal.classList.add("active");
  document.body.style.overflow = "hidden";

  // Reset form
  document.getElementById("newMessageForm").reset();
}

function closeNewMessageModal() {
  const modal = document.getElementById("newMessageModal");
  modal.classList.remove("active");
  document.body.style.overflow = "";
}

// Handle new message form submission
document
  .getElementById("newMessageForm")
  .addEventListener("submit", function (e) {
    e.preventDefault();

    const recipient = document.getElementById("recipientInput").value;
    const subject = document.getElementById("subjectInput").value;
    const messageBody = document.getElementById("messageBodyInput").value;

    if (!recipient || !messageBody) {
      alert("Please fill in recipient and message fields");
      return;
    }

    // Simulate sending new message
    console.log("Sending new message:", { recipient, subject, messageBody });
    alert("Message sent successfully!");

    closeNewMessageModal();
  });

// Simulate real-time messages
function simulateRealTimeMessages() {
  setInterval(() => {
    // Random chance of receiving a new message
    if (Math.random() > 0.98) {
      // 2% chance every interval
      addNewIncomingMessage();
    }
  }, 5000); // Check every 5 seconds
}

function addNewIncomingMessage() {
  const conversations = document.querySelectorAll(
    ".conversation-item:not(.active)"
  );
  if (conversations.length === 0) return;

  const randomConversation =
    conversations[Math.floor(Math.random() * conversations.length)];

  // Add unread badge
  randomConversation.classList.add("unread");

  const meta = randomConversation.querySelector(".conversation-meta");
  let unreadBadge = meta.querySelector(".unread-badge");

  if (unreadBadge) {
    const count = parseInt(unreadBadge.textContent) + 1;
    unreadBadge.textContent = count;
  } else {
    unreadBadge = document.createElement("span");
    unreadBadge.className = "unread-badge";
    unreadBadge.textContent = "1";
    meta.appendChild(unreadBadge);
  }

  // Update preview and time
  const preview = randomConversation.querySelector(".conversation-preview");
  const time = randomConversation.querySelector(".conversation-time");

  const newMessages = [
    "New message received",
    "Quick question about your vehicle",
    "Booking confirmation needed",
    "Payment processed successfully",
  ];

  preview.textContent =
    newMessages[Math.floor(Math.random() * newMessages.length)];
  time.textContent = "now";

  // Move to top of list
  const conversationsList = document.getElementById("conversationsList");
  conversationsList.insertBefore(
    randomConversation,
    conversationsList.firstChild
  );

  // Flash animation
  randomConversation.style.background = "#e8f5e8";
  setTimeout(() => {
    randomConversation.style.background = "";
  }, 1000);
}

// Close modals when clicking outside
document.addEventListener("click", function (e) {
  const modal = document.getElementById("newMessageModal");
  if (e.target === modal) {
    closeNewMessageModal();
  }
});

// Close modals with escape key
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    closeNewMessageModal();

    // Also close info panel
    const infoPanel = document.getElementById("chatInfoPanel");
    if (infoPanel.classList.contains("active")) {
      toggleChatInfo();
    }
  }
});

// Responsive behavior
window.addEventListener("resize", function () {
  const messagesLayout = document.querySelector(".messages-layout");
  const infoPanel = document.getElementById("chatInfoPanel");

  if (window.innerWidth <= 1200) {
    messagesLayout.style.gridTemplateColumns = "350px 1fr";
  } else if (infoPanel.classList.contains("active")) {
    messagesLayout.style.gridTemplateColumns = "350px 1fr 300px";
  }

  if (window.innerWidth <= 768) {
    messagesLayout.style.gridTemplateColumns = "1fr";
  }
});

// Initialize with first conversation selected
setTimeout(() => {
  const firstConversation = document.querySelector(".conversation-item");
  if (firstConversation) {
    selectConversation(firstConversation);
  }
}, 100);

// Export functions for global access
window.filterConversations = filterConversations;
window.toggleChatInfo = toggleChatInfo;
window.toggleImportant = toggleImportant;
window.handleKeyPress = handleKeyPress;
window.attachFile = attachFile;
window.addEmoji = addEmoji;
window.startNewConversation = startNewConversation;
window.closeNewMessageModal = closeNewMessageModal;
window.sendMessage = sendMessage;
