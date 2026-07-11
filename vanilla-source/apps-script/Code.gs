/**
 * Vikas Automobiles - Loyalty Rewards Portal
 * Google Apps Script Backend (Database on Google Sheets)
 * Main Controller & Router Entry Point
 */

// 1. GET Request diagnostic endpoint
function doGet(e) {
  var response = {
    status: "online",
    message: "Vikas Automobiles Loyalty Portal REST API is running perfectly. Use POST to communicate.",
    timestamp: new Date().toISOString()
  };
  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

// 2. POST Request centralized API Router
function doPost(e) {
  var resPayload = {};
  
  try {
    // Parse the input payload stringified JSON
    var postData = JSON.parse(e.postData.contents);
    var action = postData.action;
    
    // Auto-create and seed tables if necessary before handling request
    initSpreadsheetSchema();

    // Route Actions
    switch (action) {
      // 2.1 User Profiles (Users.gs)
      case "get_users":
        resPayload = { success: true, data: getUsersList() };
        break;
      case "create_user":
        resPayload = createUserRecord(postData.user);
        break;
      case "update_user_status":
        resPayload = updateUserStatusRecord(postData.email, postData.status);
        break;
      case "force_reset_password":
        resPayload = forceResetPasswordRecord(postData.email, postData.newPassword);
        break;

      // 2.2 Spare Parts Catalog (Products.gs)
      case "get_products":
        resPayload = { success: true, data: getProductsList() };
        break;
      case "save_product":
        resPayload = saveProductRecord(postData.product);
        break;

      // 2.3 Purchases Scans & Wallet Claims (Purchases.gs)
      case "get_purchases":
        resPayload = { success: true, data: getPurchasesList() };
        break;
      case "submit_purchase_claim":
        resPayload = submitPurchaseClaimRecord(postData.claim);
        break;
      case "process_purchase_claim":
        resPayload = processPurchaseClaimRecord(postData.claimID, postData.status);
        break;

      // 2.4 Central Loyalty Settings (Settings.gs)
      case "get_settings":
        resPayload = { success: true, data: getSettingsRecord() };
        break;
      case "save_settings":
        resPayload = saveSettingsRecord(postData.settings);
        break;

      // 2.5 Security Audits Logs (Reports.gs)
      case "get_logs":
        resPayload = { success: true, data: getAuditLogsList() };
        break;

      default:
        throw new Error("Action route '" + action + "' is unrecognized by central controller.");
    }

  } catch (error) {
    resPayload = {
      success: false,
      error: error.message || error.toString()
    };
    logToAuditSheet("API_ERR", "REST controller exception: " + resPayload.error);
  }

  // Pack response output as stringified JSON with CORs allowances
  return ContentService.createTextOutput(JSON.stringify(resPayload))
    .setMimeType(ContentService.MimeType.JSON);
}

// 3. Central Spreadsheet Database accessor
function getActiveSpreadsheet() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

// 4. Schema initialization & Database Seeder
function initSpreadsheetSchema() {
  var ss = getActiveSpreadsheet();
  
  // 4.1 USERS SHEET
  var usersSheet = ss.getSheetByName("Users");
  if (!usersSheet) {
    usersSheet = ss.insertSheet("Users");
    var headers = ["fullname", "email", "mobile", "password", "role", "status", "firmName", "address", "pincode", "gstin", "panCard", "points", "regDate", "photo"];
    usersSheet.appendRow(headers);
    // Seed default administrative users
    usersSheet.appendRow(["Vikas Sethi", "owner@vikas.com", "9999999999", "owner123", "owner", "approved", "Vikas Corporate Head Office", "G-10, Auto Market, Hisar, Haryana", "125001", "06AAAAA1111A1Z1", "AAAAA1111A", 0, new Date().toISOString(), "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop"]);
    usersSheet.appendRow(["Suresh Sharma", "admin@vikas.com", "8888888888", "admin123", "admin", "approved", "Central Warehouse Hisar", "Plot 14, Industrial Area, Hisar, Haryana", "125005", "06BBBBB2222B2Z2", "BBBBB2222B", 0, new Date().toISOString(), "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop"]);
    usersSheet.appendRow(["Ramesh Kumar Retailer", "retailer@vikas.com", "9876543210", "retailer123", "retailer", "approved", "Ramesh Auto Spares", "Shop 5, Motor Market, Rohtak, Haryana", "124001", "06GSPRK1234A1Z0", "ASDFG1234H", 4800, new Date().toISOString(), "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop"]);
    usersSheet.appendRow(["Bala Bhai Mechanic", "mechanic@vikas.com", "9112233445", "mechanic123", "mechanic", "approved", "Bala Car Repairing Shop", "Opposite Bus Stand, Jind, Haryana", "126102", "", "", 1250, new Date().toISOString(), "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop"]);
  }

  // 4.2 PRODUCTS CATALOG SHEET
  var productsSheet = ss.getSheetByName("Products");
  if (!productsSheet) {
    productsSheet = ss.insertSheet("Products");
    var headers = ["id", "name", "brand", "category", "mrp", "packSize", "retailerPrice", "mechanicPrice", "retailerPoints", "mechanicPoints", "stock", "minStock"];
    productsSheet.appendRow(headers);
    // Seed default spare parts Catalog
    productsSheet.appendRow(["P-001", "Premium Front Disc Brake Pads (Set of 4)", "Vikas Original Parts", "Brakes", 2400, "1 Set", 1850, 1950, 120, 100, 250, 15]);
    productsSheet.appendRow(["P-002", "Heavy Duty Mono-Shock Absorber (Rear)", "Vikas Original Parts", "Suspension", 3800, "1 Unit", 2900, 3100, 200, 160, 80, 10]);
    productsSheet.appendRow(["P-003", "Synthetic Premium Engine Oil 15W-40 5L", "LubriMax", "Lubricants", 2200, "5 Litres", 1550, 1650, 150, 120, 500, 30]);
    productsSheet.appendRow(["P-004", "High-Charge Maintenance Free Battery (12V)", "Vikas PowerLine", "Electrical", 5400, "1 Unit", 4100, 4300, 300, 250, 120, 5]);
  }

  // 4.3 CLAIMS & PURCHASES LEDGER SHEET
  var purchasesSheet = ss.getSheetByName("Purchases");
  if (!purchasesSheet) {
    purchasesSheet = ss.insertSheet("Purchases");
    var headers = ["id", "email", "fullname", "role", "firmName", "productID", "productName", "quantity", "pointsCalculated", "status", "date"];
    purchasesSheet.appendRow(headers);
    // Seed initial records
    purchasesSheet.appendRow(["C-982736", "retailer@vikas.com", "Ramesh Kumar Retailer", "retailer", "Ramesh Auto Spares", "P-001", "Premium Front Disc Brake Pads (Set of 4)", 2, 240, "approved", new Date().toISOString()]);
  }

  // 4.4 SETTINGS SHEET (Policies)
  var settingsSheet = ss.getSheetByName("Settings");
  if (!settingsSheet) {
    settingsSheet = ss.insertSheet("Settings");
    var headers = ["retailerMultiplier", "mechanicMultiplier", "silverThreshold", "goldThreshold"];
    settingsSheet.appendRow(headers);
    settingsSheet.appendRow([1.0, 1.2, 5000, 15000]);
  }

  // 4.5 AUDIT LOGS SHEET
  var logsSheet = ss.getSheetByName("Logs");
  if (!logsSheet) {
    logsSheet = ss.insertSheet("Logs");
    var headers = ["timestamp", "tag", "text"];
    logsSheet.appendRow(headers);
    logsSheet.appendRow([new Date().toISOString(), "SYS_INIT", "Vikas Automobiles central sheet cloud tables created and initialized."]);
  }

  // Clean empty default sheets
  var defaultSheet = ss.getSheetByName("Sheet1");
  if (defaultSheet) {
    try {
      ss.deleteSheet(defaultSheet);
    } catch(e) {}
  }
}

// Helper utility to convert sheet data rows to objects
function getSheetRowsAsObjects(sheet) {
  var rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];
  
  var headers = rows[0];
  var result = [];
  
  for (var i = 1; i < rows.length; i++) {
    var obj = {};
    var row = rows[i];
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = row[j];
    }
    result.push(obj);
  }
  
  return result;
}
