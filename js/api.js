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
          userId: "USR-1001",
          fullname: "Vikas Khandelwal",
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
          userId: "USR-1002",
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
          userId: "USR-1003",
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
          userId: "USR-1004",
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
          userId: "USR-1005",
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
    } else {
      // Backwards compatibility safety check: ensure all existing users have userIds
      const existingUsers = window.UTILS.getLocal(keys.USERS) || [];
      let updated = false;
      existingUsers.forEach((u, idx) => {
        if (!u.userId) {
          u.userId = `USR-${1001 + idx}`;
          updated = true;
        }
      });
      if (updated) {
        window.UTILS.setLocal(keys.USERS, existingUsers);
      }
    }

    // Seed default Point claims / Purchases scans
    if (!localStorage.getItem(keys.PURCHASES)) {
      const seedPurchases = [
        {
          id: "C-982736",
          purchaseID: "PCH-582914",
          email: "retailer@vikas.com",
          fullname: "Ramesh Kumar Retailer",
          role: "retailer",
          firmName: "Ramesh Auto Spares",
          productID: "P-001",
          productName: "Premium Front Disc Brake Pads (Set of 4)",
          quantity: 2,
          pointsCalculated: 240,
          status: "approved",
          date: new Date(Date.now() - 3600000 * 12).toISOString(),
          approvedBy: "Vikas Khandelwal",
          approvedDate: new Date(Date.now() - 3600000 * 11).toISOString(),
          remark: "Valid purchase invoice"
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

    // Seed QR Claims
    if (!localStorage.getItem(keys.QR_CLAIMS)) {
      window.UTILS.setLocal(keys.QR_CLAIMS, window.CONFIG.DEFAULT_QR_CLAIMS || []);
    }

    // Seed OTP Logs
    if (!localStorage.getItem(keys.OTP_LOGS)) {
      const seedOtpLogs = [
        {
          timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
          mobile: "9876543210",
          email: "retailer@vikas.com",
          otp: "582103",
          status: "verified",
          usedAt: new Date(Date.now() - 3600000 * 3.9).toISOString()
        },
        {
          timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
          mobile: "9112233445",
          email: "mechanic@vikas.com",
          otp: "904128",
          status: "verified",
          usedAt: new Date(Date.now() - 3600000 * 1.95).toISOString()
        }
      ];
      window.UTILS.setLocal(keys.OTP_LOGS, seedOtpLogs);
    }

    // Seed initial security audit logs
    if (!localStorage.getItem(keys.LOGS)) {
      window.UTILS.setLocal(keys.LOGS, [
        {
          timestamp: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
          userId: "SYSTEM",
          user: "SYSTEM",
          action: "SYS_INIT",
          module: "SYSTEM",
          remark: "Vikas Automobiles Central Node database synchronisation completed successfully."
        },
        {
          timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
          userId: "USR-1003",
          user: "Ramesh Kumar Retailer (retailer)",
          action: "SCAN_OK",
          module: "CLAIMS",
          remark: "Retailer Ramesh Kumar scanned Brake Pads (P-001) for 240 Pts, approved by system."
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

    // Email is optional at registration; fall back to a unique internal
    // address derived from the mobile number so every downstream feature
    // that keys records off `email` (notifications, purchases, redemptions,
    // login lookup, etc.) keeps working unchanged.
    const email = (userData.email || "").trim() || `${userData.mobile}@no-email.vikas.internal`;
    userData = { ...userData, email };

    // Avoid duplicates
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error("This email address is already registered.");
    }
    if (users.find(u => u.mobile === userData.mobile)) {
      throw new Error("This mobile number is already registered.");
    }

    // Generate unique User ID (USR-100X)
    const lastNum = users.reduce((max, u) => {
      if (u.userId && u.userId.startsWith("USR-")) {
        const num = parseInt(u.userId.replace("USR-", ""), 10);
        return num > max ? num : max;
      }
      return max;
    }, 1000);
    const userId = `USR-${lastNum + 1}`;

    users.push({
      ...userData,
      userId,
      points: 0,
      status: userData.role === "admin" ? "approved" : "pending", // admin created by owner is auto-approved, member requires owner audit
      regDate: new Date().toISOString()
    });
    window.UTILS.setLocal(window.CONFIG.STORAGE_KEYS.USERS, users);
    
    // Log audit
    await API.addLog("USER_REG", `New ${userData.role} user profile registered: ${userData.fullname} (${userData.email})`, "USERS");
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

  updateUserProfile: async (email, updatedData) => {
    const users = window.UTILS.getLocal(window.CONFIG.STORAGE_KEYS.USERS);
    const userIndex = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
    if (userIndex !== -1) {
      // Check if email is being changed and if new email already exists
      if (updatedData.email && updatedData.email.toLowerCase() !== email.toLowerCase()) {
        const emailExists = users.some(u => u.email.toLowerCase() === updatedData.email.toLowerCase());
        if (emailExists) {
          throw new Error("The new email address is already registered by another user.");
        }
      }
      
      users[userIndex] = { ...users[userIndex], ...updatedData };
      window.UTILS.setLocal(window.CONFIG.STORAGE_KEYS.USERS, users);
      
      // Update session if it's the current user
      const currentSession = window.UTILS.getLocal(window.CONFIG.STORAGE_KEYS.SESSION, null);
      if (currentSession && currentSession.email.toLowerCase() === email.toLowerCase()) {
        const newSession = { ...currentSession, ...updatedData };
        window.UTILS.setLocal(window.CONFIG.STORAGE_KEYS.SESSION, newSession);
      }
      await API.addLog("USER_MOD", `User profile details updated for: ${email}`);
      return { success: true, user: users[userIndex] };
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

  deleteUser: async (email) => {
    if (API.isRealBackend()) {
      return await API.request("delete_user", { email });
    }
    let users = window.UTILS.getLocal(window.CONFIG.STORAGE_KEYS.USERS);
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      throw new Error("User profile not found.");
    }
    users = users.filter(u => u.email.toLowerCase() !== email.toLowerCase());
    window.UTILS.setLocal(window.CONFIG.STORAGE_KEYS.USERS, users);
    await API.addLog("USER_DEL", `User account permanently deleted: ${user.fullname} (${email}) [Role: ${user.role.toUpperCase()}]`, "USERS");
    return { success: true };
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

  resetUserPassword: async (email, newPassword) => {
    return API.forceResetPassword(email, newPassword);
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

    // 1. Auto-generate Item Code if empty
    let itemCode = productData.itemCode ? productData.itemCode.trim() : "";
    if (!itemCode) {
      let maxNum = 0;
      products.forEach(p => {
        if (p.itemCode && p.itemCode.startsWith("HP-")) {
          const num = parseInt(p.itemCode.replace("HP-", ""), 10);
          if (!isNaN(num) && num > maxNum) {
            maxNum = num;
          }
        }
      });
      itemCode = `HP-${String(maxNum + 1).padStart(4, "0")}`;
    }
    productData.itemCode = itemCode;

    // 2. Prevent duplicate Item Codes
    const duplicate = products.find(p => p.itemCode && p.itemCode.toLowerCase() === itemCode.toLowerCase() && p.id !== productData.id);
    if (duplicate) {
      throw new Error(`Duplicate Item Code error: "${itemCode}" is already assigned to "${duplicate.name}"`);
    }

    // 3. Set standard defaults
    productData.status = productData.status || "Active";
    productData.createdDate = productData.createdDate || new Date().toISOString().split('T')[0];
    productData.distributorPrice = Number(productData.distributorPrice) || 0;

    const existingIndex = products.findIndex(p => p.id === productData.id);

    if (existingIndex !== -1) {
      // Edit
      products[existingIndex] = { ...products[existingIndex], ...productData };
      window.UTILS.setLocal(window.CONFIG.STORAGE_KEYS.PRODUCTS, products);
      await API.addLog("PROD_MOD", `Catalog Product Card edited: ${productData.name} (${productData.id}) - Code: ${itemCode}`);
    } else {
      // Add new
      const nextID = productData.id || `P-${Math.floor(100 + Math.random() * 900)}`;
      productData.id = nextID;
      products.push(productData);
      window.UTILS.setLocal(window.CONFIG.STORAGE_KEYS.PRODUCTS, products);
      await API.addLog("PROD_ADD", `New Spare Part product added: ${productData.name} (${nextID}) - Code: ${itemCode}`);
    }
    return { success: true };
  },

  deleteProduct: async (id) => {
    if (API.isRealBackend()) {
      return await API.request("delete_product", { id });
    }
    const products = window.UTILS.getLocal(window.CONFIG.STORAGE_KEYS.PRODUCTS);
    const filtered = products.filter(p => p.id !== id);
    window.UTILS.setLocal(window.CONFIG.STORAGE_KEYS.PRODUCTS, filtered);
    await API.addLog("PROD_DEL", `Catalog Product deleted: ${id}`);
    return { success: true };
  },

  deleteMultipleProducts: async (ids) => {
    if (API.isRealBackend()) {
      return await API.request("delete_multiple_products", { ids });
    }
    const products = window.UTILS.getLocal(window.CONFIG.STORAGE_KEYS.PRODUCTS);
    const filtered = products.filter(p => !ids.includes(p.id));
    window.UTILS.setLocal(window.CONFIG.STORAGE_KEYS.PRODUCTS, filtered);
    await API.addLog("PROD_DEL_MULT", `Catalog Products deleted: ${ids.join(", ")}`);
    return { success: true };
  },

  deleteAllProducts: async () => {
    if (API.isRealBackend()) {
      return await API.request("delete_all_products");
    }
    window.UTILS.setLocal(window.CONFIG.STORAGE_KEYS.PRODUCTS, []);
    await API.addLog("PROD_DEL_ALL", `All catalog products cleared.`);
    return { success: true };
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

  processPurchaseClaim: async (claimID, status, remark = "") => {
    if (API.isRealBackend()) {
      return await API.request("process_purchase_claim", { claimID, status, remark });
    }
    const purchases = window.UTILS.getLocal(window.CONFIG.STORAGE_KEYS.PURCHASES);
    const index = purchases.findIndex(c => c.id === claimID);

    if (index !== -1) {
      if (purchases[index].status !== "pending") {
        throw new Error("This point claim has already been processed.");
      }
      
      const session = window.UTILS.getLocal(window.CONFIG.STORAGE_KEYS.SESSION, null);
      const approvedBy = session ? session.fullname : "System Auto";
      const approvedDate = new Date().toISOString();

      purchases[index].status = status;
      purchases[index].remark = remark;
      purchases[index].approvedBy = approvedBy;
      purchases[index].approvedDate = approvedDate;

      if (status === "approved" && !purchases[index].purchaseID) {
        purchases[index].purchaseID = `PCH-${Math.floor(100000 + Math.random() * 900000)}`;
      }

      window.UTILS.setLocal(window.CONFIG.STORAGE_KEYS.PURCHASES, purchases);

      const claim = purchases[index];

      if (status === "approved") {
        // Disburse points
        await API.updateUserPoints(claim.email, claim.pointsCalculated);
        await API.addLog("SCAN_OK", `Scan claim approved: Disbursed ${claim.pointsCalculated} Pts to ${claim.fullname}${remark ? ' - Remark: ' + remark : ''}`, "CLAIMS");
      } else {
        await API.addLog("SCAN_REJ", `Scan claim rejected: Claims authorization denied for ${claim.fullname} (Claim ID: ${claimID})${remark ? ' - Remark: ' + remark : ''}`, "CLAIMS");
      }
      return { success: true };
    }
    throw new Error("Claim ledger record not found.");
  },

  deletePurchaseClaim: async (claimID) => {
    if (API.isRealBackend()) {
      return await API.request("delete_purchase_claim", { claimID });
    }
    let purchases = window.UTILS.getLocal(window.CONFIG.STORAGE_KEYS.PURCHASES);
    const claim = purchases.find(c => c.id === claimID);
    if (!claim) {
      throw new Error("Claim ledger record not found.");
    }
    purchases = purchases.filter(c => c.id !== claimID);
    window.UTILS.setLocal(window.CONFIG.STORAGE_KEYS.PURCHASES, purchases);
    await API.addLog("SCAN_DEL", `Scan claim record permanently deleted: ${claim.fullname} (${claim.productName || claim.productID || claimID})`, "CLAIMS");
    return { success: true };
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
    const existing = window.UTILS.getLocal(window.CONFIG.STORAGE_KEYS.SETTINGS, window.CONFIG.DEFAULT_POLICIES);
    window.UTILS.setLocal(window.CONFIG.STORAGE_KEYS.SETTINGS, { ...existing, ...settingsData });
    await API.addLog("SETT_MOD", `Corporate settings / points multiplier structures revised.`, "SETTINGS");
    return { success: true };
  },


  // 5. SECURITY AUDIT LOGS
  getLogs: async () => {
    if (API.isRealBackend()) {
      return (await API.request("get_logs")).data;
    }
    return window.UTILS.getLocal(window.CONFIG.STORAGE_KEYS.LOGS);
  },

  addLog: async (tag, text, moduleParam = null) => {
    const logs = window.UTILS.getLocal(window.CONFIG.STORAGE_KEYS.LOGS) || [];
    const session = window.UTILS.getLocal(window.CONFIG.STORAGE_KEYS.SESSION, null);
    
    let userId = "SYSTEM";
    let user = "SYSTEM";
    if (session) {
      userId = session.userId || "SYSTEM";
      user = `${session.fullname} (${session.role})`;
    }

    // Auto-detect module from tag/action if not explicitly provided
    let module = moduleParam;
    if (!module) {
      if (tag.includes("AUTH")) module = "AUTH";
      else if (tag.includes("USER") || tag.includes("SEC")) module = "USERS";
      else if (tag.includes("PROD")) module = "CATALOG";
      else if (tag.includes("SCAN")) module = "CLAIMS";
      else if (tag.includes("SETT")) module = "SETTINGS";
      else if (tag.includes("NOTIF")) module = "NOTIFICATIONS";
      else module = "SYSTEM";
    }

    logs.unshift({
      timestamp: new Date().toISOString(),
      userId,
      user,
      action: tag,
      module,
      remark: text
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
    await API.addLog("NOTIF_OUT", `Broadcast bulletin announced: ${ann.subject} (Target: ${ann.target.toUpperCase()})`, "NOTIFICATIONS");
    return { success: true };
  },

  deleteAnnouncement: async (id) => {
    let arr = window.UTILS.getLocal(window.CONFIG.STORAGE_KEYS.BROADCASTS);
    const ann = arr.find(a => a.id === id);
    if (!ann) {
      throw new Error("Announcement not found.");
    }
    arr = arr.filter(a => a.id !== id);
    window.UTILS.setLocal(window.CONFIG.STORAGE_KEYS.BROADCASTS, arr);
    await API.addLog("NOTIF_DEL", `Broadcast bulletin permanently deleted: ${ann.subject}`, "NOTIFICATIONS");
    return { success: true };
  },

  // 7. OTP LOGS API ENDPOINTS
  getOtpLogs: async () => {
    return window.UTILS.getLocal(window.CONFIG.STORAGE_KEYS.OTP_LOGS) || [];
  },

  addOtpLog: async (mobile, email, otp, status, usedAt = "-") => {
    const logs = window.UTILS.getLocal(window.CONFIG.STORAGE_KEYS.OTP_LOGS) || [];
    logs.unshift({
      timestamp: new Date().toISOString(),
      mobile,
      email,
      otp,
      status,
      usedAt
    });
    if (logs.length > 500) logs.pop();
    window.UTILS.setLocal(window.CONFIG.STORAGE_KEYS.OTP_LOGS, logs);
  },

  updateOtpLogStatus: async (emailOrMobile, status) => {
    const logs = window.UTILS.getLocal(window.CONFIG.STORAGE_KEYS.OTP_LOGS) || [];
    const q = emailOrMobile.trim().toLowerCase();
    const logIndex = logs.findIndex(l => 
      (l.email.toLowerCase() === q || l.mobile === q) && l.status === "sent"
    );
    if (logIndex !== -1) {
      logs[logIndex].status = status;
      logs[logIndex].usedAt = status === "verified" ? new Date().toISOString() : "-";
      window.UTILS.setLocal(window.CONFIG.STORAGE_KEYS.OTP_LOGS, logs);
    }
  },

  // 8. QR CODE CLAIMS API ENDPOINTS
  getQrClaims: async () => {
    if (API.isRealBackend()) {
      return (await API.request("get_qr_claims")).data;
    }
    return window.UTILS.getLocal(window.CONFIG.STORAGE_KEYS.QR_CLAIMS) || [];
  },

  saveQrClaim: async (claim) => {
    if (API.isRealBackend()) {
      return await API.request("save_qr_claim", { claim });
    }
    const claims = window.UTILS.getLocal(window.CONFIG.STORAGE_KEYS.QR_CLAIMS) || [];
    const index = claims.findIndex(c => c.id === claim.id);
    if (index !== -1) {
      claims[index] = { ...claims[index], ...claim };
    } else {
      claim.id = claim.id || window.UTILS.generateID("QRC");
      claim.date = claim.date || new Date().toISOString();
      claims.unshift(claim);
    }
    window.UTILS.setLocal(window.CONFIG.STORAGE_KEYS.QR_CLAIMS, claims);
    return { success: true };
  },

  deleteQrClaim: async (id) => {
    if (API.isRealBackend()) {
      return await API.request("delete_qr_claim", { id });
    }
    let claims = window.UTILS.getLocal(window.CONFIG.STORAGE_KEYS.QR_CLAIMS) || [];
    claims = claims.filter(c => c.id !== id);
    window.UTILS.setLocal(window.CONFIG.STORAGE_KEYS.QR_CLAIMS, claims);
    await API.addLog("QR_DEL", `QR claim deleted: ${id}`);
    return { success: true };
  },

  evaluateQrClaim: async (claimId, status, remarks) => {
    if (API.isRealBackend()) {
      return await API.request("evaluate_qr_claim", { claimId, status, remarks });
    }
    const claims = window.UTILS.getLocal(window.CONFIG.STORAGE_KEYS.QR_CLAIMS) || [];
    const idx = claims.findIndex(c => c.id === claimId);
    if (idx === -1) {
      throw new Error("QR claim record not found.");
    }
    const oldStatus = claims[idx].status;
    claims[idx].status = status;
    claims[idx].remarks = remarks;
    window.UTILS.setLocal(window.CONFIG.STORAGE_KEYS.QR_CLAIMS, claims);

    const claim = claims[idx];
    if (status === "Approved" && oldStatus !== "Approved") {
      // Award loyalty points to the user
      await API.updateUserPointsByEmailOrName(claim.userName, claim.points || 0);
      await API.addLog("QR_APP", `QR claim ${claimId} APPROVED. Awarded ${claim.points} Pts to ${claim.userName}`, "CLAIMS");
    } else if (status !== "Approved" && oldStatus === "Approved") {
      // Deduct loyalty points if transitioning from Approved to something else
      await API.updateUserPointsByEmailOrName(claim.userName, -(claim.points || 0));
      await API.addLog("QR_REV", `QR claim ${claimId} status changed from Approved to ${status}. Revoked ${claim.points} Pts from ${claim.userName}`, "CLAIMS");
    } else {
      await API.addLog("QR_EVAL", `QR claim ${claimId} evaluated as ${status}`, "CLAIMS");
    }
    return { success: true };
  },

  updateUserPointsByEmailOrName: async (emailOrName, pointsDelta) => {
    const users = window.UTILS.getLocal(window.CONFIG.STORAGE_KEYS.USERS) || [];
    const q = emailOrName.trim().toLowerCase();
    const user = users.find(u => u.email.toLowerCase() === q || u.fullname.toLowerCase() === q);
    if (user) {
      user.points = Math.max(0, (user.points || 0) + pointsDelta);
      window.UTILS.setLocal(window.CONFIG.STORAGE_KEYS.USERS, users);
      return { success: true };
    }
    try {
      await API.updateUserPoints(emailOrName, pointsDelta);
    } catch (e) {
      console.warn("Could not disburse points to user: " + emailOrName);
    }
  },

  // === 9. RATINGS & REVIEWS API ===
  getReviews: async () => {
    let reviews = window.UTILS.getLocal(window.CONFIG.STORAGE_KEYS.REVIEWS);
    if (reviews.length === 0) {
      // Seed default ratings
      reviews = [
        { id: "REV-101", productId: "P-001", userEmail: "retailer@vikas.com", userName: "Ramesh Kumar Retailer", rating: 5, reviewText: "Excellent grip and long-lasting brake performance! Highly recommended for all hatchbacks.", date: new Date(Date.now() - 3600000 * 24 * 3).toISOString() },
        { id: "REV-102", productId: "P-003", userEmail: "mechanic@vikas.com", userName: "Bala Bhai Mechanic", rating: 4, reviewText: "Very smooth cold starts and great viscosity stability. Customer was very satisfied with the engine sound.", date: new Date(Date.now() - 3600000 * 24 * 1).toISOString() }
      ];
      window.UTILS.setLocal(window.CONFIG.STORAGE_KEYS.REVIEWS, reviews);
    }
    return reviews;
  },

  addReview: async (reviewData) => {
    const reviews = window.UTILS.getLocal(window.CONFIG.STORAGE_KEYS.REVIEWS);
    const newReview = {
      id: window.UTILS.generateID("REV"),
      date: new Date().toISOString(),
      ...reviewData
    };
    reviews.unshift(newReview);
    window.UTILS.setLocal(window.CONFIG.STORAGE_KEYS.REVIEWS, reviews);
    await API.addLog("PROD_REV", `New review added for product ID ${reviewData.productId}: ${reviewData.rating} Stars by ${reviewData.userName}`);
    return { success: true, review: newReview };
  },

  // === 10. NOTIFICATIONS SYSTEM API ===
  getNotifications: async (userEmail) => {
    const all = window.UTILS.getLocal(window.CONFIG.STORAGE_KEYS.NOTIFICATIONS);
    const q = (userEmail || "").trim().toLowerCase();
    return all.filter(n => !n.userId || n.userId.toLowerCase() === q);
  },

  addNotification: async (userEmail, title, message, type = "info") => {
    const all = window.UTILS.getLocal(window.CONFIG.STORAGE_KEYS.NOTIFICATIONS);
    const newNotif = {
      id: window.UTILS.generateID("NTF"),
      userId: (userEmail || "").trim().toLowerCase(),
      title,
      message,
      type,
      read: false,
      date: new Date().toISOString()
    };
    all.unshift(newNotif);
    window.UTILS.setLocal(window.CONFIG.STORAGE_KEYS.NOTIFICATIONS, all);
    return newNotif;
  },

  markNotificationAsRead: async (id) => {
    const all = window.UTILS.getLocal(window.CONFIG.STORAGE_KEYS.NOTIFICATIONS);
    const idx = all.findIndex(n => n.id === id);
    if (idx !== -1) {
      all[idx].read = true;
      window.UTILS.setLocal(window.CONFIG.STORAGE_KEYS.NOTIFICATIONS, all);
    }
    return { success: true };
  },

  clearNotifications: async (userEmail) => {
    let all = window.UTILS.getLocal(window.CONFIG.STORAGE_KEYS.NOTIFICATIONS);
    const q = (userEmail || "").trim().toLowerCase();
    all = all.filter(n => n.userId && n.userId.toLowerCase() !== q);
    window.UTILS.setLocal(window.CONFIG.STORAGE_KEYS.NOTIFICATIONS, all);
    return { success: true };
  },

  // === 11. REWARDS CATALOGUE & REDEMPTION API ===
  getRewards: async () => {
    const storageKey = window.CONFIG.STORAGE_KEYS.REWARDS;
    const neverInitialized = localStorage.getItem(storageKey) === null;
    let rewards = window.UTILS.getLocal(storageKey);

    if (neverInitialized) {
      rewards = window.CONFIG.DEFAULT_REWARDS;
      window.UTILS.setLocal(storageKey, rewards);
    }
    return rewards;
  },

  saveReward: async (reward) => {
    const rewards = window.UTILS.getLocal(window.CONFIG.STORAGE_KEYS.REWARDS);
    const index = rewards.findIndex(r => r.id === reward.id);
    if (index !== -1) {
      rewards[index] = { ...rewards[index], ...reward };
    } else {
      reward.id = reward.id || window.UTILS.generateID("REW");
      rewards.unshift(reward);
    }
    window.UTILS.setLocal(window.CONFIG.STORAGE_KEYS.REWARDS, rewards);
    await API.addLog("REW_SAVE", `Reward Catalogue item saved: ${reward.name} (${reward.id})`);
    return { success: true };
  },

  deleteReward: async (id) => {
    const rewards = window.UTILS.getLocal(window.CONFIG.STORAGE_KEYS.REWARDS);
    const filtered = rewards.filter(r => r.id !== id);
    window.UTILS.setLocal(window.CONFIG.STORAGE_KEYS.REWARDS, filtered);
    await API.addLog("REW_DEL", `Reward Catalogue item deleted: ${id}`);
    return { success: true };
  },

  getRedemptions: async () => {
    let redemptions = window.UTILS.getLocal(window.CONFIG.STORAGE_KEYS.REDEMPTIONS);
    if (redemptions.length === 0) {
      // Seed default redemptions
      redemptions = [
        {
          id: "RDM-2049",
          email: "retailer@vikas.com",
          fullname: "Ramesh Kumar Retailer",
          role: "retailer",
          firmName: "Ramesh Auto Spares",
          rewardId: "REW-001",
          rewardName: "HP Brand Sports T-Shirt",
          pointsRequired: 500,
          status: "pending",
          date: new Date(Date.now() - 3600000 * 4).toISOString()
        }
      ];
      window.UTILS.setLocal(window.CONFIG.STORAGE_KEYS.REDEMPTIONS, redemptions);
    }
    return redemptions;
  },

  submitRedemption: async (email, fullname, role, firmName, rewardId, rewardName, pointsRequired) => {
    const redemptions = window.UTILS.getLocal(window.CONFIG.STORAGE_KEYS.REDEMPTIONS) || [];
    const rewards = window.UTILS.getLocal(window.CONFIG.STORAGE_KEYS.REWARDS);
    const rIdx = rewards.findIndex(r => r.id === rewardId);
    
    if (rIdx !== -1 && rewards[rIdx].stock <= 0) {
      throw new Error("This reward is currently out of stock!");
    }

    const newRed = {
      id: window.UTILS.generateID("RDM"),
      email,
      fullname,
      role,
      firmName,
      rewardId,
      rewardName,
      pointsRequired,
      status: "pending",
      date: new Date().toISOString()
    };
    redemptions.unshift(newRed);
    window.UTILS.setLocal(window.CONFIG.STORAGE_KEYS.REDEMPTIONS, redemptions);

    // Auto-create notification
    await API.addNotification(email, "Redemption Submitted", `Your redemption request for ${rewardName} (${pointsRequired} Pts) has been submitted successfully and is pending approval.`, "reward_redemption");

    await API.addLog("REW_RDM_SUB", `Redemption requested by ${fullname} for ${rewardName} (${pointsRequired} Pts)`);
    return { success: true, redemption: newRed };
  },

  processRedemption: async (redemptionId, status, remark = "") => {
    const redemptions = window.UTILS.getLocal(window.CONFIG.STORAGE_KEYS.REDEMPTIONS) || [];
    const idx = redemptions.findIndex(r => r.id === redemptionId);
    if (idx === -1) {
      throw new Error("Redemption record not found.");
    }
    if (redemptions[idx].status !== "pending") {
      throw new Error("This redemption request has already been evaluated.");
    }

    const rdm = redemptions[idx];
    const session = window.UTILS.getLocal(window.CONFIG.STORAGE_KEYS.SESSION, null);
    const processedBy = session ? session.fullname : "System Auto";

    rdm.status = status;
    rdm.remark = remark;
    rdm.approvedBy = processedBy;
    rdm.approvedDate = new Date().toISOString();

    if (status === "approved") {
      // Deduct points
      const users = window.UTILS.getLocal(window.CONFIG.STORAGE_KEYS.USERS);
      const uIdx = users.findIndex(u => u.email.toLowerCase() === rdm.email.toLowerCase());
      if (uIdx !== -1) {
        if (users[uIdx].points < rdm.pointsRequired) {
          throw new Error(`Insufficient point balance! User has ${users[uIdx].points} Pts, requires ${rdm.pointsRequired} Pts.`);
        }
        users[uIdx].points -= rdm.pointsRequired;
        window.UTILS.setLocal(window.CONFIG.STORAGE_KEYS.USERS, users);
      }

      // Deduct reward stock
      const rewards = window.UTILS.getLocal(window.CONFIG.STORAGE_KEYS.REWARDS);
      const rewIdx = rewards.findIndex(r => r.id === rdm.rewardId);
      if (rewIdx !== -1) {
        rewards[rewIdx].stock = Math.max(0, (rewards[rewIdx].stock || 0) - 1);
        window.UTILS.setLocal(window.CONFIG.STORAGE_KEYS.REWARDS, rewards);
      }

      window.UTILS.setLocal(window.CONFIG.STORAGE_KEYS.REDEMPTIONS, redemptions);

      // Notify User
      await API.addNotification(rdm.email, "Redemption Approved! 🎉", `Congratulations! Your redemption of "${rdm.rewardName}" has been approved.${remark ? ' Notes: ' + remark : ''}`, "reward_redemption");

      await API.addLog("REW_RDM_OK", `Redemption APPROVED: Shipped "${rdm.rewardName}" to ${rdm.fullname} (Deducted ${rdm.pointsRequired} Pts)`);
    } else {
      window.UTILS.setLocal(window.CONFIG.STORAGE_KEYS.REDEMPTIONS, redemptions);
      
      // Notify User
      await API.addNotification(rdm.email, "Redemption Cancelled", `Your redemption of "${rdm.rewardName}" has been rejected.${remark ? ' Reason: ' + remark : ''}`, "reward_redemption");

      await API.addLog("REW_RDM_REJ", `Redemption REJECTED for ${rdm.fullname} ("${rdm.rewardName}"): ${remark}`);
    }

    return { success: true };
  },

  deleteRedemption: async (redemptionId) => {
    if (API.isRealBackend()) {
      return await API.request("delete_redemption", { redemptionId });
    }
    let redemptions = window.UTILS.getLocal(window.CONFIG.STORAGE_KEYS.REDEMPTIONS) || [];
    const rdm = redemptions.find(r => r.id === redemptionId);
    if (!rdm) {
      throw new Error("Redemption record not found.");
    }
    redemptions = redemptions.filter(r => r.id !== redemptionId);
    window.UTILS.setLocal(window.CONFIG.STORAGE_KEYS.REDEMPTIONS, redemptions);
    await API.addLog("REW_RDM_DEL", `Redemption record permanently deleted: "${rdm.rewardName}" for ${rdm.fullname}`);
    return { success: true };
  },

  // === 12. ADVANCED BULK USER & PROFILE MANAGEMENT ===
  bulkApproveUsers: async (emails) => {
    const users = window.UTILS.getLocal(window.CONFIG.STORAGE_KEYS.USERS);
    let count = 0;
    users.forEach(u => {
      if (emails.includes(u.email) && u.status !== "approved") {
        u.status = "approved";
        count++;
        // Add welcome notification
        API.addNotification(u.email, "Account Activated! 🎉", "Your Vikas Automobiles Loyalty Portal profile has been reviewed and approved! Welcome aboard.", "registration_approval");
      }
    });
    if (count > 0) {
      window.UTILS.setLocal(window.CONFIG.STORAGE_KEYS.USERS, users);
      await API.addLog("USER_BULK_APP", `Bulk approved ${count} member accounts: ${emails.join(", ")}`);
    }
    return { success: true, count };
  },

  bulkDeleteUsers: async (emails) => {
    const users = window.UTILS.getLocal(window.CONFIG.STORAGE_KEYS.USERS);
    const filtered = users.filter(u => !emails.includes(u.email));
    const deletedCount = users.length - filtered.length;
    window.UTILS.setLocal(window.CONFIG.STORAGE_KEYS.USERS, filtered);
    await API.addLog("USER_BULK_DEL", `Bulk deleted ${deletedCount} member accounts: ${emails.join(", ")}`);
    return { success: true, count: deletedCount };
  },

  setUserSuspendedState: async (email, isSuspended) => {
    const users = window.UTILS.getLocal(window.CONFIG.STORAGE_KEYS.USERS);
    const idx = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
    if (idx !== -1) {
      users[idx].status = isSuspended ? "suspended" : "approved";
      window.UTILS.setLocal(window.CONFIG.STORAGE_KEYS.USERS, users);
      await API.addLog("USER_STATE", `Account ${email} has been ${isSuspended ? 'SUSPENDED' : 'ACTIVATED'}`);
      return { success: true };
    }
    throw new Error("User profile not found.");
  },

  // === 13. ADVANCED CLAIM REMARKS & BULK CLAIMS PROCESSING ===
  addClaimRemarkHistory: async (claimId, remarkText) => {
    const purchases = window.UTILS.getLocal(window.CONFIG.STORAGE_KEYS.PURCHASES);
    const idx = purchases.findIndex(p => p.id === claimId);
    if (idx !== -1) {
      const session = window.UTILS.getLocal(window.CONFIG.STORAGE_KEYS.SESSION);
      const author = session ? session.fullname : "System Admin";
      
      purchases[idx].remarksHistory = purchases[idx].remarksHistory || [];
      purchases[idx].remarksHistory.push({
        author,
        text: remarkText,
        timestamp: new Date().toISOString()
      });
      // Also update the active inline remark
      purchases[idx].remark = remarkText;
      
      window.UTILS.setLocal(window.CONFIG.STORAGE_KEYS.PURCHASES, purchases);
      await API.addLog("CLAIM_REMARK", `Remark added to claim ${claimId}: "${remarkText}"`);
      return { success: true };
    }
    throw new Error("Claim ledger record not found.");
  },

  bulkApproveClaims: async (claimIds) => {
    const purchases = window.UTILS.getLocal(window.CONFIG.STORAGE_KEYS.PURCHASES);
    let count = 0;
    const session = window.UTILS.getLocal(window.CONFIG.STORAGE_KEYS.SESSION, null);
    const approvedBy = session ? session.fullname : "System Auto";
    const approvedDate = new Date().toISOString();

    for (const claimId of claimIds) {
      const idx = purchases.findIndex(c => c.id === claimId);
      if (idx !== -1 && purchases[idx].status === "pending") {
        purchases[idx].status = "approved";
        purchases[idx].approvedBy = approvedBy;
        purchases[idx].approvedDate = approvedDate;
        purchases[idx].purchaseID = `PCH-${Math.floor(100000 + Math.random() * 900000)}`;

        const claim = purchases[idx];
        await API.updateUserPoints(claim.email, claim.pointsCalculated);
        
        // Notify
        await API.addNotification(claim.email, "Claim Approved! 💰", `Your scan claim of ${claim.quantity}x ${claim.productName} has been approved (+${claim.pointsCalculated} Pts)!`, "claim_approval");

        count++;
      }
    }

    if (count > 0) {
      window.UTILS.setLocal(window.CONFIG.STORAGE_KEYS.PURCHASES, purchases);
      await API.addLog("CLAIM_BULK_APP", `Bulk approved ${count} point claims.`);
    }
    return { success: true, count };
  },

  bulkRejectClaims: async (claimIds, reason = "Bulk administrative rejection") => {
    const purchases = window.UTILS.getLocal(window.CONFIG.STORAGE_KEYS.PURCHASES);
    let count = 0;
    const session = window.UTILS.getLocal(window.CONFIG.STORAGE_KEYS.SESSION, null);
    const rejectedBy = session ? session.fullname : "System Auto";
    const rejectDate = new Date().toISOString();

    for (const claimId of claimIds) {
      const idx = purchases.findIndex(c => c.id === claimId);
      if (idx !== -1 && purchases[idx].status === "pending") {
        purchases[idx].status = "rejected";
        purchases[idx].remark = reason;
        purchases[idx].approvedBy = rejectedBy;
        purchases[idx].approvedDate = rejectDate;

        const claim = purchases[idx];
        await API.addNotification(claim.email, "Claim Rejected", `Your scan claim of ${claim.productName} was rejected. Reason: ${reason}`, "claim_rejection");

        count++;
      }
    }

    if (count > 0) {
      window.UTILS.setLocal(window.CONFIG.STORAGE_KEYS.PURCHASES, purchases);
      await API.addLog("CLAIM_BULK_REJ", `Bulk rejected ${count} point claims. Reason: ${reason}`);
    }
    return { success: true, count };
  }
};

// Seed db instantly on module inclusion
API.initLocalDatabase();
window.API = API;
