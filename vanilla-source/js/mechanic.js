/* Mechanic Dashboard Controller - Vikas Automobiles */

let currentMechanicSession = null;
let productsList = [];

// Tab switcher
function switchTab(tabId) {
  document.querySelectorAll('.panel').forEach(panel => panel.classList.add('hidden'));
  const target = document.getElementById(`panel-${tabId}`);
  if (target) target.classList.remove('hidden');

  document.querySelectorAll('.menu-item').forEach(btn => {
    btn.classList.remove('active', 'text-white', 'bg-[#FF6B00]');
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
  if (sidebar) sidebar.classList.toggle("-translate-x-full");
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

    // Load active announcements
    await window.NOTIFICATIONS.renderDashboardAnnouncements("partner-notices-feed", "mechanic");

  } catch (e) {
    console.error("Mechanic dashboard load failed", e);
  } finally {
    window.UTILS.hideLoader();
  }
}

// 2. PARTS CATALOG FOR MECHANIC
async function loadMechanicCatalog() {
  try {
    productsList = await window.API.getProducts();
    renderCatalogGrid(productsList);
  } catch (e) {
    console.error("Error loading mechanic parts", e);
  }
}

function renderCatalogGrid(list) {
  const grid = document.getElementById("catalog-grid");
  if (!grid) return;

  if (list.length === 0) {
    grid.innerHTML = `<p class="col-span-full text-xs text-slate-500 text-center py-8 font-mono">No products in corporate spares catalog.</p>`;
    return;
  }

  grid.innerHTML = list.map(p => `
    <div class="bg-slate-950 p-4 rounded-xl border border-slate-800/80 hover:border-blue-500/30 transition flex flex-col justify-between space-y-4">
      <div class="space-y-1">
        <span class="text-[9px] text-blue-400 font-mono font-bold uppercase tracking-widest">${p.category}</span>
        <h4 class="font-bold text-white text-xs line-clamp-2 leading-snug">${p.name}</h4>
        <p class="text-[9px] text-slate-500 font-mono">SKU: ${p.id} | Brand: ${p.brand}</p>
      </div>
      
      <div class="p-2.5 bg-slate-900 rounded-lg border border-slate-800 space-y-1 font-mono text-[10px]">
        <div class="flex justify-between">
          <span class="text-slate-500">Mechanic Price:</span>
          <span class="font-bold text-white">${window.UTILS.formatCurrency(p.mechanicPrice)}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-slate-500">Your Reward:</span>
          <span class="font-black text-[#FF6B00]">+${p.mechanicPoints} Pts</span>
        </div>
      </div>

      <div class="flex items-center justify-between">
        <span class="text-[9px] px-2 py-0.5 bg-slate-900 border border-slate-800 text-slate-400 font-mono rounded">MRP: ${window.UTILS.formatCurrency(p.mrp)}</span>
        <span class="text-[9px] font-mono ${p.stock <= p.minStock ? 'text-red-400' : 'text-emerald-400'}">${p.stock > 0 ? 'In Stock' : 'Out of Stock'}</span>
      </div>
    </div>
  `).join("");
}

function handleCatalogSearch(query) {
  const q = query.toLowerCase().trim();
  const filtered = productsList.filter(p => 
    p.name.toLowerCase().includes(q) ||
    p.id.toLowerCase().includes(q) ||
    p.category.toLowerCase().includes(q) ||
    p.brand.toLowerCase().includes(q)
  );
  renderCatalogGrid(filtered);
}

// 3. SCAN & EARN CAMERA FOR MECHANICS
async function loadScannerForm() {
  try {
    const products = await window.API.getProducts();
    const select = document.getElementById("scan-select-product");
    if (!select) return;

    select.innerHTML = '<option value="">-- Choose Product Sticker --</option>' + 
      products.map(p => `<option value="${p.id}">${p.id} - ${p.name} (${p.mechanicPoints} Pts)</option>`).join("");
  } catch (e) {
    console.error("Error loading products for mechanic scan simulator", e);
  }
}

async function calculateMockScanPoints() {
  const prodId = document.getElementById("scan-select-product").value;
  const qty = Number(document.getElementById("scan-qty").value) || 1;
  const computedInput = document.getElementById("scan-computed-pts");

  if (!prodId) {
    computedInput.value = "0 Pts";
    return;
  }

  const list = productsList.length > 0 ? productsList : window.CONFIG.DEFAULT_PRODUCTS;
  const prod = list.find(p => p.id === prodId);
  if (!prod) {
    computedInput.value = "0 Pts";
    return;
  }

  const policies = await window.API.getSettings();
  const basePoints = prod.mechanicPoints * qty;
  const total = Math.round(basePoints * (policies.mechanicMultiplier || 1.2));

  computedInput.value = `${total} Pts`;
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

    const claim = {
      email: currentMechanicSession.email,
      fullname: currentMechanicSession.fullname,
      role: currentMechanicSession.role,
      firmName: currentMechanicSession.firmName,
      productID: prod.id,
      productName: prod.name,
      quantity: qty,
      pointsCalculated: pointsCalculated
    };

    await window.API.submitPurchaseClaim(claim);
    window.UTILS.showToast("Sticker scanned successfully! Awaiting central approval.", "success");
    
    // Clear
    document.getElementById("scan-select-product").value = "";
    document.getElementById("scan-qty").value = "1";
    document.getElementById("scan-computed-pts").value = "0 Pts";

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
    indicator.className = "w-2 h-2 bg-[#FF6B00] rounded-full animate-ping";
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
function calculateRedemptionRequiredPoints(value) {
  let reqPts = 0;
  if (value === "500") reqPts = 500;
  else if (value === "1000") reqPts = 1000;
  else if (value === "tool_kit") reqPts = 1500;
  else if (value === "hydraulic_jack") reqPts = 3000;
  else if (value === "air_compressor") reqPts = 5000;
  else if (value === "10000") reqPts = 10000;

  document.getElementById("redeem-required-pts").innerText = `${reqPts} Pts`;
  document.getElementById("redeem-user-balance").innerText = `${currentMechanicSession.points || 0} Pts`;
}

function toggleRedeemAddressInput(method) {
  const label = document.getElementById("redeem-details-label");
  const input = document.getElementById("redeem-details");
  if (!label || !input) return;

  if (method === "delivery") {
    label.innerText = "Shipping Delivery Address (with Landmark & Phone)";
    input.placeholder = "Bhai, enter your full workshop home shipping address here...";
  } else {
    label.innerText = "Mobile UPI Details (Paytm, GPAY, PhonePe)";
    input.placeholder = "9123456789@paytm or UPI ID";
  }
}

async function handleRedemptionSubmit(e) {
  e.preventDefault();
  const selectVal = document.getElementById("redeem-amount").value;
  const method = document.getElementById("redeem-method").value;
  const details = document.getElementById("redeem-details").value.trim();

  let reqPts = 0;
  let giftName = "";
  
  if (selectVal === "500") { reqPts = 500; giftName = "₹ 500 UPI Cash Payout"; }
  else if (selectVal === "1000") { reqPts = 1000; giftName = "₹ 1,000 UPI Cash Payout"; }
  else if (selectVal === "tool_kit") { reqPts = 1500; giftName = "Professional Socket Screwdriver Set"; }
  else if (selectVal === "hydraulic_jack") { reqPts = 3000; giftName = "3-Ton Floor Hydraulic Jack"; }
  else if (selectVal === "air_compressor") { reqPts = 5000; giftName = "Electric Impact Air Compressor"; }
  else if (selectVal === "10000") { reqPts = 10000; giftName = "₹ 10,000 UPI Cash Payout"; }

  if (!selectVal) {
    window.UTILS.showToast("Please choose a gift or payout option.", "warning");
    return;
  }

  if ((currentMechanicSession.points || 0) < reqPts) {
    window.UTILS.showToast("You do not have enough approved points to claim this gift.", "error");
    return;
  }

  window.UTILS.showLoader("Transmitting gift claim request...");
  try {
    // Subtract points
    await window.API.updateUserPoints(currentMechanicSession.email, -reqPts);

    const claim = {
      email: currentMechanicSession.email,
      fullname: currentMechanicSession.fullname,
      role: currentMechanicSession.role,
      firmName: currentMechanicSession.firmName,
      productID: "RED-CASH",
      productName: `GIFT CLAIMED: ${giftName} (Delivered via ${method.toUpperCase()})`,
      quantity: 1,
      pointsCalculated: -reqPts
    };

    await window.API.submitPurchaseClaim(claim);
    window.UTILS.showToast("Claim successfully logged! Dispatch processing in 24 hours.", "success");

    // Reset form
    document.getElementById("redeem-amount").value = "";
    document.getElementById("redeem-details").value = "";
    document.getElementById("redeem-required-pts").innerText = "0 Pts";

    await loadMechanicDashboard();
    switchTab("dashboard");
  } catch (ex) {
    window.UTILS.showToast(ex.message, "error");
  } finally {
    window.UTILS.hideLoader();
  }
}

async function loadRedemptions() {
  document.getElementById("redeem-required-pts").innerText = "0 Pts";
  document.getElementById("redeem-user-balance").innerText = `${currentMechanicSession.points || 0} Pts`;

  try {
    const claims = await window.API.getPurchases();
    const myRedemptions = claims.filter(c => 
      c.email.toLowerCase() === currentMechanicSession.email.toLowerCase() && 
      c.productID === "RED-CASH"
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

    tbody.innerHTML = myRedemptions.map(r => `
      <tr class="border-b border-slate-800/40 text-[11px]">
        <td class="py-2.5 font-bold text-white">${r.productName}</td>
        <td class="py-2.5 font-mono text-slate-400">${window.UTILS.formatDate(r.date)}</td>
        <td class="py-2.5 text-right font-mono font-bold text-red-400">${r.pointsCalculated} Pts</td>
      </tr>
    `).join("");

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
      tierClass = "text-[#FF6B00] font-mono font-bold tracking-widest animate-pulse";
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

window.initMechanicPage = initMechanicPage;
window.switchTab = switchTab;
window.toggleSidebar = toggleSidebar;
window.calculateMockScanPoints = calculateMockScanPoints;
window.submitManualLoyaltyScanClaim = submitManualLoyaltyScanClaim;
window.simulateCameraScanCapture = simulateCameraScanCapture;
window.calculateRedemptionRequiredPoints = calculateRedemptionRequiredPoints;
window.toggleRedeemAddressInput = toggleRedeemAddressInput;
window.handleRedemptionSubmit = handleRedemptionSubmit;
window.handleSendSupportMessage = handleSendSupportMessage;
window.handleLogout = handleLogout;
window.handleCatalogSearch = handleCatalogSearch;
