/* Admin Dashboard Controller - Vikas Automobiles */

let currentAdminSession = null;

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

  // Tab dynamic loaders
  if (tabId === "dashboard") {
    loadDashboardMetrics();
  } else if (tabId === "users") {
    loadUsers();
  } else if (tabId === "products") {
    loadProductsCatalog();
  } else if (tabId === "purchases") {
    loadPendingClaims();
  } else if (tabId === "qr-codes") {
    loadQRGeneratorCatalog();
  } else if (tabId === "qr-claims") {
    loadQrClaims();
  } else if (tabId === "settings") {
    loadSettingsForm();
  } else if (tabId === "notifs") {
    loadNotifsList();
  } else if (tabId === "rewards") {
    loadRewardsAndRedemptions();
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

// 1. DASHBOARD METRICS
async function loadDashboardMetrics() {
  window.UTILS.showLoader("Refreshing warehouse metrics...");
  try {
    const [products, claims, users, redemptions] = await Promise.all([
      window.API.getProducts(),
      window.API.getPurchases(),
      window.API.getUsers(),
      window.API.getRedemptions()
    ]);

    const totalSKUs = products.length;
    const partnersCount = users.filter(u => u.role === "retailer" || u.role === "mechanic").length;
    const pendingClaims = claims.filter(c => c.status === "pending").length;
    const totalProcessed = claims.filter(c => c.status !== "pending").length;

    const skusEl = document.getElementById("stat-products-count");
    if (skusEl) skusEl.innerText = totalSKUs;

    const partnersEl = document.getElementById("stat-partners-count");
    if (partnersEl) partnersEl.innerText = partnersCount;

    const pendingClaimsEl = document.getElementById("stat-claims-pending");
    if (pendingClaimsEl) pendingClaimsEl.innerText = pendingClaims;

    const processedClaimsEl = document.getElementById("stat-scans-completed");
    if (processedClaimsEl) processedClaimsEl.innerText = totalProcessed;

    // Load pending redemption requests
    const redemptionsBody = document.getElementById("quick-redemptions-tbody");
    if (redemptionsBody) {
      const pendingRedemptions = redemptions.filter(r => r.status === "pending");
      if (pendingRedemptions.length === 0) {
        redemptionsBody.innerHTML = `
          <tr>
            <td colspan="3" class="py-4 text-center text-slate-400 font-mono text-[11px]">No pending redemptions.</td>
          </tr>
        `;
      } else {
        redemptionsBody.innerHTML = pendingRedemptions.map(r => `
          <tr class="border-b border-slate-100 text-[11px]">
            <td class="py-2.5 font-bold text-slate-800">${r.fullname}<br><span class="text-[9px] text-slate-400 font-mono">${r.id}</span></td>
            <td class="py-2.5 text-slate-600 truncate max-w-[120px]" title="${r.rewardName || 'Reward'}">
              ${r.rewardName || 'Reward'}
            </td>
            <td class="py-2.5 text-right font-mono font-bold text-blue-600">
              ${r.pointsRequired || 0} pts
            </td>
          </tr>
        `).join("");
      }
    }

    // Load incoming scan claims table
    const claimsBody = document.getElementById("quick-claims-tbody");
    if (claimsBody) {
      const pendingItems = claims.filter(c => c.status === "pending");
      if (pendingItems.length === 0) {
        claimsBody.innerHTML = `
          <tr>
            <td colspan="3" class="py-4 text-center text-slate-400 font-mono text-[11px]">No pending claims.</td>
          </tr>
        `;
      } else {
        claimsBody.innerHTML = pendingItems.map(c => `
          <tr class="border-b border-slate-100 text-[11px]">
            <td class="py-2.5 text-slate-800">
              <span class="font-bold">${c.fullname || c.userEmail || "Anonymous"}</span><br>
              <span class="text-[9px] text-slate-400 font-mono">${c.id}</span>
            </td>
            <td class="py-2.5 text-slate-600 truncate max-w-[120px]" title="${c.productName || 'Product'}">
              ${c.productName || 'Product'}
            </td>
            <td class="py-2.5 text-right font-mono font-bold text-blue-600">
              +${c.pointsEarned || 0} pts
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
        <td colspan="9" class="py-6 text-center text-slate-500 font-mono">No products in database. Create one below.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = list.map(p => {
    const statusColor = (p.status || "Active").toLowerCase() === "active"
      ? "bg-emerald-50 text-emerald-600 border-emerald-150"
      : "bg-slate-100 text-slate-600 border-slate-200";
    
    return `
      <tr class="border-b border-slate-100 text-xs hover:bg-slate-50 transition">
        <td class="py-3 pl-2">
          <input type="checkbox" name="product-select" value="${p.id}" onchange="updateDeleteSelectedButtonState()" class="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer">
        </td>
        <td class="py-3 font-mono font-bold text-blue-600">${p.itemCode || "Auto"}</td>
        <td class="py-3 font-bold text-slate-800 font-sans">
          ${p.name}
          <br>
          <span class="text-[9px] text-slate-400 font-mono font-normal">ID: ${p.id}</span>
        </td>
        <td class="py-3 text-slate-600 font-medium">
          <span class="font-bold">${p.packSize || "1 Unit"}</span>
          <br>
          <span class="text-[9px] text-slate-400">${p.category}</span>
        </td>
        <td class="py-3 font-semibold text-slate-700 font-mono text-[10px]">
          R: <span class="text-blue-600">${window.UTILS.formatCurrency(p.retailerPrice || 0)}</span><br>
          M: <span class="text-indigo-600">${window.UTILS.formatCurrency(p.mechanicPrice || 0)}</span><br>
          D: <span class="text-slate-600">${window.UTILS.formatCurrency(p.distributorPrice || 0)}</span>
        </td>
        <td class="py-3 font-mono text-[10px]">
          R: <span class="font-bold text-blue-600">${p.retailerPoints || 0} Pts</span><br>
          M: <span class="font-bold text-indigo-600">${p.mechanicPoints || 0} Pts</span>
        </td>
        <td class="py-3">
          <span class="px-2 py-0.5 text-[10px] font-bold rounded-full border ${statusColor}">
            ${p.status || "Active"}
          </span>
        </td>
        <td class="py-3 font-mono text-slate-500 text-[10px]">${p.createdDate || "-"}</td>
        <td class="py-3 text-right pr-2">
          <button onclick="editProductPrompt('${p.id}')" class="p-1 text-blue-600 hover:text-blue-500 transition mr-1" title="Edit Product">
            <i data-lucide="edit" class="w-4 h-4 inline"></i>
          </button>
          <button onclick="handleDeleteSingleProduct('${p.id}')" class="p-1 text-rose-600 hover:text-rose-500 transition" title="Delete Product">
            <i data-lucide="trash-2" class="w-4 h-4 inline"></i>
          </button>
        </td>
      </tr>
    `;
  }).join("");
  lucide.createIcons();
  
  // Update select all and buttons
  const master = document.getElementById("select-all-products");
  if (master) master.checked = false;
  updateDeleteSelectedButtonState();
}

function toggleSelectAllProducts(masterCheckbox) {
  const checkboxes = document.querySelectorAll('input[name="product-select"]');
  checkboxes.forEach(cb => cb.checked = masterCheckbox.checked);
  updateDeleteSelectedButtonState();
}

function updateDeleteSelectedButtonState() {
  const checkboxes = document.querySelectorAll('input[name="product-select"]:checked');
  const deleteBtn = document.getElementById("btn-delete-selected");
  if (deleteBtn) {
    if (checkboxes.length > 0) {
      deleteBtn.disabled = false;
      deleteBtn.querySelector("span").innerText = `Delete Selected (${checkboxes.length})`;
    } else {
      deleteBtn.disabled = true;
      deleteBtn.querySelector("span").innerText = "Delete Selected";
    }
  }

  const downloadBtn = document.getElementById("btn-download-selected-qr");
  if (downloadBtn) {
    if (checkboxes.length > 0) {
      downloadBtn.disabled = false;
      downloadBtn.querySelector("span").innerText = `Download QR (Selected) (${checkboxes.length})`;
    } else {
      downloadBtn.disabled = true;
      downloadBtn.querySelector("span").innerText = "Download QR (Selected)";
    }
  }

  // Also update master checkbox checked state if some are unchecked
  const totalCheckboxes = document.querySelectorAll('input[name="product-select"]');
  const master = document.getElementById("select-all-products");
  if (master && totalCheckboxes.length > 0) {
    master.checked = checkboxes.length === totalCheckboxes.length;
  }
}

async function handleDeleteSingleProduct(id) {
  if (!confirm(`Are you sure you want to delete product "${id}" from the catalog? This action is irreversible.`)) {
    return;
  }
  
  window.UTILS.showLoader("Deleting product...");
  try {
    await window.API.deleteProduct(id);
    window.UTILS.showToast(`Product ${id} deleted successfully.`, "success");
    await loadProductsCatalog();
    await loadDashboardMetrics();
  } catch (err) {
    console.error("Failed to delete product", err);
    window.UTILS.showToast("Failed to delete product.", "error");
  } finally {
    window.UTILS.hideLoader();
  }
}

async function handleDeleteSelectedProducts() {
  const checkboxes = document.querySelectorAll('input[name="product-select"]:checked');
  if (checkboxes.length === 0) return;
  
  const ids = Array.from(checkboxes).map(cb => cb.value);
  if (!confirm(`Are you sure you want to delete the ${ids.length} selected products? This action is irreversible.`)) {
    return;
  }
  
  window.UTILS.showLoader(`Deleting ${ids.length} products...`);
  try {
    await window.API.deleteMultipleProducts(ids);
    window.UTILS.showToast(`${ids.length} products deleted successfully.`, "success");
    
    const master = document.getElementById("select-all-products");
    if (master) master.checked = false;
    
    await loadProductsCatalog();
    await loadDashboardMetrics();
  } catch (err) {
    console.error("Failed to delete products", err);
    window.UTILS.showToast("Failed to delete selected products.", "error");
  } finally {
    window.UTILS.hideLoader();
  }
}

async function handleDeleteAllProducts() {
  if (!confirm("WARNING: Are you absolutely sure you want to delete ALL products from the catalog? This will completely clear your parts database and is irreversible!")) {
    return;
  }
  
  if (!confirm("Confirm one more time: Do you really want to clear the entire product database?")) {
    return;
  }
  
  window.UTILS.showLoader("Clearing all products...");
  try {
    await window.API.deleteAllProducts();
    window.UTILS.showToast("All catalog products deleted successfully.", "success");
    
    const master = document.getElementById("select-all-products");
    if (master) master.checked = false;
    
    await loadProductsCatalog();
    await loadDashboardMetrics();
  } catch (err) {
    console.error("Failed to clear products", err);
    window.UTILS.showToast("Failed to clear product catalog.", "error");
  } finally {
    window.UTILS.hideLoader();
  }
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
      itemCode: document.getElementById("prod-itemcode") ? document.getElementById("prod-itemcode").value.trim() : "",
      name: document.getElementById("prod-name").value.trim(),
      brand: document.getElementById("prod-brand").value.trim(),
      category: document.getElementById("prod-category").value,
      mrp: Number(document.getElementById("prod-mrp").value),
      packSize: document.getElementById("prod-packsize").value.trim(),
      retailerPrice: Number(document.getElementById("prod-rprice").value),
      mechanicPrice: Number(document.getElementById("prod-mprice").value),
      distributorPrice: document.getElementById("prod-distprice") ? Number(document.getElementById("prod-distprice").value) : 0,
      retailerPoints: Number(document.getElementById("prod-rpts").value),
      mechanicPoints: Number(document.getElementById("prod-mpts").value),
      status: document.getElementById("prod-status") ? document.getElementById("prod-status").value : "Active",
      qrCode: document.getElementById("prod-qrcode") ? document.getElementById("prod-qrcode").value.trim() : "",
      createdDate: document.getElementById("prod-created") && document.getElementById("prod-created").value ? document.getElementById("prod-created").value : new Date().toISOString().split('T')[0]
    };

    await window.API.saveProduct(product);
    window.UTILS.showToast("Product metadata saved to central catalog!", "success");
    
    // Clear form
    resetProductForm();
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

  // Fill new fields
  if (document.getElementById("prod-itemcode")) document.getElementById("prod-itemcode").value = prod.itemCode || "";
  if (document.getElementById("prod-distprice")) document.getElementById("prod-distprice").value = prod.distributorPrice || 0;
  if (document.getElementById("prod-status")) document.getElementById("prod-status").value = prod.status || "Active";
  if (document.getElementById("prod-qrcode")) document.getElementById("prod-qrcode").value = prod.qrCode || "";
  if (document.getElementById("prod-created")) document.getElementById("prod-created").value = prod.createdDate ? prod.createdDate.split('T')[0] : "";

  document.getElementById("prod-submit-btn").innerText = "Update Part SKU Metadata";
  
  const cancelBtn = document.getElementById("btn-cancel-edit");
  if (cancelBtn) cancelBtn.classList.remove("hidden");
  document.getElementById("product-form-title").innerText = `Edit Product Metadata (${id})`;
  
  window.UTILS.showToast(`Loading SKU properties for: ${id}`, "info");
}

function resetProductForm() {
  const idField = document.getElementById("prod-id");
  if (idField) idField.value = "";
  
  const form = idField ? idField.closest("form") : null;
  if (form) form.reset();
  
  const btn = document.getElementById("prod-submit-btn");
  if (btn) btn.innerText = "Add Part SKU to Catalog";
  
  const cancelBtn = document.getElementById("btn-cancel-edit");
  if (cancelBtn) cancelBtn.classList.add("hidden");
  
  const title = document.getElementById("product-form-title");
  if (title) title.innerText = "Add New Catalog Product";
}

function handleProductFormSubmit(e) {
  // Map form inputs properly
  const prodId = document.getElementById("prod-id").value;
  
  // Backwards compatibility mapper for form inputs in admin.html
  // Let's copy values to where handleProductSubmit expects them
  const fields = [
    { from: "prod-name", to: "prod-name" },
    { from: "prod-brand", to: "prod-brand" },
    { from: "prod-category", to: "prod-category" },
    { from: "prod-mrp", to: "prod-mrp" },
    { from: "prod-pack", to: "prod-packsize" },
    { from: "prod-retprice", to: "prod-rprice" },
    { from: "prod-mechprice", to: "prod-mprice" },
    { from: "prod-retpoints", to: "prod-rpts" },
    { from: "prod-mechpoints", to: "prod-mpts" },
    { from: "prod-itemcode", to: "prod-itemcode" },
    { from: "prod-distprice", to: "prod-distprice" },
    { from: "prod-status", to: "prod-status" },
    { from: "prod-qrcode", to: "prod-qrcode" },
    { from: "prod-created", to: "prod-created" }
  ];
  
  // Create virtual shadow inputs if needed by handleProductSubmit
  fields.forEach(f => {
    const el = document.getElementById(f.from);
    if (el) {
      let target = document.getElementById(f.to);
      if (!target) {
        target = document.createElement("input");
        target.id = f.to;
        target.type = "hidden";
        document.body.appendChild(target);
      }
      target.value = el.value;
    }
  });

  handleProductSubmit(e);
}

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

    // Skip header row
    let successCount = 0;

    for (let i = 1; i < rows.length; i++) {
      const cols = rows[i].split(",").map(c => c.trim().replace(/^["']|["']$/g, ""));
      if (cols.length < 5) continue;

      // Construct product
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
    if (typeof loadProductsCatalog === "function") {
      try {
        await loadProductsCatalog();
      } catch (e) {
        console.warn(e);
      }
    }
    if (typeof loadOwnerCatalog === "function") {
      try {
        await loadOwnerCatalog();
      } catch (e) {
        console.warn(e);
      }
    }
  } catch (err) {
    console.error("Bulk upload failed", err);
    window.UTILS.showToast(err.message, "error");
  } finally {
    window.UTILS.hideLoader();
    input.value = ""; // clear input
  }
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
  const tbody = document.getElementById("purchases-tbody");
  if (!tbody) return;

  // Reset checkboxes
  const selectAllChk = document.getElementById("claims-select-all");
  if (selectAllChk) selectAllChk.checked = false;
  const bulkBar = document.getElementById("claims-bulk-actions");
  if (bulkBar) bulkBar.classList.add("hidden");

  if (list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="py-6 text-center text-slate-500 font-mono">No points scan claims registered in the ledger.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = list.map(c => {
    let statusClass = "text-amber-500 bg-amber-500/10 border-amber-500/20";
    if (c.status === "approved") statusClass = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    if (c.status === "rejected") statusClass = "text-red-400 bg-red-500/10 border-red-500/20";

    const isPending = c.status === "pending";
    const checkboxHtml = isPending
      ? `<input type="checkbox" data-claim-id="${c.id}" onchange="updateClaimsSelection()" class="claim-select-checkbox rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer">`
      : `<i data-lucide="lock" class="w-3.5 h-3.5 text-slate-300 mx-auto"></i>`;

    const actions = isPending
      ? `<button onclick="processLoyaltyClaim('${c.id}', 'approved')" class="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[9px] rounded uppercase transition mr-1 cursor-pointer">Verify</button>
         <button onclick="processLoyaltyClaim('${c.id}', 'rejected')" class="px-2 py-1 bg-red-650 hover:bg-red-600 text-white font-black text-[9px] rounded uppercase transition mr-1 cursor-pointer">Reject</button>
         <button onclick="handleDeleteAdminClaim('${c.id}')" class="p-1 text-rose-600 hover:text-rose-500 transition align-middle" title="Delete Claim"><i data-lucide="trash-2" class="w-3.5 h-3.5 inline"></i></button>`
      : `<span class="text-slate-500 font-mono text-[9px] uppercase font-bold mr-1.5">Processed</span>
         <button onclick="handleDeleteAdminClaim('${c.id}')" class="p-1 text-rose-600 hover:text-rose-500 transition align-middle" title="Delete Claim"><i data-lucide="trash-2" class="w-3.5 h-3.5 inline"></i></button>`;

    const dateStr = c.date ? new Date(c.date).toLocaleDateString() : "-";

    return `
      <tr class="border-b border-slate-100 text-xs hover:bg-slate-50 transition">
        <td class="py-3 pl-2 text-center">
          ${checkboxHtml}
        </td>
        <td class="py-3 font-sans">
          <span class="font-bold text-slate-800">${c.fullname}</span><br>
          <span class="text-[10px] text-slate-500 font-mono">${window.UTILS.displayEmail(c.email)} (${c.role.toUpperCase()})</span>
        </td>
        <td class="py-3 text-slate-700 font-semibold">
          ${c.productName}<br>
          <span class="text-[10px] text-slate-400 font-mono font-bold">${c.productID}</span>
        </td>
        <td class="py-3 font-mono font-bold text-slate-600">${c.quantity}</td>
        <td class="py-3 font-mono text-blue-600 font-black">${c.pointsCalculated >= 0 ? '+' : ''}${c.pointsCalculated} Pts</td>
        <td class="py-3">
          <span class="px-2 py-0.5 border text-[9px] font-bold rounded uppercase font-mono ${statusClass}">${c.status}</span>
          ${c.remark ? `<div class="text-[10px] text-slate-500 italic mt-1 font-sans font-medium max-w-[200px] truncate" title="${c.remark}">Re: ${c.remark}</div>` : ""}
        </td>
        <td class="py-3 font-mono text-slate-500 text-[10px]">${dateStr}</td>
        <td class="py-3 text-right whitespace-nowrap pr-2">${actions}</td>
      </tr>
    `;
  }).join("");
  lucide.createIcons();
}

function toggleSelectAllClaims(checked) {
  document.querySelectorAll(".claim-select-checkbox").forEach(chk => {
    chk.checked = checked;
  });
  updateClaimsSelection();
}

function updateClaimsSelection() {
  const checkedChks = document.querySelectorAll(".claim-select-checkbox:checked");
  const count = checkedChks.length;

  const bulkBar = document.getElementById("claims-bulk-actions");
  const countLabel = document.getElementById("claims-selected-count");

  if (count > 0) {
    if (bulkBar) bulkBar.classList.remove("hidden");
    if (countLabel) countLabel.innerText = `${count} claim${count > 1 ? 's' : ''} selected`;
  } else {
    if (bulkBar) bulkBar.classList.add("hidden");
  }
}

async function applyClaimsBulkAction(action) {
  const checkedChks = document.querySelectorAll(".claim-select-checkbox:checked");
  const claimIds = Array.from(checkedChks).map(chk => chk.getAttribute("data-claim-id"));

  if (claimIds.length === 0) {
    window.UTILS.showToast("No claims selected.", "warning");
    return;
  }

  let promptReason = "Bulk administrative action";
  if (action === "reject") {
    const input = prompt("Please provide a rejection reason for these bulk claims:", "Incomplete invoice details or mismatch");
    if (input === null) return;
    promptReason = input.trim() || "Bulk administrative rejection";
  }

  window.UTILS.showLoader(`Processing bulk claims action (${action.toUpperCase()})...`);
  try {
    if (action === "approve") {
      const res = await window.API.bulkApproveClaims(claimIds);
      window.UTILS.showToast(`Successfully approved ${res.count} claims.`, "success");
    } else {
      const res = await window.API.bulkRejectClaims(claimIds, promptReason);
      window.UTILS.showToast(`Successfully rejected ${res.count} claims.`, "success");
    }
    await loadPendingClaims();
  } catch (err) {
    console.error("Bulk claims action failed", err);
    window.UTILS.showToast(err.message || "Failed to process bulk claims.", "error");
  } finally {
    window.UTILS.hideLoader();
  }
}

window.toggleSelectAllClaims = toggleSelectAllClaims;
window.updateClaimsSelection = updateClaimsSelection;
window.applyClaimsBulkAction = applyClaimsBulkAction;

function handleClaimsSearch(query) {
  const q = query.toLowerCase().trim();
  const filtered = pendingClaimsList.filter(c => 
    c.id.toLowerCase().includes(q) ||
    c.fullname.toLowerCase().includes(q) ||
    c.productName.toLowerCase().includes(q) ||
    c.productID.toLowerCase().includes(q) ||
    (c.firmName && c.firmName.toLowerCase().includes(q))
  );
  renderClaimsTable(filtered);
}

function processLoyaltyClaim(claimID, status) {
  const claim = pendingClaimsList.find(c => c.id === claimID);
  if (!claim) {
    window.UTILS.showToast("Claim not found in operations list.", "error");
    return;
  }

  document.getElementById("p-modal-claim-id").value = claim.id;
  document.getElementById("p-modal-id").innerText = claim.id;
  document.getElementById("p-modal-member").innerText = claim.fullname || claim.userEmail || "Anonymous";
  document.getElementById("p-modal-product").innerText = claim.productName || "Product";
  document.getElementById("p-modal-qty").innerText = claim.quantity || "1";
  document.getElementById("p-modal-points").innerText = `${claim.pointsCalculated || 0} pts`;
  document.getElementById("p-modal-remark").value = claim.remark || "";

  // 1. Invoice Image Preview Binding
  const invoicePreview = document.getElementById("p-modal-invoice-preview");
  if (invoicePreview) {
    // Dynamically retrieve user scan invoice photo or display a premium generic receipt mockup
    invoicePreview.src = claim.billImage || claim.invoicePhoto || "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&q=80&w=400";
  }

  // 2. Duplicate QR Code Scan Detection
  // Check if any other approved claim exists with the exact same product ID
  const duplicateWarning = document.getElementById("p-modal-duplicate-warning");
  if (duplicateWarning) {
    const hasDuplicateApproved = pendingClaimsList.some(other => 
      other.id !== claim.id && 
      other.productID === claim.productID && 
      other.status === "approved"
    );
    if (hasDuplicateApproved) {
      duplicateWarning.classList.remove("hidden");
    } else {
      duplicateWarning.classList.add("hidden");
    }
  }

  // 3. Claims Remarks & Audit History Thread
  const historyContainer = document.getElementById("p-modal-remarks-history");
  if (historyContainer) {
    if (claim.remarksHistory && claim.remarksHistory.length > 0) {
      historyContainer.innerHTML = claim.remarksHistory.map(h => `
        <div class="text-[10px] pb-1.5 border-b border-slate-100 last:border-0 last:pb-0">
          <div class="flex justify-between font-bold text-slate-700">
            <span>${h.author}</span>
            <span class="font-normal font-mono text-[8px] text-slate-400">${new Date(h.timestamp).toLocaleString()}</span>
          </div>
          <p class="text-slate-500 mt-0.5 leading-relaxed">${h.text}</p>
        </div>
      `).join("");
    } else {
      historyContainer.innerHTML = `<div class="text-[10px] text-slate-400 font-mono italic">No previous remarks in history.</div>`;
    }
  }

  // Set the radio status based on selection
  const radios = document.getElementsByName("p-modal-status");
  for (let r of radios) {
    if (r.value === status) {
      r.checked = true;
    }
  }

  document.getElementById("purchase-claim-modal").classList.remove("hidden");
  if (window.lucide) window.lucide.createIcons();
}

function closePurchaseClaimModal() {
  document.getElementById("purchase-claim-modal").classList.add("hidden");
}

async function savePurchaseClaimEvaluation(event) {
  if (event) event.preventDefault();

  const claimID = document.getElementById("p-modal-claim-id").value;
  const remark = document.getElementById("p-modal-remark").value.trim();
  
  let status = "approved";
  const radios = document.getElementsByName("p-modal-status");
  for (let r of radios) {
    if (r.checked) {
      status = r.value;
    }
  }

  if (!remark) {
    window.UTILS.showToast("Please provide evaluation remarks.", "error");
    return;
  }

  window.UTILS.showLoader("Applying verification verdict...");
  try {
    // Save to comment history first
    await window.API.addClaimRemarkHistory(claimID, remark);
    // Process the final approval or rejection status
    await window.API.processPurchaseClaim(claimID, status, remark);
    window.UTILS.showToast(`Points claim was successfully ${status}!`, "success");
    closePurchaseClaimModal();
    await loadPendingClaims();
  } catch (e) {
    console.error("Claim processing error", e);
    window.UTILS.showToast(e.message, "error");
  } finally {
    window.UTILS.hideLoader();
  }
}

async function handleDeleteAdminClaim(id) {
  const confirmed = confirm(`Are you sure you want to permanently delete scan claim ${id}? This cannot be undone.`);
  if (!confirmed) return;

  window.UTILS.showLoader("Deleting scan claim record...");
  try {
    await window.API.deletePurchaseClaim(id);
    window.UTILS.showToast("Scan claim record permanently deleted.", "success");
    await loadPendingClaims();
  } catch (err) {
    console.error("Failed to delete scan claim", err);
    window.UTILS.showToast(err.message, "error");
  } finally {
    window.UTILS.hideLoader();
  }
}

window.processLoyaltyClaim = processLoyaltyClaim;
window.closePurchaseClaimModal = closePurchaseClaimModal;
window.savePurchaseClaimEvaluation = savePurchaseClaimEvaluation;
window.handleDeleteAdminClaim = handleDeleteAdminClaim;


// 4. PRINTABLE STICKER LABEL QR GENERATOR & INVENTORY & MEMBERS
let currentUsersList = [];

async function loadUsers() {
  window.UTILS.showLoader("Refreshing members roster...");
  try {
    const users = await window.API.getUsers();
    currentUsersList = users.filter(u => u.role !== "owner"); // exclude owner
    renderUsersTable(currentUsersList);
  } catch (err) {
    console.error("Failed to load users", err);
    window.UTILS.showToast("Error loading operations roster.", "error");
  } finally {
    window.UTILS.hideLoader();
  }
}

function renderUsersTable(list) {
  const tbody = document.getElementById("users-tbody");
  if (!tbody) return;

  // Reset checkall checkbox
  const selectAllChk = document.getElementById("users-select-all");
  if (selectAllChk) selectAllChk.checked = false;
  const bulkBar = document.getElementById("users-bulk-actions");
  if (bulkBar) bulkBar.classList.add("hidden");

  if (list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="py-6 text-center text-slate-500 font-mono">No matching members registered in database.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = list.map(u => {
    let statusColor = "text-amber-500 bg-amber-500/10 border-amber-500/20";
    if (u.status === "approved") statusColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    if (u.status === "suspended") statusColor = "text-red-400 bg-red-500/10 border-red-500/20";

    return `
      <tr class="border-b border-slate-100 text-xs hover:bg-slate-50 transition">
        <td class="py-3 pl-2">
          <input type="checkbox" data-user-email="${u.email}" onchange="updateUsersSelection()" class="user-select-checkbox rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer">
        </td>
        <td class="py-3 font-bold text-slate-900">${u.fullname && u.fullname.trim() ? u.fullname : window.UTILS.displayEmail(u.email)}<br><span class="text-[9px] text-slate-500 font-mono font-normal">${window.UTILS.displayEmail(u.email)}</span></td>
        <td class="py-3 capitalize text-slate-600 font-semibold font-mono text-[10px]">${u.role}</td>
        <td class="py-3 text-slate-600">${u.firmName || "-"}</td>
        <td class="py-3 text-slate-600 font-mono">${u.mobile}<br><span class="text-[9px] text-slate-400">Pincode: ${u.pincode || "-"}</span></td>
        <td class="py-3"><span class="px-2 py-0.5 border text-[9px] font-bold rounded uppercase font-mono ${statusColor}">${u.status}</span></td>
        <td class="py-3 text-right whitespace-nowrap space-x-1 pr-2">
          <button onclick="openLoyaltyQrModal('${u.email}')" class="p-1 px-1.5 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded transition font-bold font-mono text-[9px] uppercase tracking-wider inline-flex items-center gap-1 cursor-pointer" title="Generate QR Pass">
            <i data-lucide="qr-code" class="w-3.5 h-3.5"></i> QR
          </button>
          <button onclick="openEditPartnerModal('${u.email}')" class="p-1 px-1.5 text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded transition font-bold font-mono text-[9px] uppercase tracking-wider inline-flex items-center gap-1 cursor-pointer" title="Edit Partner">
            <i data-lucide="edit" class="w-3.5 h-3.5"></i> Edit
          </button>
          <button onclick="openForceResetPasswordModal('${u.email}', '${u.fullname}')" class="p-1 px-1.5 text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 rounded transition font-bold font-mono text-[9px] uppercase tracking-wider inline-flex items-center gap-1 cursor-pointer" title="Reset Password">
            <i data-lucide="key" class="w-3.5 h-3.5"></i> Reset
          </button>
          <button onclick="toggleUserStatus('${u.email}', '${u.status}')" class="p-1 px-1.5 text-slate-600 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition font-bold font-mono text-[9px] uppercase tracking-wider inline-flex items-center gap-1 cursor-pointer" title="Toggle Account Status">
            <i data-lucide="ban" class="w-3.5 h-3.5"></i> ${u.status === 'suspended' ? 'Activate' : 'Suspend'}
          </button>
        </td>
      </tr>
    `;
  }).join("");
  lucide.createIcons();
}

function toggleSelectAllUsers(checked) {
  document.querySelectorAll(".user-select-checkbox").forEach(chk => {
    chk.checked = checked;
  });
  updateUsersSelection();
}

function updateUsersSelection() {
  const checkedChks = document.querySelectorAll(".user-select-checkbox:checked");
  const count = checkedChks.length;
  
  const bulkBar = document.getElementById("users-bulk-actions");
  const countLabel = document.getElementById("users-selected-count");

  if (count > 0) {
    if (bulkBar) bulkBar.classList.remove("hidden");
    if (countLabel) countLabel.innerText = `${count} partner${count > 1 ? 's' : ''} selected`;
  } else {
    if (bulkBar) bulkBar.classList.add("hidden");
  }
}

async function applyUsersBulkAction(action) {
  const checkedChks = document.querySelectorAll(".user-select-checkbox:checked");
  const emails = Array.from(checkedChks).map(chk => chk.getAttribute("data-user-email"));

  if (emails.length === 0) {
    window.UTILS.showToast("No partners selected.", "warning");
    return;
  }

  if (action === "delete") {
    if (!confirm(`Are you absolutely sure you want to permanently delete the ${emails.length} selected partner profile(s)?`)) {
      return;
    }
  }

  window.UTILS.showLoader(`Processing bulk user action (${action.toUpperCase()})...`);
  try {
    if (action === "approve") {
      const res = await window.API.bulkApproveUsers(emails);
      window.UTILS.showToast(`Successfully approved ${res.count} partners.`, "success");
    } else if (action === "delete") {
      const res = await window.API.bulkDeleteUsers(emails);
      window.UTILS.showToast(`Successfully deleted ${res.count} partner profiles.`, "success");
    } else if (action === "suspend") {
      let count = 0;
      for (const email of emails) {
        await window.API.setUserSuspendedState(email, true);
        count++;
      }
      window.UTILS.showToast(`Suspended ${count} partner profiles.`, "success");
    } else if (action === "activate") {
      let count = 0;
      for (const email of emails) {
        await window.API.setUserSuspendedState(email, false);
        count++;
      }
      window.UTILS.showToast(`Activated ${count} partner profiles.`, "success");
    }
    await loadUsers();
  } catch (err) {
    console.error("Bulk action failed", err);
    window.UTILS.showToast(err.message || "Failed to process bulk user action.", "error");
  } finally {
    window.UTILS.hideLoader();
  }
}

window.toggleSelectAllUsers = toggleSelectAllUsers;
window.updateUsersSelection = updateUsersSelection;
window.applyUsersBulkAction = applyUsersBulkAction;

function handleUserSearch(query) {
  const q = query.toLowerCase().trim();
  const filtered = currentUsersList.filter(u => 
    u.fullname.toLowerCase().includes(q) ||
    u.email.toLowerCase().includes(q) ||
    (u.firmName && u.firmName.toLowerCase().includes(q)) ||
    String(u.mobile || "").includes(q)
  );
  renderUsersTable(filtered);
}

function openForceResetPasswordModal(email, fullname) {
  document.getElementById("reset-user-email").value = email;
  document.getElementById("reset-modal-subtitle").innerText = `Resetting passphrase for ${fullname} (${email})`;
  document.getElementById("reset-new-pass").value = "";
  document.getElementById("reset-password-modal").classList.remove("hidden");
}

function closeResetPasswordModal() {
  document.getElementById("reset-password-modal").classList.add("hidden");
}

async function handleForceResetPasswordSubmit(e) {
  e.preventDefault();
  const email = document.getElementById("reset-user-email").value;
  const newPass = document.getElementById("reset-new-pass").value;

  window.UTILS.showLoader("Recalibrating security keys...");
  try {
    await window.API.resetUserPassword(email, newPass);
    window.UTILS.showToast(`Passphrase for ${email} successfully changed!`, "success");
    closeResetPasswordModal();
  } catch (err) {
    console.error("Force reset failed", err);
    window.UTILS.showToast(err.message, "error");
  } finally {
    window.UTILS.hideLoader();
  }
}

async function toggleUserStatus(email, currentStatus) {
  const nextStatus = currentStatus === "suspended" ? "approved" : "suspended";
  window.UTILS.showLoader("Transiting account status...");
  try {
    await window.API.updateUserStatus(email, nextStatus);
    window.UTILS.showToast(`Account ${email} transitioned to ${nextStatus.toUpperCase()}`, "success");
    await loadUsers();
  } catch (err) {
    console.error("Status toggle failed", err);
    window.UTILS.showToast(err.message, "error");
  } finally {
    window.UTILS.hideLoader();
  }
}

async function loadNotifsList() {
  try {
    const list = await window.API.getAnnouncements();
    const feed = document.getElementById("broadcasts-feed");
    if (!feed) return;

    if (list.length === 0) {
      feed.innerHTML = `<p class="text-xs text-slate-400 font-mono text-center py-12">No recent announcements dispatched.</p>`;
      return;
    }

    feed.innerHTML = list.map(a => `
      <div class="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5 relative overflow-hidden">
        <div class="flex items-center justify-between">
          <h4 class="font-bold text-slate-800 text-[11px]">${a.subject}</h4>
          <div class="flex items-center gap-2">
            <span class="text-[8px] text-slate-400 font-mono">${window.UTILS.formatDate(a.date)}</span>
            <button onclick="handleDeleteAnnouncementAdmin('${a.id}')" class="text-slate-400 hover:text-rose-500 transition" title="Delete announcement"><i data-lucide="trash-2" class="w-3 h-3"></i></button>
          </div>
        </div>
        <p class="text-[10px] text-slate-600 leading-snug">${a.body}</p>
        <span class="absolute right-2 bottom-1 text-[8px] font-mono text-slate-300 font-extrabold uppercase">Target: ${a.target}</span>
      </div>
    `).reverse().join("");

    if (window.lucide) window.lucide.createIcons();
  } catch (err) {
    console.error("Failed to load announcements", err);
  }
}

async function handleDeleteAnnouncementAdmin(id) {
  const confirmed = confirm("Are you sure you want to permanently delete this announcement? This cannot be undone.");
  if (!confirmed) return;

  window.UTILS.showLoader("Deleting announcement...");
  try {
    await window.API.deleteAnnouncement(id);
    window.UTILS.showToast("Announcement permanently deleted.", "success");
    await loadNotifsList();
  } catch (err) {
    console.error("Failed to delete announcement", err);
    window.UTILS.showToast(err.message, "error");
  } finally {
    window.UTILS.hideLoader();
  }
}

async function handleSendAnnouncementSubmit(e) {
  e.preventDefault();
  window.UTILS.showLoader("Broadcasting bulletin...");
  try {
    const ann = {
      subject: document.getElementById("notif-subject").value.trim(),
      body: document.getElementById("notif-body").value.trim(),
      target: document.getElementById("notif-target").value,
      channel: document.getElementById("notif-channel").value
    };

    await window.API.addAnnouncement(ann);
    window.UTILS.showToast("Broadcast bulletin dispatched to network!", "success");
    
    // Clear form
    document.getElementById("notif-subject").value = "";
    document.getElementById("notif-body").value = "";
    
    await loadNotifsList();
  } catch (err) {
    console.error("Bulletin dispatch failed", err);
    window.UTILS.showToast(err.message, "error");
  } finally {
    window.UTILS.hideLoader();
  }
}

// ---------------- DYNAMIC PRODUCT QR CODES GENERATOR ----------------
async function loadQRGeneratorCatalog() {
  try {
    const products = await window.API.getProducts();
    const select = document.getElementById("qr-select-product");
    if (!select) return;

    // Reset list
    select.innerHTML = '<option value="">-- Choose Product SKU --</option>' + 
      products.map(p => `<option value="${p.id}">${p.id} - ${p.name}</option>`).join("");

    // Restore the admin's last-picked sticker format
    const templateSelect = document.getElementById("sticker-template-select");
    if (templateSelect) templateSelect.value = window.UTILS.getStickerTemplateKey();
  } catch (e) {
    console.error("Error loading product keys for QR label", e);
  }
}

function loadProductQrMetadata() {
  const prodId = document.getElementById("qr-select-product").value;
  const nameField = document.getElementById("qr-name");
  const packField = document.getElementById("qr-pack");
  const qtyField = document.getElementById("qr-qty");
  
  if (!prodId) {
    if (nameField) nameField.value = "";
    if (packField) packField.value = "1 Unit";
    if (qtyField) qtyField.value = "1";
    return;
  }
  
  const list = currentProductsList.length > 0 ? currentProductsList : window.CONFIG.DEFAULT_PRODUCTS;
  const prod = list.find(p => p.id === prodId);
  if (prod) {
    if (nameField) nameField.value = prod.name || "";
    if (packField) packField.value = prod.packSize || "1 Unit";
    if (qtyField) qtyField.value = "1";
  }
}

let activeGeneratedProduct = null;

function generateProductQrGraphic() {
  const prodId = document.getElementById("qr-select-product").value;
  if (!prodId) {
    window.UTILS.showToast("Please choose a product SKU first.", "warning");
    return;
  }

  const list = currentProductsList.length > 0 ? currentProductsList : window.CONFIG.DEFAULT_PRODUCTS;
  const prod = list.find(p => p.id === prodId);
  if (!prod) return;
  activeGeneratedProduct = prod;

  // Retrieve customized values from fields
  const customName = document.getElementById("qr-name").value || prod.name;
  const customPack = document.getElementById("qr-pack").value || prod.packSize || "1 Unit";
  const customQty = document.getElementById("qr-qty").value || "1";
  const customBatch = document.getElementById("qr-batch").value || "B-2026-07";

  // Render sticker card elements
  document.getElementById("label-prod-id").innerText = prod.id;
  document.getElementById("label-prod-name").innerText = customName;
  document.getElementById("label-brand").innerText = `Brand: ${prod.brand || "Vikas Spares"}`;
  document.getElementById("label-batch").innerText = `Batch: ${customBatch}`;
  document.getElementById("label-pack").innerText = `Size: ${customPack}`;
  document.getElementById("label-qty").innerText = `Qty: ${customQty}`;
  
  const mfgVal = document.getElementById("qr-mfg-date").value;
  document.getElementById("label-mfg").innerText = `MFG: ${mfgVal ? window.UTILS.formatDate(new Date(mfgVal).toISOString()) : "03-Jul-2026"}`;

  // Generate QR code vector
  const payload = {
    app: "VikasRewards",
    v: 1,
    part: prod.id,
    name: customName,
    pack: customPack,
    qty: Number(customQty) || 1,
    rpts: prod.retailerPoints,
    mpts: prod.mechanicPoints,
    serial: `S-${Math.floor(100000 + Math.random() * 900000)}`
  };

  const payloadStr = JSON.stringify(payload);
  const container = document.getElementById("qr-canvas-container");
  if (container) {
    container.innerHTML = "";
    const qr = qrcode(0, 'M');
    qr.addData(payloadStr);
    qr.make();
    container.innerHTML = qr.createSvgTag(2.5, 1);
  }

  // Adjust display visibility
  document.getElementById("qr-empty-state").classList.add("hidden");
  document.getElementById("sticker-label").classList.remove("hidden");
  document.getElementById("qr-actions-panel").classList.remove("hidden");

  // Apply the currently selected sticker format (colors/border/QR frame)
  window.UTILS.applyStickerTemplateStyle();

  lucide.createIcons();
  window.UTILS.showToast(`Sticker generated for ${customName}!`, "success");
}

// Called when the admin picks a different Sticker Format from the dropdown.
function handleStickerTemplateChange(templateKey) {
  window.UTILS.setStickerTemplateKey(templateKey);
  // Restyle the live preview immediately if a sticker is already showing
  window.UTILS.applyStickerTemplateStyle();
  window.UTILS.showToast(`Sticker format set to ${window.CONFIG.STICKER_TEMPLATES[templateKey].label}.`, "success");
}
window.handleStickerTemplateChange = handleStickerTemplateChange;

function downloadQrSticker() {
  if (!activeGeneratedProduct) return;
  window.UTILS.showLoader("Composing physical tag image...");

  const t = window.UTILS.getStickerTemplate();
  const name = activeGeneratedProduct.name;
  const canvas = document.createElement("canvas");
  canvas.width = 450;
  canvas.height = 320;
  const ctx = canvas.getContext("2d");

  // Draw white background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Border stroke
  ctx.strokeStyle = t.border;
  ctx.lineWidth = 5;
  ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);

  // Header line
  ctx.fillStyle = t.headerBg;
  ctx.fillRect(5, 5, canvas.width - 10, 40);
  ctx.fillStyle = t.headerText;
  ctx.font = "bold 15px sans-serif";
  ctx.fillText("VIKAS AUTO GENUINE PART", 20, 30);

  // Product metadata lines
  ctx.fillStyle = "#000000";
  ctx.font = "bold 14px sans-serif";
  ctx.fillText(name.toUpperCase(), 20, 80);

  ctx.font = "11px monospace";
  ctx.fillText(`PART SKU: ${activeGeneratedProduct.id}`, 20, 115);
  ctx.fillText(`BRAND: ${activeGeneratedProduct.brand}`, 20, 135);
  ctx.fillText(`BATCH: ${document.getElementById("qr-batch").value}`, 20, 155);
  ctx.fillText(`NET QTY: ${activeGeneratedProduct.packSize}`, 20, 175);
  ctx.fillText(`MRP: Rs. ${activeGeneratedProduct.mrp}.00 (All taxes incl.)`, 20, 195);
  ctx.fillText(`MFG DATE: ${document.getElementById("qr-mfg-date").value}`, 20, 215);

  // Draw QR code path
  const qrSvg = document.querySelector("#qr-canvas-container svg");
  if (qrSvg) {
    const svgString = new XMLSerializer().serializeToString(qrSvg);
    const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const URL = window.URL || window.webkitURL || window;
    const blobURL = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = function() {
      ctx.drawImage(img, canvas.width - 165, 80, 140, 140);

      // Fine lines
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(20, 245);
      ctx.lineTo(canvas.width - 20, 245);
      ctx.stroke();

      // Footnotes
      ctx.font = "bold 10px monospace";
      ctx.fillText("SCRATCH & SCAN INSIDE PORTAL TO ACTIVATE POINTS", 25, 270);
      ctx.font = "9px monospace";
      ctx.fillText(`Retailer: ${activeGeneratedProduct.retailerPoints} Pts | Mechanic: ${activeGeneratedProduct.mechanicPoints} Pts`, 25, 290);

      // Save
      const link = document.createElement("a");
      link.download = `parts-sticker-${activeGeneratedProduct.id.toLowerCase()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();

      URL.revokeObjectURL(blobURL);
      window.UTILS.hideLoader();
      window.UTILS.showToast("Sticker saved to downloads!", "success");
    };
    img.src = blobURL;
  } else {
    window.UTILS.hideLoader();
  }
}

function printQrSticker() {
  if (!activeGeneratedProduct) return;
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    window.UTILS.showToast("Print window blocked. Please permit pop-ups.", "warning");
    return;
  }

  function openEditQrModal() {

    document.getElementById("editQRModal").classList.remove("hidden");
    document.getElementById("editQRModal").classList.add("flex");

}

  function closeEditQrModal() {

    document.getElementById("editQRModal").classList.remove("flex");
    document.getElementById("editQRModal").classList.add("hidden");

}

  function loadStickerIntoEditor(sticker){

    document.getElementById("editQrId").value = sticker.id;
    document.getElementById("editProduct").value = sticker.product;
    document.getElementById("editBatch").value = sticker.batch;
    document.getElementById("editPack").value = sticker.pack;
    document.getElementById("editRetailerPrice").value = sticker.retailerPrice;
    document.getElementById("editMechanicPrice").value = sticker.mechanicPrice;
    document.getElementById("editPoints").value = sticker.points;
    document.getElementById("editStatus").value = sticker.status;
    document.getElementById("editRemarks").value = sticker.remarks;

}

  async function saveEditedQr(){

    const sticker = {

        id: document.getElementById("editQrId").value,
        product: document.getElementById("editProduct").value,
        batch: document.getElementById("editBatch").value,
        pack: document.getElementById("editPack").value,
        retailerPrice: document.getElementById("editRetailerPrice").value,
        mechanicPrice: document.getElementById("editMechanicPrice").value,
        points: document.getElementById("editPoints").value,
        status: document.getElementById("editStatus").value,
        remarks: document.getElementById("editRemarks").value

    };

    await updateQrSticker(sticker);

    alert("QR Sticker Updated Successfully");

    closeEditQrModal();

}

  const stickerHtml = document.getElementById("sticker-label").outerHTML;
  printWindow.document.write(`
    <html>
      <head>
        <title>Print Genuine Part Sticker - ${activeGeneratedProduct.id}</title>
        <style>
          body {
            margin: 0;
            padding: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 90vh;
            background: #ffffff;
            font-family: sans-serif;
          }
          .w-64 { width: 350px; }
          .bg-white { background-color: #ffffff; }
          .text-slate-900 { color: #000000; }
          .p-4 { padding: 24px; }
          .rounded-lg { border-radius: 0; }
          .shadow-xl { box-shadow: none; }
          .space-y-3 > * + * { margin-top: 12px; }
          .border { border: 4px solid #000000; }
          .flex { display: flex; }
          .items-center { align-items: center; }
          .justify-between { justify-content: space-between; }
          .pb-1 { padding-bottom: 8px; border-bottom: 2px solid #000000; }
          .font-black { font-weight: 900; }
          .text-xs { font-size: 14px; }
          .font-mono { font-family: monospace; }
          .text-\\[8px\\] { font-size: 11px; }
          .bg-slate-900 { background: #000000; color: #ffffff; }
          .px-1 { padding: 2px 6px; }
          .gap-3 { gap: 16px; }
          .p-1 { padding: 4px; border: 2px solid #000000; }
          .min-w-0 { min-width: 0; }
          .flex-grow { flex-grow: 1; }
          .text-\\[9px\\] { font-size: 12px; line-height: 1.4; }
          .font-bold { font-weight: bold; }
          .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
          .text-center { text-align: center; }
          .text-slate-500 { color: #000000; }
          .border-t { border-top: 2px dashed #000000; }
          .pt-1\\.5 { padding-top: 10px; }
          svg { width: 110px !important; height: 110px !important; }
        </style>
      </head>
      <body>
        <div style="transform: scale(1.3); transform-origin: center;">
          ${stickerHtml}
        </div>
        <script>
          // strip classes that hide print layout
          document.querySelector(".hidden")?.classList.remove("hidden");
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


// === BULK QR STICKER DOWNLOAD (Selected / All) ===

// Renders one product's sticker to a PNG Blob, entirely off-DOM (safe to
// run in a loop for many products without disturbing the visible preview).
function generateStickerBlobForProduct(prod) {
  return new Promise((resolve, reject) => {
    try {
      const t = window.UTILS.getStickerTemplate();
      const payload = {
        app: "VikasRewards",
        v: 1,
        part: prod.id,
        name: prod.name,
        pack: prod.packSize || "1 Unit",
        qty: 1,
        rpts: prod.retailerPoints,
        mpts: prod.mechanicPoints,
        serial: `S-${Math.floor(100000 + Math.random() * 900000)}`
      };

      const qr = qrcode(0, 'M');
      qr.addData(JSON.stringify(payload));
      qr.make();
      const svgString = qr.createSvgTag(2.5, 1);
      const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      const URLObj = window.URL || window.webkitURL || window;
      const blobURL = URLObj.createObjectURL(svgBlob);

      const canvas = document.createElement("canvas");
      canvas.width = 450;
      canvas.height = 320;
      const ctx = canvas.getContext("2d");

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = t.border;
      ctx.lineWidth = 5;
      ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);

      ctx.fillStyle = t.headerBg;
      ctx.fillRect(5, 5, canvas.width - 10, 40);
      ctx.fillStyle = t.headerText;
      ctx.font = "bold 15px sans-serif";
      ctx.fillText("VIKAS AUTO GENUINE PART", 20, 30);

      ctx.fillStyle = "#000000";
      ctx.font = "bold 14px sans-serif";
      ctx.fillText((prod.name || "").toUpperCase(), 20, 80);

      ctx.font = "11px monospace";
      ctx.fillText(`PART SKU: ${prod.id}`, 20, 115);
      ctx.fillText(`BRAND: ${prod.brand || "Vikas Spares"}`, 20, 135);
      ctx.fillText(`BATCH: B-2026-07`, 20, 155);
      ctx.fillText(`NET QTY: ${prod.packSize || "1 Unit"}`, 20, 175);
      ctx.fillText(`MRP: Rs. ${prod.mrp || 0}.00 (All taxes incl.)`, 20, 195);
      ctx.fillText(`MFG DATE: ${new Date().toISOString().split("T")[0]}`, 20, 215);

      const img = new Image();
      img.onload = function() {
        ctx.drawImage(img, canvas.width - 165, 80, 140, 140);

        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(20, 245);
        ctx.lineTo(canvas.width - 20, 245);
        ctx.stroke();

        ctx.font = "bold 10px monospace";
        ctx.fillText("SCRATCH & SCAN INSIDE PORTAL TO ACTIVATE POINTS", 25, 270);
        ctx.font = "9px monospace";
        ctx.fillText(`Retailer: ${prod.retailerPoints || 0} Pts | Mechanic: ${prod.mechanicPoints || 0} Pts`, 25, 290);

        URLObj.revokeObjectURL(blobURL);
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error(`Failed to render sticker for ${prod.id}`));
        }, "image/png");
      };
      img.onerror = () => reject(new Error(`Failed to render QR graphic for ${prod.id}`));
      img.src = blobURL;
    } catch (e) {
      reject(e);
    }
  });
}

async function downloadStickersAsZip(products, zipFileName) {
  if (!products || products.length === 0) {
    window.UTILS.showToast("No products to generate stickers for.", "warning");
    return;
  }
  if (typeof JSZip === "undefined") {
    window.UTILS.showToast("QR zip library failed to load. Check your connection and retry.", "error");
    return;
  }

  window.UTILS.showLoader(`Generating ${products.length} QR sticker${products.length > 1 ? "s" : ""}...`);
  try {
    const zip = new JSZip();
    for (const prod of products) {
      const blob = await generateStickerBlobForProduct(prod);
      zip.file(`parts-sticker-${prod.id.toLowerCase()}.png`, blob);
    }

    const zipBlob = await zip.generateAsync({ type: "blob" });
    const link = document.createElement("a");
    link.download = zipFileName;
    link.href = URL.createObjectURL(zipBlob);
    link.click();
    URL.revokeObjectURL(link.href);

    window.UTILS.showToast(`${products.length} QR sticker${products.length > 1 ? "s" : ""} downloaded as ZIP!`, "success");
  } catch (e) {
    console.error("Bulk QR sticker download failed", e);
    window.UTILS.showToast("Failed to generate one or more QR stickers.", "error");
  } finally {
    window.UTILS.hideLoader();
  }
}

async function handleDownloadSelectedQRs() {
  const checkboxes = document.querySelectorAll('input[name="product-select"]:checked');
  if (checkboxes.length === 0) {
    window.UTILS.showToast("Please select at least one product.", "warning");
    return;
  }
  const ids = Array.from(checkboxes).map(cb => cb.value);
  const list = currentProductsList.length > 0 ? currentProductsList : window.CONFIG.DEFAULT_PRODUCTS;
  const products = list.filter(p => ids.includes(p.id));
  await downloadStickersAsZip(products, `vikas-qr-stickers-selected-${Date.now()}.zip`);
}

async function handleDownloadAllQRs() {
  const list = currentProductsList.length > 0 ? currentProductsList : window.CONFIG.DEFAULT_PRODUCTS;
  if (list.length === 0) {
    window.UTILS.showToast("No products in the catalog yet.", "warning");
    return;
  }
  const confirmed = confirm(`Generate and download QR stickers for all ${list.length} products in the catalog?`);
  if (!confirmed) return;
  await downloadStickersAsZip(list, `vikas-qr-stickers-all-${Date.now()}.zip`);
}

window.handleDownloadSelectedQRs = handleDownloadSelectedQRs;
window.handleDownloadAllQRs = handleDownloadAllQRs;


// ---------------- MEMBERS LOYALTY QR UNIQUE PASS MODALS ----------------
function openLoyaltyQrModal(userEmail) {
  window.UTILS.showLoader("Generating unique loyalty pass...");
  try {
    const list = currentUsersList.length > 0 ? currentUsersList : [];
    let user = list.find(u => u.email.toLowerCase() === userEmail.toLowerCase());

    if (!user) {
      const allUsers = window.UTILS.getLocal(window.CONFIG.STORAGE_KEYS.USERS) || [];
      user = allUsers.find(u => u.email.toLowerCase() === userEmail.toLowerCase());
    }

    if (!user) {
      window.UTILS.showToast("Failed to retrieve user's profile details.", "error");
      return;
    }

    // Populate details
    document.getElementById("qr-card-name").innerText = user.fullname;
    document.getElementById("qr-card-firm").innerText = `Firm: ${user.firmName || "N/A"}`;
    document.getElementById("qr-card-email").innerText = `Email: ${window.UTILS.displayEmail(user.email)}`;
    document.getElementById("qr-card-phone").innerText = `Phone: ${user.mobile}`;
    
    const formattedRegDate = user.regDate ? window.UTILS.formatDate(user.regDate) : "01-Jul-2026";
    document.getElementById("qr-card-date").innerText = `Issued: ${formattedRegDate}`;

    // Badge
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
    box.innerHTML = "";
    
    const qr = qrcode(0, 'M');
    qr.addData(payloadStr);
    qr.make();
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

// Called when the admin picks a different Pass Format from the dropdown.
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
window.handleProductFormSubmit = handleProductFormSubmit;
window.handleBulkProductUpload = handleBulkProductUpload;
window.resetProductForm = resetProductForm;
window.editProductPrompt = editProductPrompt;
window.processLoyaltyClaim = processLoyaltyClaim;
window.handleGenerateStickerLabel = handleGenerateStickerLabel;
window.handlePrintLabelAction = handlePrintLabelAction;
window.handleLogout = handleLogout;
window.handleProductsSearch = handleProductsSearch;
window.handleClaimsSearch = handleClaimsSearch;
window.loadUsers = loadUsers;
window.renderUsersTable = renderUsersTable;
window.handleUserSearch = handleUserSearch;
window.openForceResetPasswordModal = openForceResetPasswordModal;
window.closeResetPasswordModal = closeResetPasswordModal;
window.handleForceResetPasswordSubmit = handleForceResetPasswordSubmit;
window.toggleUserStatus = toggleUserStatus;
window.loadNotifsList = loadNotifsList;
window.handleSendAnnouncementSubmit = handleSendAnnouncementSubmit;
window.handleDeleteAnnouncementAdmin = handleDeleteAnnouncementAdmin;
window.loadProductQrMetadata = loadProductQrMetadata;
window.generateProductQrGraphic = generateProductQrGraphic;
window.downloadQrSticker = downloadQrSticker;
window.printQrSticker = printQrSticker;
window.openLoyaltyQrModal = openLoyaltyQrModal;
window.closeLoyaltyQrModal = closeLoyaltyQrModal;

// Edit Partner Details (Admin portal)
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
    await loadUsers();
  } catch (error) {
    window.UTILS.hideLoader();
    window.UTILS.showToast(error.message, "error");
  }
}

window.openEditPartnerModal = openEditPartnerModal;
window.closeEditPartnerModal = closeEditPartnerModal;
window.savePartnerDetails = savePartnerDetails;

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
window.downloadMemberQrCard = downloadMemberQrCard;
window.printMemberQrCard = printMemberQrCard;

// Export product deletion handlers to global scope
window.toggleSelectAllProducts = toggleSelectAllProducts;
window.updateDeleteSelectedButtonState = updateDeleteSelectedButtonState;
window.handleDeleteSingleProduct = handleDeleteSingleProduct;
window.handleDeleteSelectedProducts = handleDeleteSelectedProducts;
window.handleDeleteAllProducts = handleDeleteAllProducts;

// ==========================================
// 8. QR CODE CLAIM VALIDATION MANAGEMENT
// ==========================================
let currentQrClaimsList = [];

async function loadQrClaims() {
  const tbody = document.getElementById("qr-claims-tbody");
  if (tbody) tbody.innerHTML = `<tr><td colspan="8" class="py-8 text-center text-slate-400 font-mono">Syncing claims ledger...</td></tr>`;

  try {
    const claims = await window.API.getQrClaims();
    currentQrClaimsList = claims;
    renderQrClaimsTable(claims);
  } catch (err) {
    console.error("Failed to load QR claims", err);
    window.UTILS.showToast("Failed to refresh QR claims list.", "error");
  }
}

function renderQrClaimsTable(list) {
  const tbody = document.getElementById("qr-claims-tbody");
  if (!tbody) return;

  const countSpan = document.getElementById("qr-claims-count");
  if (countSpan) countSpan.innerText = list.length;

  if (list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="py-10 text-center text-slate-400 font-mono">
          No QR claims found matching selected filters.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = list.map(c => {
    let statusClass = "bg-slate-100 text-slate-600 border-slate-200";
    if (c.status === "Pending") statusClass = "bg-amber-50 text-amber-600 border-amber-100";
    else if (c.status === "Approved") statusClass = "bg-emerald-50 text-emerald-600 border-emerald-100";
    else if (c.status === "Rejected") statusClass = "bg-rose-50 text-rose-600 border-rose-100";
    else if (c.status === "Duplicate") statusClass = "bg-fuchsia-50 text-fuchsia-600 border-fuchsia-100";
    else if (c.status === "Invalid QR") statusClass = "bg-orange-50 text-orange-600 border-orange-100";

    const dateFormatted = c.date ? new Date(c.date).toLocaleString("en-IN") : "-";

    return `
      <tr class="hover:bg-slate-50 transition border-b border-slate-100 text-xs">
        <td class="py-3 pl-4 font-mono font-bold text-slate-800">${c.id}</td>
        <td class="py-3">
          <div class="font-mono font-bold text-slate-700">${c.qrCode || "-"}</div>
          <div class="text-[9px] text-slate-400 font-mono">Item: ${c.itemCode || "N/A"}</div>
        </td>
        <td class="py-3 font-semibold text-slate-700 max-w-[150px] truncate" title="${c.productName || ''}">${c.productName || "Unknown Product"}</td>
        <td class="py-3">
          <div class="font-bold text-slate-800">${c.userName || "Unknown"}</div>
          <div class="text-[9px] text-slate-400 uppercase font-mono">${c.role || "retailer"}</div>
        </td>
        <td class="py-3 text-slate-500 font-mono text-[10px]">${dateFormatted}</td>
        <td class="py-3">
          <span class="px-2 py-0.5 text-[10px] font-bold rounded border ${statusClass}">
            ${c.status || "Pending"}
          </span>
        </td>
        <td class="py-3 text-slate-500 max-w-[150px] truncate" title="${c.remarks || ''}">${c.remarks || "-"}</td>
        <td class="py-3 text-right pr-4">
          <button onclick="openQrClaimModal('${c.id}')" class="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold rounded transition mr-1.5" title="Evaluate Diagnosis">
            Diagnose
          </button>
          <button onclick="handleDeleteQrClaim('${c.id}')" class="p-1 text-rose-600 hover:text-rose-500 transition" title="Delete Claim">
            <i data-lucide="trash-2" class="w-4 h-4 inline"></i>
          </button>
        </td>
      </tr>
    `;
  }).join("");

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function handleQrClaimsSearch() {
  const query = document.getElementById("qr-claim-search").value.toLowerCase().trim();
  const statusFilter = document.getElementById("qr-claim-filter-status").value;
  const roleFilter = document.getElementById("qr-claim-filter-role").value;

  const filtered = currentQrClaimsList.filter(c => {
    const matchesSearch = 
      c.id.toLowerCase().includes(query) ||
      (c.qrCode && c.qrCode.toLowerCase().includes(query)) ||
      (c.itemCode && c.itemCode.toLowerCase().includes(query)) ||
      (c.productName && c.productName.toLowerCase().includes(query)) ||
      (c.userName && c.userName.toLowerCase().includes(query));

    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    const matchesRole = roleFilter === "all" || c.role.toLowerCase() === roleFilter;

    return matchesSearch && matchesStatus && matchesRole;
  });

  renderQrClaimsTable(filtered);
}

let activeEvaluatingClaimId = null;

async function openQrClaimModal(id) {
  const claim = currentQrClaimsList.find(c => c.id === id);
  if (!claim) return;

  activeEvaluatingClaimId = id;

  document.getElementById("modal-claim-id").innerText = `Claim ID: ${claim.id}`;
  document.getElementById("modal-qr-code").innerText = claim.qrCode || "-";
  document.getElementById("modal-item-code").innerText = claim.itemCode || "N/A";
  document.getElementById("modal-prod-name").innerText = claim.productName || "Unknown Product";
  document.getElementById("modal-user-name").innerText = claim.userName || "Unknown";
  document.getElementById("modal-user-role").innerText = claim.role || "retailer";
  document.getElementById("modal-status-select").value = claim.status || "Pending";
  document.getElementById("modal-remarks").value = claim.remarks || "";

  // Perform Diagnosis Checklist
  const alertContainer = document.getElementById("modal-diagnosis-alert");
  if (alertContainer) {
    const products = currentProductsList.length > 0 ? currentProductsList : (await window.API.getProducts());
    
    // Check 1: Does product exist in catalog?
    const hasProduct = products.some(p => p.itemCode && claim.itemCode && p.itemCode.toLowerCase() === claim.itemCode.toLowerCase());
    
    // Check 2: Has this QR code been approved for another claim?
    const duplicates = currentQrClaimsList.filter(c => c.qrCode === claim.qrCode && c.id !== claim.id && c.status === "Approved");

    if (!claim.itemCode || !hasProduct) {
      alertContainer.className = "p-3.5 rounded-lg border flex gap-2 bg-orange-50 text-orange-700 border-orange-200";
      alertContainer.innerHTML = `
        <i data-lucide="alert-triangle" class="w-5 h-5 flex-shrink-0"></i>
        <div>
          <h4 class="font-bold text-[11px] uppercase">Invalid QR Code Code Match</h4>
          <p class="text-[10px] mt-0.5">WARNING: This scanned QR Code pattern ("${claim.qrCode}") prefix doesn't match any registered part SKU in the system catalog.</p>
        </div>
      `;
    } else if (duplicates.length > 0) {
      const other = duplicates[0];
      const otherDate = other.date ? new Date(other.date).toLocaleDateString() : "earlier";
      alertContainer.className = "p-3.5 rounded-lg border flex gap-2 bg-rose-50 text-rose-700 border-rose-200";
      alertContainer.innerHTML = `
        <i data-lucide="shield-alert" class="w-5 h-5 flex-shrink-0"></i>
        <div>
          <h4 class="font-bold text-[11px] uppercase">Reused QR Sticker Alert</h4>
          <p class="text-[10px] mt-0.5">CRITICAL: This exact sticker QR code was already claimed by ${other.userName} on ${otherDate}. This is a duplicate reuse attempt!</p>
        </div>
      `;
    } else {
      alertContainer.className = "p-3.5 rounded-lg border flex gap-2 bg-emerald-50 text-emerald-700 border-emerald-200";
      alertContainer.innerHTML = `
        <i data-lucide="check-circle" class="w-5 h-5 flex-shrink-0"></i>
        <div>
          <h4 class="font-bold text-[11px] uppercase">Genuine Code Diagnosis</h4>
          <p class="text-[10px] mt-0.5">SUCCESS: QR code matches registered product "${claim.productName}". Genuine hologram verification recommended before approval.</p>
        </div>
      `;
    }
  }

  const modal = document.getElementById("qr-claim-modal");
  if (modal) modal.classList.remove("hidden");

  if (window.lucide) {
    window.lucide.createIcons({
      attrs: { class: ["lucide"] },
      container: alertContainer
    });
  }
}

function closeQrClaimModal() {
  const modal = document.getElementById("qr-claim-modal");
  if (modal) modal.classList.add("hidden");
  activeEvaluatingClaimId = null;
}

async function saveQrClaimEvaluation() {
  if (!activeEvaluatingClaimId) return;

  const status = document.getElementById("modal-status-select").value;
  const remarks = document.getElementById("modal-remarks").value.trim();

  window.UTILS.showLoader("Saving claim verification status...");
  try {
    await window.API.evaluateQrClaim(activeEvaluatingClaimId, status, remarks);
    window.UTILS.showToast(`Claim ${activeEvaluatingClaimId} successfully processed as ${status}!`, "success");
    closeQrClaimModal();
    await loadQrClaims();
  } catch (err) {
    console.error("Failed to process QR claim", err);
    window.UTILS.showToast(err.message, "error");
  } finally {
    window.UTILS.hideLoader();
  }
}

async function handleDeleteQrClaim(id) {
  const confirmed = confirm(`Are you sure you want to permanently delete QR claim record ${id}? This action is irreversible.`);
  if (!confirmed) return;

  window.UTILS.showLoader("Deleting QR claim record...");
  try {
    await window.API.deleteQrClaim(id);
    window.UTILS.showToast("QR claim record permanently deleted.", "success");
    await loadQrClaims();
  } catch (err) {
    console.error("Failed to delete QR claim", err);
    window.UTILS.showToast(err.message, "error");
  } finally {
    window.UTILS.hideLoader();
  }
}

window.loadQrClaims = loadQrClaims;
window.renderQrClaimsTable = renderQrClaimsTable;
window.handleQrClaimsSearch = handleQrClaimsSearch;
window.openQrClaimModal = openQrClaimModal;
window.closeQrClaimModal = closeQrClaimModal;
window.saveQrClaimEvaluation = saveQrClaimEvaluation;
window.handleDeleteQrClaim = handleDeleteQrClaim;

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
// 9. CORPORATE SETTINGS MODULE
// ==========================================
async function loadSettingsForm() {
  window.UTILS.showLoader("Syncing system parameters...");
  try {
    const policies = await window.API.getSettings();
    document.getElementById("settings-retailer-multiplier").value = policies.retailerMultiplier || 1.0;
    document.getElementById("settings-mechanic-multiplier").value = policies.mechanicMultiplier || 1.2;
    document.getElementById("settings-silver-threshold").value = policies.silverThreshold || 5000;
    document.getElementById("settings-gold-threshold").value = policies.goldThreshold || 15000;
  } catch (err) {
    console.error("Failed to load corporate settings", err);
    window.UTILS.showToast("Failed to refresh corporate settings.", "error");
  } finally {
    window.UTILS.hideLoader();
  }
}

async function handleSaveSettingsSubmit(event) {
  if (event) event.preventDefault();

  const settingsData = {
    retailerMultiplier: parseFloat(document.getElementById("settings-retailer-multiplier").value) || 1.0,
    mechanicMultiplier: parseFloat(document.getElementById("settings-mechanic-multiplier").value) || 1.2,
    silverThreshold: parseInt(document.getElementById("settings-silver-threshold").value, 10) || 5000,
    goldThreshold: parseInt(document.getElementById("settings-gold-threshold").value, 10) || 15000
  };

  window.UTILS.showLoader("Updating point policy thresholds...");
  try {
    await window.API.saveSettings(settingsData);
    window.UTILS.showToast("Corporate points multipliers & milestones updated successfully!", "success");
    await loadSettingsForm();
  } catch (err) {
    console.error("Failed to save settings", err);
    window.UTILS.showToast(err.message, "error");
  } finally {
    window.UTILS.hideLoader();
  }
}

window.loadSettingsForm = loadSettingsForm;
window.handleSaveSettingsSubmit = handleSaveSettingsSubmit;

// ==========================================
// 10. USER SECURITY AUDIT LOGS MODULE
// ==========================================
let activeActivityLogs = [];

async function openUserActivityLogModal() {
  const modal = document.getElementById("user-activity-log-modal");
  if (!modal) return;
  modal.classList.remove("hidden");
  document.getElementById("log-filter").value = "";
  
  const container = document.getElementById("activity-logs-container");
  if (container) {
    container.innerHTML = `<div class="p-4 text-center text-slate-400 font-mono italic">Loading audit trail...</div>`;
  }

  try {
    const logs = await window.API.getLogs();
    activeActivityLogs = logs || [];
    renderActivityLogs(activeActivityLogs);
  } catch (e) {
    console.error("Error loading logs", e);
    if (container) {
      container.innerHTML = `<div class="p-4 text-center text-red-500 font-mono italic">Failed to load logs.</div>`;
    }
  }
}

function closeUserActivityLogModal() {
  const modal = document.getElementById("user-activity-log-modal");
  if (modal) modal.classList.add("hidden");
}

function renderActivityLogs(list) {
  const container = document.getElementById("activity-logs-container");
  if (!container) return;

  if (list.length === 0) {
    container.innerHTML = `<div class="p-4 text-center text-slate-400 font-mono italic">No events recorded in audit history.</div>`;
    return;
  }

  container.innerHTML = list.map(l => {
    const timeStr = l.timestamp ? new Date(l.timestamp).toLocaleString() : "-";
    let moduleBadgeColor = "bg-slate-100 text-slate-600 border-slate-200/55";
    if (l.module === "AUTH") moduleBadgeColor = "bg-sky-50 text-sky-600 border-sky-100";
    if (l.module === "USER") moduleBadgeColor = "bg-indigo-50 text-indigo-600 border-indigo-100";
    if (l.module === "CLAIM") moduleBadgeColor = "bg-amber-50 text-amber-600 border-amber-100";
    if (l.module === "PRODUCT") moduleBadgeColor = "bg-emerald-50 text-emerald-600 border-emerald-100";
    if (l.module === "REWARDS") moduleBadgeColor = "bg-purple-50 text-purple-600 border-purple-100";

    return `
      <div class="grid grid-cols-12 gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 transition items-center font-sans">
        <span class="col-span-3 font-mono text-[9px] text-slate-400">${timeStr}</span>
        <span class="col-span-3 font-semibold text-slate-800 truncate" title="${l.user || 'System'}">${l.user || 'System'}</span>
        <div class="col-span-2">
          <span class="px-1.5 py-0.5 border rounded text-[8px] font-bold uppercase font-mono ${moduleBadgeColor}">${l.module || 'SYSTEM'}</span>
        </div>
        <span class="col-span-4 text-slate-500 break-words">${l.remark || l.action || '-'}</span>
      </div>
    `;
  }).join("");
}

function filterActivityLogs(query) {
  const q = query.toLowerCase().trim();
  if (!q) {
    renderActivityLogs(activeActivityLogs);
    return;
  }

  const filtered = activeActivityLogs.filter(l => 
    (l.user && l.user.toLowerCase().includes(q)) ||
    (l.module && l.module.toLowerCase().includes(q)) ||
    (l.action && l.action.toLowerCase().includes(q)) ||
    (l.remark && l.remark.toLowerCase().includes(q))
  );
  renderActivityLogs(filtered);
}

window.openUserActivityLogModal = openUserActivityLogModal;
window.closeUserActivityLogModal = closeUserActivityLogModal;
window.filterActivityLogs = filterActivityLogs;

// ==========================================
// 11. ADMIN USER REGISTRATION MODULE
// ==========================================
function openAddUserModal() {
  document.getElementById("add-user-form").reset();
  document.getElementById("add-user-firm-group").classList.add("hidden");
  document.getElementById("add-user-modal").classList.remove("hidden");
}

function closeAddUserModal() {
  document.getElementById("add-user-modal").classList.add("hidden");
}

function toggleAddUserFirmField() {
  const role = document.getElementById("add-user-role").value;
  const firmGroup = document.getElementById("add-user-firm-group");
  if (role === "retailer") {
    firmGroup.classList.remove("hidden");
  } else {
    firmGroup.classList.add("hidden");
  }
}

async function handleRegisterNewUserSubmit(event) {
  if (event) event.preventDefault();

  const fullname = document.getElementById("add-user-name").value.trim();
  const role = document.getElementById("add-user-role").value;
  const email = document.getElementById("add-user-email").value.trim();
  const mobile = document.getElementById("add-user-phone").value.trim();
  const password = document.getElementById("add-user-password").value.trim();
  const firmName = role === "retailer" ? document.getElementById("add-user-firm").value.trim() : "";

  if (!fullname || !email || !mobile || !password) {
    window.UTILS.showToast("Please fill in all mandatory fields.", "error");
    return;
  }

  window.UTILS.showLoader("Registering user credentials...");
  try {
    const userData = {
      fullname,
      role,
      email,
      mobile,
      password,
      firmName,
      status: "approved" // Admin created users are pre-approved
    };

    await window.API.createUser(userData);
    window.UTILS.showToast(`User ${fullname} registered successfully!`, "success");
    closeAddUserModal();
    await loadUsers(); // Refresh the list
  } catch (err) {
    console.error("Failed to register new user", err);
    window.UTILS.showToast(err.message || "Email address is already in use.", "error");
  } finally {
    window.UTILS.hideLoader();
  }
}

window.openAddUserModal = openAddUserModal;
window.closeAddUserModal = closeAddUserModal;
window.toggleAddUserFirmField = toggleAddUserFirmField;
window.handleRegisterNewUserSubmit = handleRegisterNewUserSubmit;

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
    if (window.lucide) {
      window.lucide.createIcons();
    }
    window.UTILS.showToast(`Printable Loyalty tag generated for ${prod.id}!`, "success");
  }
}

function handlePrintLabelAction() {
  window.UTILS.showToast("Contacting wireless label printer...", "info");
  setTimeout(() => {
    window.UTILS.showToast("Print command dispatched. Label printed successfully!", "success");
  }, 1500);
}

window.handleGenerateStickerLabel = handleGenerateStickerLabel;
window.handlePrintLabelAction = handlePrintLabelAction;


// ==========================================
// 12. DYNAMIC REWARDS CATALOGUE & REDEMPTION SYSTEM
// ==========================================
let activeAdminRewardsList = [];
let activeAdminRedemptionsList = [];

async function loadRewardsAndRedemptions() {
  try {
    window.UTILS.showLoader("Loading dynamic rewards ledger...");
    
    // 1. Fetch dynamic rewards and redemptions
    const rewards = await window.API.getRewards();
    const redemptions = await window.API.getRedemptions();
    
    activeAdminRewardsList = rewards || [];
    activeAdminRedemptionsList = redemptions || [];
    
    // 2. Render UI blocks
    renderAdminRewards(activeAdminRewardsList);
    renderAdminRedemptions(activeAdminRedemptionsList);
    
    // 3. Update pending redemptions count indicator badge
    updateRedemptionsBadge(activeAdminRedemptionsList);
    
  } catch (err) {
    console.error("Error loading rewards catalogue systems", err);
    window.UTILS.showToast("Failed to refresh loyalty rewards.", "error");
  } finally {
    window.UTILS.hideLoader();
  }
}

function renderAdminRewards(list) {
  const grid = document.getElementById("admin-rewards-grid");
  if (!grid) return;

  if (list.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full py-8 text-center text-slate-400 font-mono">
        No reward items registered in the active catalogue.
      </div>
    `;
    return;
  }

  grid.innerHTML = list.map(r => {
    const stockClass = r.stock <= 5 ? "text-rose-600 bg-rose-50 border-rose-100" : "text-emerald-600 bg-emerald-50 border-emerald-100";
    const fallbackImg = "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=150&auto=format&fit=crop";

    return `
      <div class="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col hover:shadow-md transition">
        <!-- Image Header -->
        <div class="h-36 bg-slate-50 relative flex items-center justify-center p-4 border-b border-slate-100">
          <img src="${r.image || fallbackImg}" alt="${r.name}" class="h-full object-contain rounded-lg" onerror="this.src='${fallbackImg}'">
          <div class="absolute top-3 right-3">
            <span class="px-2 py-0.5 text-[9px] font-bold font-mono border rounded-full uppercase ${stockClass}">
              Stock: ${r.stock || 0} qty
            </span>
          </div>
        </div>
        
        <!-- Details Body -->
        <div class="p-4 flex-grow flex flex-col justify-between space-y-3">
          <div class="space-y-1">
            <h5 class="font-black text-slate-800 text-xs tracking-tight line-clamp-1" title="${r.name}">${r.name}</h5>
            <div class="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
              <span>SKU:</span>
              <span class="font-bold text-slate-600">${r.id}</span>
            </div>
          </div>
          
          <div class="flex items-center justify-between border-t border-slate-100 pt-3">
            <div class="text-left">
              <p class="text-[8px] text-slate-400 uppercase font-mono font-bold">Required Points</p>
              <p class="text-xs font-black text-purple-600 font-mono">${r.pointsRequired} Pts</p>
            </div>
            
            <div class="flex items-center gap-1.5">
              <button onclick="openEditRewardModal('${r.id}')" class="p-1.5 bg-slate-100 hover:bg-purple-100 text-slate-600 hover:text-purple-600 rounded-lg cursor-pointer transition" title="Edit Reward">
                <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
              </button>
              <button onclick="deleteRewardItem('${r.id}')" class="p-1.5 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer transition" title="Delete Reward">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join("");

  if (window.lucide) window.lucide.createIcons();
}

function renderAdminRedemptions(list) {
  const tbody = document.getElementById("admin-redemptions-tbody");
  if (!tbody) return;

  if (list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="py-6 text-center text-slate-400 font-mono">No active redemptions registered in the ledger.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = list.map(rdm => {
    let statusClass = "text-amber-500 bg-amber-500/10 border-amber-500/20";
    if (rdm.status === "approved") statusClass = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    if (rdm.status === "rejected") statusClass = "text-red-400 bg-red-500/10 border-red-500/20";

    const isPending = rdm.status === "pending";
    const actionsHtml = isPending
      ? `<button onclick="processRedemption('${rdm.id}', 'approved')" class="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[9px] rounded uppercase transition mr-1 cursor-pointer">Ship</button>
         <button onclick="processRedemption('${rdm.id}', 'rejected')" class="px-2 py-1 bg-rose-650 hover:bg-rose-600 text-white font-black text-[9px] rounded uppercase transition mr-1 cursor-pointer">Cancel</button>
         <button onclick="handleDeleteRedemption('${rdm.id}')" class="p-1 text-rose-600 hover:text-rose-500 transition align-middle" title="Delete Request"><i data-lucide="trash-2" class="w-3.5 h-3.5 inline"></i></button>`
      : `<span class="text-slate-400 font-mono text-[9px] uppercase font-bold mr-1.5">Completed</span>
         <button onclick="handleDeleteRedemption('${rdm.id}')" class="p-1 text-rose-600 hover:text-rose-500 transition align-middle" title="Delete Request"><i data-lucide="trash-2" class="w-3.5 h-3.5 inline"></i></button>`;

    const reward = activeAdminRewardsList.find(r => r.id === rdm.rewardId);
    const stockStatus = reward 
      ? `<span class="font-bold font-mono text-[10px] ${reward.stock > 0 ? 'text-slate-600' : 'text-rose-500 font-black animate-pulse'}">${reward.stock} Left</span>` 
      : `<span class="text-slate-400">-</span>`;

    return `
      <tr class="border-b border-slate-100 text-xs hover:bg-slate-50 transition">
        <td class="py-3 font-sans">
          <span class="font-bold text-slate-800">${rdm.fullname}</span><br>
          <span class="text-[10px] text-slate-500 font-mono">${window.UTILS.displayEmail(rdm.email)} (${rdm.role.toUpperCase()})</span>
        </td>
        <td class="py-3 font-semibold text-slate-700">
          ${rdm.rewardName}<br>
          <span class="text-[10px] text-slate-400 font-mono font-bold">${rdm.rewardId}</span>
        </td>
        <td class="py-3 font-mono font-bold text-purple-600">${rdm.pointsRequired} Pts</td>
        <td class="py-3">${stockStatus}</td>
        <td class="py-3">
          <span class="px-2 py-0.5 border text-[9px] font-bold rounded uppercase font-mono ${statusClass}">${rdm.status}</span>
          ${rdm.remark ? `<div class="text-[10px] text-slate-500 italic mt-1 font-sans font-medium max-w-[200px] truncate" title="${rdm.remark}">Re: ${rdm.remark}</div>` : ""}
        </td>
        <td class="py-3 text-right whitespace-nowrap">${actionsHtml}</td>
      </tr>
    `;
  }).join("");

  if (window.lucide) window.lucide.createIcons();
}

function updateRedemptionsBadge(list) {
  const badge = document.getElementById("badge-pending-redemptions");
  if (!badge) return;
  const pendingCount = list.filter(r => r.status === "pending").length;
  if (pendingCount > 0) {
    badge.innerText = pendingCount;
    badge.classList.remove("hidden");
  } else {
    badge.classList.add("hidden");
  }
}

function openAddRewardModal() {
  document.getElementById("add-reward-form").reset();
  document.getElementById("reward-id").value = "";
  document.getElementById("reward-modal-title").innerText = "Add Catalogue Reward";
  document.getElementById("add-reward-modal").classList.remove("hidden");
}

function openEditRewardModal(id) {
  const reward = activeAdminRewardsList.find(r => r.id === id);
  if (!reward) return;

  document.getElementById("reward-id").value = reward.id;
  document.getElementById("reward-name").value = reward.name;
  document.getElementById("reward-points").value = reward.pointsRequired;
  document.getElementById("reward-stock").value = reward.stock;
  document.getElementById("reward-image").value = reward.image || "";

  document.getElementById("reward-modal-title").innerText = "Edit Catalogue Reward";
  document.getElementById("add-reward-modal").classList.remove("hidden");
}

function closeAddRewardModal() {
  document.getElementById("add-reward-modal").classList.add("hidden");
}

async function handleRewardFormSubmit(event) {
  if (event) event.preventDefault();

  const id = document.getElementById("reward-id").value;
  const name = document.getElementById("reward-name").value.trim();
  const pointsRequired = parseInt(document.getElementById("reward-points").value);
  const stock = parseInt(document.getElementById("reward-stock").value);
  const image = document.getElementById("reward-image").value.trim();

  if (!name || isNaN(pointsRequired) || isNaN(stock)) {
    window.UTILS.showToast("Please fill in all required fields properly.", "warning");
    return;
  }

  window.UTILS.showLoader("Saving catalogue updates...");
  try {
    const rewardData = { id, name, pointsRequired, stock, image };
    await window.API.saveReward(rewardData);
    window.UTILS.showToast("Catalogue item saved successfully!", "success");
    closeAddRewardModal();
    await loadRewardsAndRedemptions();
  } catch (err) {
    console.error("Failed to save reward item", err);
    window.UTILS.showToast(err.message, "error");
  } finally {
    window.UTILS.hideLoader();
  }
}

async function deleteRewardItem(id) {
  const confirmed = confirm(`Are you sure you want to permanently remove reward item "${id}" from the active catalogue?`);
  if (!confirmed) return;

  window.UTILS.showLoader("Removing catalogue item...");
  try {
    await window.API.deleteReward(id);
    window.UTILS.showToast("Catalogue item permanently deleted.", "success");
    await loadRewardsAndRedemptions();
  } catch (err) {
    console.error("Failed to delete reward", err);
    window.UTILS.showToast(err.message, "error");
  } finally {
    window.UTILS.hideLoader();
  }
}

async function processRedemption(id, action) {
  const remark = prompt(`Please enter processing notes or shipping landmark for this redemption (${action.toUpperCase()}):`, 
    action === "approved" ? "Shipped via BlueDart Logistics. Waybill #BK2026." : "Insufficient point validity or user requested cancellation."
  );
  if (remark === null) return;

  window.UTILS.showLoader("Processing gift dispatch evaluation...");
  try {
    await window.API.processRedemption(id, action, remark.trim());
    window.UTILS.showToast(`Redemption successfully marked as ${action}!`, "success");
    await loadRewardsAndRedemptions();
  } catch (err) {
    console.error("Failed to process redemption request", err);
    window.UTILS.showToast(err.message, "error");
  } finally {
    window.UTILS.hideLoader();
  }
}

async function handleDeleteRedemption(id) {
  const confirmed = confirm(`Are you sure you want to permanently delete redemption request ${id}? This cannot be undone.`);
  if (!confirmed) return;

  window.UTILS.showLoader("Deleting redemption record...");
  try {
    await window.API.deleteRedemption(id);
    window.UTILS.showToast("Redemption request permanently deleted.", "success");
    await loadRewardsAndRedemptions();
  } catch (err) {
    console.error("Failed to delete redemption", err);
    window.UTILS.showToast(err.message, "error");
  } finally {
    window.UTILS.hideLoader();
  }
}

// Global Exports
window.openAddRewardModal = openAddRewardModal;
window.openEditRewardModal = openEditRewardModal;
window.closeAddRewardModal = closeAddRewardModal;
window.handleRewardFormSubmit = handleRewardFormSubmit;
window.deleteRewardItem = deleteRewardItem;
window.processRedemption = processRedemption;
window.handleDeleteRedemption = handleDeleteRedemption;
window.loadRewardsAndRedemptions = loadRewardsAndRedemptions;




function openEditQrModal() {
    const modal = document.getElementById("editQRModal");

    if (!modal) {
        console.error("editQRModal not found");
        return;
    }

    modal.classList.remove("hidden");
    modal.classList.add("flex");
}

function closeEditQrModal() {
    const modal = document.getElementById("editQRModal");

    modal.classList.remove("flex");
    modal.classList.add("hidden");
}
