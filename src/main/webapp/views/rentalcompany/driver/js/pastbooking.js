let bookings = [];
let filters = { dateRange:"month", status:"all", search:"" };
const $ = (id) => document.getElementById(id);

document.addEventListener("DOMContentLoaded", () => {
    $("sidebarToggle")?.addEventListener("click", () => $("sidebar")?.classList.toggle("active"));
    document.addEventListener("click", (e) => {
        if (innerWidth <= 992 && $("sidebar")?.classList.contains("active") &&
            !$("sidebar").contains(e.target) && !$("sidebarToggle")?.contains(e.target)) $("sidebar").classList.remove("active");
    });

    $("searchInput")?.addEventListener("input", debounce(function(){ filters.search=this.value; load(); }, 400));
    $("dateRange")?.addEventListener("change", e => (filters.dateRange=e.target.value, load()));
    $("statusFilter")?.addEventListener("change", e => (filters.status=e.target.value, load()));
    $("resetFilters")?.addEventListener("click", () => {
        filters={dateRange:"month",status:"all",search:""};
        $("searchInput").value=""; $("dateRange").value="month"; $("statusFilter").value="all"; load();
    });

    $("closeModal")?.addEventListener("click", closeModal);
    window.addEventListener("click", e => e.target === $("bookingDetailsModal") && closeModal());

    document.querySelector(".logout")?.addEventListener("click", function(){
        if(!confirm("Are you sure you want to logout?")) return;
        this.innerHTML='<i class="fas fa-spinner fa-spin"></i><span>Logging out...</span>';
        setTimeout(()=>location.href="../driver/logout",800);
    });

    $("bookingsList")?.addEventListener("click", (e) => {
        const btn = e.target.closest("button[data-id]");
        if (btn) viewDetails(btn.dataset.id);
    });

    load();
});

async function load(){
    show(true);
    try{
        const p = new URLSearchParams(filters);
        const r = await fetch(`/driver/pastbookings?${p.toString()}`, { credentials:"include" });
        if(r.status===401) return (location.href="/views/landing/driverlogin.html");
        const d = await r.json();
        if(!d.success) throw new Error(d.error||"Failed");
        bookings = d.bookings || [];
        stats(d.stats||{});
        render();
    }catch(e){
        console.error(e); empty();
        alert("Failed to load bookings");
    }finally{ show(false); }
}

function stats(s){
    $("completedCount").textContent = s.totalCompleted||0;
    $("cancelledCount").textContent = s.totalCancelled||0;
    $("revenueAmount").textContent = "Rs. " + Number(s.totalRevenue||0).toLocaleString();
    $("avgRating").textContent = Number(s.avgRating||0).toFixed(1);
}

function render(){
    if(!bookings.length) return empty();
    $("bookingsContainer").style.display="block";
    $("emptyState").style.display="none";
    $("bookingsList").innerHTML = bookings.map(card).join("");
    $("bookingsCount").textContent = `${bookings.length} total bookings`;
}

function card(b){
    const st = String(b.status||"").toLowerCase();
    const amount = Number(b.totalAmount||0).toLocaleString();
    return `
  <div class="booking-card">
    <div class="booking-header">
      <div class="booking-id"><i class="fas fa-hashtag"></i>${esc(b.rideId||"N/A")}</div>
      <div class="booking-status ${esc(st)}">${esc(b.status||"N/A")}</div>
    </div>

    <div class="booking-info">
      <div class="booking-details">
        <div class="detail-item"><i class="fas fa-user"></i><span class="detail-label">Customer:</span><span class="detail-value">${esc(b.customerName||"N/A")}</span></div>
        <div class="detail-item"><i class="fas fa-calendar"></i><span class="detail-label">Date:</span><span class="detail-value">${esc(fmtDate(b.bookingDate))}</span></div>
        <div class="detail-item"><i class="fas fa-clock"></i><span class="detail-label">Time:</span><span class="detail-value">${esc(fmtTime(b.startTime))}</span></div>
        <div class="detail-item"><i class="fas fa-dollar-sign"></i><span class="detail-label">Fare:</span><span class="detail-value">Rs. ${amount}</span></div>
        <div class="detail-item"><i class="fas fa-star"></i><span class="detail-label">Rating:</span><span class="detail-value">N/A</span></div>
      </div>

      <div class="location-info">
        <div class="location-item pickup"><i class="fas fa-map-marker-alt pickup-icon"></i><span class="location-text">${esc(b.pickupLocation||"N/A")}</span></div>
        <div class="location-item dropoff"><i class="fas fa-map-marker-alt dropoff-icon"></i><span class="location-text">${esc(b.dropoffLocation||"N/A")}</span></div>
      </div>
    </div>

    <div class="booking-actions">
      <button class="btn btn-outline" type="button" data-id="${esc(b.rideId)}"><i class="fas fa-eye"></i>View Details</button>
    </div>
  </div>`;
}

function viewDetails(id){
    const b = bookings.find(x => x.rideId === id); if(!b) return;
    const st = String(b.status||"").toLowerCase();
    $("modalBookingDetails").innerHTML = `
    <div class="booking-card">
      <div class="booking-header">
        <div class="booking-id"><i class="fas fa-hashtag"></i>${esc(b.rideId||"N/A")}</div>
        <div class="booking-status ${esc(st)}">${esc(b.status||"N/A")}</div>
      </div>
      <div class="booking-info">
        <div class="booking-details">
          <div class="detail-item"><i class="fas fa-user"></i><span class="detail-label">Customer:</span><span class="detail-value">${esc(b.customerName||"N/A")}</span></div>
          <div class="detail-item"><i class="fas fa-phone"></i><span class="detail-label">Phone:</span><span class="detail-value">${esc(b.customerPhone||"N/A")}</span></div>
          <div class="detail-item"><i class="fas fa-envelope"></i><span class="detail-label">Email:</span><span class="detail-value">${esc(b.customerEmail||"N/A")}</span></div>
          <div class="detail-item"><i class="fas fa-calendar"></i><span class="detail-label">Date:</span><span class="detail-value">${esc(fmtDate(b.bookingDate))}</span></div>
          <div class="detail-item"><i class="fas fa-clock"></i><span class="detail-label">Time:</span><span class="detail-value">${esc(fmtTime(b.startTime))}</span></div>
          <div class="detail-item"><i class="fas fa-dollar-sign"></i><span class="detail-label">Fare:</span><span class="detail-value">Rs. ${Number(b.totalAmount||0).toLocaleString()}</span></div>
          <div class="detail-item"><i class="fas fa-route"></i><span class="detail-label">Distance:</span><span class="detail-value">${Number(b.distance||0)} km</span></div>
          <div class="detail-item"><i class="fas fa-hourglass-half"></i><span class="detail-label">Duration:</span><span class="detail-value">${Number(b.estimatedDuration||0)} mins</span></div>
          <div class="detail-item"><i class="fas fa-car"></i><span class="detail-label">Vehicle:</span><span class="detail-value">${esc((b.vehicleModel||"N/A")+" - "+(b.vehiclePlate||"N/A"))}</span></div>
          ${b.specialInstructions ? `<div class="detail-item"><i class="fas fa-note-sticky"></i><span class="detail-label">Notes:</span><span class="detail-value">${esc(b.specialInstructions)}</span></div>` : ""}
        </div>
      </div>
    </div>`;
    $("bookingDetailsModal").style.display="block";
}

function closeModal(){ $("bookingDetailsModal").style.display="none"; }
function show(on){ $("loadingSpinner").style.display = on ? "flex":"none"; if(on){ $("bookingsContainer").style.display="none"; $("emptyState").style.display="none"; } }
function empty(){ $("bookingsContainer").style.display="none"; $("emptyState").style.display="block"; $("bookingsCount").textContent="0 total bookings"; }

function fmtDate(s){
    if(!s) return "N/A";
    const d = (String(s).length===10) ? new Date(s+"T00:00:00") : new Date(s);
    return isNaN(d) ? "N/A" : d.toLocaleDateString("en-US",{year:"numeric",month:"short",day:"numeric"});
}
function fmtTime(t){
    if(!t) return "N/A"; t=String(t);
    if(t.length===8) t=t.slice(0,5);
    if(t.length===5){ let[h,m]=t.split(":"); h=+h; return `${h%12||12}:${m} ${h>=12?"PM":"AM"}`; }
    return t;
}
function debounce(fn, ms){ let t; return function(...a){ const c=this; clearTimeout(t); t=setTimeout(()=>fn.apply(c,a),ms); }; }
function esc(v){ return String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;"); }