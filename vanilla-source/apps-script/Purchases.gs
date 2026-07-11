/**
 * Vikas Automobiles - Loyalty Rewards Portal
 * Google Apps Script - Purchases.gs
 * Claims Ledger records & stateful approval hooks
 */

// 1. Get all points claims from ledger
function getPurchasesList() {
  var ss = getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Purchases");
  return getSheetRowsAsObjects(sheet);
}

// 2. Insert a new claims scan request row (Pending by default)
function submitPurchaseClaimRecord(claim) {
  var ss = getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Purchases");
  
  // Create a randomized high-fidelity transaction hash
  var claimID = "C-" + Math.floor(100000 + Math.random() * 900000);
  
  // Headers: ["id", "email", "fullname", "role", "firmName", "productID", "productName", "quantity", "pointsCalculated", "status", "date"]
  var newRow = [
    claimID,
    claim.email,
    claim.fullname,
    claim.role,
    claim.firmName || "",
    claim.productID,
    claim.productName,
    Number(claim.quantity) || 1,
    Number(claim.pointsCalculated) || 0,
    "pending",
    new Date().toISOString()
  ];

  sheet.appendRow(newRow);
  logToAuditSheet("SCAN_IN", "Point claim submitted on server: " + claim.fullname + " for " + claim.productName);
  
  return { success: true };
}

// 3. Approve or Reject claim (Disburses wallet balances in Sheets database)
function processPurchaseClaimRecord(claimID, status) {
  var ss = getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Purchases");
  var rows = sheet.getDataRange().getValues();
  
  var idColIdx = rows[0].indexOf("id");
  var emailColIdx = rows[0].indexOf("email");
  var fullnameColIdx = rows[0].indexOf("fullname");
  var prodIDColIdx = rows[0].indexOf("productID");
  var qtyColIdx = rows[0].indexOf("quantity");
  var ptsColIdx = rows[0].indexOf("pointsCalculated");
  var statusColIdx = rows[0].indexOf("status");

  var foundIdx = -1;
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][idColIdx].toString() === claimID.toString()) {
      foundIdx = i + 1;
      break;
    }
  }

  if (foundIdx === -1) {
    throw new Error("Points claim ID '" + claimID + "' not found in server ledger.");
  }

  // Get current row status
  var currentStatus = rows[foundIdx - 1][statusColIdx];
  if (currentStatus !== "pending") {
    throw new Error("This claim has already been finalized as " + currentStatus.toUpperCase());
  }

  // Write new status
  sheet.getRange(foundIdx, statusColIdx + 1).setValue(status);

  var email = rows[foundIdx - 1][emailColIdx];
  var fullname = rows[foundIdx - 1][fullnameColIdx];
  var productID = rows[foundIdx - 1][prodIDColIdx];
  var qty = Number(rows[foundIdx - 1][qtyColIdx]) || 0;
  var points = Number(rows[foundIdx - 1][ptsColIdx]) || 0;

  if (status === "approved") {
    // 1. Add points to user account row
    adjustUserPointsRecord(email, points);
    
    // 2. Reduce product inventory stock (skip if it is cash redemptions)
    if (productID !== "RED-CASH") {
      adjustProductStockRecord(productID, -qty);
    }
    
    logToAuditSheet("SCAN_OK", "Claim approved on server: Disbursed " + points + " Pts to " + fullname);
  } else {
    logToAuditSheet("SCAN_REJ", "Claim rejected on server: Claims authorization denied for " + fullname + " (ID: " + claimID + ")");
  }

  return { success: true };
}
