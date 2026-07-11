/**
 * Vikas Automobiles - Loyalty Rewards Portal
 * Google Apps Script - Users.gs
 * User Profiles Database Management (Reads / Writes)
 */

// 1. Get all registered users from sheets
function getUsersList() {
  var ss = getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Users");
  return getSheetRowsAsObjects(sheet);
}

// 2. Append a new partner account row (with unique constraints)
function createUserRecord(user) {
  var ss = getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Users");
  var rows = sheet.getDataRange().getValues();
  
  var emailColIdx = rows[0].indexOf("email");
  
  // Look for duplicate registration
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][emailColIdx].toString().toLowerCase() === user.email.toLowerCase()) {
      throw new Error("This email address is already registered.");
    }
  }

  // Map user structure into sequential columns matching headers
  // Headers: ["fullname", "email", "mobile", "password", "role", "status", "firmName", "address", "pincode", "gstin", "panCard", "points", "regDate", "photo"]
  var newRow = [
    user.fullname,
    user.email,
    user.mobile,
    user.password,
    user.role,
    user.role === "admin" ? "approved" : "pending", // admin created by owner is auto-approved, member requires owner audit
    user.firmName || "",
    user.address || "",
    user.pincode || "",
    user.gstin || "",
    user.panCard || "",
    0, // Initial points balance
    new Date().toISOString(),
    user.photo || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop"
  ];

  sheet.appendRow(newRow);
  logToAuditSheet("USER_REG", "New " + user.role + " user registered via API: " + user.fullname + " (" + user.email + ")");
  
  return { success: true };
}

// 3. Update partner account state (Approved / Suspended)
function updateUserStatusRecord(email, status) {
  var ss = getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Users");
  var rows = sheet.getDataRange().getValues();
  
  var emailColIdx = rows[0].indexOf("email");
  var statusColIdx = rows[0].indexOf("status");
  
  var found = false;
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][emailColIdx].toString().toLowerCase() === email.toLowerCase()) {
      sheet.getRange(i + 1, statusColIdx + 1).setValue(status);
      found = true;
      break;
    }
  }

  if (!found) {
    throw new Error("Partner account not found: " + email);
  }

  logToAuditSheet("USER_MOD", "User " + email + " status transitioned on server to: " + status.toUpperCase());
  return { success: true };
}

// 4. Server-Side Points ledger balance modifier
function adjustUserPointsRecord(email, pointsDelta) {
  var ss = getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Users");
  var rows = sheet.getDataRange().getValues();
  
  var emailColIdx = rows[0].indexOf("email");
  var pointsColIdx = rows[0].indexOf("points");
  
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][emailColIdx].toString().toLowerCase() === email.toLowerCase()) {
      var currentPoints = Number(rows[i][pointsColIdx]) || 0;
      var newPoints = Math.max(0, currentPoints + pointsDelta);
      sheet.getRange(i + 1, pointsColIdx + 1).setValue(newPoints);
      return;
    }
  }
  
  throw new Error("Unable to disburse points, user not found in spreadsheet: " + email);
}
