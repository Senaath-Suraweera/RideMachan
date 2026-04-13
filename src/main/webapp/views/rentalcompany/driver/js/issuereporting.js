// ==========================================
// Global Variables
// ==========================================
let currentIssues = [];
let uploadedFile = null;

// ==========================================
// INIT
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    console.log("Page loaded");

    setupUpload();
    setupForm();

    loadPastIssues();
});

// ==========================================
// Upload handler
// ==========================================
function setupUpload() {
    const uploadArea = document.getElementById("uploadArea");
    const photoInput = document.getElementById("photoInput");

    if (!uploadArea || !photoInput) return;

    uploadArea.addEventListener("click", () => {
        photoInput.click();
    });

    photoInput.addEventListener("change", (e) => {
        uploadedFile = e.target.files[0];
        console.log("File selected:", uploadedFile);
    });
}

// ==========================================
// FORM SUBMIT
// ==========================================
function setupForm() {
    const form = document.getElementById("issueForm");

    if (!form) return;

    form.addEventListener("submit", submitIssueForm);
}

// ==========================================
// ==========================================
// SUBMIT ISSUE
// ==========================================
async function submitIssueForm(e) {
    e.preventDefault();

    try {
        const formData = new FormData();

        formData.append("action", "create");
        formData.append("category", getVal("category"));
        formData.append("location", getVal("location"));
        formData.append("description", getVal("description"));
        formData.append("bookingId", getVal("booking-id"));
        formData.append("plateNumber", getVal("plate-number"));

        const driveableYes = document.getElementById("driveable-yes");
        const driveableNo = document.getElementById("driveable-no");

        let driveable = "no";
        if (driveableYes && driveableYes.checked) driveable = "yes";
        if (driveableNo && driveableNo.checked) driveable = "no";

        formData.append("driveable", driveable);

        const photoInput = document.getElementById("photoInput");
        if (photoInput?.files?.length > 0) {
            formData.append("photo", photoInput.files[0]);
        }

        const res = await fetch("/IssueServlet", {
            method: "POST",
            body: formData
        });

        const data = await res.json();
        console.log("CREATE RESPONSE:", data);

        if (data.success) {
            showNotification("Issue created successfully", "success");
            document.getElementById("issueForm").reset();
            loadPastIssues();
        } else {
            showNotification("Failed to create issue", "error");
        }

    } catch (err) {
        console.error(err);
        showNotification("Server error while creating issue", "error");
    }
}

// helper
function getVal(id) {
    const el = document.getElementById(id);
    return el ? el.value : "";
}

// ==========================================
// LOAD ISSUES
// ==========================================
async function loadPastIssues() {
    const loadingEl = document.getElementById("loadingIssues");
    const noIssuesEl = document.getElementById("noIssues");

    try {
        if (loadingEl) loadingEl.style.display = "block";
        if (noIssuesEl) noIssuesEl.style.display = "none";

        const res = await fetch("/IssueServlet?action=getAll");
        const data = await res.json();

        if (loadingEl) loadingEl.style.display = "none";

        if (data.success && data.issues?.length > 0) {
            currentIssues = data.issues;
            displayIssues(currentIssues);
        } else {
            if (noIssuesEl) noIssuesEl.style.display = "block";
        }

    } catch (err) {
        console.error(err);
        if (loadingEl) loadingEl.style.display = "none";
        showNotification("Failed to load issues", "error");
    }
}

// ==========================================
// DISPLAY ISSUES (CLEAN UI)
// ==========================================
function displayIssues(issues) {
    const container = document.getElementById("issuesContainer");
    if (!container) return;

    container.innerHTML = "";

    if (!issues || issues.length === 0) {
        container.innerHTML = `
            <div style="padding:20px;text-align:center;color:#777;">
                No issues found 🚫
            </div>
        `;
        return;
    }

    issues.forEach(issue => {

        const statusColor =
            issue.status === "pending" ? "#ff9800" :
                issue.status === "resolved" ? "#4caf50" :
                    issue.status === "rejected" ? "#f44336" : "#2196f3";

        const card = document.createElement("div");

        card.style.cssText = `
            background: linear-gradient(135deg,#fff,#f7f9ff);
            border-left: 6px solid ${statusColor};
            padding: 14px;
            margin: 10px 0;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
            transition: 0.2s;
        `;

        card.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <h3 style="margin:0;">${issue.category}</h3>

                <span style="background:${statusColor};color:white;padding:4px 10px;border-radius:20px;font-size:12px;">
                    ${issue.status}
                </span>
            </div>

            <p><b>📍 Location:</b> ${issue.location}</p>
            <p><b>📝 Description:</b> ${issue.description}</p>
            <p><b>🚗 Booking:</b> ${issue.bookingId || "-"}</p>

            <div style="margin-top:10px;display:flex;gap:10px;">
                
                <button onclick="openIssueModal(${issue.id})"
                    style="padding:6px 12px;border:none;border-radius:6px;background:#4299e1;color:white;cursor:pointer;">
                    View
                </button>

                <button onclick="deleteIssue(${issue.id})"
                    style="padding:6px 12px;border:none;border-radius:6px;background:#f56565;color:white;cursor:pointer;">
                    Delete
                </button>

            </div>
        `;

        container.appendChild(card);
    });
}

// ==========================================
// NOTIFICATION
// ==========================================
function showNotification(msg, type = "info") {
    const div = document.createElement("div");

    div.textContent = msg;

    div.style.cssText = `
        position:fixed;
        top:20px;
        right:20px;
        padding:12px 16px;
        border-radius:8px;
        color:#fff;
        z-index:9999;
        font-size:14px;
    `;

    div.style.background =
        type === "success" ? "#28a745" :
            type === "error" ? "#dc3545" :
                "#17a2b8";

    document.body.appendChild(div);

    setTimeout(() => div.remove(), 3000);
}

async function openIssueModal(issueId) {
    const modal = document.getElementById("issueModal");

    if (!modal) return;

    try {
        const res = await fetch(`/IssueServlet?action=getById&issueId=${issueId}`);
        const data = await res.json();

        if (!data.success || !data.issue) {
            showNotification("Issue not found", "error");
            return;
        }

        const issue = data.issue;

        const statusColor =
            issue.status === "pending" ? "#ff9800" :
                issue.status === "resolved" ? "#4caf50" :
                    issue.status === "rejected" ? "#f44336" : "#2196f3";

        modal.innerHTML = `
            <div style="
                position:fixed;
                top:0;left:0;
                width:100%;height:100%;
                background:rgba(0,0,0,0.6);
                display:flex;
                justify-content:center;
                align-items:center;
                z-index:9999;
            " onclick="closeIssueModal(event)">

                <div style="
                    background:#fff;
                    width:420px;
                    max-width:90%;
                    padding:20px;
                    border-radius:12px;
                    position:relative;
                    font-family:Poppins,sans-serif;
                    box-shadow:0 10px 30px rgba(0,0,0,0.2);
                " onclick="event.stopPropagation()">

                    <button onclick="closeIssueModal()" style="
                        position:absolute;
                        top:10px;
                        right:10px;
                        border:none;
                        background:#f56565;
                        color:#fff;
                        width:32px;
                        height:32px;
                        border-radius:50%;
                        cursor:pointer;
                    ">✕</button>

                    <h2 style="margin-top:0;">${issue.category}</h2>

                    <p><b>📍 Location:</b> ${issue.location}</p>
                    <p><b>📝 Description:</b> ${issue.description}</p>
                    <p><b>🚗 Booking ID:</b> ${issue.bookingId || "-"}</p>

                    <p>
                        <b>📌 Status:</b>
                        <span style="
                            background:${statusColor};
                            color:white;
                            padding:4px 10px;
                            border-radius:12px;
                            font-size:12px;
                        ">
                            ${issue.status}
                        </span>
                    </p>

                    ${
            issue.photoPath
                ? `<img src="${issue.photoPath}" style="width:100%;margin-top:10px;border-radius:8px;">`
                : ""
        }

                </div>
            </div>
        `;

    } catch (err) {
        console.error(err);
        showNotification("Failed to load issue", "error");
    }
}