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
      name: "Hill Country Motors",
      email: "contact@hillcountry.lk",
      phone: "+94 81 555 0192",
      submitted: "1/28/2024",
    },
    {
      id: 3,
      name: "Negombo Express",
      email: "hello@negomboexpress.lk",
      phone: "+94 31 224 7789",
      submitted: "1/27/2024",
    },
    {
      id: 4,
      name: "Beachside Wheels",
      email: "hi@beachsidewheels.lk",
      phone: "+94 71 999 1122",
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

  // ===== Sort state =====
  let alphaSort = "az"; // 'az' | 'za'
  let dateSort = "new"; // 'new' | 'old'
  let lastChanged = "date"; // 'alpha' | 'date' — which filter was touched last

  document.addEventListener("DOMContentLoaded", () => {
    if (document.querySelector(".sidebar"))
      document.body.classList.add("with-sidebar");
    bindSortChips();
    render();
  });

  // ===== Comparators =====
  function alphaCmp(a, b) {
    const cmp = a.name.localeCompare(b.name);
    return alphaSort === "az" ? cmp : -cmp;
  }
  function dateCmp(a, b) {
    const diff = new Date(b.submitted) - new Date(a.submitted); // newest first
    return dateSort === "new" ? diff : -diff;
  }

  // ===== Render table =====
  function render() {
    let sorted = [...requests];

    // Apply the last-changed filter as PRIMARY, other as SECONDARY (stable)
    if (lastChanged === "alpha") {
      sorted = stableSort(sorted, dateCmp); // secondary
      sorted = stableSort(sorted, alphaCmp); // primary
    } else {
      sorted = stableSort(sorted, alphaCmp); // secondary
      sorted = stableSort(sorted, dateCmp); // primary
    }

    const tbody = $("#requestsTbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    sorted.forEach((req, i) => tbody.appendChild(row(req, i)));
  }

  // ===== Build a row =====
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

    // Row/links open the profile view
    tr.addEventListener("click", (e) => {
      if (e.target.closest(".actions")) return; // ignore clicks on action buttons
      goToCompanyView(req);
    });
    tr.querySelectorAll(".go-view").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        goToCompanyView(req);
      });
    });

    // Accept/Reject actions
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

  // ===== Navigation =====
  function goToCompanyView(req) {
    const url = new URL("rental-company-view.html", location.href);
    if (req.companyId) {
      url.searchParams.set("id", String(req.companyId));
    } else {
      url.searchParams.set("name", req.name); // name fallback if you don't know the id
    }
    location.href = url.toString();
  }

  // ===== Chips (A–Z/Z–A and Newest/Oldest) =====
  function bindSortChips() {
    // A–Z / Z–A
    $("#alphaSort")?.addEventListener("click", (e) => {
      const btn = e.target.closest(".chip");
      if (!btn) return;
      alphaSort = btn.dataset.sort; // 'az' | 'za'
      lastChanged = "alpha";
      setActive("#alphaSort", btn);
      render();
    });

    // Newest / Oldest
    $("#dateSort")?.addEventListener("click", (e) => {
      const btn = e.target.closest(".chip");
      if (!btn) return;
      dateSort = btn.dataset.sort; // 'new' | 'old'
      lastChanged = "date";
      setActive("#dateSort", btn);
      render();
    });
  }

  function setActive(groupSel, btn) {
    $$(groupSel + " .chip").forEach((c) => c.classList.remove("active"));
    btn.classList.add("active");
  }

  // ===== Utils =====
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
