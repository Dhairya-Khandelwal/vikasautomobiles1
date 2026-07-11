/**
 * Vikas Automobiles - Loyalty Rewards Portal
 * Google Apps Script - Auth.gs
 * Authentications and credential management services
 */

// Force reset password for account (Owner action)
function forceResetPasswordRecord(email, newPassword) {
  var ss = getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Users");
  var rows = sheet.getDataRange().getValues();
  
  if (rows.length <= 1) {
    throw new Error("No user records exist in the database.");
  }
  
  var emailColIdx = rows[0].indexOf("email");
  var passColIdx = rows[0].indexOf("password");
  
  if (emailColIdx === -1 || passColIdx === -1) {
    throw new Error("User columns structure mismatch.");
  }

  var found = false;
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][emailColIdx].toString().toLowerCase() === email.toLowerCase()) {
      sheet.getRange(i + 1, passColIdx + 1).setValue(newPassword);
      found = true;
      break;
    }
  }

  if (!found) {
    throw new Error("Requested user account '" + email + "' not found.");
  }

  logToAuditSheet("SEC_RESET", "Password force reset completed on server for: " + email);
  return { success: true, message: "Password updated successfully." };
}
