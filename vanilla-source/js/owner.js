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
    btn.classList.remove('active', 'text-white', 'bg-[#FF6B00]');
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
  } else if (tabId === "policies") {
    loadPolicies();
  } else if (tabId === "audit") {
    loadAuditLogs();
  } else if (tabId === "bulletins") {
    loadBulletins();
  }
}

// Side bar responsive toggle
function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  if (sidebar) {
    sidebar.classList.toggle("-translate-x-full");
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

    // Set metrics DOM
    document.getElementById("stat-total-partners").innerText = totalPartners;
    document.getElementById("stat-pending-approvals").innerText = pendingPartners;
    document.getElementById("stat-approved-scans").innerText = approvedClaims;
    document.getElementById("stat-points-claimed").innerText = totalPointsClaimed + " Pts";

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
                <span class="font-mono text-[#FF6B00]">${qty} scans</span>
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

// 2. PARTNERS MANAGEMENT
async function loadPartners() {
  try {
    const users = await window.API.getUsers();
    const filtered = users.filter(u => u.role !== "owner"); // hide owner
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
        ? `<button onclick="handleStatusChange('${u.email}', 'suspended')" class="px-2.5 py-1 bg-slate-950 hover:bg-red-950 border border-slate-800 hover:text-red-400 text-slate-400 font-bold rounded text-[10px] transition uppercase">Suspend</button>`
        : `<button onclick="handleStatusChange('${u.email}', 'approved')" class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-[#0B192C] font-black rounded text-[10px] transition uppercase">Reactivate</button>`;

      return `
        <tr class="border-b border-slate-800/40">
          <td class="py-3 pr-3 font-bold text-white font-sans">${u.fullname}<br><span class="text-[9px] text-slate-500 font-mono">${u.email}</span></td>
          <td class="py-3 capitalize">${u.role}</td>
          <td class="py-3 font-semibold text-slate-300 font-sans">${u.firmName || "-"}<br><span class="text-[9px] text-slate-500 font-mono">${u.mobile}</span></td>
          <td class="py-3 font-mono font-bold text-[#FF6B00]">${u.points || 0}</td>
          <td class="py-3">
            <span class="px-2 py-0.5 border text-[9px] font-bold rounded uppercase font-mono ${statusColor}">${u.status}</span>
          </td>
          <td class="py-3 text-right whitespace-nowrap">${actions}</td>
        </tr>
      `;
    }).join("");

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
  } catch (e) {
    console.error("Account change failed", e);
    window.UTILS.showToast(e.message, "error");
  } finally {
    window.UTILS.hideLoader();
  }
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
  await window.NOTIFICATIONS.renderDashboardAnnouncements("bulletins-feed-container", "all");
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
