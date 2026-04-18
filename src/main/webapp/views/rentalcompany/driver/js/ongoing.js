let bookings = [], filter = "all", current = null;
const $ = (s) => document.querySelector(s), $$ = (s) => document.querySelectorAll(s);

document.addEventListener("DOMContentLoaded", () => {
    $("#sidebarToggle")?.addEventListener("click", () => $("#sidebar")?.classList.toggle("active"));

    $$(".filter-btn:not(.vehicle-issues-btn)").forEach(b => b.addEventListener("click", () => {
        $$(".filter-btn:not(.vehicle-issues-btn)").forEach(x => x.classList.remove("active"));
        b.classList.add("active"); filter = b.dataset.filter; applyFilter();
    }));

    $("#sortBookings")?.addEventListener("change", e => sortGrid(e.target.value));

    $$(".tab-btn").forEach(b => b.addEventListener("click", () => {
        $$(".tab-btn").forEach(x => x.classList.remove("active"));
        $$(".tab-content").forEach(x => x.classList.remove("active"));
        b.classList.add("active"); $("#" + b.dataset.tab)?.classList.add("active");
    }));

    $(".logout")?.addEventListener("click", function () {
        if (!confirm("Are you sure you want to logout?")) return;
        this.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Logging out...</span>';
        setTimeout(() => (location.href = "../driver/logout"), 800);
    });

    window.addEventListener("click", e => (e.target === $("#bookingDetailsModal")) && closeModal());

    $("#bookingsGrid")?.addEventListener("click", (e) => {
        const btn = e.target.closest("button[data-act]");
        if (!btn) return;
        const id = btn.dataset.id;
        if (btn.dataset.act === "details") showBookingDetails(id);
        if (btn.dataset.act === "start") updateStatus(id, "in-progress", btn);
        if (btn.dataset.act === "complete") updateStatus(id, "completed", btn);
    });

    loadBookings();
});

async function loadBookings() {
    $("#loadingSpinner").style.display = "block";
    $("#emptyState").style.display = "none";
    $("#bookingsGrid").style.display = "none";

    try {
        const r = await fetch("/ongoing", { credentials: "include" });
        if (r.status === 401) return (location.href = "/views/landing/driverlogin.html");
        const d = await r.json();
        if (!d.success) throw new Error(d.message || d.error || "Failed");
        bookings = (d.bookings || []).map(b => ({ ...b, status: String(b.status || "").trim().toLowerCase() }));
        render();
    } catch (e) {
        console.error(e); alert("Failed to load bookings");
        showEmpty();
    } finally {
        $("#loadingSpinner").style.display = "none";
    }
}

function render() {
    if (!bookings.length) return showEmpty();
    $("#bookingsGrid").innerHTML = bookings.map(cardHtml).join("");
    $("#bookingsGrid").style.display = "grid";
    $("#emptyState").style.display = "none";
    const inProg = bookings.filter(b => b.status === "in-progress").length;
    const up = bookings.filter(b => b.status === "upcoming").length;
    $("#totalActive").textContent = bookings.length;
    $("#inProgressCount").textContent = inProg;
    $("#upcomingCount").textContent = up;
    applyFilter();
}

function cardHtml(b) {
    const st = b.status || "upcoming";
    const badge = st === "in-progress"
        ? '<div class="status-badge in-progress"><i class="fas fa-road"></i> In Progress</div>'
        : '<div class="status-badge upcoming"><i class="fas fa-clock"></i> Upcoming</div>';

    const action = st === "upcoming"
        ? btnHtml("start", b.rideId, "Start Ride", "fa-play")
        : st === "in-progress"
            ? btnHtml("complete", b.rideId, "Complete Ride", "fa-check")
            : "";

    return `
  <div class="booking-card ${esc(st)}" data-status="${esc(st)}" data-time="${esc(b.bookingTime||"")}" data-fare="${Number(b.totalAmount||0)}">
    <div class="booking-header"><div class="booking-id">#${esc(b.rideId||"N/A")}</div>${badge}</div>
    <div class="booking-time"><div class="date">${esc(fmtDate(b.bookingDate))}</div><div class="time">${esc(fmtTime(b.bookingTime))}</div></div>
    <div class="booking-route">
      <div class="route-item pickup"><i class="fas fa-map-marker-alt"></i><span>${esc(b.pickupLocation||"N/A")}</span></div>
      <div class="route-divider"><i class="fas fa-arrow-down"></i></div>
      <div class="route-item dropoff"><i class="fas fa-map-marker-alt"></i><span>${esc(b.dropoffLocation||"N/A")}</span></div>
    </div>
    <div class="booking-info">
      <div class="info-item"><i class="fas fa-user"></i><span>${esc(b.customerName||"N/A")}</span></div>
      <div class="info-item"><i class="fas fa-car"></i><span>${esc((b.vehicleModel||"N/A")+" - "+(b.vehiclePlate||"N/A"))}</span></div>
      <div class="info-item"><i class="fas fa-clock"></i><span>${Number(b.estimatedDuration||0)} mins</span></div>
      <div class="info-item"><i class="fas fa-dollar-sign"></i><span>LKR ${Number(b.totalAmount||0).toFixed(2)}</span></div>
    </div>
    <div class="booking-actions">
      ${btnHtml("details", b.rideId, "Details", "fa-info-circle", "btn-outline")}
      ${action}
    </div>
  </div>`;
}

function btnHtml(act, id, txt, icon, cls="btn-primary") {
    return `<button class="btn ${cls}" type="button" data-act="${act}" data-id="${esc(id||"")}"><i class="fas ${icon}"></i>${txt}</button>`;
}

function applyFilter() {
    $$(".booking-card").forEach(c => c.style.display = (filter === "all" || c.dataset.status === filter) ? "block" : "none");
}

function sortGrid(v) {
    const g = $("#bookingsGrid"); if (!g) return;
    const cards = [...g.children];
    cards.sort((a,b) => v==="time-asc" ? a.dataset.time.localeCompare(b.dataset.time)
        : v==="time-desc" ? b.dataset.time.localeCompare(a.dataset.time)
            : v==="fare" ? (+b.dataset.fare)-(+a.dataset.fare)
                : v==="status" ? a.dataset.status.localeCompare(b.dataset.status) : 0);
    cards.forEach(x => g.appendChild(x));
}

function showBookingDetails(id) {
    const b = bookings.find(x => x.rideId === id); if (!b) return;
    current = b;

    $("#modal-booking-id").textContent = "#" + (b.rideId || "N/A");
    const st = b.status || "upcoming";
    const ms = $("#modal-status"); ms.className = "status-badge " + st; ms.textContent = st.replace("-", " ").toUpperCase();
    $("#modal-datetime").textContent = `${fmtDate(b.bookingDate)} - ${fmtTime(b.bookingTime)}`;
    $("#modal-duration").textContent = (b.estimatedDuration||0) + " minutes";
    $("#modal-fare").textContent = "LKR " + Number(b.totalAmount||0).toFixed(2);
    $("#modal-distance").textContent = (b.distance||0) + " km";

    $("#modal-customer-name").textContent = b.customerName || "N/A";
    $("#modal-customer-initial").textContent = (b.customerName||"?").trim().charAt(0).toUpperCase();
    $("#modal-customer-phone").textContent = b.customerPhone || "N/A";
    $("#modal-customer-email").textContent = b.customerEmail || "N/A";

    $("#modal-pickup").textContent = b.pickupLocation || "N/A";
    $("#modal-dropoff").textContent = b.dropoffLocation || "N/A";
    $("#modal-vehicle-model").textContent = b.vehicleModel || "N/A";
    $("#modal-vehicle-plate").textContent = "License: " + (b.vehiclePlate || "N/A");

    const ins = (b.specialInstructions||"").trim();
    $("#modal-instructions").innerHTML = ins
        ? ins.split("\n").filter(Boolean).map(t=>`<div class="instruction-item"><i class="fas fa-info-circle"></i><span>${esc(t)}</span></div>`).join("")
        : `<p style="color: var(--text-light);">No special instructions</p>`;

    const p = $("#primaryActionBtn");
    if (st === "upcoming") { p.innerHTML = '<i class="fas fa-play"></i> Start Ride'; p.onclick = () => updateStatus(b.rideId,"in-progress"); }
    else if (st === "in-progress") { p.innerHTML = '<i class="fas fa-check"></i> Complete Ride'; p.onclick = () => updateStatus(b.rideId,"completed"); }
    else { p.innerHTML = '<i class="fas fa-check"></i> Close'; p.onclick = closeModal; }

    $("#bookingDetailsModal").classList.add("show");
}

function closeModal(){ $("#bookingDetailsModal").classList.remove("show"); current=null; }
function contactCustomer(){ const p=current?.customerPhone; p ? (location.href=`tel:${p}`) : alert("Customer phone number not available"); }
function primaryAction(){ if(!current) return; current.status==="upcoming"?updateStatus(current.rideId,"in-progress"):updateStatus(current.rideId,"completed"); }
function navigateToIssueReporting(){ location.href="issuereporting.html"; }

async function updateStatus(rideId, status, btn) {
    if (!confirm(`Are you sure you want to set status to "${status}"?`)) return;
    const old = btn?.innerHTML; if (btn){ btn.disabled=true; btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Please wait...'; }

    try {
        const body = new URLSearchParams({ rideId, status });
        const r = await fetch("/ongoing", { method:"POST", credentials:"include",
            headers:{ "Content-Type":"application/x-www-form-urlencoded" }, body: body.toString() });

        if (r.status === 401) return (location.href="/views/landing/driverlogin.html");
        const d = await r.json();
        if (!d.success) throw new Error(d.message || d.error || "Update failed");
        closeModal(); await loadBookings();
    } catch(e){
        console.error(e); alert("Failed: " + e.message);
        if(btn){ btn.disabled=false; btn.innerHTML=old; }
    }
}

function showEmpty(){ $("#emptyState").style.display="block"; $("#bookingsGrid").style.display="none"; $("#totalActive").textContent=0; $("#inProgressCount").textContent=0; $("#upcomingCount").textContent=0; }
function fmtTime(t){ if(!t) return "N/A"; t=String(t); return t.length===8?to12(t.slice(0,5)):t.length===5?to12(t):t; }
function to12(x){ let[h,m]=x.split(":"); h=+h; return `${h%12||12}:${m} ${h>=12?"PM":"AM"}`; }
function fmtDate(d){ if(!d) return "N/A"; const dt = (String(d).length===10)?new Date(d+"T00:00:00"):new Date(d); if(isNaN(dt)) return "N/A";
    const t=new Date(), tm=new Date(); tm.setDate(t.getDate()+1);
    if(dt.toDateString()===t.toDateString()) return "Today";
    if(dt.toDateString()===tm.toDateString()) return "Tomorrow";
    return dt.toLocaleDateString("en-US",{month:"short",day:"numeric"});
}
function esc(v){ return String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;"); }

// for inline calls in HTML modal/buttons
window.closeModal = closeModal;
window.contactCustomer = contactCustomer;
window.primaryAction = primaryAction;
window.navigateToIssueReporting = navigateToIssueReporting;