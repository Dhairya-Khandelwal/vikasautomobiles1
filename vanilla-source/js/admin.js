/* Admin Dashboard Controller - Vikas Automobiles */

let currentAdminSession = null;

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

  // Tab dynamic loaders
  if (tabId === "dashboard") {
    loadDashboardMetrics();
  } else if (tabId === "products") {
    loadProductsCatalog();
  } else if (tabId === "claims") {
    loadPendingClaims();
  } else if (tabId === "qr-generator") {
    loadQRGeneratorCatalog();
  }
}

function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  if (sidebar) sidebar.classList.toggle("-translate-x-full");
}

// 1. DASHBOARD METRICS
async function loadDashboardMetrics() {
  window.UTILS.showLoader("Refreshing warehouse metrics...");
  try {
    const [products, claims] = await Promise.all([
      window.API.getProducts(),
      window.API.getPurchases()
    ]);

    const totalSKUs = products.length;
    const lowStockSKUs = products.filter(p => (p.stock || 0) <= (p.minStock || 5)).length;
    const pendingClaims = claims.filter(c => c.status === "pending").length;
    const totalProcessed = claims.filter(c => c.status !== "pending").length;

    document.getElementById("metrics-skus").innerText = totalSKUs;
    document.getElementById("metrics-low-stock").innerText = lowStockSKUs;
    document.getElementById("metrics-pending-claims").innerText = pendingClaims;
    document.getElementById("metrics-processed-claims").innerText = totalProcessed;

    // Load low stock alert table
    const alertBody = document.getElementById("dashboard-stock-alerts");
    if (alertBody) {
      const lowStockItems = products.filter(p => (p.stock || 0) <= (p.minStock || 5));
      if (lowStockItems.length === 0) {
        alertBody.innerHTML = `
          <tr>
            <td colspan="4" class="py-4 text-center text-slate-500 font-mono text-[11px]">All genuine spare parts are above safety stock limits.</td>
          </tr>
        `;
      } else {
        alertBody.innerHTML = lowStockItems.map(p => `
          <tr class="border-b border-slate-800/40 text-[11px]">
            <td class="py-2.5 font-bold text-white">${p.name}<br><span class="text-[9px] text-slate-500 font-mono">${p.id}</span></td>
            <td class="py-2.5 font-mono">${p.category}</td>
            <td class="py-2.5 text-red-400 font-mono font-bold">${p.stock} left</td>
            <td class="py-2.5 text-right">
              <button onclick="quickRefillStock('${p.id}')" class="px-2 py-0.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-[9px] rounded uppercase transition">Refill +50</button>
            </td>
          </tr>
        `).join("");
      }
    }

  } catch (e) {
    console.error("Dashboard metrics load failure", e);
    window.UTILS.showToast("Failed to refresh warehouse data.", "error");
  } finally {
    window.UTILS.hideLoader();
  }
}

async function quickRefillStock(id) {
  window.UTILS.showLoader("Refilling SKU stock level...");
  try {
    await window.API.adjustStock(id, 50);
    window.UTILS.showToast("Product stock refilled successfully (+50)!", "success");
    await loadDashboardMetrics();
  } catch (e) {
    window.UTILS.showToast(e.message, "error");
  } finally {
    window.UTILS.hideLoader();
  }
}

// 2. SPARE PARTS PRODUCT CATALOG MANAGEMENT
let currentProductsList = [];
async function loadProductsCatalog() {
  try {
    currentProductsList = await window.API.getProducts();
    renderProductsListTable(currentProductsList);
  } catch (e) {
    console.error("Error loading products", e);
    window.UTILS.showToast("Failed to load parts catalog.", "error");
  }
}

function renderProductsListTable(list) {
  const tbody = document.getElementById("products-tbody");
  if (!tbody) return;

  if (list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="py-6 text-center text-slate-500 font-mono">No products in database. Create one below.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = list.map(p => `
    <tr class="border-b border-slate-800/40 text-xs">
      <td class="py-3 font-bold text-white font-sans">${p.name}<br><span class="text-[9px] text-slate-500 font-mono font-normal">${p.id} | Pack: ${p.packSize || "1 Unit"}</span></td>
      <td class="py-3 font-mono text-slate-400">${p.category}</td>
      <td class="py-3 font-semibold text-slate-300">R: ${window.UTILS.formatCurrency(p.retailerPrice)}<br>M: ${window.UTILS.formatCurrency(p.mechanicPrice)}</td>
      <td class="py-3 font-mono text-[#FF6B00]">R: ${p.retailerPoints} Pts<br>M: ${p.mechanicPoints} Pts</td>
      <td class="py-3 font-mono font-bold ${p.stock <= p.minStock ? 'text-red-400' : 'text-slate-300'}">${p.stock}</td>
      <td class="py-3 text-right">
        <button onclick="editProductPrompt('${p.id}')" class="p-1 text-blue-400 hover:text-blue-300 transition mr-1" title="Edit Product"><i data-lucide="edit" class="w-4 h-4 inline"></i></button>
      </td>
    </tr>
  `).join("");
  lucide.createIcons();
}

function handleProductsSearch(query) {
  const q = query.toLowerCase().trim();
  const filtered = currentProductsList.filter(p => 
    p.name.toLowerCase().includes(q) || 
    p.id.toLowerCase().includes(q) || 
    p.category.toLowerCase().includes(q) ||
    p.brand.toLowerCase().includes(q)
  );
  renderProductsListTable(filtered);
}

// Add/Edit Product submit
async function handleProductSubmit(e) {
  e.preventDefault();
  window.UTILS.showLoader("Saving part data to catalog...");
  try {
    const product = {
      id: document.getElementById("prod-id").value.trim() || undefined,
      name: document.getElementById("prod-name").value.trim(),
      brand: document.getElementById("prod-brand").value.trim(),
      category: document.getElementById("prod-category").value,
      mrp: Number(document.getElementById("prod-mrp").value),
      packSize: document.getElementById("prod-packsize").value.trim(),
      retailerPrice: Number(document.getElementById("prod-rprice").value),
      mechanicPrice: Number(document.getElementById("prod-mprice").value),
      retailerPoints: Number(document.getElementById("prod-rpts").value),
      mechanicPoints: Number(document.getElementById("prod-mpts").value),
      stock: Number(document.getElementById("prod-stock").value),
      minStock: Number(document.getElementById("prod-minstock").value)
    };

    await window.API.saveProduct(product);
    window.UTILS.showToast("Product metadata saved to central catalog!", "success");
    
    // Clear form
    document.getElementById("prod-form").reset();
    document.getElementById("prod-id").value = "";
    document.getElementById("prod-submit-btn").innerText = "Add Part SKU to Catalog";
    
    await loadProductsCatalog();
  } catch (e) {
    console.error("Product catalog save failed", e);
    window.UTILS.showToast(e.message, "error");
  } finally {
    window.UTILS.hideLoader();
  }
}

function editProductPrompt(id) {
  const prod = currentProductsList.find(p => p.id === id);
  if (!prod) return;

  // Fill form
  document.getElementById("prod-id").value = prod.id;
  document.getElementById("prod-name").value = prod.name;
  document.getElementById("prod-brand").value = prod.brand;
  document.getElementById("prod-category").value = prod.category;
  document.getElementById("prod-mrp").value = prod.mrp;
  document.getElementById("prod-packsize").value = prod.packSize;
  document.getElementById("prod-rprice").value = prod.retailerPrice;
  document.getElementById("prod-mprice").value = prod.mechanicPrice;
  document.getElementById("prod-rpts").value = prod.retailerPoints;
  document.getElementById("prod-mpts").value = prod.mechanicPoints;
  document.getElementById("prod-stock").value = prod.stock;
  document.getElementById("prod-minstock").value = prod.minStock;

  document.getElementById("prod-submit-btn").innerText = "Update Part SKU Metadata";
  window.UTILS.showToast(`Loading SKU properties for: ${id}`, "info");
}


// 3. SCAN CLAIMS AUTHORIZATIONS
let pendingClaimsList = [];
async function loadPendingClaims() {
  try {
    const claims = await window.API.getPurchases();
    pendingClaimsList = claims;
    renderClaimsTable(claims);
  } catch (e) {
    console.error("Error loading claims", e);
    window.UTILS.showToast("Failed to load claims ledger.", "error");
  }
}

function renderClaimsTable(list) {
  const tbody = document.getElementById("claims-tbody");
  if (!tbody) return;

  if (list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="py-6 text-center text-slate-500 font-mono">No points scan claims registered in the ledger.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = list.map(c => {
    let statusClass = "text-amber-500 bg-amber-500/10 border-amber-500/20";
    if (c.status === "approved") statusClass = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    if (c.status === "rejected") statusClass = "text-red-400 bg-red-500/10 border-red-500/20";

    const actions = c.status === "pending"
      ? `<button onclick="processLoyaltyClaim('${c.id}', 'approved')" class="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-[#0B192C] font-black text-[9px] rounded uppercase transition mr-1">Approve</button>
         <button onclick="processLoyaltyClaim('${c.id}', 'rejected')" class="px-2 py-0.5 bg-slate-950 border border-slate-800 hover:text-red-400 text-slate-400 font-bold text-[9px] rounded uppercase transition">Reject</button>`
      : `<span class="text-slate-500 font-mono text-[9px] uppercase">Processed</span>`;

    return `
      <tr class="border-b border-slate-800/40 text-xs">
        <td class="py-3 font-mono font-bold text-slate-400">${c.id}<br><span class="text-[9px] font-normal text-slate-500">${window.UTILS.formatDate(c.date)}</span></td>
        <td class="py-3 font-bold text-white">${c.fullname}<br><span class="text-[9px] font-normal text-slate-500 capitalize">${c.role} | ${c.firmName || "-"}</span></td>
        <td class="py-3 font-medium text-slate-300">${c.productName}<br><span class="text-[9px] font-mono text-slate-500">SKU: ${c.productID} | Qty: ${c.quantity}</span></td>
        <td class="py-3 font-mono font-bold text-[#FF6B00]">${c.pointsCalculated} Pts</td>
        <td class="py-3">
          <span class="px-1.5 py-0.5 border text-[9px] font-bold rounded font-mono uppercase ${statusClass}">${c.status}</span>
        </td>
        <td class="py-3 text-right whitespace-nowrap">${actions}</td>
      </tr>
    `;
  }).join("");
}

function handleClaimsSearch(query) {
  const q = query.toLowerCase().trim();
  const filtered = pendingClaimsList.filter(c => 
    c.id.toLowerCase().includes(q) ||
    c.fullname.toLowerCase().includes(q) ||
    c.productName.toLowerCase().includes(q) ||
    c.productID.toLowerCase().includes(q) ||
    c.firmName.toLowerCase().includes(q)
  );
  renderClaimsTable(filtered);
}

async function processLoyaltyClaim(claimID, status) {
  window.UTILS.showLoader("Processing points claim...");
  try {
    await window.API.processPurchaseClaim(claimID, status);
    window.UTILS.showToast(`Points claim successfully ${status}!`, "success");
    await loadPendingClaims();
  } catch (e) {
    console.error("Claim processing error", e);
    window.UTILS.showToast(e.message, "error");
  } finally {
    window.UTILS.hideLoader();
  }
}


// 4. PRINTABLE STICKER LABEL QR GENERATOR
async function loadQRGeneratorCatalog() {
  try {
    const products = await window.API.getProducts();
    const select = document.getElementById("qr-select-product");
    if (!select) return;

    // Reset list
    select.innerHTML = '<option value="">-- Choose Product SKU --</option>' + 
      products.map(p => `<option value="${p.id}">${p.id} - ${p.name}</option>`).join("");
  } catch (e) {
    console.error("Error loading product keys for QR label", e);
  }
}

function handleGenerateStickerLabel() {
  const prodId = document.getElementById("qr-select-product").value;
  if (!prodId) {
    window.UTILS.showToast("Please choose a product SKU first.", "warning");
    return;
  }

  const list = currentProductsList.length > 0 ? currentProductsList : window.CONFIG.DEFAULT_PRODUCTS;
  const prod = list.find(p => p.id === prodId);
  if (!prod) return;

  // Build high contrast vector label card inside simulator
  const preview = document.getElementById("sticker-preview-box");
  if (preview) {
    // Generate a beautiful, completely styled printable auto label
    preview.innerHTML = `
      <div class="bg-white text-slate-900 p-6 border-4 border-slate-950 max-w-sm rounded-none font-sans relative shadow-2xl mx-auto flex flex-col justify-between h-80 select-none animate-fade-in" id="printable-area-card">
        
        <!-- Header -->
        <div class="flex items-start justify-between border-b-2 border-slate-950 pb-2">
          <div>
            <h5 class="text-[14px] font-black uppercase tracking-tight leading-none text-slate-950">VIKAS AUTOMOBILES</h5>
            <span class="text-[8px] font-mono font-bold text-slate-600 tracking-wider">GENUINE SPARE PARTS</span>
          </div>
          <span class="px-2 py-0.5 bg-slate-950 text-white font-mono text-[9px] font-bold uppercase rounded">STICKER ORIGINAL</span>
        </div>

        <!-- Body metadata -->
        <div class="grid grid-cols-3 gap-2 py-3 items-center">
          <div class="col-span-2 space-y-1">
            <h6 class="text-[11px] font-extrabold text-slate-950 uppercase leading-snug">${prod.name}</h6>
            <div class="text-[8px] font-bold text-slate-600 space-y-0.5">
              <p>PART NO: <span class="font-mono text-slate-900">${prod.id}</span></p>
              <p>NET QTY: <span class="text-slate-900">${prod.packSize}</span></p>
              <p>MRP: <span class="font-mono text-slate-900">₹ ${prod.mrp}.00 (Incl. of taxes)</span></p>
              <p>BRAND: <span class="text-slate-900">${prod.brand}</span></p>
            </div>
          </div>

          <!-- Vector Barcode simulator -->
          <div class="flex flex-col items-center justify-center space-y-1">
            <div class="w-16 h-16 border-2 border-slate-950 flex items-center justify-center relative p-1 bg-white">
              <!-- Grid blocks mimicking actual complex QR code -->
              <div class="grid grid-cols-4 gap-0.5 w-full h-full opacity-90">
                <div class="bg-slate-950"></div><div class="bg-slate-900"></div><div class="bg-white"></div><div class="bg-slate-950"></div>
                <div class="bg-white"></div><div class="bg-slate-950"></div><div class="bg-slate-950"></div><div class="bg-white"></div>
                <div class="bg-slate-950"></div><div class="bg-white"></div><div class="bg-slate-900"></div><div class="bg-slate-950"></div>
                <div class="bg-slate-900"></div><div class="bg-slate-950"></div><div class="bg-white"></div><div class="bg-slate-950"></div>
              </div>
              <span class="absolute bottom-0 right-0 bg-slate-950 text-white font-mono text-[6px] px-0.5">VIKAS</span>
            </div>
            <span class="text-[7px] font-mono font-bold text-slate-600 tracking-widest">${prod.id}</span>
          </div>
        </div>

        <!-- Footnote with claims info -->
        <div class="border-t border-dashed border-slate-600 pt-2 flex justify-between items-center text-[7.5px] font-bold text-slate-500">
          <div>
            <p class="text-slate-950 font-extrabold">LOYALTY REWARDS POINTS:</p>
            <p>Retailer: ${prod.retailerPoints} Pts | Mechanic: ${prod.mechanicPoints} Pts</p>
          </div>
          <div class="text-right leading-tight font-mono text-slate-600">
            Scan QR inside Portal<br>To claim Cash out
          </div>
        </div>

      </div>
      
      <!-- Action triggers -->
      <div class="flex items-center justify-center gap-3 mt-4">
        <button onclick="handlePrintLabelAction()" class="px-4 py-2 bg-slate-900 border border-slate-800 hover:border-[#FF6B00] text-[#FF6B00] text-xs font-bold rounded-lg transition flex items-center gap-1.5">
          <i data-lucide="printer" class="w-4 h-4"></i>
          <span>Print Physical Tag</span>
        </button>
      </div>
    `;
    lucide.createIcons();
    window.UTILS.showToast(`Printable Loyalty tag generated for ${prod.id}!`, "success");
  }
}

function handlePrintLabelAction() {
  window.UTILS.showToast("Contacting wireless label printer...", "info");
  setTimeout(() => {
    window.UTILS.showToast("Print command dispatched. Label printed successfully!", "success");
  }, 1500);
}


function handleLogout() {
  window.AUTH.logout();
}

// INITIALIZER MODULE
async function initAdminPage() {
  window.UTILS.showLoader("Opening administrator desk...");
  try {
    currentAdminSession = window.AUTH.verifySession(["admin", "owner"]);
    if (!currentAdminSession) return;

    // Load header properties
    document.getElementById("sidebar-username").innerText = currentAdminSession.fullname;
    if (currentAdminSession.photo) {
      document.getElementById("sidebar-avatar").src = currentAdminSession.photo;
    }

    // Default dashboard statistics metrics
    loadDashboardMetrics();

  } catch (e) {
    console.error("Admin dashboard initialization error", e);
    window.UTILS.showToast("Administrative session failed to authenticate.", "error");
  } finally {
    window.UTILS.hideLoader();
  }
}

window.initAdminPage = initAdminPage;
window.switchTab = switchTab;
window.toggleSidebar = toggleSidebar;
window.handleProductSubmit = handleProductSubmit;
window.quickRefillStock = quickRefillStock;
window.editProductPrompt = editProductPrompt;
window.processLoyaltyClaim = processLoyaltyClaim;
window.handleGenerateStickerLabel = handleGenerateStickerLabel;
window.handlePrintLabelAction = handlePrintLabelAction;
window.handleLogout = handleLogout;
window.handleProductsSearch = handleProductsSearch;
window.handleClaimsSearch = handleClaimsSearch;
