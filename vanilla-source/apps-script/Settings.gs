/**
 * Vikas Automobiles - Loyalty Rewards Portal
 * Google Apps Script - Settings.gs
 * Administrative rules and points multiplier configurations
 */

// 1. Fetch multiplier settings
function getSettingsRecord() {
  var ss = getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Settings");
  var list = getSheetRowsAsObjects(sheet);
  
  if (list.length > 0) {
    return list[0];
  }
  
  // Fallback defaults
  return {
    retailerMultiplier: 1.0,
    mechanicMultiplier: 1.2,
    silverThreshold: 5000,
    goldThreshold: 15000
  };
}

// 2. Persist updated system configs
function saveSettingsRecord(settings) {
  var ss = getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Settings");
  
  // Headers: ["retailerMultiplier", "mechanicMultiplier", "silverThreshold", "goldThreshold"]
  var newRow = [
    Number(settings.retailerMultiplier) || 1.0,
    Number(settings.mechanicMultiplier) || 1.2,
    Number(settings.silverThreshold) || 5000,
    Number(settings.goldThreshold) || 15000
  ];

  // Overwrite the first settings config row (row 2)
  var range = sheet.getRange(2, 1, 1, newRow.length);
  range.setValues([newRow]);
  
  logToAuditSheet("SETT_MOD", "Corporate policies & points multipliers revised on server.");
  return { success: true };
}
