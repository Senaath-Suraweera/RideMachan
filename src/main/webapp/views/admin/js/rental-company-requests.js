// Pending Rental Company Requests -> click row opens rental-company-view.html
(function () {
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));

  // Sample data (add companyId if you already know the id in your companies DB)
  let requests = [
    {
      id: 1,
      name: "ABC Transport Services",
      email: "admin@abctransport.com",
      phone: "+94 77 123 4567",
      submitted: "1/30/2024" /*, companyId: 1*/,
    },
    {
      id: 2,
      name: "Quick Ride Solutions",
      email: "contact@quickride.lk",
      phone: "+94 71 987 6543",
      submitted: "1/29/2024" /*, companyId: 2*/,
    },
    {
      id: 3,
      name: "Metro Car Rentals",
      email: "info@metrocars.com",
      phone: "+94 76 555 0123",
      submitted: "1/28/2024" /*, companyId: 3*/,
    },
    {
      id: 4,
      name: "City Cab Network",
      email: "support@citycab.lk",
      phone: "+94 75 444 9876",
      submitted: "1/27/2024",
    },
    {
      id: 5,
      name: "Express Travel Co.",
      email: "admin@expresstravel.com",
      phone: "+94 78 333 2468",
      submitted: "1/26/2024",
    },
  ];

  let alphaSort = "az"; // 'az' | 'za'
  let dateSort = "new"; // 'new' | 'old'

  document.addEventListener("DOMContentLoaded", () => {
    if (document.querySelector(".sidebar"))
      document.body.classList.add("with-sidebar");
    bindSortChips();
    render();
  });

  function render() {
    const byName = (a, b) => a.name.localeCompare(b.name);
    let sorted = [...requests].sort(byName);
    if (alphaSort === "za") sorted.reverse();
    sorted = stableSort(sorted, (a, b) =>
      dateSort === "new"
        ? new Date(b.submitted) - new Date(a.submitted)
        : new Date(a.submitted) - new Date(b.submitted)
    );

    const tbody = $("#requestsTbody");
    tbody.innerHTML = "";
    sorted.forEach((req, i) => tbody.appendChild(row(req, i)));
  }

  function row(req, i) {
    const tr = document.createElement("tr");
    tr.dataset.id = req.id;
    tr.innerHTML = `
      <td class="row-index"><a href="#" class="go-view">#${i + 1}</a></td>
      <td><span class="company-name go-view">${escapeHTML(req.name)}</span></td>
      <td><a href="mailto:${escapeAttr(req.email)}">${escapeHTML(
      req.email
    )}</a></td>
      <td>${escapeHTML(req.phone)}</td>
      <td>${escapeHTML(req.submitted)}</td>
      <td>
        <div class="actions">
          <button type="button" class="btn btn-accept">Accept</button>
          <button type="button" class="btn btn-reject">Reject</button>
        </div>
      </td>
    `;

    // Click anywhere on the row (except the buttons) → open the company view
    tr.addEventListener("click", (e) => {
      if (e.target.closest(".actions")) return; // don't navigate when clicking action buttons
      goToCompanyView(req);
    });
    tr.querySelectorAll(".go-view").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        goToCompanyView(req);
      });
    });

    tr.querySelector(".btn-accept").addEventListener("click", (e) => {
      e.stopPropagation();
      toast(`Accepted: ${req.name}`);
      removeRequest(req.id);
    });
    tr.querySelector(".btn-reject").addEventListener("click", (e) => {
      e.stopPropagation();
      if (confirm(`Reject request from "${req.name}"?`)) {
        toast(`Rejected: ${req.name}`);
        removeRequest(req.id);
      }
    });

    return tr;
  }

  function removeRequest(id) {
    requests = requests.filter((r) => r.id !== id);
    render();
  }

  // Open rental-company-view.html (prefer id; otherwise pass name)
  function goToCompanyView(req) {
    const url = new URL("rental-company-view.html", location.href);
    if (req.companyId) {
      url.searchParams.set("id", String(req.companyId));
    } else {
      url.searchParams.set("name", req.name); // name fallback if you don't know the id
    }
    location.href = url.toString();
  }

  function bindSortChips() {
    $("#alphaSort")?.addEventListener("click", (e) => {
      const btn = e.target.closest(".chip");
      if (!btn) return;
      alphaSort = btn.dataset.sort;
      setActive("#alphaSort", btn);
      render();
    });
    $("#dateSort")?.addEventListener("click", (e) => {
      const btn = e.target.closest(".chip");
      if (!btn) return;
      dateSort = btn.dataset.sort;
      setActive("#dateSort", btn);
      render();
    });
  }
  function setActive(groupSel, btn) {
    $$(groupSel + " .chip").forEach((c) => c.classList.remove("active"));
    btn.classList.add("active");
  }

  function stableSort(arr, cmp) {
    return arr
      .map((v, i) => ({ v, i }))
      .sort((a, b) => cmp(a.v, b.v) || a.i - b.i)
      .map((o) => o.v);
  }
  function escapeHTML(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }
  function escapeAttr(s) {
    return String(s).replaceAll('"', "&quot;").replaceAll("<", "&lt;");
  }

  function toast(message) {
    const el = document.createElement("div");
    el.textContent = message;
    el.style.cssText = `
      position: fixed; right: 16px; bottom: 16px; background: #0f172a; color: #fff;
      padding: 10px 14px; border-radius: 10px; box-shadow: 0 12px 30px rgba(0,0,0,.25);
      z-index: 2000;`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1600);
  }
})();
