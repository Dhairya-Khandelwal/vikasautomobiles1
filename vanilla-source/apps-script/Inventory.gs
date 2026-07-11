/**
 * Vikas Automobiles - Loyalty Rewards Portal
 * Google Apps Script - Inventory.gs
 * Warehouse supply reports and stock operations
 */

// Retrieve all products running below safety thresholds
function getLowStockReport() {
  var products = getProductsList();
  var alerts = [];
  
  for (var i = 0; i < products.length; i++) {
    var p = products[i];
    var stock = Number(p.stock) || 0;
    var minStock = Number(p.minStock) || 5;
    if (stock <= minStock) {
      alerts.push(p);
    }
  }
  return alerts;
}

// Bulk refill stock for a specific spare part
function refillPartSKUStock(id, addedQuantity) {
  adjustProductStockRecord(id, addedQuantity);
  logToAuditSheet("STOCK_ADD", "Manual warehouse restock for SKU: " + id + " (Added " + addedQuantity + " units)");
  return { success: true };
}
