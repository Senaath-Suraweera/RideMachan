// notifications.js — drop into every page that has a bell
class NotificationBell {
  constructor() {
    this.pollInterval = null;
    this.dropdownOpen = false;
    this.init();
  }

  init() {
    const toggleBtn = document.getElementById("notifToggleBtn");
    const markAllBtn = document.getElementById("markAllReadBtn");
    if (!toggleBtn) return; // page has no bell

    toggleBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.toggleDropdown();
    });
    markAllBtn?.addEventListener("click", () => this.markAllRead());
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".notification-bell")) this.closeDropdown();
    });

    this.loadCount();
    this.pollInterval = setInterval(() => this.loadCount(), 30000);
  }

  async loadCount() {
    try {
      const r = await fetch("/api/notifications/count", {
        credentials: "include",
      });
      const d = await r.json();
      const badge = document.getElementById("notifBadge");
      if (d.ok && d.count > 0) {
        badge.textContent = d.count > 99 ? "99+" : d.count;
        badge.style.display = "flex";
      } else {
        badge.style.display = "none";
      }
    } catch (e) {
      console.error(e);
    }
  }

  toggleDropdown() {
    const dd = document.getElementById("notifDropdown");
    this.dropdownOpen = !this.dropdownOpen;
    dd.classList.toggle("active", this.dropdownOpen);
    if (this.dropdownOpen) this.loadList();
  }

  closeDropdown() {
    this.dropdownOpen = false;
    document.getElementById("notifDropdown")?.classList.remove("active");
  }

  async loadList() {
    const list = document.getElementById("notifList");
    list.innerHTML = '<div class="notif-empty">Loading...</div>';
    try {
      const r = await fetch("/api/notifications?limit=20&offset=0", {
        credentials: "include",
      });
      const d = await r.json();
      if (d.ok && d.notifications.length > 0) {
        list.innerHTML = d.notifications
          .map(
            (n) => `
          <div class="notif-item ${n.isRead ? "" : "unread"}"
               onclick="notificationBell.handleClick(${n.notificationId}, '${n.referenceType}', ${n.referenceId})">
            <div class="notif-icon"><i class="fas ${this.iconFor(n.type)}"></i></div>
            <div class="notif-content">
              <div class="notif-title">${this.esc(n.title)}</div>
              <div class="notif-body">${this.esc(n.body)}</div>
              <div class="notif-time">${this.fmtTime(n.createdAt)}</div>
            </div>
          </div>`,
          )
          .join("");
      } else {
        list.innerHTML =
          '<div class="notif-empty"><i class="fas fa-bell-slash"></i><br>No notifications</div>';
      }
    } catch (e) {
      list.innerHTML =
        '<div class="notif-empty">Error loading notifications</div>';
    }
  }

  async handleClick(id, refType, refId) {
    try {
      await fetch(`/api/notifications/read?id=${id}`, {
        method: "POST",
        credentials: "include",
      });
    } catch {}
    // Route to the right page based on referenceType
    const routes = {
      CONVERSATION: `messages.html?conversationId=${refId}`,
      BOOKING: `booking-management.html?bookingId=${refId}`,
      TICKET: `Provider-Request.html?ticketId=${refId}`,
      MAINTENANCE_JOB: `maintenance-vehicle-assignment.html?jobId=${refId}`,
      COMPANY_REQUEST: `Provider-Request.html?requestId=${refId}`,
      REPORT: `notification.html?reportId=${refId}`,
    };
    const dest = routes[refType];
    if (dest) window.location.href = dest;
    else {
      this.loadCount();
      this.loadList();
    }
  }

  async markAllRead() {
    try {
      await fetch("/api/notifications/readAll", {
        method: "POST",
        credentials: "include",
      });
      this.loadCount();
      this.loadList();
    } catch (e) {
      console.error(e);
    }
  }

  iconFor(t) {
    return (
      {
        NEW_MESSAGE: "fa-comment",
        SYSTEM: "fa-cog",
        BOOKING: "fa-calendar",
        TICKET: "fa-ticket-alt",
        REPORT: "fa-flag",
        MAINTENANCE: "fa-wrench",
        GENERAL: "fa-bell",
      }[t] || "fa-bell"
    );
  }
  esc(s) {
    return (s || "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  }
  fmtTime(ts) {
    const diff = (Date.now() - new Date(ts).getTime()) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return Math.floor(diff / 60) + "m ago";
    if (diff < 86400) return Math.floor(diff / 3600) + "h ago";
    return Math.floor(diff / 86400) + "d ago";
  }
}

const notificationBell = new NotificationBell();
