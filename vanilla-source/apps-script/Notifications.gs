/**
 * Vikas Automobiles - Loyalty Rewards Portal
 * Google Apps Script - Notifications.gs
 * System email alert dispatchers and notification logs
 */

// Dispatch custom registration approval notifications
function sendAccountApprovalNotification(email, name, role) {
  try {
    var subject = "Vikas Automobiles Loyalty Portal: Account Approved!";
    var body = "Bhai " + name + ",\n\n" +
               "Your registration request for the Vikas Automobiles Loyalty Rewards Portal has been APPROVED by owner.\n" +
               "You can now login using your registered credentials to scan packages and earn instant cash payouts!\n\n" +
               "Log in now: https://vikas-auto-loyalty.github.io/\n\n" +
               "Regards,\n" +
               "Vikas Sethi\n" +
               "Owner, Vikas Automobiles";
    
    // Attempt sending via real Google Mail app if authorized, or fallback gracefully
    MailApp.sendEmail(email, subject, body);
    logToAuditSheet("NOTIF_OK", "Mail notification sent to " + email);
  } catch (e) {
    // Fail silently, as MailApp might exceed daily quotes during testing
    Logger.log("Mail Dispatcher skipped: " + e.message);
  }
}

// Alert warehouse managers when SKU levels fall below safety margins
function sendLowStockAlertNotification(id, name, remaining) {
  try {
    var adminEmail = "admin@vikas.com";
    var subject = "ALERT: SKU Stock Critical - " + id;
    var body = "Hi Admin,\n\n" +
               "The following spare part SKU has fallen below its safety margin:\n" +
               "ID: " + id + "\n" +
               "Name: " + name + "\n" +
               "Current Stock: " + remaining + "\n\n" +
               "Please trigger a warehouse purchase order as soon as possible.\n\n" +
               "System Automation Node";
               
    MailApp.sendEmail(adminEmail, subject, body);
  } catch (e) {
    Logger.log("Stock mail dispatcher skipped: " + e.message);
  }
}
