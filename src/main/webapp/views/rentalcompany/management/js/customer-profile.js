// ====== Message Staff Popup JS ======

// Create the modal dynamically
const messageModal = document.createElement("div");
messageModal.id = "messagecustomerModal";
messageModal.style.display = "none";
messageModal.style.position = "fixed";
messageModal.style.top = "0";
messageModal.style.left = "0";
messageModal.style.width = "100%";
messageModal.style.height = "100%";
messageModal.style.backgroundColor = "rgba(0,0,0,0.5)";
messageModal.style.zIndex = "1000";
messageModal.style.justifyContent = "center";
messageModal.style.alignItems = "center";

messageModal.innerHTML = `
  <div style="background:#fff; padding:20px; border-radius:8px; width:400px; max-width:90%; position:relative;">
    <span id="closeMessageModal" style="position:absolute; top:10px; right:15px; font-size:20px; cursor:pointer;">&times;</span>
    <h2>Message customer</h2>
    <p id="messagecustomerName" style="font-weight:600;"></p>
    <textarea id="messageContent" placeholder="Type your message..." style="width:100%; height:120px; margin-top:10px; padding:8px; border:1px solid #ccc; border-radius:4px;"></textarea>
    <button id="sendMessageBtn" style="margin-top:10px; padding:10px 20px; background:#4CAF50; color:#fff; border:none; border-radius:4px; cursor:pointer;">Send</button>
  </div>
`;

document.body.appendChild(messageModal);

function messageCustomer(button) {
    const customerName = document.querySelector(".customer-details h3").textContent;

  document.getElementById("messagecustomerName").textContent = `To: ${customerName}`;
  document.getElementById("messageContent").value = "";
  messageModal.style.display = "flex";
  document.body.style.overflow = "hidden";
}

// Attach to all buttons with class "message"
const messageButtons = document.getElementsByClassName("message");
for (let i = 0; i < messageButtons.length; i++) {
  messageButtons[i].addEventListener("click", function () {
    messageCustomer();
  });
}

// Close Message Modal
function closeMessageModal() {
  messageModal.style.display = "none";
  document.body.style.overflow = "auto";
}

// Send Message
document.getElementById("sendMessageBtn").addEventListener("click", () => {
  const message = document.getElementById("messageContent").value.trim();
  if (!message) {
    alert("Please enter a message.");
    return;
  }

  console.log("[v0] Message sent:", message);
  alert("Message sent successfully!");
  closeMessageModal();
});

// Close modal via close button
document.getElementById("closeMessageModal").addEventListener("click", closeMessageModal);

// Close modal when clicking outside
window.addEventListener("click", (event) => {
  if (event.target === messageModal) {
    closeMessageModal();
  }
});

// Close modal with Escape key
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeMessageModal();
  }
});