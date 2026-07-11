/**
 * Vikas Automobiles - Loyalty Rewards Portal
 * Google Apps Script - Reports.gs
 * System audit reports and centralized logging
 */

// 1. Get central audit logs
function getAuditLogsList() {
  var ss = getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Logs");
  var logs = getSheetRowsAsObjects(sheet);
  
  // Sort logs: newest first
  return logs.reverse();
}

// 2. Log standard server actions to Audit tab
function logToAuditSheet(tag, text) {
  try {
    var ss = getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Logs");
    if (!sheet) return;

    // Headers: ["timestamp", "tag", "text"]
    sheet.appendRow([
      new Date().toISOString(),
      tag,
      text
    ]);
    
    // Constrain size to prevent sheets bloat
    var lastRow = sheet.getLastRow();
    if (lastRow > 500) {
      sheet.deleteRow(2); // Delete the oldest log row (Row 2, since Row 1 is header)
    }
  } catch(e) {
    Logger.log("Audit logger failure: " + e.message);
  }
}
