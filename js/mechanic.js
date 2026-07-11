/* Mechanic Dashboard Controller - Vikas Automobiles */

let currentMechanicSession = null;
let productsList = [];

// Tab switcher
function switchTab(tabId) {
  document.querySelectorAll('.panel').forEach(panel => panel.classList.add('hidden'));
  const target = document.getElementById(`panel-${tabId}`);
  if (target) target.classList.remove('hidden');

  document.querySelectorAll('.menu-item').forEach(btn => {
    btn.classList.remove('active', 'text-white', 'bg-blue-600');
    btn.classList.add('text-slate-400');
  });

  const activeBtn = Array.from(document.querySelectorAll('.menu-item')).find(btn => {
    return btn.getAttribute('onclick').includes(`'${tabId}'`);
  });
  
  if (activeBtn) {
    activeBtn.classList.add('active');
    activeBtn.classList.remove('text-slate-400');
  }

  const breadcrumb = document.getElementById("breadcrumb-title");
  if (breadcrumb) breadcrumb.innerText = tabId.replace('-', ' ');

  // Tab loaders
  if (tabId === "dashboard") {
    loadMechanicDashboard();
  } else if (tabId === "catalog") {
    loadMechanicCatalog();
  } else if (tabId === "scanner") {
    loadScannerForm();
  } else if (tabId === "ledger") {
    loadLedgerStatement();
  } else if (tabId === "rewards") {
    loadRedemptions();
  }
}

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

// 1. DASHBOARD SUMMARY
async function loadMechanicDashboard() {
  window.UTILS.showLoader("Syncing point balances...");
  try {
    const [users, claims] = await Promise.all([
      window.API.getUsers(),
      window.API.getPurchases()
    ]);

    // Sync session
    const updatedUser = users.find(u => u.email.toLowerCase() === currentMechanicSession.email.toLowerCase());
    if (updatedUser) {
      currentMechanicSession = updatedUser;
      window.AUTH.setCurrentSession(updatedUser);
    }

    const userClaims = claims.filter(c => c.email.toLowerCase() === currentMechanicSession.email.toLowerCase());
    const totalPointsEarned = userClaims.filter(c => c.status === "approved").reduce((sum, curr) => sum + (curr.pointsCalculated || 0), 0);
    const pendingClaims = userClaims.filter(c => c.status === "pending").length;

    document.getElementById("nav-points-balance").innerText = (currentMechanicSession.points || 0) + " Pts";
    document.getElementById("dash-points-approved").innerText = currentMechanicSession.points || 0;
    document.getElementById("dash-points-pending").innerText = pendingClaims;
    document.getElementById("dash-points-total").innerText = totalPointsEarned;

    // Render Milestone Rewards Center
    renderMilestoneRewards(currentMechanicSession.points || 0);

    // Load active announcements
    await window.NOTIFICATIONS.renderDashboardAnnouncements("partner-notices-feed", "mechanic");
    await window.NOTIFICATIONS.loadHelplineInfo();

  } catch (e) {
    console.error("Mechanic dashboard load failed", e);
  } finally {
    window.UTILS.hideLoader();
  }
}

// 2. PARTS CATALOG FOR MECHANIC
let catalogCategoryFilter = "all";
let catalogSearchQuery = "";

async function loadMechanicCatalog() {
  try {
    productsList = await window.API.getProducts();
    renderCatalogCategoryPills();
    renderCatalogGridFiltered();
  } catch (e) {
    console.error("Error loading mechanic parts", e);
  }
}

function renderCatalogCategoryPills() {
  const container = document.getElementById("catalog-category-pills");
  if (!container) return;

  const categories = new Set();
  productsList.forEach(p => {
    if (p.category) categories.add(p.category.trim());
  });

  const sortedCategories = Array.from(categories).sort();
  let html = `
    <button onclick="setCatalogCategoryFilter('all')" class="px-2.5 py-1 text-[10px] font-bold rounded-full border transition cursor-pointer ${
      catalogCategoryFilter === "all"
        ? "bg-blue-600 text-white border-blue-600"
        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
    }">
      All
    </button>
  `;

  sortedCategories.forEach(cat => {
    const isActive = catalogCategoryFilter === cat;
    html += `
      <button onclick="setCatalogCategoryFilter('${cat}')" class="px-2.5 py-1 text-[10px] font-bold rounded-full border transition cursor-pointer ${
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

function setCatalogCategoryFilter(category) {
  catalogCategoryFilter = category;
  renderCatalogCategoryPills();
  renderCatalogGridFiltered();
}

function renderCatalogGridFiltered() {
  const filtered = productsList.filter(p => {
    const matchesCategory = catalogCategoryFilter === "all" || (p.category && p.category.trim() === catalogCategoryFilter);
    const text = `${p.name || ""} ${p.brand || ""} ${p.category || ""}`.toLowerCase();
    const matchesSearch = text.includes(catalogSearchQuery);
    return matchesCategory && matchesSearch;
  });
  renderCatalogGrid(filtered);
}

function renderCatalogGrid(list) {
  const grid = document.getElementById("catalog-grid");
  if (!grid) return;

  if (list.length === 0) {
    grid.innerHTML = `<p class="col-span-full text-xs text-slate-500 text-center py-8 font-mono">No spare parts in selected category matches your search.</p>`;
    return;
  }

  grid.innerHTML = list.map(p => `
    <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 hover:border-blue-500/30 hover:shadow transition flex flex-col justify-between space-y-4">
      <div class="space-y-1">
        <span class="text-[9px] text-blue-600 font-mono font-bold uppercase tracking-widest">${p.category}</span>
        <h4 class="font-bold text-slate-800 text-xs line-clamp-2 leading-snug">${p.name}</h4>
        <p class="text-[9px] text-slate-400 font-mono">SKU: ${p.id} | Brand: ${p.brand}</p>
      </div>
      
      <div class="p-2.5 bg-slate-100/50 rounded-lg border border-slate-200 space-y-1 font-mono text-[10px]">
        <div class="flex justify-between">
          <span class="text-slate-500">Mechanic Price:</span>
          <span class="font-bold text-slate-800">${window.UTILS.formatCurrency(p.mechanicPrice)}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-slate-500">Your Reward:</span>
          <span class="font-black text-blue-600">+${p.mechanicPoints} Pts</span>
        </div>
      </div>

      <div class="flex items-center justify-between">
        <span class="text-[9px] px-2 py-0.5 bg-white border border-slate-200 text-slate-500 font-mono rounded">MRP: ${window.UTILS.formatCurrency(p.mrp)}</span>
      </div>
    </div>
  `).join("");
}

function handleCatalogSearch(query) {
  catalogSearchQuery = (query || "").toLowerCase().trim();
  renderCatalogGridFiltered();
}

window.setCatalogCategoryFilter = setCatalogCategoryFilter;

// 3. SCAN & EARN CAMERA FOR MECHANICS
function saveToRecentScans(productId) {
  if (!productId) return;
  const email = (currentMechanicSession || {}).email || "unknown";
  const key = `vikas_recent_scans_${email}`;
  let scans = [];
  try {
    scans = JSON.parse(localStorage.getItem(key)) || [];
  } catch (e) {
    scans = [];
  }
  scans = scans.filter(id => id !== productId);
  scans.unshift(productId);
  if (scans.length > 10) {
    scans = scans.slice(0, 10);
  }
  localStorage.setItem(key, JSON.stringify(scans));
  renderRecentScans();
}

function renderRecentScans() {
  const container = document.getElementById("recent-scans-list");
  if (!container) return;

  const email = (currentMechanicSession || {}).email || "unknown";
  const key = `vikas_recent_scans_${email}`;
  let scans = [];
  try {
    scans = JSON.parse(localStorage.getItem(key)) || [];
  } catch (e) {
    scans = [];
  }

  if (scans.length === 0) {
    container.innerHTML = `
      <p class="text-[10px] text-slate-400 font-mono text-center py-6">No recent scans saved.</p>
    `;
    return;
  }

  const list = productsList.length > 0 ? productsList : window.CONFIG.DEFAULT_PRODUCTS;
  
  let html = "";
  scans.forEach(prodId => {
    const prod = list.find(p => p.id === prodId);
    if (!prod) return;
    
    html += `
      <div onclick="selectRecentScan('${prod.id}')" class="group flex items-center justify-between p-2 bg-slate-50 border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 rounded-xl cursor-pointer transition">
        <div class="flex items-center gap-2 min-w-0">
          <div class="p-1 rounded-lg bg-white border border-slate-200 text-blue-600 group-hover:text-blue-700">
            <i data-lucide="package" class="w-3.5 h-3.5"></i>
          </div>
          <div class="min-w-0">
            <h4 class="font-bold text-slate-800 text-[10px] leading-tight truncate max-w-[120px]">${prod.name}</h4>
            <span class="text-[8px] font-mono text-slate-400 block">${prod.id} (${prod.packSize || '1 Unit'})</span>
          </div>
        </div>
        <div class="text-right">
          <span class="text-[10px] font-mono font-bold text-blue-600">+${prod.mechanicPoints} Pts</span>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;

  if (window.lucide) {
    window.lucide.createIcons({
      attrs: {
        class: ["lucide"]
      },
      container: container
    });
  }
}

async function selectRecentScan(productId) {
  const select = document.getElementById("scan-select-product");
  if (select) {
    select.value = productId;
    await calculateMockScanPoints();
    window.UTILS.showToast("Selected from recent scans.", "info");
  }
}

function clearRecentScans() {
  const email = (currentMechanicSession || {}).email || "unknown";
  const key = `vikas_recent_scans_${email}`;
  localStorage.removeItem(key);
  renderRecentScans();
  window.UTILS.showToast("Recent scans cleared.", "info");
}

async function loadScannerForm() {
  try {
    const products = await window.API.getProducts();
    productsList = products; // Cache it
    const select = document.getElementById("scan-select-product");
    if (!select) return;

    select.innerHTML = '<option value="">-- Choose Product Sticker --</option>' + 
      products.map(p => `<option value="${p.id}">${p.id} - ${p.name} (${p.mechanicPoints} Pts)</option>`).join("");

    renderRecentScans();
  } catch (e) {
    console.error("Error loading products for mechanic scan simulator", e);
  }
}

async function calculateMockScanPoints() {
  const prodId = document.getElementById("scan-select-product").value;
  const qty = Number(document.getElementById("scan-qty").value) || 1;
  const computedInput = document.getElementById("scan-computed-pts");
  const infoCard = document.getElementById("scan-product-info-card");
  const packSizeInput = document.getElementById("scan-packsize");

  if (!prodId) {
    if (computedInput) computedInput.value = "0 Pts";
    if (infoCard) infoCard.classList.add("hidden");
    if (packSizeInput) packSizeInput.value = "-";
    return;
  }

  const list = productsList.length > 0 ? productsList : window.CONFIG.DEFAULT_PRODUCTS;
  const prod = list.find(p => p.id === prodId);
  if (!prod) {
    if (computedInput) computedInput.value = "0 Pts";
    if (infoCard) infoCard.classList.add("hidden");
    if (packSizeInput) packSizeInput.value = "-";
    return;
  }

  if (packSizeInput) {
    packSizeInput.value = prod.packSize || "1 Unit";
  }

  const policies = await window.API.getSettings();
  const basePoints = prod.mechanicPoints * qty;
  const total = Math.round(basePoints * (policies.mechanicMultiplier || 1.2));

  if (computedInput) computedInput.value = `${total} Pts`;

  // Populate dynamic info card
  if (infoCard) {
    document.getElementById("scan-info-name").innerText = prod.name;
    document.getElementById("scan-info-brand").innerText = `Brand: ${prod.brand || "Vikas Spares"}`;
    document.getElementById("scan-info-pack").innerText = prod.packSize || "1 Unit";
    document.getElementById("scan-info-category").innerText = prod.category || "-";
    document.getElementById("scan-info-points").innerText = `${prod.mechanicPoints} Pts each (Multiplier: x${policies.mechanicMultiplier || 1.2})`;
    infoCard.classList.remove("hidden");
  }

  saveToRecentScans(prodId);
}

async function submitManualLoyaltyScanClaim() {
  const prodId = document.getElementById("scan-select-product").value;
  const qty = Number(document.getElementById("scan-qty").value) || 1;
  
  if (!prodId) {
    window.UTILS.showToast("Please select a spare part sticker first.", "warning");
    return;
  }

  const list = productsList.length > 0 ? productsList : window.CONFIG.DEFAULT_PRODUCTS;
  const prod = list.find(p => p.id === prodId);
  if (!prod) return;

  window.UTILS.showLoader("Transmitting scan claim details...");
  try {
    const policies = await window.API.getSettings();
    const pointsCalculated = Math.round((prod.mechanicPoints * qty) * (policies.mechanicMultiplier || 1.2));

    const invoiceInput = document.getElementById("scan-invoice-ref");
    const invoiceVal = invoiceInput ? invoiceInput.value.trim() : "";
    const finalProductName = invoiceVal ? `${prod.name} [Inv: ${invoiceVal}]` : prod.name;

    const claim = {
      email: currentMechanicSession.email,
      fullname: currentMechanicSession.fullname,
      role: currentMechanicSession.role,
      firmName: currentMechanicSession.firmName,
      productID: prod.id,
      productName: finalProductName,
      quantity: qty,
      pointsCalculated: pointsCalculated
    };

    await window.API.submitPurchaseClaim(claim);
    window.UTILS.showToast("Purchase request submitted successfully! Awaiting approval.", "success");
    
    // Clear
    document.getElementById("scan-select-product").value = "";
    document.getElementById("scan-qty").value = "1";
    document.getElementById("scan-computed-pts").value = "0 Pts";
    if (invoiceInput) invoiceInput.value = "";

    switchTab("dashboard");
  } catch (e) {
    window.UTILS.showToast(e.message, "error");
  } finally {
    window.UTILS.hideLoader();
  }
}

async function simulateCameraScanCapture() {
  const list = productsList.length > 0 ? productsList : window.CONFIG.DEFAULT_PRODUCTS;
  if (list.length === 0) return;

  const randProd = list[Math.floor(Math.random() * list.length)];
  window.UTILS.showToast(`Sticker barcode matching detected: ${randProd.id}! Parsing...`, "info");
  
  const indicator = document.getElementById("scanner-camera-indicator");
  if (indicator) {
    indicator.className = "w-2 h-2 bg-blue-600 rounded-full animate-ping";
  }

  setTimeout(async () => {
    const select = document.getElementById("scan-select-product");
    if (select) select.value = randProd.id;
    
    document.getElementById("scan-qty").value = "1";
    await calculateMockScanPoints();
    
    if (indicator) {
      indicator.className = "w-2 h-2 bg-emerald-500 rounded-full animate-pulse";
    }

    window.UTILS.showToast("Product stickers parsed successfully. Click Submit Claim to earn points!", "success");
  }, 1500);
}


// 4. POINT STATEMENT LEDGER
async function loadLedgerStatement() {
  try {
    const claims = await window.API.getPurchases();
    const userClaims = claims.filter(c => c.email.toLowerCase() === currentMechanicSession.email.toLowerCase());
    const tbody = document.getElementById("ledger-tbody");
    if (!tbody) return;

    if (userClaims.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="py-6 text-center text-slate-500 font-mono">You haven't scanned any spares packages yet.</td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = userClaims.map(c => {
      let statusClass = "text-amber-500 bg-amber-500/10 border-amber-500/20";
      if (c.status === "approved") statusClass = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      if (c.status === "rejected") statusClass = "text-red-400 bg-red-500/10 border-red-500/20";

      return `
        <tr class="border-b border-slate-800/40 text-[11px]">
          <td class="py-2.5 font-mono">${window.UTILS.formatDate(c.date)}</td>
          <td class="py-2.5 font-sans font-bold text-white">${c.productName}<br><span class="text-[9px] font-mono text-slate-500 font-normal">SKU: ${c.productID} | Claim ID: ${c.id}</span></td>
          <td class="py-2.5 font-mono uppercase text-slate-400">QR CLAIM</td>
          <td class="py-2.5 font-mono font-bold text-emerald-400">+${c.pointsCalculated}</td>
          <td class="py-2.5">
            <span class="px-1.5 py-0.5 border text-[8px] font-bold rounded font-mono uppercase ${statusClass}">${c.status}</span>
          </td>
        </tr>
      `;
    }).join("");

  } catch (e) {
    console.error("Ledger rendering error", e);
  }
}


// 5. REDEEM REWARDS & TOOLS
let activeRewardsList = [];

function calculateRedemptionRequiredPoints(value) {
  const reqInput = document.getElementById("redeem-required-pts");
  const balInput = document.getElementById("redeem-user-balance");
  
  const selectedReward = activeRewardsList.find(r => r.id === value);
  const reqPts = selectedReward ? selectedReward.pointsRequired : 0;

  if (reqInput) reqInput.innerText = reqPts ? `${reqPts} Pts` : "0 Pts";
  if (balInput) balInput.innerText = `${currentMechanicSession.points || 0} Pts`;
}

async function handleRedemptionSubmit(e) {
  e.preventDefault();
  const rewardId = document.getElementById("redeem-amount").value;
  const method = document.getElementById("redeem-method").value;
  const details = document.getElementById("redeem-details").value.trim();

  const selectedReward = activeRewardsList.find(r => r.id === rewardId);
  if (!selectedReward) {
    window.UTILS.showToast("Please choose a gift option.", "warning");
    return;
  }

  const reqPts = selectedReward.pointsRequired;
  if ((currentMechanicSession.points || 0) < reqPts) {
    window.UTILS.showToast(`Insufficient wallet balance! Requires ${reqPts} Pts, you have ${currentMechanicSession.points || 0} Pts.`, "error");
    return;
  }

  if (selectedReward.stock <= 0) {
    window.UTILS.showToast("This reward is currently out of stock!", "error");
    return;
  }

  // Confirmation popup
  const confirmed = confirm(`Are you sure you want to redeem "${selectedReward.name}" for ${reqPts} Pts?\nYour claim will be processed by Vikas Automobiles.`);
  if (!confirmed) return;

  window.UTILS.showLoader("Transmitting gift claim request...");
  try {
    await window.API.submitRedemption(
      currentMechanicSession.email,
      currentMechanicSession.fullname,
      currentMechanicSession.role,
      currentMechanicSession.firmName || "",
      selectedReward.id,
      selectedReward.name,
      reqPts
    );
    
    window.UTILS.showToast("Gift claim request successfully submitted for approval!", "success");

    // Reset form
    document.getElementById("redeem-amount").value = "";
    document.getElementById("redeem-details").value = "";
    document.getElementById("redeem-required-pts").innerText = "0 Pts";

    await loadMechanicDashboard();
    await loadRedemptions();
  } catch (ex) {
    window.UTILS.showToast(ex.message, "error");
  } finally {
    window.UTILS.hideLoader();
  }
}

async function loadRedemptions() {
  const selectElem = document.getElementById("redeem-amount");
  const reqInput = document.getElementById("redeem-required-pts");
  const balInput = document.getElementById("redeem-user-balance");
  if (reqInput) reqInput.innerText = "0 Pts";
  if (balInput) balInput.innerText = `${currentMechanicSession.points || 0} Pts`;

  try {
    // 1. Fetch dynamic rewards and populate dropdown
    const rewards = await window.API.getRewards();
    activeRewardsList = rewards || [];
    if (selectElem) {
      selectElem.innerHTML = `
        <option value="">-- Choose Reward --</option>
        ${activeRewardsList.map(r => `
          <option value="${r.id}" ${r.stock <= 0 ? 'disabled' : ''}>
            ${r.name} (${r.pointsRequired} Pts) ${r.stock <= 0 ? '[OUT OF STOCK]' : `[Stock: ${r.stock}]`}
          </option>
        `).join("")}
      `;
    }

    // 2. Fetch redemptions for current user
    const redemptions = await window.API.getRedemptions();
    const myRedemptions = redemptions.filter(r => 
      r.email.toLowerCase() === currentMechanicSession.email.toLowerCase()
    );

    const tbody = document.getElementById("redemptions-tbody");
    if (!tbody) return;

    if (myRedemptions.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="3" class="py-4 text-center text-slate-500 font-mono">No previous rewards claimed yet.</td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = myRedemptions.map(r => {
      let statusClass = "text-amber-500 bg-amber-50/50 border-amber-100";
      if (r.status === "approved") statusClass = "text-emerald-600 bg-emerald-50 border-emerald-100";
      if (r.status === "rejected") statusClass = "text-rose-600 bg-rose-50 border-rose-100";

      return `
        <tr class="border-b border-slate-100 text-[11px] text-slate-700 hover:bg-slate-50 transition">
          <td class="py-2.5 font-bold text-slate-800">
            ${r.rewardName}<br>
            <span class="text-[10px] text-slate-400 font-mono">${r.rewardId}</span>
          </td>
          <td class="py-2.5 font-mono text-slate-500">
            ${window.UTILS.formatDate(r.date)}
            ${r.remark ? `<div class="text-[9px] text-purple-600 italic mt-0.5">Re: ${r.remark}</div>` : ""}
          </td>
          <td class="py-2.5 text-right font-mono">
            <span class="font-bold text-red-500">-${r.pointsRequired} Pts</span><br>
            <span class="px-1.5 py-0.5 border text-[9px] font-bold rounded uppercase ${statusClass}">${r.status}</span>
          </td>
        </tr>
      `;
    }).join("");

  } catch (e) {
    console.error("Redemptions retrieval failure", e);
  }
}


// 6. HELPLINE CHAT BOT SIMULATOR
function handleSendSupportMessage(e) {
  e.preventDefault();
  const input = document.getElementById("chat-input");
  const text = input.value.trim();
  if (!text) return;

  const container = document.getElementById("chat-messages-container");
  if (!container) return;

  // Render user message
  const userMsg = document.createElement("div");
  userMsg.className = "max-w-[80%] p-2.5 rounded-lg bg-blue-600 text-[#0B192C] self-end leading-relaxed border border-blue-500/30 text-right";
  userMsg.innerHTML = `
    <span class="text-[9px] text-[#0B192C]/70 block font-bold font-sans mb-1 uppercase">You (${currentMechanicSession.fullname})</span>
    ${text}
  `;
  container.appendChild(userMsg);
  input.value = "";
  container.scrollTop = container.scrollHeight;

  // Bot reply triggers
  setTimeout(() => {
    const botMsg = document.createElement("div");
    botMsg.className = "max-w-[80%] p-2.5 rounded-lg bg-slate-900 text-slate-300 self-start leading-relaxed border border-slate-800";
    
    let botReply = "Bhai, your scan claim is safely registered. Approved points can be redeemed instantly for tools or Paytm payouts!";
    if (text.toLowerCase().includes("paytm") || text.toLowerCase().includes("gpay") || text.toLowerCase().includes("cash")) {
      botReply = "Bhai! UPI cashout transfers are made daily at 6 PM. Just select ₹500 or ₹1000 from the catalog, submit UPI ID, and we will send it.";
    } else if (text.toLowerCase().includes("tool") || text.toLowerCase().includes("jack") || text.toLowerCase().includes("socket")) {
      botReply = "Bhai, premium garage tools are shipped free via DTDC courier. They take 3-4 working days to reach your workshop address.";
    }

    botMsg.innerHTML = `
      <span class="text-[9px] text-orange-400 block font-bold font-sans mb-1 uppercase">Support Desk (Vikas Auto)</span>
      ${botReply}
    `;
    container.appendChild(botMsg);
    container.scrollTop = container.scrollHeight;
    window.UTILS.showToast("Support partner replied.", "info");
  }, 1200);
}


function handleLogout() {
  window.AUTH.logout();
}

// INITIALIZER
async function initMechanicPage() {
  window.UTILS.showLoader("Opening Mechanic Portal workspace...");
  try {
    currentMechanicSession = window.AUTH.verifySession(["mechanic"]);
    if (!currentMechanicSession) return;

    // Load sidebar details
    document.getElementById("sidebar-username").innerText = currentMechanicSession.fullname;
    if (currentMechanicSession.photo) {
      document.getElementById("sidebar-avatar").src = currentMechanicSession.photo;
    }

    // Set custom tier text
    const points = currentMechanicSession.points || 0;
    let tierText = "BRONZE MEMBER";
    let tierClass = "text-slate-500 font-mono";

    if (points >= 15000) {
      tierText = "PLATINUM LEGEND GARAGE";
      tierClass = "text-blue-500 font-mono font-bold tracking-widest animate-pulse";
    } else if (points >= 5000) {
      tierText = "GOLD VALUE WORKSHOP";
      tierClass = "text-amber-400 font-mono font-bold tracking-widest";
    }

    const tierLabel = document.getElementById("sidebar-tier");
    if (tierLabel) {
      tierLabel.innerText = tierText;
      tierLabel.className = `text-[9px] ${tierClass} uppercase tracking-wider block`;
    }

    await loadMechanicDashboard();

  } catch (e) {
    console.error("Mechanic dashboard failed to boot", e);
    window.UTILS.showToast("Verification failure.", "error");
  } finally {
    window.UTILS.hideLoader();
  }
}

let productHtml5QrCode = null;

function openWebcamScanner() {
  document.getElementById("product-scanner-modal").classList.remove("hidden");
  document.getElementById("product-scanner-status").innerText = "Initializing camera feed...";
  
  productHtml5QrCode = new Html5Qrcode("product-reader-elem");
  const config = { fps: 15, qrbox: { width: 220, height: 220 } };
  
  productHtml5QrCode.start(
    { facingMode: "environment" },
    config,
    async (decodedText) => {
      window.UTILS.showToast("QR code captured!", "success");
      closeWebcamScanner();
      
      try {
        let prodId = decodedText.trim();
        let scannedQty = 1;
        let invoiceNum = "";
        
        try {
          const parsed = JSON.parse(decodedText);
          if (parsed.id) prodId = parsed.id;
          if (parsed.part) prodId = parsed.part;
          if (parsed.productID) prodId = parsed.productID;
          if (parsed.quantity) scannedQty = Number(parsed.quantity);
          if (parsed.qty) scannedQty = Number(parsed.qty);
          if (parsed.invoice) invoiceNum = parsed.invoice;
        } catch (e) {}
        
        const list = productsList.length > 0 ? productsList : window.CONFIG.DEFAULT_PRODUCTS;
        const found = list.find(p => p.id.toLowerCase() === prodId.toLowerCase() || p.name.toLowerCase() === prodId.toLowerCase());
        
        if (found) {
          document.getElementById("scan-select-product").value = found.id;
          document.getElementById("scan-qty").value = scannedQty;
          const invField = document.getElementById("scan-invoice-ref");
          if (invField && invoiceNum) {
            invField.value = invoiceNum;
          }
          await calculateMockScanPoints();
          window.UTILS.showToast(`Scanned product: ${found.name}`, "success");
        } else {
          window.UTILS.showToast(`Unrecognized product QR data: "${prodId}"`, "warning");
        }
      } catch (err) {
        console.error("Error decoding QR text", err);
      }
    },
    (err) => {}
  ).then(() => {
    document.getElementById("product-scanner-status").innerText = "Camera Active & Scanning";
  }).catch(err => {
    console.error("Webcam start error", err);
    document.getElementById("product-scanner-status").innerText = "Camera Error: " + err.message;
  });
}

function closeWebcamScanner() {
  document.getElementById("product-scanner-modal").classList.add("hidden");
  if (productHtml5QrCode) {
    try {
      productHtml5QrCode.stop().then(() => {
        productHtml5QrCode = null;
      }).catch(err => {
        console.error("Failed to stop QR reader", err);
      });
    } catch (e) {
      productHtml5QrCode = null;
    }
  }
}

window.initMechanicPage = initMechanicPage;
window.switchTab = switchTab;
window.toggleSidebar = toggleSidebar;
window.calculateMockScanPoints = calculateMockScanPoints;
window.submitManualLoyaltyScanClaim = submitManualLoyaltyScanClaim;
window.simulateCameraScanCapture = simulateCameraScanCapture;
window.openWebcamScanner = openWebcamScanner;
window.closeWebcamScanner = closeWebcamScanner;
window.calculateRedemptionRequiredPoints = calculateRedemptionRequiredPoints;
window.toggleRedeemAddressInput = toggleRedeemAddressInput;
window.handleRedemptionSubmit = handleRedemptionSubmit;
window.handleSendSupportMessage = handleSendSupportMessage;
window.handleLogout = handleLogout;
window.handleCatalogSearch = handleCatalogSearch;
window.clearRecentScans = clearRecentScans;
window.selectRecentScan = selectRecentScan;

// Profile Settings Modal logic
function openProfileSettingsModal() {
  const session = window.AUTH.getCurrentSession();
  if (!session) return;
  
  document.getElementById("profile-modal-name").value = session.fullname || "";
  document.getElementById("profile-modal-phone").value = session.mobile || "";
  document.getElementById("profile-modal-email").value = window.UTILS.displayEmail(session.email);
  document.getElementById("profile-modal-address").value = session.address || "";
  document.getElementById("profile-modal-photo").value = session.photo || "";
  document.getElementById("profile-modal-preview").src = session.photo || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop";
  
  const firmInput = document.getElementById("profile-modal-firm");
  if (firmInput) {
    firmInput.value = session.firmName || "";
  }
  
  document.getElementById("profile-settings-modal").classList.remove("hidden");
}

function closeProfileSettingsModal() {
  document.getElementById("profile-settings-modal").classList.add("hidden");
}

function setPresetProfileAvatar(url) {
  document.getElementById("profile-modal-photo").value = url;
  document.getElementById("profile-modal-preview").src = url;
}

async function saveProfileSettings(event) {
  event.preventDefault();
  window.UTILS.showLoader("Saving profile updates...");
  
  try {
    const session = window.AUTH.getCurrentSession();
    if (!session) throw new Error("No active user session.");
    
    const updatedData = {
      fullname: document.getElementById("profile-modal-name").value.trim(),
      mobile: document.getElementById("profile-modal-phone").value.trim(),
      address: document.getElementById("profile-modal-address").value.trim(),
      photo: document.getElementById("profile-modal-photo").value.trim()
    };
    
    const firmInput = document.getElementById("profile-modal-firm");
    if (firmInput) {
      updatedData.firmName = firmInput.value.trim();
    }
    
    await window.API.updateUserProfile(session.email, updatedData);
    
    window.UTILS.hideLoader();
    window.UTILS.showToast("Your profile details updated successfully!", "success");
    closeProfileSettingsModal();
    
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  } catch (error) {
    window.UTILS.hideLoader();
    window.UTILS.showToast(error.message, "error");
  }
}

function renderMilestoneRewards(points) {
  const userPointsElem = document.getElementById("milestones-user-points");
  if (userPointsElem) userPointsElem.innerText = points + " Pts";

  const milestonesList = [
    { pts: 1000, name: "Silver Star Overall Kit", item: "👕 HP Work Dungaree & Cap", desc: "Premium quality durable work overalls for your workshop.", icon: "shirt" },
    { pts: 2500, name: "Gold Toolset Set", item: "🔧 Professional Socket Wrench Kit", desc: "46-piece vanadium tool set with high-grade ratcheting wrenches.", icon: "wrench" },
    { pts: 5000, name: "Platinum Safety Combo", item: "🥾 Steel-Toe Boots & Safety Jacket", desc: "ISO-certified steel-toe slip-resistant boots and reflective jacket.", icon: "shield" },
    { pts: 10000, name: "Supernova Diagnostics", item: "📱 OBD2 Bluetooth Smart Scanner", desc: "Advanced vehicle health diagnostics scanning tablet.", icon: "smartphone" },
    { pts: 25000, name: "Vikas VIP Legend Trolley", item: "🧰 Full Master Garage Steel Cabinet", desc: "Rolling tool storage cabinet loaded with heavy-duty tools.", icon: "box" }
  ];

  // Calculate progress percent based on 25,000 points max milestone
  const percent = Math.min(100, Math.round((points / 25000) * 100));
  const progressBar = document.getElementById("milestones-progress-bar");
  if (progressBar) progressBar.style.width = percent + "%";

  // Find next milestone
  const nextMilestone = milestonesList.find(m => points < m.pts);
  const nextText = document.getElementById("milestones-next-text");
  if (nextText) {
    if (nextMilestone) {
      const remaining = nextMilestone.pts - points;
      nextText.innerText = `${nextMilestone.name} (${remaining} Pts needed)`;
    } else {
      nextText.innerText = "⭐ VIKAS ROYAL LEGEND (All Milestones Cleared!)";
    }
  }

  const grid = document.getElementById("milestones-grid");
  if (!grid) return;

  grid.innerHTML = milestonesList.map(m => {
    const isUnlocked = points >= m.pts;
    const progressPercent = Math.min(100, Math.round((points / m.pts) * 100));
    const btnClass = isUnlocked 
      ? "bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white cursor-pointer" 
      : "bg-slate-100 text-slate-400 cursor-not-allowed";
    const btnText = isUnlocked ? "Redeem Gift!" : "Locked";
    const borderClass = isUnlocked ? "border-rose-200 bg-rose-50/25" : "border-slate-100 bg-white";
    const iconColor = isUnlocked ? "text-rose-600" : "text-slate-300";

    return `
      <div class="border ${borderClass} shadow-sm rounded-xl p-4 flex flex-col justify-between transition hover:shadow-md">
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-[9px] font-mono font-bold tracking-wider ${isUnlocked ? 'text-rose-600' : 'text-slate-400'}">${m.pts} PTS</span>
            <div class="p-1 rounded-lg ${isUnlocked ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-400'}">
              <i data-lucide="${m.icon}" class="w-3.5 h-3.5"></i>
            </div>
          </div>
          <div class="space-y-1">
            <h4 class="font-bold text-slate-800 text-[11px] leading-tight">${m.name}</h4>
            <span class="text-[9px] text-blue-600 font-extrabold block leading-none">${m.item}</span>
            <p class="text-[10px] text-slate-400 leading-snug font-medium pt-1">${m.desc}</p>
          </div>
        </div>
        
        <div class="mt-4 pt-3 border-t border-slate-100 space-y-2.5">
          ${!isUnlocked ? `
            <div class="space-y-1">
              <div class="flex justify-between text-[8px] font-mono font-bold text-slate-400">
                <span>Unlock Progress</span>
                <span>${progressPercent}%</span>
              </div>
              <div class="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                <div class="h-full bg-blue-500" style="width: ${progressPercent}%"></div>
              </div>
            </div>
          ` : `
            <div class="flex items-center gap-1 text-[8.5px] font-bold text-emerald-600">
              <i data-lucide="check-circle" class="w-3 h-3"></i>
              <span>Milestone Unlocked!</span>
            </div>
          `}
          <button onclick="claimMilestoneReward('${m.name}', ${m.pts})" ${!isUnlocked ? 'disabled' : ''} 
            class="w-full py-1.5 rounded-lg font-bold text-[10px] uppercase tracking-wide transition flex items-center justify-center gap-1 ${btnClass}">
            <i data-lucide="${isUnlocked ? 'gift' : 'lock'}" class="w-3 h-3"></i>
            <span>${btnText}</span>
          </button>
        </div>
      </div>
    `;
  }).join("");

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

async function claimMilestoneReward(name, pointsRequired) {
  if ((currentMechanicSession.points || 0) < pointsRequired) {
    window.UTILS.showToast("Insufficient wallet points to claim this milestone gift.", "error");
    return;
  }

  const confirmed = confirm(`Are you sure you want to redeem your points to claim "${name}" (${pointsRequired} Pts)? This will deduct ${pointsRequired} points from your wallet.`);
  if (!confirmed) return;

  window.UTILS.showLoader("Transmitting gift claim request...");
  try {
    // Deduct points
    await window.API.updateUserPoints(currentMechanicSession.email, -pointsRequired);

    // Log claim to purchases ledger
    const claim = {
      email: currentMechanicSession.email,
      fullname: currentMechanicSession.fullname,
      role: currentMechanicSession.role,
      firmName: currentMechanicSession.firmName,
      productID: "RED-GIFT",
      productName: `Milestone Reward Unlocked: ${name}`,
      quantity: 1,
      pointsCalculated: -pointsRequired
    };

    await window.API.submitPurchaseClaim(claim);
    window.UTILS.showToast(`Congratulations! Claim for ${name} submitted successfully! Vikas Automobiles staff will contact you to dispatch your reward shortly.`, "success");

    await loadMechanicDashboard();
    
    // Log system activity
    await window.API.logAction(currentMechanicSession.fullname, "Redeemed Milestone Reward", "mechanic", `User redeemed ${pointsRequired} pts for ${name}`);
  } catch (ex) {
    window.UTILS.showToast(ex.message, "error");
  } finally {
    window.UTILS.hideLoader();
  }
}

window.openProfileSettingsModal = openProfileSettingsModal;
window.closeProfileSettingsModal = closeProfileSettingsModal;
window.setPresetProfileAvatar = setPresetProfileAvatar;
window.saveProfileSettings = saveProfileSettings;
window.claimMilestoneReward = claimMilestoneReward;
window.renderMilestoneRewards = renderMilestoneRewards;

// Setup profile photo live preview
document.addEventListener("DOMContentLoaded", () => {
  const photoInput = document.getElementById("profile-modal-photo");
  if (photoInput) {
    photoInput.addEventListener("input", (e) => {
      const img = document.getElementById("profile-modal-preview");
      if (img) img.src = e.target.value || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop";
    });
  }
});

function uploadProfilePhotoFile(input) {
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
      const photoInput = document.getElementById("profile-modal-photo");
      const preview = document.getElementById("profile-modal-preview");
      if (photoInput) photoInput.value = base64;
      if (preview) preview.src = base64;
      window.UTILS.showToast("Local profile photo uploaded!", "success");
    };
    reader.readAsDataURL(file);
  }
}
window.uploadProfilePhotoFile = uploadProfilePhotoFile;
