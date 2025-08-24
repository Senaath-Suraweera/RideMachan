// Admins Page JavaScript - modeled after Customers manager
class AdminsManager {
  constructor() {
    // Seed admins (replace with API in production)
    this.admins = [
      {
        id: 1,
        fullName: "Kaviru Hapuarachchi",
        email: "kaviru@ridemachan.lk",
        phone: "+94 77 345 6789",
        employeeId: "RM-OPS-1001",
        permissionLevel: "super-admin",
        department: "operations",
        status: "active",
        createdAt: "2024-06-18T10:00:00Z",
      },
      {
        id: 2,
        fullName: "Sanjalee Dassanayake",
        email: "sanjalee@ridemachan.lk",
        phone: "+94 71 123 4567",
        employeeId: "RM-CS-1057",
        permissionLevel: "admin",
        department: "customer-service",
        status: "active",
        createdAt: "2024-12-01T12:30:00Z",
      },
      {
        id: 3,
        fullName: "Ishara Fernando",
        email: "ishara@ridemachan.lk",
        phone: "+94 70 234 5678",
        employeeId: "RM-MKT-1103",
        permissionLevel: "moderator",
        department: "marketing",
        status: "inactive",
        createdAt: "2023-09-20T09:00:00Z",
      },
      {
        id: 4,
        fullName: "Emily Brown",
        email: "emily@ridemachan.lk",
        phone: "+94 76 987 6543",
        employeeId: "RM-TEC-1204",
        permissionLevel: "support",
        department: "technical",
        status: "suspended",
        createdAt: "2025-02-10T07:45:00Z",
      },
      {
        id: 5,
        fullName: "Kaviru Hapuarachchi",
        email: "kaviru@ridemachan.lk",
        phone: "+94 77 345 6789",
        employeeId: "RM-OPS-1001",
        permissionLevel: "super-admin",
        department: "operations",
        status: "active",
        createdAt: "2024-06-18T10:00:00Z",
      },
    ];

    this.filteredAdmins = [...this.admins];
    this.init();
  }

  // ---------- Init ----------
  init() {
    this.setupEventListeners();
    this.applyFilters(); // renders + updates count
  }

  setupEventListeners() {
    // Search button
    const searchBtn = document.querySelector(".search-btn");
    if (searchBtn)
      searchBtn.addEventListener("click", () => this.searchAdmins());

    // Live filter on inputs
    const nameInput = document.getElementById("adminNameFilter");
    const idInput = document.getElementById("adminIdFilter");
    const sortInput = document.getElementById("sortOrder");

    [nameInput, idInput, sortInput].forEach((el) => {
      if (!el) return;
      const evt = el.tagName === "SELECT" ? "change" : "input";
      el.addEventListener(evt, () => this.applyFilters());
    });

    // Register admin form
    const regForm = document.getElementById("registerAdminForm");
    if (regForm) {
      regForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.registerAdmin();
      });
    }

    // Edit admin form
    const editForm = document.getElementById("editAdminForm");
    if (editForm) {
      editForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.updateAdmin();
      });
    }
  }

  // ---------- Filtering ----------
  searchAdmins() {
    this.applyFilters();
  }

  applyFilters() {
    const nameFilter = (
      document.getElementById("adminNameFilter")?.value || ""
    ).toLowerCase();
    const idFilter = (
      document.getElementById("adminIdFilter")?.value || ""
    ).toLowerCase();
    const sortOrder =
      document.getElementById("sortOrder")?.value || "ascending";

    // Filter
    this.filteredAdmins = this.admins.filter((a) => {
      const byName = a.fullName.toLowerCase().includes(nameFilter);
      const byId = (a.employeeId || String(a.id))
        .toLowerCase()
        .includes(idFilter);
      return byName && byId;
    });

    // Sort
    const statusWeight = { active: 0, inactive: 1, suspended: 2 };
    this.filteredAdmins.sort((a, b) => {
      if (sortOrder === "ascending") {
        return a.fullName.localeCompare(b.fullName);
      } else if (sortOrder === "descending") {
        return b.fullName.localeCompare(a.fullName);
      } else if (sortOrder === "recent") {
        return new Date(b.createdAt) - new Date(a.createdAt);
      } else if (sortOrder === "status") {
        const sa = statusWeight[a.status] ?? 99;
        const sb = statusWeight[b.status] ?? 99;
        if (sa !== sb) return sa - sb;
        return a.fullName.localeCompare(b.fullName);
      }
      return 0;
    });

    this.renderAdmins();
    this.updateAdminsCount();
  }

  // ---------- Render ----------
  renderAdmins() {
    const list = document.getElementById("adminsList");
    if (!list) return;
    list.innerHTML = "";

    this.filteredAdmins.forEach((admin) => {
      list.appendChild(this.createAdminCard(admin));
    });
  }

  createAdminCard(admin) {
    const card = document.createElement("div");
    card.className = "admin-card";
    card.dataset.adminId = admin.id;

    const statusClass =
      admin.status === "active"
        ? "status-active"
        : admin.status === "suspended"
        ? "status-suspended"
        : "status-inactive";

    card.innerHTML = `
      <div class="admin-info">
        <div class="admin-id">#${admin.id}</div>
        <div class="admin-details">
          <h3 class="admin-name">${this.escape(admin.fullName)}</h3>
          <p class="admin-permission">${this.escape(admin.permissionLevel)}</p>
        </div>
        <div class="admin-status">
          <span class="status-badge ${statusClass}">
            <span class="status-indicator"></span>
            ${this.capitalize(admin.status)}
          </span>
        </div>
      </div>
      <div class="admin-actions">
        <button class="btn btn-secondary btn-sm" data-action="edit">Edit</button>
        <button class="btn btn-danger btn-sm" data-action="delete">Delete</button>
      </div>
    `;

    // Actions
    const editBtn = card.querySelector('[data-action="edit"]');
    const delBtn = card.querySelector('[data-action="delete"]');
    editBtn.addEventListener("click", () => this.editAdmin(admin.id));
    delBtn.addEventListener("click", () => this.deleteAdmin(admin.id));

    return card;
  }

  updateAdminsCount() {
    const title = document.querySelector(".page-title");
    if (title) title.textContent = `Admins (${this.filteredAdmins.length})`;
  }

  // ---------- Modals ----------
  openRegisterAdminModal() {
    const modal = document.getElementById("registerAdminModal");
    if (!modal) return;
    modal.classList.add("show");
    modal.style.display = "flex";
    document.body.style.overflow = "hidden";
  }

  closeRegisterAdminModal() {
    const modal = document.getElementById("registerAdminModal");
    if (!modal) return;
    modal.classList.remove("show");
    modal.style.display = "none";
    document.body.style.overflow = "";
    document.getElementById("registerAdminForm")?.reset();
    this.clearErrors("#registerAdminForm");
  }

  openEditAdminModal() {
    const modal = document.getElementById("editAdminModal");
    if (!modal) return;
    modal.classList.add("show");
    modal.style.display = "flex";
    document.body.style.overflow = "hidden";
  }

  closeEditAdminModal() {
    const modal = document.getElementById("editAdminModal");
    if (!modal) return;
    modal.classList.remove("show");
    modal.style.display = "none";
    document.body.style.overflow = "";
    this.clearErrors("#editAdminForm");
  }

  // ---------- CRUD ----------
  registerAdmin() {
    const form = document.getElementById("registerAdminForm");
    if (!form) return;

    const data = Object.fromEntries(new FormData(form).entries());

    // Validate
    let ok = true;
    this.clearErrors("#registerAdminForm");

    const requireField = (name, msg) => {
      if (!data[name] || !String(data[name]).trim()) {
        this.setError(`#registerAdminForm [name="${name}"]`, msg);
        ok = false;
      }
    };

    requireField("fullName", "Full name is required");
    requireField("email", "Email is required");
    requireField("phone", "Phone number is required");
    requireField("permissionLevel", "Permission level is required");
    requireField("password", "Password is required");
    requireField("confirmPassword", "Please confirm the password");

    if (data.password !== data.confirmPassword) {
      this.setError(
        `#registerAdminForm [name="confirmPassword"]`,
        "Passwords do not match"
      );
      ok = false;
    }

    if (!ok) return;

    const nextId = this.admins.length
      ? Math.max(...this.admins.map((a) => a.id)) + 1
      : 1;
    const admin = {
      id: nextId,
      fullName: data.fullName.trim(),
      email: data.email.trim(),
      phone: data.phone.trim(),
      employeeId:
        (data.employeeId || "").trim() ||
        `RM-${nextId.toString().padStart(4, "0")}`,
      permissionLevel: data.permissionLevel,
      department: data.department || "",
      status: "active",
      createdAt: new Date().toISOString(),
    };

    this.admins.push(admin);
    this.closeRegisterAdminModal();
    this.applyFilters();
    this.toast("Admin registered successfully");
  }

  editAdmin(id) {
    const admin = this.admins.find((a) => a.id === id);
    if (!admin) return;

    // Fill form
    document.getElementById("editAdminId").value = String(admin.id);
    document.getElementById("editFullName").value = admin.fullName;
    document.getElementById("editEmail").value = admin.email;
    document.getElementById("editPhone").value = admin.phone;
    document.getElementById("editEmployeeId").value = admin.employeeId || "";
    document.getElementById("editPermissionLevel").value =
      admin.permissionLevel;
    document.getElementById("editDepartment").value = admin.department || "";
    document.getElementById("editStatus").value = admin.status;

    this.openEditAdminModal();
  }

  updateAdmin() {
    const form = document.getElementById("editAdminForm");
    if (!form) return;

    const data = Object.fromEntries(new FormData(form).entries());
    const id = Number(data.adminId);
    const admin = this.admins.find((a) => a.id === id);
    if (!admin) return;

    admin.fullName = data.fullName.trim();
    admin.email = data.email.trim();
    admin.phone = data.phone.trim();
    admin.employeeId = (data.employeeId || "").trim();
    admin.permissionLevel = data.permissionLevel;
    admin.department = data.department || "";
    admin.status = data.status;

    this.closeEditAdminModal();
    this.applyFilters();
    this.toast("Admin updated");
  }

  deleteAdmin(id) {
    if (!confirm("Delete this admin?")) return;
    this.admins = this.admins.filter((a) => a.id !== id);
    this.applyFilters();
    this.toast("Admin deleted");
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
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  capitalize(s) {
    s = String(s || "");
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
}

// ---------- Global helpers for inline HTML handlers ----------
window.addEventListener("DOMContentLoaded", () => {
  window.adminsManager = new AdminsManager();
});

function searchAdmins() {
  window.adminsManager?.searchAdmins();
}
function openRegisterAdminModal() {
  window.adminsManager?.openRegisterAdminModal();
}
function closeRegisterAdminModal() {
  window.adminsManager?.closeRegisterAdminModal();
}
function editAdmin(id) {
  window.adminsManager?.editAdmin(Number(id));
}
function deleteAdmin(id) {
  window.adminsManager?.deleteAdmin(Number(id));
}
function closeEditAdminModal() {
  window.adminsManager?.closeEditAdminModal();
}
function updateAdmin() {
  window.adminsManager?.updateAdmin();
}
