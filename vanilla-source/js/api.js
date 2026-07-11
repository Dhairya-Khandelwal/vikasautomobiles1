/* Central Database Interface API Wrapper - Vikas Automobiles */

const API = {
  // Check if real GAS URL is specified, else execute stateful local db emulation
  isRealBackend: () => {
    return window.CONFIG && window.CONFIG.API_URL && window.CONFIG.API_URL.trim() !== "";
  },

  // Perform HTTP REST request
  request: async (action, payload = {}, method = "POST") => {
    const url = window.CONFIG.API_URL;
    try {
      const options = {
        method: "POST", // GAS Web Apps usually require POST for cross-origin payload transmissions
        mode: "cors",
        headers: {
          "Content-Type": "text/plain;charset=utf-8" // Bypass standard preflight options request on simple GAS setups
        },
        body: JSON.stringify({ action, ...payload })
      };
      
      const response = await fetch(url, options);
      if (!response.ok) throw new Error(`HTTP Status ${response.status}`);
      return await response.json();
    } catch (e) {
      console.error(`Backend REST API Call Failed: ${action}`, e);
      throw e;
    }
  },

  // State initialization / Database Seeding (Offline Emulator Mode)
  initLocalDatabase: () => {
    const keys = window.CONFIG.STORAGE_KEYS;
    
    // Seed System settings (Policies)
    if (!localStorage.getItem(keys.SETTINGS)) {
      window.UTILS.setLocal(keys.SETTINGS, window.CONFIG.DEFAULT_POLICIES);
    }

    // Seed Spare Parts Catalog
    if (!localStorage.getItem(keys.PRODUCTS)) {
      window.UTILS.setLocal(keys.PRODUCTS, window.CONFIG.DEFAULT_PRODUCTS);
    }

    // Seed announcements bulletins
    if (!localStorage.getItem(keys.BROADCASTS)) {
      window.UTILS.setLocal(keys.BROADCASTS, [
        {
          id: "AN-1",
          subject: "Loyalty Scheme Portal is LIVE!",
          body: "Welcome to Vikas Automobiles brand-new digital rewards portal. Start earning instant Paytm cashback and redeem premium workshop tools by scanning QR code stickers pasted on parts packages.",
          target: "all",
          channel: "all",
          date: new Date(Date.now() - 3600000 * 24 * 3).toISOString()
        }
      ]);
    }

    // Seed default administrative / testing accounts
    if (!localStorage.getItem(keys.USERS)) {
      const seedUsers = [
        {
          fullname: "Vikas Sethi",
          email: "owner@vikas.com",
          mobile: "9999999999",
          password: "owner123", // Pre-secured in plain string for instant preview testing
          role: "owner",
          status: "approved",
          firmName: "Vikas Corporate Head Office",
          address: "G-10, Auto Market, Hisar, Haryana",
          pincode: "125001",
          gstin: "06AAAAA1111A1Z1",
          panCard: "AAAAA1111A",
          points: 0,
          regDate: new Date(Date.now() - 3600000 * 24 * 10).toISOString(),
          photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop"
        },
        {
          fullname: "Suresh Sharma",
          email: "admin@vikas.com",
          mobile: "8888888888",
          password: "admin123",
          role: "admin",
          status: "approved",
          firmName: "Central Warehouse Hisar",
          address: "Plot 14, Industrial Area, Hisar, Haryana",
          pincode: "125005",
          gstin: "06BBBBB2222B2Z2",
          panCard: "BBBBB2222B",
          points: 0,
          regDate: new Date(Date.now() - 3600000 * 24 * 9).toISOString(),
          photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop"
        },
        {
          fullname: "Ramesh Kumar Retailer",
          email: "retailer@vikas.com",
          mobile: "9876543210",
          password: "retailer123",
          role: "retailer",
          status: "approved",
          firmName: "Ramesh Auto Spares",
          address: "Shop 5, Motor Market, Rohtak, Haryana",
          pincode: "124001",
          gstin: "06GSPRK1234A1Z0",
          panCard: "ASDFG1234H",
          points: 4800,
          regDate: new Date(Date.now() - 3600000 * 24 * 4).toISOString(),
          photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop"
        },
        {
          fullname: "Bala Bhai Mechanic",
          email: "mechanic@vikas.com",
          mobile: "9112233445",
          password: "mechanic123",
          role: "mechanic",
          status: "approved",
          firmName: "Bala Car Repairing Shop",
          address: "Opposite Bus Stand, Jind, Haryana",
          pincode: "126102",
          gstin: "",
          panCard: "",
          points: 1250,
          regDate: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
          photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop"
        },
        {
          fullname: "Naveen Gupta",
          email: "pending@vikas.com",
          mobile: "9416012345",
          password: "pending123",
          role: "retailer",
          status: "pending",
          firmName: "Gupta Motor Agency",
          address: "Auto Market, Sirsa, Haryana",
          pincode: "125055",
          gstin: "06GPINT5678B1Z9",
          panCard: "POIUY9876Q",
          points: 0,
          regDate: new Date().toISOString(),
          photo: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop"
        }
      ];
      window.UTILS.setLocal(keys.USERS, seedUsers);
    }

    // Seed default Point claims / Purchases scans
    if (!localStorage.getItem(keys.PURCHASES)) {
      const seedPurchases = [
        {
          id: "C-982736",
          email: "retailer@vikas.com",
          fullname: "Ramesh Kumar Retailer",
          role: "retailer",
          firmName: "Ramesh Auto Spares",
          productID: "P-001",
          productName: "Premium Front Disc Brake Pads (Set of 4)",
          quantity: 2,
          pointsCalculated: 240,
          status: "approved",
          date: new Date(Date.now() - 3600000 * 12).toISOString()
        },
        {
          id: "C-453627",
          email: "mechanic@vikas.com",
          fullname: "Bala Bhai Mechanic",
          role: "mechanic",
          firmName: "Bala Car Repairing Shop",
          productID: "P-003",
          productName: "Synthetic Premium Engine Oil 15W-40 5L",
          quantity: 1,
          pointsCalculated: 264, // 150 points * 1.2 mechanic policy multiplier * 1 quantity
          status: "pending",
          date: new Date().toISOString()
        }
      ];
      window.UTILS.setLocal(keys.PURCHASES, seedPurchases);
    }

    // Seed initial security audit logs
    if (!localStorage.getItem(keys.LOGS)) {
      window.UTILS.setLocal(keys.LOGS, [
        {
          timestamp: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
          tag: "SYS_INIT",
          text: "Vikas Automobiles Central Node database synchronisation completed successfully."
        },
        {
          timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
          tag: "SCAN_AUTH",
          text: "Retailer Ramesh Kumar scanned Brake Pads (P-001) for 240 Pts, approved by system."
        }
      ]);
    }
  },

  // 1. MEMBERS / USERS API ENDPOINTS
  getUsers: async () => {
    if (API.isRealBackend()) {
      return (await API.request("get_users")).data;
    }
    return window.UTILS.getLocal(window.CONFIG.STORAGE_KEYS.USERS);
  },

  createUser: async (userData) => {
    if (API.isRealBackend()) {
      return await API.request("create_user", { user: userData });
    }
    const users = window.UTILS.getLocal(window.CONFIG.STORAGE_KEYS.USERS);
    // Avoid duplicates
    if (users.find(u => u.email.toLowerCase() === userData.email.toLowerCase())) {
      throw new Error("This email address is already registered.");
    }
    users.push({
      ...userData,
      points: 0,
      status: userData.role === "admin" ? "approved" : "pending", // admin created by owner is auto-approved, member requires owner audit
      regDate: new Date().toISOString()
    });
    window.UTILS.setLocal(window.CONFIG.STORAGE_KEYS.USERS, users);
    
    // Log audit
    await API.addLog("USER_REG", `New ${userData.role} user profile registered: ${userData.fullname} (${userData.email})`);
    return { success: true };
  },

  updateUserStatus: async (email, status) => {
    if (API.isRealBackend()) {
      return await API.request("update_user_status", { email, status });
    }
    const users = window.UTILS.getLocal(window.CONFIG.STORAGE_KEYS.USERS);
    const userIndex = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
    if (userIndex !== -1) {
      users[userIndex].status = status;
      window.UTILS.setLocal(window.CONFIG.STORAGE_KEYS.USERS, users);
      await API.addLog("USER_MOD", `User profile ${email} state transitioned to: ${status.toUpperCase()}`);
      return { success: true };
    }
    throw new Error("User profile not found.");
  },

  updateUserPoints: async (email, pointsDelta) => {
    const users = window.UTILS.getLocal(window.CONFIG.STORAGE_KEYS.USERS);
    const userIndex = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
    if (userIndex !== -1) {
      users[userIndex].points = Math.max(0, (users[userIndex].points || 0) + pointsDelta);
      window.UTILS.setLocal(window.CONFIG.STORAGE_KEYS.USERS, users);
      
      // Update session if it's the current user
      const currentSession = window.UTILS.getLocal(window.CONFIG.STORAGE_KEYS.SESSION, null);
      if (currentSession && currentSession.email.toLowerCase() === email.toLowerCase()) {
        currentSession.points = users[userIndex].points;
        window.UTILS.setLocal(window.CONFIG.STORAGE_KEYS.SESSION, currentSession);
      }
      return { success: true };
    }
    throw new Error("User profile not found.");
  },

  forceResetPassword: async (email, newPassword) => {
    if (API.isRealBackend()) {
      return await API.request("force_reset_password", { email, newPassword });
    }
    const users = window.UTILS.getLocal(window.CONFIG.STORAGE_KEYS.USERS);
    const userIndex = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
    if (userIndex !== -1) {
      users[userIndex].password = newPassword;
      window.UTILS.setLocal(window.CONFIG.STORAGE_KEYS.USERS, users);
      await API.addLog("SEC_RESET", `Administrative password force reset completed for account: ${email}`);
      return { success: true };
    }
    throw new Error("User profile not found.");
  },


  // 2. PRODUCTS CATALOG API ENDPOINTS
  getProducts: async () => {
    if (API.isRealBackend()) {
      return (await API.request("get_products")).data;
    }
    return window.UTILS.getLocal(window.CONFIG.STORAGE_KEYS.PRODUCTS);
  },

  saveProduct: async (productData) => {
    if (API.isRealBackend()) {
      return await API.request("save_product", { product: productData });
    }
    const products = window.UTILS.getLocal(window.CONFIG.STORAGE_KEYS.PRODUCTS);
    const existingIndex = products.findIndex(p => p.id === productData.id);

    if (existingIndex !== -1) {
      // Edit
      products[existingIndex] = { ...products[existingIndex], ...productData };
      window.UTILS.setLocal(window.CONFIG.STORAGE_KEYS.PRODUCTS, products);
      await API.addLog("PROD_MOD", `Catalog Product Card edited: ${productData.name} (${productData.id})`);
    } else {
      // Add new
      const nextID = productData.id || `P-${Math.floor(100 + Math.random() * 900)}`;
      productData.id = nextID;
      products.push(productData);
      window.UTILS.setLocal(window.CONFIG.STORAGE_KEYS.PRODUCTS, products);
      await API.addLog("PROD_ADD", `New Spare Part product added: ${productData.name} (${nextID})`);
    }
    return { success: true };
  },

  adjustStock: async (id, quantityDelta) => {
    const products = window.UTILS.getLocal(window.CONFIG.STORAGE_KEYS.PRODUCTS);
    const index = products.findIndex(p => p.id === id);
    if (index !== -1) {
      products[index].stock = Math.max(0, (products[index].stock || 0) + quantityDelta);
      window.UTILS.setLocal(window.CONFIG.STORAGE_KEYS.PRODUCTS, products);
      return { success: true };
    }
    throw new Error("Product not found in catalog.");
  },


  // 3. POINT CLAIMS / PURCHASE SCANS API ENDPOINTS
  getPurchases: async () => {
    if (API.isRealBackend()) {
      return (await API.request("get_purchases")).data;
    }
    return window.UTILS.getLocal(window.CONFIG.STORAGE_KEYS.PURCHASES);
  },

  submitPurchaseClaim: async (claim) => {
    if (API.isRealBackend()) {
      return await API.request("submit_purchase_claim", { claim });
    }
    const purchases = window.UTILS.getLocal(window.CONFIG.STORAGE_KEYS.PURCHASES);
    purchases.unshift({
      id: window.UTILS.generateID("C"),
      status: "pending",
      date: new Date().toISOString(),
      ...claim
    });
    window.UTILS.setLocal(window.CONFIG.STORAGE_KEYS.PURCHASES, purchases);
    await API.addLog("SCAN_IN", `Point scan claim requested: ${claim.fullname} for ${claim.quantity}x of ${claim.productName}`);
    return { success: true };
  },

  processPurchaseClaim: async (claimID, status) => {
    if (API.isRealBackend()) {
      return await API.request("process_purchase_claim", { claimID, status });
    }
    const purchases = window.UTILS.getLocal(window.CONFIG.STORAGE_KEYS.PURCHASES);
    const index = purchases.findIndex(c => c.id === claimID);

    if (index !== -1) {
      if (purchases[index].status !== "pending") {
        throw new Error("This point claim has already been processed.");
      }
      
      purchases[index].status = status;
      window.UTILS.setLocal(window.CONFIG.STORAGE_KEYS.PURCHASES, purchases);

      const claim = purchases[index];

      if (status === "approved") {
        // Disburse points
        await API.updateUserPoints(claim.email, claim.pointsCalculated);
        // Decrease stock
        await API.adjustStock(claim.productID, -claim.quantity);
        await API.addLog("SCAN_OK", `Scan claim approved: Disbursed ${claim.pointsCalculated} Pts to ${claim.fullname}`);
      } else {
        await API.addLog("SCAN_REJ", `Scan claim rejected: Claims authorization denied for ${claim.fullname} (Claim ID: ${claimID})`);
      }
      return { success: true };
    }
    throw new Error("Claim ledger record not found.");
  },


  // 4. REWARD SYSTEM POLICIES & SETTINGS
  getSettings: async () => {
    if (API.isRealBackend()) {
      return (await API.request("get_settings")).data;
    }
    return window.UTILS.getLocal(window.CONFIG.STORAGE_KEYS.SETTINGS, window.CONFIG.DEFAULT_POLICIES);
  },

  saveSettings: async (settingsData) => {
    if (API.isRealBackend()) {
      return await API.request("save_settings", { settings: settingsData });
    }
    window.UTILS.setLocal(window.CONFIG.STORAGE_KEYS.SETTINGS, settingsData);
    await API.addLog("SETT_MOD", `Corporate settings / points multiplier structures revised.`);
    return { success: true };
  },


  // 5. SECURITY AUDIT LOGS
  getLogs: async () => {
    if (API.isRealBackend()) {
      return (await API.request("get_logs")).data;
    }
    return window.UTILS.getLocal(window.CONFIG.STORAGE_KEYS.LOGS);
  },

  addLog: async (tag, text) => {
    const logs = window.UTILS.getLocal(window.CONFIG.STORAGE_KEYS.LOGS);
    logs.unshift({
      timestamp: new Date().toISOString(),
      tag,
      text
    });
    // Keep standard logs cap
    if (logs.length > 500) logs.pop();
    window.UTILS.setLocal(window.CONFIG.STORAGE_KEYS.LOGS, logs);
  },


  // 6. ANNOUNCEMENTS BULLETINS
  getAnnouncements: async () => {
    return window.UTILS.getLocal(window.CONFIG.STORAGE_KEYS.BROADCASTS);
  },

  addAnnouncement: async (ann) => {
    const arr = window.UTILS.getLocal(window.CONFIG.STORAGE_KEYS.BROADCASTS);
    arr.unshift({
      id: window.UTILS.generateID("AN"),
      date: new Date().toISOString(),
      ...ann
    });
    window.UTILS.setLocal(window.CONFIG.STORAGE_KEYS.BROADCASTS, arr);
    await API.addLog("NOTIF_OUT", `Broadcast bulletin announced: ${ann.subject} (Target: ${ann.target.toUpperCase()})`);
    return { success: true };
  }
};

// Seed db instantly on module inclusion
API.initLocalDatabase();
window.API = API;
