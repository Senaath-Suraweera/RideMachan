// Admins Manager - now hooked to backend signup endpoint
class AdminsManager {
  constructor() {
    this.admins = []; // will load from backend
    this.filteredAdmins = [];
    this.init();
  }

  async init() {
    this.setupEventListeners();
    await this.loadAdmins();
  }

  setupEventListeners() {
    const regForm = document.getElementById("registerAdminForm");
    if (regForm) {
      regForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.registerAdmin();
      });
    }
  }

  async loadAdmins() {
    try {
      const res = await fetch("/admin/list");
      if (res.ok) {
        const result = await res.json();
        this.admins = result.admins || [];
      }
    } catch (err) {
      console.error("Failed to load admins:", err);
    }
    this.applyFilters();
  }

  applyFilters() {
    this.filteredAdmins = [...this.admins];
    this.renderAdmins();
    this.updateAdminsCount();
  }

  renderAdmins() {
    const list = document.getElementById("adminsList");
    if (!list) return;
    list.innerHTML = "";

    this.filteredAdmins.forEach((admin) => {
      const card = this.createAdminCard(admin);

      // 🔗 attach delete event here
      const deleteBtn = card.querySelector('[data-action="delete"]');
      if (deleteBtn) {
        deleteBtn.addEventListener("click", () => {
          if (
            confirm(`Are you sure you want to delete admin #${admin.adminId}?`)
          ) {
            this.deleteAdmin(admin.adminId);
          }
        });
      }

      list.appendChild(card);
    });
  }

  // In AdminsManager class

  createAdminCard(admin) {
    const card = document.createElement("div");
    card.className = "admin-card";
    card.dataset.adminId = admin.adminId;

    card.innerHTML = `
    <div class="admin-info">
      <div class="admin-id">#${admin.adminId}</div>
      <div class="admin-details">
        <h3 class="admin-name">${this.escape(admin.username)}</h3>
        <p class="admin-permission">${this.escape(admin.email)}</p>
        <p>${this.escape(admin.phoneNumber)}</p>
      </div>
    </div>
    <div class="admin-actions">
      <button class="btn btn-secondary btn-sm" data-action="edit">Edit</button>
      <button class="btn btn-danger btn-sm" data-action="delete">Delete</button>
    </div>
  `;

    // Attach edit event
    const editBtn = card.querySelector('[data-action="edit"]');
    if (editBtn) {
      editBtn.addEventListener("click", () => {
        this.populateEditModal(admin);
        this.openEditAdminModal();
      });
    }

    return card;
  }

  populateEditModal(admin) {
    document.getElementById("editAdminId").value = admin.adminId;
    document.getElementById("editFullName").value = admin.username;
    document.getElementById("editEmail").value = admin.email;
    document.getElementById("editPhone").value = admin.phoneNumber;
  }

  async updateAdmin() {
    const id = document.getElementById("editAdminId").value;
    const username = document.getElementById("editFullName").value.trim();
    const email = document.getElementById("editEmail").value.trim();
    const phoneNumber = document.getElementById("editPhone").value.trim();

    const payload = { adminId: id, username, email, phoneNumber };

    try {
      const res = await fetch("/admin/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (result.status === "success") {
        this.closeEditAdminModal();
        this.toast("Admin updated successfully");
        await this.loadAdmins();
      } else {
        this.toast("Error: " + (result.message || "Update failed"));
      }
    } catch (err) {
      console.error("Update failed:", err);
      this.toast("Server error");
    }
  }

  async deleteAdmin(adminId) {
    try {
      const res = await fetch("/admin/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId }),
      });
      const result = await res.json();
      console.log("Delete response:", result);

      if (result.status === "success") {
        this.toast("Admin deleted successfully");
        await this.loadAdmins();
      } else {
        this.toast("Error: " + (result.message || "Delete failed"));
      }
    } catch (err) {
      console.error("Delete failed:", err);
      this.toast("Server error");
    }
  }

  updateAdminsCount() {
    const title = document.querySelector(".page-title");
    if (title) title.textContent = `Admins (${this.filteredAdmins.length})`;
  }

  // ---------- Modals ----------
  openRegisterAdminModal() {
    const modal = document.getElementById("registerAdminModal");
    modal.classList.add("show");
    modal.style.display = "flex";
    document.body.style.overflow = "hidden";
  }

  closeRegisterAdminModal() {
    const modal = document.getElementById("registerAdminModal");
    modal.classList.remove("show");
    modal.style.display = "none";
    document.body.style.overflow = "";
    document.getElementById("registerAdminForm")?.reset();
  }

  openEditAdminModal() {
    document.getElementById("editAdminModal").classList.add("show");
  }
  closeEditAdminModal() {
    document.getElementById("editAdminModal").classList.remove("show");
  }

  // ---------- Register Admin ----------
  async registerAdmin() {
    const form = document.getElementById("registerAdminForm");
    const data = Object.fromEntries(new FormData(form).entries());

    this.clearErrors("#registerAdminForm");

    if (data.password !== data.confirmPassword) {
      this.setError(
        `#registerAdminForm [name="confirmPassword"]`,
        "Passwords do not match"
      );
      return;
    }

    const payload = {
      username: data.fullName.trim(),
      email: data.email.trim(),
      phoneNumber: data.phone.trim(),
      password: data.password.trim(),
    };

    try {
      const res = await fetch("/admin/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();

      if (result.status === "success") {
        this.closeRegisterAdminModal();
        this.toast("Admin registered successfully");
        await this.loadAdmins();
      } else {
        this.toast("Error: " + (result.message || "Signup failed"));
      }
    } catch (err) {
      console.error("Signup failed:", err);
      this.toast("Server error");
    }
  }

  // ---------- Validation & helpers ----------
  setError(selector, message) {
    const input = document.querySelector(selector);
    if (!input) return;
    const group = input.closest(".form-group");
    if (!group) return;
    let err = group.querySelector(".error");
    if (!err) {
      err = document.createElement("div");
      err.className = "error";
      group.appendChild(err);
    }
    err.textContent = message;
  }

  clearErrors(formSelector) {
    document
      .querySelectorAll(`${formSelector} .error`)
      .forEach((e) => e.remove());
  }

  toast(message) {
    const el = document.createElement("div");
    el.textContent = message;
    el.style.cssText = `
      position: fixed;
      right: 16px;
      bottom: 16px;
      background: #0f172a;
      color: #fff;
      padding: 10px 14px;
      border-radius: 10px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.25);
      z-index: 1200;
    `;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2200);
  }

  escape(s) {
    return String(s || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
}

// ---------- Global helpers ----------
window.addEventListener("DOMContentLoaded", () => {
  window.adminsManager = new AdminsManager();
});

function searchAdmins() {
  window.adminsManager?.applyFilters();
}
function openRegisterAdminModal() {
  window.adminsManager?.openRegisterAdminModal();
}
function closeRegisterAdminModal() {
  window.adminsManager?.closeRegisterAdminModal();
}
function closeEditAdminModal() {
  window.adminsManager?.closeEditAdminModal();
}
function updateAdmin() {
  window.adminsManager?.updateAdmin();
}
