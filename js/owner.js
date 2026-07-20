/* Owner Dashboard Controller - Vikas Automobiles */

let currentOwnerSession = null;

// Tab management
function switchTab(tabId) {
  // Hide all panels
  document.querySelectorAll('.panel').forEach(panel => panel.classList.add('hidden'));
  // Unhide active
  const target = document.getElementById(`panel-${tabId}`);
  if (target) target.classList.remove('hidden');

  // Sync menu selections active styles
  document.querySelectorAll('.menu-item').forEach(btn => {
    btn.classList.remove('active', 'text-white', 'bg-blue-600');
    btn.classList.add('text-slate-400');
  });

  // Find calling menu button
  const activeBtn = Array.from(document.querySelectorAll('.menu-item')).find(btn => {
    return btn.getAttribute('onclick').includes(`'${tabId}'`);
  });
  
  if (activeBtn) {
    activeBtn.classList.add('active');
    activeBtn.classList.remove('text-slate-400');
  }

  // Update navbar breadcrumb
  const breadcrumb = document.getElementById("breadcrumb-title");
  if (breadcrumb) breadcrumb.innerText = tabId.replace('-', ' ');

  // Load specific tab data dynamically
  if (tabId === "analytics") {
    loadAnalytics();
  } else if (tabId === "partners") {
    loadPartners();
  } else if (tabId === "approvals") {
    loadApprovals();
  } else if (tabId === "purchases") {
    loadOwnerPurchases();
  } else if (tabId === "policies") {
    loadPolicies();
  } else if (tabId === "audit") {
    loadAuditLogs();
  } else if (tabId === "bulletins") {
    loadBulletins();
  } else if (tabId === "catalog") {
    loadOwnerCatalog();
  } else if (tabId === "admins") {
    loadAdminsRoster();
  } else if (tabId === "settings") {
    loadCorporateSettingsForm();
  }
}

// Side bar responsive toggle
function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  const mainWorkspace = document.getElementById("main-workspace");
  if (window.innerWidth >= 768) {
    if (sidebar) sidebar.classList.toggle("collapsed");
    if (mainWorkspace) mainWorkspace.classList.toggle("expanded");
  } else {
    if (sidebar) sidebar.classList.toggle("-translate-x-full");
  }
}

// 1. ANALYTICS LOADER
async function loadAnalytics() {
  window.UTILS.showLoader("Analyzing sales and scans data...");
  try {
    const [users, products, claims] = await Promise.all([
      window.API.getUsers(),
      window.API.getProducts(),
      window.API.getPurchases()
    ]);

    // Quick Metrics
    const totalPartners = users.filter(u => u.role !== "owner" && u.role !== "admin").length;
    const pendingPartners = users.filter(u => u.status === "pending").length;
    const approvedClaims = claims.filter(c => c.status === "approved").length;
    const totalPointsClaimed = claims.filter(c => c.status === "approved").reduce((acc, curr) => acc + (curr.pointsCalculated || 0), 0);
    const pendingClaims = claims.filter(c => c.status === "pending").length;

    // Set metrics DOM safely with guards
    const elemTotalPartners = document.getElementById("stat-total-partners");
    if (elemTotalPartners) elemTotalPartners.innerText = totalPartners;

    const elemRetailers = document.getElementById("stat-retailers-count");
    if (elemRetailers) {
      const approvedRetailers = users.filter(u => u.role === "retailer" && u.status === "approved").length;
      elemRetailers.innerText = approvedRetailers;
    }

    const elemMechanics = document.getElementById("stat-mechanics-count");
    if (elemMechanics) {
      const approvedMechanics = users.filter(u => u.role === "mechanic" && u.status === "approved").length;
      elemMechanics.innerText = approvedMechanics;
    }

    const elemPointsIssued = document.getElementById("stat-points-issued");
    if (elemPointsIssued) elemPointsIssued.innerText = totalPointsClaimed;

    const elemPendingApprovals = document.getElementById("stat-pending-approvals");
    if (elemPendingApprovals) elemPendingApprovals.innerText = pendingPartners;

    const elemApprovedScans = document.getElementById("stat-approved-scans");
    if (elemApprovedScans) elemApprovedScans.innerText = approvedClaims;

    const elemPointsClaimed = document.getElementById("stat-points-claimed");
    if (elemPointsClaimed) elemPointsClaimed.innerText = totalPointsClaimed + " Pts";

    const badgeClaims = document.getElementById("badge-pending-claims");
    if (badgeClaims) {
      if (pendingClaims > 0) {
        badgeClaims.innerText = pendingClaims;
        badgeClaims.classList.remove("hidden");
      } else {
        badgeClaims.classList.add("hidden");
      }
    }

    // Build top products chart
    const prodCounts = {};
    claims.forEach(c => {
      prodCounts[c.productName] = (prodCounts[c.productName] || 0) + Number(c.quantity);
    });

    const sortedProds = Object.entries(prodCounts).sort((a,b) => b[1] - a[1]).slice(0, 5);
    const prodContainer = document.getElementById("analytics-top-products");
    if (prodContainer) {
      if (sortedProds.length === 0) {
        prodContainer.innerHTML = `<p class="text-xs text-slate-500 py-4 font-mono text-center">No scanned items found to display charts.</p>`;
      } else {
        prodContainer.innerHTML = sortedProds.map(([name, qty]) => {
          const maxVal = Math.max(...sortedProds.map(p => p[1]));
          const pct = Math.min(100, Math.floor((qty / maxVal) * 100));
          return `
            <div class="space-y-1.5 text-xs">
              <div class="flex justify-between font-bold text-white">
                <span class="truncate pr-4">${name}</span>
                <span class="font-mono text-blue-600">${qty} scans</span>
              </div>
              <div class="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                <div class="bg-blue-500 h-full rounded-full" style="width: ${pct}%"></div>
              </div>
            </div>
          `;
        }).join("");
      }
    }

    // Load recent activity feed list
    const logsContainer = document.getElementById("analytics-recent-activity");
    if (logsContainer) {
      const logs = await window.API.getLogs();
      const slicedLogs = logs.slice(0, 5);
      if (slicedLogs.length === 0) {
        logsContainer.innerHTML = `<p class="text-xs text-slate-500 py-4 font-mono text-center">No actions logged yet.</p>`;
      } else {
        logsContainer.innerHTML = slicedLogs.map(l => {
          let badgeColor = "text-slate-400 bg-slate-950 border-slate-800";
          if (l.tag.includes("OK") || l.tag.includes("INIT")) badgeColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
          if (l.tag.includes("REG") || l.tag.includes("MOD")) badgeColor = "text-blue-400 bg-blue-500/10 border-blue-500/20";
          if (l.tag.includes("SEC") || l.tag.includes("REJ")) badgeColor = "text-red-400 bg-red-500/10 border-red-500/20";

          return `
            <div class="p-3 bg-slate-950 rounded-xl border border-slate-800/60 flex items-start gap-3">
              <span class="px-2 py-0.5 border text-[8px] font-mono font-bold rounded uppercase ${badgeColor}">${l.tag}</span>
              <div class="min-w-0 flex-grow text-xs">
                <p class="text-slate-300 font-sans leading-tight">${l.text}</p>
                <span class="text-[9px] text-slate-500 font-mono block mt-1">${window.UTILS.formatDate(l.timestamp)}</span>
              </div>
            </div>
          `;
        }).join("");
      }
    }

  } catch (e) {
    console.error("Analytics rendering error", e);
    window.UTILS.showToast("Failed to synchronise analytics.", "error");
  } finally {
    window.UTILS.hideLoader();
  }
}

// 2. PARTNERS MANAGEMENT & LOYALTY QR UTILITIES
let currentPartnersList = [];
let approvalFilterRole = "all";

async function loadPartners() {
  try {
    const users = await window.API.getUsers();
    const filtered = users.filter(u => u.role !== "owner"); // hide owner
    currentPartnersList = filtered;
    const tbody = document.getElementById("partners-tbody");
    if (!tbody) return;

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="py-6 text-center text-slate-500 font-mono">No registered partners found in database.</td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtered.map(u => {
      let statusColor = "text-amber-500 bg-amber-500/10 border-amber-500/20";
      if (u.status === "approved") statusColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      if (u.status === "suspended") statusColor = "text-red-400 bg-red-500/10 border-red-500/20";

      const actions = u.status === "pending" 
        ? `<button onclick="handleStatusChange('${u.email}', 'approved')" class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-[#0B192C] font-black rounded text-[10px] transition mr-1 uppercase">Approve</button>
           <button onclick="handleStatusChange('${u.email}', 'suspended')" class="px-2.5 py-1 bg-slate-950 hover:bg-red-950 border border-slate-800 hover:text-red-400 text-slate-400 font-bold rounded text-[10px] transition uppercase">Reject</button>`
        : u.status === "approved"
        ? `<button onclick="handleStatusChange('${u.email}', 'suspended')" class="px-2.5 py-1 bg-slate-950 hover:bg-red-950 border border-slate-800 hover:text-red-400 text-slate-400 font-bold rounded text-[10px] transition uppercase mr-1">Suspend</button>`
        : `<button onclick="handleStatusChange('${u.email}', 'approved')" class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-[#0B192C] font-black rounded text-[10px] transition uppercase mr-1">Reactivate</button>`;

      const qrBtn = `<button onclick="openLoyaltyQrModal('${u.email}')" class="p-1 px-1.5 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded transition font-bold font-mono text-[9px] uppercase tracking-wider inline-flex items-center gap-1" title="Generate QR Pass">
        <i data-lucide="qr-code" class="w-3.5 h-3.5"></i> QR
      </button>`;

      const editBtn = `<button onclick="openEditPartnerModal('${u.email}')" class="p-1 px-1.5 text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded transition font-bold font-mono text-[9px] uppercase tracking-wider inline-flex items-center gap-1 cursor-pointer" title="Edit Partner">
        <i data-lucide="edit" class="w-3.5 h-3.5"></i> Edit
      </button>`;

      return `
        <tr class="border-b border-slate-800/40">
          <td class="py-3 pr-3 font-bold text-white font-sans">${u.fullname}<br><span class="text-[9px] text-slate-500 font-mono">${window.UTILS.displayEmail(u.email)}</span></td>
          <td class="py-3 capitalize font-bold text-slate-300 font-mono text-[10px]">${u.role}</td>
          <td class="py-3 font-semibold text-slate-300 font-sans">${u.firmName || "-"}<br><span class="text-[9px] text-slate-500 font-mono">${u.mobile}</span></td>
          <td class="py-3 font-mono font-bold text-blue-600">${u.points || 0} Pts</td>
          <td class="py-3">
            <span class="px-2 py-0.5 border text-[9px] font-bold rounded uppercase font-mono ${statusColor}">${u.status}</span>
          </td>
          <td class="py-3 text-right whitespace-nowrap space-x-1">
            ${qrBtn}
            ${editBtn}
            ${actions}
          </td>
        </tr>
      `;
    }).join("");
    lucide.createIcons();

  } catch (e) {
    console.error("Partners list retrieval error", e);
    window.UTILS.showToast("Error loading partner profiles.", "error");
  }
}

async function handleStatusChange(email, newStatus) {
  window.UTILS.showLoader("Updating account state...");
  try {
    await window.API.updateUserStatus(email, newStatus);
    window.UTILS.showToast(`Partner account status set to: ${newStatus.toUpperCase()}`, "success");
    await loadPartners();
    if (document.getElementById("panel-approvals") && !document.getElementById("panel-approvals").classList.contains("hidden")) {
      await loadApprovals();
    }
  } catch (e) {
    console.error("Account change failed", e);
    window.UTILS.showToast(e.message, "error");
  } finally {
    window.UTILS.hideLoader();
  }
}

// Complete Membership Roster tab loading
async function loadApprovals() {
  try {
    const users = await window.API.getUsers();
    let filtered = users.filter(u => u.role !== "owner");
    
    // Apply client-side filtering based on selected filter badge
    if (approvalFilterRole === "retailer") {
      filtered = filtered.filter(u => u.role === "retailer");
    } else if (approvalFilterRole === "mechanic") {
      filtered = filtered.filter(u => u.role === "mechanic");
    } else if (approvalFilterRole === "pending") {
      filtered = filtered.filter(u => u.status === "pending");
    }

    const tbody = document.getElementById("approvals-tbody");
    if (!tbody) return;

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="py-6 text-center text-slate-500 font-mono">No matching members found under role "${approvalFilterRole.toUpperCase()}".</td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtered.map(u => {
      let statusColor = "text-amber-500 bg-amber-500/10 border-amber-500/20";
      if (u.status === "approved") statusColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      if (u.status === "suspended") statusColor = "text-red-400 bg-red-500/10 border-red-500/20";

      const actions = u.status === "pending" 
        ? `<button onclick="handleStatusChange('${u.email}', 'approved')" class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-[#0B192C] font-black rounded text-[10px] transition mr-1 uppercase">Approve</button>
           <button onclick="handleStatusChange('${u.email}', 'suspended')" class="px-2.5 py-1 bg-slate-950 hover:bg-red-950 border border-slate-800 hover:text-red-400 text-slate-400 font-bold rounded text-[10px] transition uppercase">Reject</button>`
        : u.status === "approved"
        ? `<button onclick="handleStatusChange('${u.email}', 'suspended')" class="px-2.5 py-1 bg-slate-950 hover:bg-red-950 border border-slate-800 hover:text-red-400 text-slate-400 font-bold rounded text-[10px] transition uppercase mr-1">Suspend</button>`
        : `<button onclick="handleStatusChange('${u.email}', 'approved')" class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-[#0B192C] font-black rounded text-[10px] transition uppercase mr-1">Reactivate</button>`;

      const qrBtn = `<button onclick="openLoyaltyQrModal('${u.email}')" class="p-1 px-1.5 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded transition font-bold font-mono text-[9px] uppercase tracking-wider inline-flex items-center gap-1" title="Generate QR Pass">
        <i data-lucide="qr-code" class="w-3.5 h-3.5"></i> QR
      </button>`;

      const editBtn = `<button onclick="openEditPartnerModal('${u.email}')" class="p-1 px-1.5 text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded transition font-bold font-mono text-[9px] uppercase tracking-wider inline-flex items-center gap-1 cursor-pointer" title="Edit Partner">
        <i data-lucide="edit" class="w-3.5 h-3.5"></i> Edit
      </button>`;

     return `
        <tr class="border-b border-slate-100 text-xs">
          <td class="py-3 pr-3 font-bold text-slate-800 font-sans">${u.fullname}<br><span class="text-[9px] text-slate-400 font-mono">${window.UTILS.displayEmail(u.email)}</span></td>
          <td class="py-3 capitalize font-bold text-slate-600 font-mono text-[10px]">${u.role}</td>
          <td class="py-3 font-semibold text-slate-600 font-sans">${u.firmName || "-"}</td>
          <td class="py-3 text-slate-500 font-mono text-[10px]">${u.pincode || "-"}</td>
          <td class="py-3">
            <span class="px-2 py-0.5 border text-[9px] font-bold rounded uppercase font-mono ${statusColor}">${u.status}</span>
          </td>
          <td class="py-3 font-mono font-bold text-blue-600">${u.points || 0}</td>
          <td class="py-3 text-right whitespace-nowrap space-x-1">
            ${qrBtn}
            ${editBtn}
            ${actions}
          </td>
        </tr>
      `;
    }).join("");
    lucide.createIcons();
  } catch (err) {
    console.error("Error loading approvals", err);
  }
}

function filterApprovalUsers(roleFilter) {
  approvalFilterRole = roleFilter;
  
  // Update button visual states
  const filters = ["all", "retailer", "mechanic", "pending"];
  filters.forEach(f => {
    const btn = document.getElementById(`btn-filter-${f}`);
    if (btn) {
      if (f === roleFilter) {
        btn.className = "px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg transition cursor-pointer";
      } else {
        btn.className = "px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-800 text-xs font-bold rounded-lg transition cursor-pointer";
      }
    }
  });

  loadApprovals();
}

// ---------------- LOYALTY QR UNIQUE GENERATION & CONTROLS ----------------
function openLoyaltyQrModal(userEmail) {
  window.UTILS.showLoader("Generating unique loyalty pass...");
  try {
    const list = currentPartnersList.length > 0 ? currentPartnersList : [];
    let user = list.find(u => u.email.toLowerCase() === userEmail.toLowerCase());
    
    // Fallback search inside direct seeded list if not loaded yet
    if (!user) {
      const allUsers = window.UTILS.getLocal(window.CONFIG.STORAGE_KEYS.USERS) || [];
      user = allUsers.find(u => u.email.toLowerCase() === userEmail.toLowerCase());
    }

    if (!user) {
      window.UTILS.showToast("Failed to retrieve user's profile details.", "error");
      return;
    }

    // Populate Modal details
    document.getElementById("qr-card-name").innerText = user.fullname;
    document.getElementById("qr-card-firm").innerText = `Firm: ${user.firmName || "N/A"}`;
    document.getElementById("qr-card-email").innerText = `Email: ${window.UTILS.displayEmail(user.email)}`;
    document.getElementById("qr-card-phone").innerText = `Phone: ${user.mobile}`;
    
    const formattedRegDate = user.regDate ? window.UTILS.formatDate(user.regDate) : "01-Jul-2026";
    document.getElementById("qr-card-date").innerText = `Issued: ${formattedRegDate}`;

    // Badge styling and content
    const badge = document.getElementById("qr-card-badge");
    badge.innerText = user.role.toUpperCase();
    if (user.role === "distributor") {
      badge.className = "px-2 py-0.5 bg-emerald-600 text-white font-mono text-[7px] font-black uppercase rounded";
    } else if (user.role === "mechanic") {
      badge.className = "px-2 py-0.5 bg-amber-500 text-slate-900 font-mono text-[7px] font-black uppercase rounded";
    } else {
      badge.className = "px-2 py-0.5 bg-slate-950 text-white font-mono text-[7px] font-black uppercase rounded";
    }

    // Build real distinct QR code using library
    const payload = {
      app: "VikasLoyalty",
      v: 1,
      role: user.role,
      email: user.email,
      name: user.fullname,
      firm: user.firmName || ""
    };

    const payloadStr = JSON.stringify(payload);
    const box = document.getElementById("modal-qr-code-box");
    
    // Clear box
    box.innerHTML = "";
    
    // Create actual QR SVG
    const qr = qrcode(0, 'M');
    qr.addData(payloadStr);
    qr.make();
    
    // createSvgTag(cellSize, margin)
    box.innerHTML = qr.createSvgTag(3.5, 2);

    // Restore/apply the currently selected pass format
    const templateSelect = document.getElementById("pass-template-select");
    if (templateSelect) templateSelect.value = window.UTILS.getPassTemplateKey();
    window.UTILS.applyPassTemplateStyle();

    // Show modal
    document.getElementById("loyalty-qr-modal").classList.remove("hidden");
    lucide.createIcons();
    window.UTILS.showToast(`Loyalty QR generated successfully for ${user.fullname}!`, "success");

  } catch (err) {
    console.error("Failed to generate loyalty QR code", err);
    window.UTILS.showToast("Error generating secure QR code.", "error");
  } finally {
    window.UTILS.hideLoader();
  }
}

function closeLoyaltyQrModal() {
  document.getElementById("loyalty-qr-modal").classList.add("hidden");
}

// Called when the owner picks a different Pass Format from the dropdown.
function handlePassTemplateChange(templateKey) {
  window.UTILS.setPassTemplateKey(templateKey);
  window.UTILS.applyPassTemplateStyle();
  window.UTILS.showToast(`Pass format set to ${window.CONFIG.PASS_TEMPLATES[templateKey].label}.`, "success");
}
window.handlePassTemplateChange = handlePassTemplateChange;

function downloadMemberQrCard() {
  const name = document.getElementById("qr-card-name").innerText;
  const email = document.getElementById("qr-card-email").innerText;
  const t = window.UTILS.getPassTemplate();
  
  window.UTILS.showLoader("Composing card print asset...");
  
  // Create canvas
  const canvas = document.createElement("canvas");
  canvas.width = 600;
  canvas.height = 380;
  const ctx = canvas.getContext("2d");
  
  // Fill background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Stroke outer boundary
  ctx.strokeStyle = t.border;
  ctx.lineWidth = 6;
  ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
  
  // Header banner accent
  ctx.fillStyle = t.accent;
  ctx.fillRect(10, 10, canvas.width - 20, 15);
  
  // Title text
  ctx.fillStyle = "#0f172a";
  ctx.font = "black 24px sans-serif";
  ctx.fillText("VIKAS AUTOMOBILES", 35, 65);
  
  ctx.fillStyle = t.accent;
  ctx.font = "bold 11px monospace";
  ctx.fillText("OFFICIAL LOYALTY REWARDS PASS", 35, 85);
  
  // Role Badge draw
  const badgeText = document.getElementById("qr-card-badge").innerText;
  ctx.fillStyle = "#0f172a";
  if (badgeText === "DISTRIBUTOR") ctx.fillStyle = "#10b981";
  else if (badgeText === "MECHANIC") ctx.fillStyle = "#f59e0b";
  
  ctx.fillRect(canvas.width - 160, 45, 125, 30);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 12px monospace";
  ctx.textAlign = "center";
  ctx.fillText(badgeText, canvas.width - 97, 64);
  ctx.textAlign = "left"; // reset alignment
  
  // Divider line
  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(35, 105);
  ctx.lineTo(canvas.width - 35, 105);
  ctx.stroke();
  
  // Draw Metadata rows
  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 15px sans-serif";
  ctx.fillText(name.toUpperCase(), 35, 145);
  
  ctx.fillStyle = "#334155";
  ctx.font = "12px monospace";
  ctx.fillText(document.getElementById("qr-card-firm").innerText, 35, 180);
  ctx.fillText(email, 35, 210);
  ctx.fillText(document.getElementById("qr-card-phone").innerText, 35, 240);
  ctx.fillText(document.getElementById("qr-card-date").innerText, 35, 270);
  
  // Draw QR Code onto Canvas
  const qrSvg = document.querySelector("#modal-qr-code-box svg");
  if (qrSvg) {
    const svgString = new XMLSerializer().serializeToString(qrSvg);
    const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const URL = window.URL || window.webkitURL || window;
    const blobURL = URL.createObjectURL(svgBlob);
    
    const img = new Image();
    img.onload = function() {
      ctx.drawImage(img, canvas.width - 210, 125, 170, 170);
      
      // Dashed separator and fine lines
      ctx.strokeStyle = "#94a3b8";
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(35, 315);
      ctx.lineTo(canvas.width - 35, 315);
      ctx.stroke();
      ctx.setLineDash([]); // reset
      
      // Footnote description
      ctx.fillStyle = "#64748b";
      ctx.font = "bold 10px monospace";
      ctx.textAlign = "center";
      ctx.fillText("PRESENT CODE AT WAREHOUSE FOR INSTANT CASH-BACKS", canvas.width / 2, 348);
      
      // Trigger download block
      const link = document.createElement("a");
      link.download = `loyalty-pass-${name.toLowerCase().replace(/\s+/g, "-")}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      
      URL.revokeObjectURL(blobURL);
      window.UTILS.hideLoader();
      window.UTILS.showToast("Digital loyalty card saved to downloads!", "success");
    };
    img.src = blobURL;
  } else {
    window.UTILS.hideLoader();
    window.UTILS.showToast("Failed to process QR graphics vector.", "error");
  }
}

function downloadMemberQrCardPdf() {
  const name = document.getElementById("qr-card-name").innerText;
  const email = document.getElementById("qr-card-email").innerText;
  const t = window.UTILS.getPassTemplate();
  
  window.UTILS.showLoader("Generating high-resolution loyalty PDF...");
  
  // Create canvas
  const canvas = document.createElement("canvas");
  canvas.width = 600;
  canvas.height = 380;
  const ctx = canvas.getContext("2d");
  
  // Fill background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Stroke outer boundary
  ctx.strokeStyle = t.border;
  ctx.lineWidth = 6;
  ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
  
  // Header banner accent
  ctx.fillStyle = t.accent;
  ctx.fillRect(10, 10, canvas.width - 20, 15);
  
  // Title text
  ctx.fillStyle = "#0f172a";
  ctx.font = "black 24px sans-serif";
  ctx.fillText("VIKAS AUTOMOBILES", 35, 65);
  
  ctx.fillStyle = t.accent;
  ctx.font = "bold 11px monospace";
  ctx.fillText("OFFICIAL LOYALTY REWARDS PASS", 35, 85);
  
  // Role Badge draw
  const badgeText = document.getElementById("qr-card-badge").innerText;
  ctx.fillStyle = "#0f172a";
  if (badgeText === "DISTRIBUTOR") ctx.fillStyle = "#10b981";
  else if (badgeText === "MECHANIC") ctx.fillStyle = "#f59e0b";
  
  ctx.fillRect(canvas.width - 160, 45, 125, 30);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 12px monospace";
  ctx.textAlign = "center";
  ctx.fillText(badgeText, canvas.width - 97, 64);
  ctx.textAlign = "left"; // reset alignment
  
  // Divider line
  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(35, 105);
  ctx.lineTo(canvas.width - 35, 105);
  ctx.stroke();
  
  // Draw Metadata rows
  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 15px sans-serif";
  ctx.fillText(name.toUpperCase(), 35, 145);
  
  ctx.fillStyle = "#334155";
  ctx.font = "12px monospace";
  ctx.fillText(document.getElementById("qr-card-firm").innerText, 35, 180);
  ctx.fillText(email, 35, 210);
  ctx.fillText(document.getElementById("qr-card-phone").innerText, 35, 240);
  ctx.fillText(document.getElementById("qr-card-date").innerText, 35, 270);
  
  // Draw QR Code onto Canvas
  const qrSvg = document.querySelector("#modal-qr-code-box svg");
  if (qrSvg) {
    const svgString = new XMLSerializer().serializeToString(qrSvg);
    const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const URL = window.URL || window.webkitURL || window;
    const blobURL = URL.createObjectURL(svgBlob);
    
    const img = new Image();
    img.onload = function() {
      ctx.drawImage(img, canvas.width - 210, 125, 170, 170);
      
      // Dashed separator and fine lines
      ctx.strokeStyle = "#94a3b8";
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(35, 315);
      ctx.lineTo(canvas.width - 35, 315);
      ctx.stroke();
      ctx.setLineDash([]); // reset
      
      // Footnote description
      ctx.fillStyle = "#64748b";
      ctx.font = "bold 10px monospace";
      ctx.textAlign = "center";
      ctx.fillText("PRESENT CODE AT WAREHOUSE FOR INSTANT CASH-BACKS", canvas.width / 2, 348);
      
      // Generate PDF
      const imgData = canvas.toDataURL("image/png");
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [600, 380]
      });
      pdf.addImage(imgData, "PNG", 0, 0, 600, 380);
      pdf.save(`loyalty-pass-${name.toLowerCase().replace(/\s+/g, "-")}.pdf`);
      
      URL.revokeObjectURL(blobURL);
      window.UTILS.hideLoader();
      window.UTILS.showToast("Digital loyalty card PDF saved to downloads!", "success");
    };
    img.src = blobURL;
  } else {
    window.UTILS.hideLoader();
    window.UTILS.showToast("Failed to process QR graphics vector.", "error");
  }
}

function printMemberQrCard() {
  const cardHtml = document.getElementById("loyalty-printable-card").outerHTML;
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    window.UTILS.showToast("Pop-up blocked! Please allow popups to print member cards.", "warning");
    return;
  }
  
  printWindow.document.write(`
    <html>
      <head>
        <title>Print Loyalty Card - ${document.getElementById("qr-card-name").innerText}</title>
        <style>
          body {
            margin: 0;
            padding: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 80vh;
            font-family: system-ui, -apple-system, sans-serif;
            background-color: #ffffff;
          }
          .w-full { width: 450px; }
          .bg-white { background-color: #ffffff; }
          .text-slate-900 { color: #0f172a; }
          .p-5 { padding: 24px; }
          .border { border: 1px solid #cbd5e1; }
          .border-slate-300 { border-color: #94a3b8; }
          .rounded-xl { border-radius: 16px; }
          .shadow-md { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); }
          .flex { display: flex; }
          .flex-col { display: flex; flex-direction: column; }
          .justify-between { justify-content: space-between; }
          .items-center { align-items: center; }
          .items-start { align-items: flex-start; }
          .gap-4 { gap: 20px; }
          .pb-2 { padding-bottom: 10px; }
          .border-b-2 { border-bottom: 3px solid #0f172a; }
          .text-\\[12px\\] { font-size: 14px; }
          .font-black { font-weight: 900; }
          .uppercase { text-transform: uppercase; }
          .tracking-tight { letter-spacing: -0.025em; }
          .text-slate-950 { color: #0f172a; }
          .text-\\[7\\.5px\\] { font-size: 9px; }
          .font-mono { font-family: monospace; }
          .text-blue-600 { color: #2563eb; }
          .tracking-wider { letter-spacing: 0.05em; }
          .px-2 { padding-left: 10px; padding-right: 10px; }
          .py-0\\.5 { padding-top: 3px; padding-bottom: 3px; }
          .bg-slate-950 { background-color: #0f172a; }
          .text-white { color: #ffffff; }
          .text-\\[7px\\] { font-size: 9px; }
          .rounded { border-radius: 6px; }
          .py-3 { padding-top: 14px; padding-bottom: 14px; }
          .w-24 { width: 110px; height: 110px; }
          .p-1\\.5 { padding: 8px; }
          .border-slate-200 { border-color: #cbd5e1; }
          .rounded-lg { border-radius: 10px; }
          .flex-grow { flex-grow: 1; }
          .text-\\[9px\\] { font-size: 11px; }
          .leading-tight { line-height: 1.35; }
          .space-y-1 > * + * { margin-top: 4px; }
          .font-extrabold { font-weight: 800; }
          .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
          .text-slate-400 { color: #64748b; }
          .border-t { border-top: 1.5px solid #e2e8f0; }
          .border-dashed { border-style: dashed; }
          .pt-1\\.5 { padding-top: 10px; }
          .text-center { text-align: center; }
          svg { width: 100% !important; height: 100% !important; }
        </style>
      </head>
      <body>
        <div style="transform: scale(1.4); transform-origin: center;">
          ${cardHtml}
        </div>
        <script>
          window.onload = function() {
            setTimeout(() => {
              window.print();
              window.close();
            }, 600);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

// 3. POLICIES LOADER
async function loadPolicies() {
  try {
    const policies = await window.API.getSettings();
    document.getElementById("policy-retailer-mult").value = policies.retailerMultiplier;
    document.getElementById("policy-mechanic-mult").value = policies.mechanicMultiplier;
    document.getElementById("policy-silver-thresh").value = policies.silverThreshold;
    document.getElementById("policy-gold-thresh").value = policies.goldThreshold;
  } catch (e) {
    console.error("Error loading policies", e);
    window.UTILS.showToast("Failed to fetch loyalty policy settings.", "error");
  }
}

async function handleSavePolicies(e) {
  e.preventDefault();
  window.UTILS.showLoader("Saving loyalty rules...");
  try {
    const settings = {
      retailerMultiplier: Number(document.getElementById("policy-retailer-mult").value),
      mechanicMultiplier: Number(document.getElementById("policy-mechanic-mult").value),
      silverThreshold: Number(document.getElementById("policy-silver-thresh").value),
      goldThreshold: Number(document.getElementById("policy-gold-thresh").value)
    };
    await window.API.saveSettings(settings);
    window.UTILS.showToast("Policies and loyalty multipliers updated successfully!", "success");
  } catch (e) {
    console.error("Policies save failed", e);
    window.UTILS.showToast(e.message, "error");
  } finally {
    window.UTILS.hideLoader();
  }
}

// 3b. CORPORATE SETTINGS (Company Name, Support Email/Phone)
async function loadCorporateSettingsForm() {
  try {
    const settings = await window.API.getSettings();
    document.getElementById("set-company").value = settings.companyName || "Vikas Automobiles Ltd.";
    document.getElementById("set-email").value = settings.supportEmail || "loyalty@vikasautomobiles.com";
    document.getElementById("set-phone").value = settings.supportPhone || "+91 99999 88888";
  } catch (e) {
    console.error("Error loading corporate settings", e);
    window.UTILS.showToast("Failed to fetch corporate settings.", "error");
  }
}

async function handleSettingsFormSubmit(event) {
  if (event) event.preventDefault();
  window.UTILS.showLoader("Updating corporate profile...");
  try {
    await window.API.saveSettings({
      companyName: document.getElementById("set-company").value.trim(),
      supportEmail: document.getElementById("set-email").value.trim(),
      supportPhone: document.getElementById("set-phone").value.trim()
    });
    window.UTILS.showToast("Corporate profile updated successfully! Helpline info will reflect network-wide.", "success");
  } catch (e) {
    console.error("Corporate settings save failed", e);
    window.UTILS.showToast(e.message, "error");
  } finally {
    window.UTILS.hideLoader();
  }
}

window.loadCorporateSettingsForm = loadCorporateSettingsForm;
window.handleSettingsFormSubmit = handleSettingsFormSubmit;

// 4. SECURITY AUDIT LOGS LOADER
async function loadAuditLogs() {
  try {
    const logs = await window.API.getLogs();
    const consoleLogs = document.getElementById("audit-logs-console");
    if (!consoleLogs) return;

    if (logs.length === 0) {
      consoleLogs.innerHTML = `<span class="text-slate-500">[CONSOLE_IDLE]: No audit sessions stored.</span>`;
      return;
    }

    consoleLogs.innerHTML = logs.map(l => {
      let tagColor = "text-slate-400";
      if (l.tag.includes("OK") || l.tag.includes("INIT")) tagColor = "text-emerald-400";
      if (l.tag.includes("REG") || l.tag.includes("MOD")) tagColor = "text-blue-400";
      if (l.tag.includes("SEC") || l.tag.includes("REJ")) tagColor = "text-red-500 font-bold";

      return `
        <div class="py-1">
          <span class="text-slate-600">[${window.UTILS.formatDate(l.timestamp)}]</span>
          <span class="${tagColor} font-bold">[${l.tag}]</span>: 
          <span class="text-slate-300">${l.text}</span>
        </div>
      `;
    }).join("");

    // Scroll to top
    consoleLogs.scrollTop = 0;
  } catch (e) {
    console.error("Audit load error", e);
    window.UTILS.showToast("Error retrieving audit records.", "error");
  }
}

// 5. BULLETINS BROADCASTER LOADER
async function loadBulletins() {
  await window.NOTIFICATIONS.renderDashboardAnnouncements("bulletins-feed-container", "all", true);
}

async function handleCreateAnnouncement(e) {
  e.preventDefault();
  window.UTILS.showLoader("Broadcasting bulletin...");
  try {
    const ann = {
      subject: document.getElementById("broadcast-subject").value.trim(),
      body: document.getElementById("broadcast-body").value.trim(),
      target: document.getElementById("broadcast-target").value,
      channel: "all"
    };

    await window.API.addAnnouncement(ann);
    window.UTILS.showToast("Broadcast bulletin dispatched to network!", "success");
    
    // Clear form
    document.getElementById("broadcast-subject").value = "";
    document.getElementById("broadcast-body").value = "";
    
    await loadBulletins();
  } catch (e) {
    console.error("Bulletin dispatch failed", e);
    window.UTILS.showToast(e.message, "error");
  } finally {
    window.UTILS.hideLoader();
  }
}

// 6. LOGOUT DISPATCH
function handleLogout() {
  window.AUTH.logout();
}

// INITIALIZATION ENTRY POINT
async function initOwnerPage() {
  window.UTILS.showLoader("Securing Owner Portal workspace...");
  try {
    currentOwnerSession = window.AUTH.verifySession(["owner"]);
    if (!currentOwnerSession) return;

    // Load profile header details
    document.getElementById("sidebar-username").innerText = currentOwnerSession.fullname;
    if (currentOwnerSession.photo) {
      document.getElementById("sidebar-avatar").src = currentOwnerSession.photo;
    }

    // Default view
    loadAnalytics();

  } catch (e) {
    console.error("Owner load failed", e);
    window.UTILS.showToast("Failed to authenticate session.", "error");
  } finally {
    window.UTILS.hideLoader();
  }
}

window.initOwnerPage = initOwnerPage;
window.switchTab = switchTab;
window.toggleSidebar = toggleSidebar;
window.handleStatusChange = handleStatusChange;
window.handleSavePolicies = handleSavePolicies;
window.handleCreateAnnouncement = handleCreateAnnouncement;
window.handleLogout = handleLogout;
window.loadApprovals = loadApprovals;
window.filterApprovalUsers = filterApprovalUsers;
window.openLoyaltyQrModal = openLoyaltyQrModal;
window.closeLoyaltyQrModal = closeLoyaltyQrModal;
window.downloadMemberQrCard = downloadMemberQrCard;
window.printMemberQrCard = printMemberQrCard;

// Edit Partner Details (Owner portal)
async function openEditPartnerModal(email) {
  try {
    const users = await window.API.getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) throw new Error("Partner not found in database.");
    
    document.getElementById("edit-partner-email-key").value = user.email;
    document.getElementById("edit-partner-name").value = user.fullname || "";
    document.getElementById("edit-partner-phone").value = user.mobile || "";
    document.getElementById("edit-partner-email").value = window.UTILS.displayEmail(user.email);
    document.getElementById("edit-partner-firm").value = user.firmName || "";
    document.getElementById("edit-partner-address").value = user.address || "";
    document.getElementById("edit-partner-photo").value = user.photo || "";
    document.getElementById("edit-partner-preview").src = user.photo || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop";
    document.getElementById("edit-partner-points").value = user.points || 0;
    
    document.getElementById("edit-partner-modal").classList.remove("hidden");
  } catch (err) {
    window.UTILS.showToast(err.message, "error");
  }
}

function closeEditPartnerModal() {
  document.getElementById("edit-partner-modal").classList.add("hidden");
}

async function savePartnerDetails(event) {
  event.preventDefault();
  window.UTILS.showLoader("Saving partner updates...");
  
  try {
    const emailKey = document.getElementById("edit-partner-email-key").value;
    const updatedData = {
      fullname: document.getElementById("edit-partner-name").value.trim(),
      mobile: document.getElementById("edit-partner-phone").value.trim(),
      firmName: document.getElementById("edit-partner-firm").value.trim(),
      address: document.getElementById("edit-partner-address").value.trim(),
      photo: document.getElementById("edit-partner-photo").value.trim(),
      points: parseInt(document.getElementById("edit-partner-points").value, 10) || 0
    };
    
    await window.API.updateUserProfile(emailKey, updatedData);
    
    window.UTILS.hideLoader();
    window.UTILS.showToast("Partner details saved successfully!", "success");
    closeEditPartnerModal();
    
    // Refresh tables
    await loadPartners();
    if (document.getElementById("panel-approvals") && !document.getElementById("panel-approvals").classList.contains("hidden")) {
      await loadApprovals();
    }
  } catch (error) {
    window.UTILS.hideLoader();
    window.UTILS.showToast(error.message, "error");
  }
}

window.openEditPartnerModal = openEditPartnerModal;
window.closeEditPartnerModal = closeEditPartnerModal;
window.savePartnerDetails = savePartnerDetails;

// --- ADMIN ACCOUNT MANAGEMENT ---
async function loadAdminsRoster() {
  const tbody = document.getElementById("admins-tbody");
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="5" class="py-6 text-center text-slate-400 font-mono">Fetching admin accounts...</td></tr>`;

  try {
    const users = await window.API.getUsers();
    const admins = users.filter(u => u.role === "admin");

    if (admins.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="py-6 text-center text-slate-400 font-mono">No admin accounts registered yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = admins.map(a => `
      <tr class="border-b border-slate-100 text-xs hover:bg-slate-50 transition">
        <td class="py-2.5 font-bold text-slate-800">${a.fullname}</td>
        <td class="py-2.5 font-mono text-slate-500">${window.UTILS.displayEmail(a.email)}</td>
        <td class="py-2.5 font-mono text-slate-500">${a.mobile || "-"}</td>
        <td class="py-2.5 font-mono text-slate-500 text-[10px]">${window.UTILS.formatDate(a.regDate)}</td>
        <td class="py-2.5 text-right">
          <button onclick="handleDeleteAdmin('${a.email}')" class="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded text-[9px] uppercase transition cursor-pointer">Remove</button>
        </td>
      </tr>
    `).join("");
  } catch (err) {
    console.error("Failed to load admin roster", err);
    tbody.innerHTML = `<tr><td colspan="5" class="py-6 text-center text-rose-500 font-mono">Failed to load admin accounts.</td></tr>`;
  }
}

async function handleCreateAdminSubmit(event) {
  if (event) event.preventDefault();

  const fullname = document.getElementById("admin-fullname").value.trim();
  const email = document.getElementById("admin-email").value.trim();
  const mobile = document.getElementById("admin-mobile").value.trim();
  const password = document.getElementById("admin-password").value;

  if (!fullname || !email || !mobile || !password) {
    window.UTILS.showToast("Please fill in all fields.", "warning");
    return;
  }

  window.UTILS.showLoader("Registering admin account...");
  try {
    await window.API.createUser({
      fullname,
      email,
      mobile,
      password,
      role: "admin",
      firmName: "Vikas Automobiles Ltd.",
      address: "",
      photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop"
    });
    window.UTILS.showToast("Admin account created successfully!", "success");
    event.target.reset();
    await loadAdminsRoster();
  } catch (err) {
    console.error("Failed to create admin", err);
    window.UTILS.showToast(err.message, "error");
  } finally {
    window.UTILS.hideLoader();
  }
}

async function handleDeleteAdmin(email) {
  const confirmed = confirm(`Are you sure you want to permanently remove this admin account? This action cannot be undone.`);
  if (!confirmed) return;

  window.UTILS.showLoader("Removing admin account...");
  try {
    await window.API.deleteUser(email);
    window.UTILS.showToast("Admin account removed.", "success");
    await loadAdminsRoster();
  } catch (err) {
    console.error("Failed to delete admin", err);
    window.UTILS.showToast(err.message, "error");
  } finally {
    window.UTILS.hideLoader();
  }
}

window.loadAdminsRoster = loadAdminsRoster;
window.handleCreateAdminSubmit = handleCreateAdminSubmit;
window.handleDeleteAdmin = handleDeleteAdmin;

// --- OWNER'S OWN PROFILE (SELF-SERVICE) ---
function openOwnerProfileModal() {
  const session = window.AUTH.getCurrentSession();
  if (!session) return;

  document.getElementById("owner-profile-modal-name").value = session.fullname || "";
  document.getElementById("owner-profile-modal-phone").value = session.mobile || "";
  document.getElementById("owner-profile-modal-email").value = window.UTILS.displayEmail(session.email);
  document.getElementById("owner-profile-modal-photo").value = session.photo || "";
  document.getElementById("owner-profile-modal-preview").src = session.photo || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop";

  document.getElementById("owner-profile-modal").classList.remove("hidden");
}

function closeOwnerProfileModal() {
  document.getElementById("owner-profile-modal").classList.add("hidden");
}

function uploadOwnerProfilePhotoFile(input) {
  if (input.files && input.files[0]) {
    const file = input.files[0];
    if (file.size > 2 * 1024 * 1024) {
      window.UTILS.showToast("Profile image exceeds 2MB limit.", "error");
      input.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = function(e) {
      const base64 = e.target.result;
      const photoInput = document.getElementById("owner-profile-modal-photo");
      const preview = document.getElementById("owner-profile-modal-preview");
      if (photoInput) photoInput.value = base64;
      if (preview) preview.src = base64;
      window.UTILS.showToast("Local profile photo uploaded!", "success");
    };
    reader.readAsDataURL(file);
  }
}

async function saveOwnerProfileSettings(event) {
  if (event) event.preventDefault();
  window.UTILS.showLoader("Saving profile updates...");

  try {
    const session = window.AUTH.getCurrentSession();
    if (!session) throw new Error("No active user session.");

    const updatedData = {
      fullname: document.getElementById("owner-profile-modal-name").value.trim(),
      mobile: document.getElementById("owner-profile-modal-phone").value.trim(),
      photo: document.getElementById("owner-profile-modal-photo").value.trim()
    };

    await window.API.updateUserProfile(session.email, updatedData);

    window.UTILS.hideLoader();
    window.UTILS.showToast("Your profile details updated successfully!", "success");
    closeOwnerProfileModal();

    setTimeout(() => window.location.reload(), 900);
  } catch (err) {
    window.UTILS.hideLoader();
    window.UTILS.showToast(err.message, "error");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const photoInput = document.getElementById("owner-profile-modal-photo");
  if (photoInput) {
    photoInput.addEventListener("input", (e) => {
      const img = document.getElementById("owner-profile-modal-preview");
      if (img) img.src = e.target.value || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop";
    });
  }
});

window.openOwnerProfileModal = openOwnerProfileModal;
window.closeOwnerProfileModal = closeOwnerProfileModal;
window.uploadOwnerProfilePhotoFile = uploadOwnerProfilePhotoFile;
window.saveOwnerProfileSettings = saveOwnerProfileSettings;

// --- OWNER PURCHASE APPROVALS ---
let ownerClaimsFilter = "all";
let ownerClaimsList = [];

async function loadOwnerPurchases() {
  try {
    const claims = await window.API.getPurchases();
    ownerClaimsList = claims;
    renderOwnerClaimsTable(claims);
  } catch (e) {
    console.error("Error loading claims", e);
    window.UTILS.showToast("Failed to load claims ledger.", "error");
  }
}

function renderOwnerClaimsTable(list) {
  const tbody = document.getElementById("purchases-tbody");
  if (!tbody) return;

  let filtered = list;
  if (ownerClaimsFilter === "pending") {
    filtered = list.filter(c => c.status === "pending");
  }

  // Update badge for pending claims count on sidebar
  const pendingCount = list.filter(c => c.status === "pending").length;
  const badge = document.getElementById("badge-pending-claims");
  if (badge) {
    if (pendingCount > 0) {
      badge.innerText = pendingCount;
      badge.classList.remove("hidden");
    } else {
      badge.classList.add("hidden");
    }
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="py-6 text-center text-slate-500 font-mono">No matching points scan claims in the ledger.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(c => {
    let statusClass = "text-amber-500 bg-amber-500/10 border-amber-500/20";
    if (c.status === "approved") statusClass = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    if (c.status === "rejected") statusClass = "text-red-400 bg-red-500/10 border-red-500/20";

    const dateStr = c.date ? new Date(c.date).toLocaleDateString() : "-";

    const actions = c.status === "pending"
      ? `<button onclick="processOwnerPurchaseClaim('${c.id}', 'approved')" class="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-[#0B192C] font-black rounded text-[9px] uppercase transition mr-1 cursor-pointer">Approve</button>
         <button onclick="processOwnerPurchaseClaim('${c.id}', 'rejected')" class="px-2 py-1 bg-red-650 hover:bg-red-600 text-white font-black rounded text-[9px] uppercase transition mr-1 cursor-pointer">Reject</button>
         <button onclick="handleDeleteOwnerClaim('${c.id}')" class="p-1 text-rose-600 hover:text-rose-500 transition align-middle" title="Delete Claim"><i data-lucide="trash-2" class="w-3.5 h-3.5 inline"></i></button>`
      : `<span class="text-[10px] text-slate-500 italic font-mono uppercase font-semibold mr-1.5">Processed</span>
         <button onclick="handleDeleteOwnerClaim('${c.id}')" class="p-1 text-rose-600 hover:text-rose-500 transition align-middle" title="Delete Claim"><i data-lucide="trash-2" class="w-3.5 h-3.5 inline"></i></button>`;

    return `
      <tr class="border-b border-slate-100 text-xs">
        <td class="py-3 font-sans">
          <span class="font-bold text-slate-800">${c.fullname}</span><br>
          <span class="text-[10px] text-slate-500 font-mono">${window.UTILS.displayEmail(c.email)} (${c.role.toUpperCase()})</span>
        </td>
        <td class="py-3 text-slate-700 font-semibold">
          ${c.productName}<br>
          <span class="text-[10px] text-slate-400 font-mono font-bold">${c.productID}</span>
        </td>
        <td class="py-3 font-mono font-bold text-slate-600">${c.quantity}</td>
        <td class="py-3 font-mono font-black text-blue-600">${c.pointsCalculated >= 0 ? '+' : ''}${c.pointsCalculated} Pts</td>
        <td class="py-3">
          <span class="px-2 py-0.5 border text-[9px] font-bold rounded uppercase font-mono ${statusClass}">${c.status}</span>
          ${c.remark ? `<div class="text-[10px] text-slate-500 italic mt-1 font-sans font-medium max-w-[200px] truncate" title="${c.remark}">Re: ${c.remark}</div>` : ""}
        </td>
        <td class="py-3 font-mono text-slate-500 text-[10px]">${dateStr}</td>
        <td class="py-3 text-right whitespace-nowrap">${actions}</td>
      </tr>
    `;
  }).join("");

  if (window.lucide) window.lucide.createIcons();
}

function filterOwnerClaims(status) {
  ownerClaimsFilter = status;
  renderOwnerClaimsTable(ownerClaimsList);
}

async function processOwnerPurchaseClaim(id, status) {
  const remark = prompt(`Enter a validation remark / reason for ${status.toUpperCase()} this claim:`, "");
  if (remark === null) {
    // Cancelled by user
    return;
  }
  
  window.UTILS.showLoader("Processing points claim authorization...");
  try {
    await window.API.processPurchaseClaim(id, status, remark);
    window.UTILS.showToast(`Purchase claim ${status} successfully!`, "success");
    await loadOwnerPurchases();
    if (window.loadAnalytics) {
      loadAnalytics();
    }
  } catch (err) {
    window.UTILS.showToast(err.message, "error");
  } finally {
    window.UTILS.hideLoader();
  }
}

async function handleDeleteOwnerClaim(id) {
  const confirmed = confirm(`Are you sure you want to permanently delete scan claim ${id}? This cannot be undone.`);
  if (!confirmed) return;

  window.UTILS.showLoader("Deleting scan claim record...");
  try {
    await window.API.deletePurchaseClaim(id);
    window.UTILS.showToast("Scan claim record permanently deleted.", "success");
    await loadOwnerPurchases();
  } catch (err) {
    console.error("Failed to delete scan claim", err);
    window.UTILS.showToast(err.message, "error");
  } finally {
    window.UTILS.hideLoader();
  }
}

window.loadOwnerPurchases = loadOwnerPurchases;
window.filterOwnerClaims = filterOwnerClaims;
window.handleDeleteOwnerClaim = handleDeleteOwnerClaim;
window.processOwnerPurchaseClaim = processOwnerPurchaseClaim;

// Set up photo live preview in edit partner modal
document.addEventListener("DOMContentLoaded", () => {
  const editPhotoInput = document.getElementById("edit-partner-photo");
  if (editPhotoInput) {
    editPhotoInput.addEventListener("input", (e) => {
      const img = document.getElementById("edit-partner-preview");
      if (img) img.src = e.target.value || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop";
    });
  }
});

function uploadPartnerPhotoFile(input) {
  if (input.files && input.files[0]) {
    const file = input.files[0];
    if (file.size > 2 * 1024 * 1024) {
      window.UTILS.showToast("Profile image exceeds 2MB limit.", "error");
      input.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = function(e) {
      const base64 = e.target.result;
      const photoInput = document.getElementById("edit-partner-photo");
      const preview = document.getElementById("edit-partner-preview");
      if (photoInput) photoInput.value = base64;
      if (preview) preview.src = base64;
      window.UTILS.showToast("Local profile photo uploaded!", "success");
    };
    reader.readAsDataURL(file);
  }
}
window.uploadPartnerPhotoFile = uploadPartnerPhotoFile;

// ==========================================
// PRICE LIST CATALOG & CATEGORY FILTERING MODULE
// ==========================================
let ownerCatalogList = [];
let ownerCatalogCategoryFilter = "all";
let ownerCatalogSearchQuery = "";

async function loadOwnerCatalog() {
  const tbody = document.getElementById("owner-catalog-tbody");
  if (tbody) tbody.innerHTML = `<tr><td colspan="7" class="py-8 text-center text-slate-400 font-mono">Fetching catalog...</td></tr>`;

  try {
    const products = await window.API.getProducts();
    ownerCatalogList = products;
    renderOwnerCategoryPills();
    renderOwnerCatalogTable();
  } catch (err) {
    console.error("Failed to load catalog in owner dashboard", err);
    window.UTILS.showToast("Failed to sync catalog.", "error");
  }
}

function renderOwnerCategoryPills() {
  const container = document.getElementById("owner-category-pills");
  if (!container) return;

  const categories = new Set();
  ownerCatalogList.forEach(p => {
    if (p.category) categories.add(p.category.trim());
  });

  const sortedCategories = Array.from(categories).sort();
  let html = `
    <button onclick="setOwnerCategoryFilter('all')" class="px-3 py-1 text-xs font-bold rounded-full border transition cursor-pointer ${
      ownerCatalogCategoryFilter === "all"
        ? "bg-blue-600 text-white border-blue-600"
        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
    }">
      All Categories
    </button>
  `;

  sortedCategories.forEach(cat => {
    const isActive = ownerCatalogCategoryFilter === cat;
    html += `
      <button onclick="setOwnerCategoryFilter('${cat}')" class="px-3 py-1 text-xs font-bold rounded-full border transition cursor-pointer ${
        isActive
          ? "bg-blue-600 text-white border-blue-600"
          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
      }">
        ${cat}
      </button>
    `;
  });

  container.innerHTML = html;
}

function setOwnerCategoryFilter(category) {
  ownerCatalogCategoryFilter = category;
  renderOwnerCategoryPills();
  renderOwnerCatalogTable();
}

function handleOwnerCatalogSearch(query) {
  ownerCatalogSearchQuery = (query || "").trim().toLowerCase();
  renderOwnerCatalogTable();
}

function renderOwnerCatalogTable() {
  const tbody = document.getElementById("owner-catalog-tbody");
  if (!tbody) return;

  const filtered = ownerCatalogList.filter(p => {
    const matchesCategory = ownerCatalogCategoryFilter === "all" || (p.category && p.category.trim() === ownerCatalogCategoryFilter);
    const text = `${p.name || ""} ${p.brand || ""} ${p.category || ""}`.toLowerCase();
    const matchesSearch = text.includes(ownerCatalogSearchQuery);
    return matchesCategory && matchesSearch;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="py-10 text-center text-slate-400 font-mono">
          No matching catalog spares found.
        </td>
      </tr>
    `;
    updateOwnerDeleteSelectedButtonState();
    return;
  }

  tbody.innerHTML = filtered.map(p => {
    return `
      <tr class="hover:bg-slate-50 transition">
        <td class="py-3 w-8">
          <input type="checkbox" name="owner-product-select" value="${p.id}" onchange="updateOwnerDeleteSelectedButtonState()" class="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer">
        </td>
        <td class="py-3">
          <div class="font-extrabold text-slate-800">${p.name || "Unnamed"}</div>
          <div class="text-[10px] text-slate-400 font-mono uppercase">Pack: ${p.packSize || "1 Unit"}</div>
        </td>
        <td class="py-3 text-slate-500 font-bold text-[11px]">
          <div>${p.brand || "Vikas Brand"}</div>
          <div class="text-[10px] text-slate-400 font-mono">${p.category || "Spares"}</div>
        </td>
        <td class="py-3 font-mono font-bold text-slate-900">&#8377; ${Number(p.mrp || 0).toLocaleString("en-IN")}</td>
        <td class="py-3 font-mono font-bold text-blue-600">&#8377; ${Number(p.retailerPrice || 0).toLocaleString("en-IN")}</td>
        <td class="py-3 font-mono font-bold text-indigo-600">&#8377; ${Number(p.mechanicPrice || 0).toLocaleString("en-IN")}</td>
        <td class="py-3">
          <div class="text-[10px] text-slate-500 font-mono">
            R: <span class="text-blue-600 font-bold">${p.retailerPoints || 0} pts</span><br>
            M: <span class="text-indigo-600 font-bold">${p.mechanicPoints || 0} pts</span>
          </div>
        </td>
      </tr>
    `;
  }).join("");

  // Reset select-all state and sync the Delete Selected button
  const master = document.getElementById("select-all-owner-products");
  if (master) master.checked = false;
  updateOwnerDeleteSelectedButtonState();
}

function toggleSelectAllOwnerProducts(masterCheckbox) {
  const checkboxes = document.querySelectorAll('input[name="owner-product-select"]');
  checkboxes.forEach(cb => cb.checked = masterCheckbox.checked);
  updateOwnerDeleteSelectedButtonState();
}

function updateOwnerDeleteSelectedButtonState() {
  const checkboxes = document.querySelectorAll('input[name="owner-product-select"]:checked');
  const deleteBtn = document.getElementById("btn-owner-delete-selected");
  if (deleteBtn) {
    if (checkboxes.length > 0) {
      deleteBtn.disabled = false;
      deleteBtn.querySelector("span").innerText = `Delete Selected (${checkboxes.length})`;
    } else {
      deleteBtn.disabled = true;
      deleteBtn.querySelector("span").innerText = "Delete Selected";
    }
  }

  // Keep master checkbox in sync when some (but not all) rows are checked
  const totalCheckboxes = document.querySelectorAll('input[name="owner-product-select"]');
  const master = document.getElementById("select-all-owner-products");
  if (master && totalCheckboxes.length > 0) {
    master.checked = checkboxes.length === totalCheckboxes.length;
  }
}

async function handleDeleteSelectedOwnerProducts() {
  const checkboxes = document.querySelectorAll('input[name="owner-product-select"]:checked');
  if (checkboxes.length === 0) return;

  const ids = Array.from(checkboxes).map(cb => cb.value);
  if (!confirm(`Are you sure you want to delete the ${ids.length} selected spare part${ids.length > 1 ? "s" : ""} from the catalog? This action is irreversible.`)) {
    return;
  }

  window.UTILS.showLoader(`Deleting ${ids.length} catalog item${ids.length > 1 ? "s" : ""}...`);
  try {
    await window.API.deleteMultipleProducts(ids);
    window.UTILS.showToast(`${ids.length} catalog item${ids.length > 1 ? "s" : ""} deleted successfully.`, "success");

    const master = document.getElementById("select-all-owner-products");
    if (master) master.checked = false;

    await loadOwnerCatalog();
  } catch (err) {
    console.error("Failed to delete selected catalog products", err);
    window.UTILS.showToast("Failed to delete selected products.", "error");
  } finally {
    window.UTILS.hideLoader();
  }
}
window.toggleSelectAllOwnerProducts = toggleSelectAllOwnerProducts;
window.updateOwnerDeleteSelectedButtonState = updateOwnerDeleteSelectedButtonState;
window.handleDeleteSelectedOwnerProducts = handleDeleteSelectedOwnerProducts;

// Bulk Product Upload logic for Owner Dashboard (matches admin behavior)
async function handleBulkProductUpload(input) {
  const file = input.files[0];
  if (!file) return;

  window.UTILS.showLoader("Processing bulk product upload...");
  try {
    const text = await file.text();
    const rows = text.split("\n").map(r => r.trim()).filter(Boolean);
    if (rows.length <= 1) {
      throw new Error("CSV file contains no records.");
    }

    let successCount = 0;
    for (let i = 1; i < rows.length; i++) {
      const cols = rows[i].split(",").map(c => c.trim().replace(/^["']|["']$/g, ""));
      if (cols.length < 5) continue;

      const product = {
        name: cols[0],
        brand: cols[1] || "Vikas Brand",
        category: cols[2] || "Spares",
        mrp: Number(cols[3]) || 0,
        packSize: cols[4] || "1 Unit",
        retailerPrice: Number(cols[5]) || 0,
        mechanicPrice: Number(cols[6]) || 0,
        retailerPoints: Number(cols[7]) || 0,
        mechanicPoints: Number(cols[8]) || 0
      };

      await window.API.saveProduct(product);
      successCount++;
    }

    window.UTILS.showToast(`Successfully uploaded ${successCount} parts to catalog!`, "success");
    await loadOwnerCatalog();
  } catch (err) {
    console.error("Bulk upload failed", err);
    window.UTILS.showToast(err.message, "error");
  } finally {
    window.UTILS.hideLoader();
    input.value = ""; // clear input
  }
}

// Export functions to global scope
window.loadOwnerCatalog = loadOwnerCatalog;
window.setOwnerCategoryFilter = setOwnerCategoryFilter;
window.handleOwnerCatalogSearch = handleOwnerCatalogSearch;
window.handleBulkProductUpload = handleBulkProductUpload;
