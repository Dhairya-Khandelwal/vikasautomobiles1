/**
 * Vikas Automobiles - Loyalty Rewards Portal
 * Google Apps Script - Products.gs
 * Spares Catalog & Warehouse Stock level operations
 */

// 1. Get all products catalog items
function getProductsList() {
  var ss = getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Products");
  return getSheetRowsAsObjects(sheet);
}

// 2. Add or Edit product card details
function saveProductRecord(product) {
  var ss = getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Products");
  var rows = sheet.getDataRange().getValues();
  
  var idColIdx = rows[0].indexOf("id");
  
  var existingRowIndex = -1;
  if (product.id) {
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][idColIdx].toString() === product.id.toString()) {
        existingRowIndex = i + 1;
        break;
      }
    }
  }

  // Row columns
  // ["id", "name", "brand", "category", "mrp", "packSize", "retailerPrice", "mechanicPrice", "retailerPoints", "mechanicPoints", "stock", "minStock"]
  var id = product.id || ("P-" + Math.floor(100 + Math.random() * 900));
  var rowData = [
    id,
    product.name,
    product.brand || "Vikas Original Parts",
    product.category,
    Number(product.mrp) || 0,
    product.packSize || "1 Unit",
    Number(product.retailerPrice) || 0,
    Number(product.mechanicPrice) || 0,
    Number(product.retailerPoints) || 0,
    Number(product.mechanicPoints) || 0,
    Number(product.stock) || 0,
    Number(product.minStock) || 5
  ];

  if (existingRowIndex !== -1) {
    // Edit existing row
    var range = sheet.getRange(existingRowIndex, 1, 1, rowData.length);
    range.setValues([rowData]);
    logToAuditSheet("PROD_MOD", "Spare Part SKU edited on server: " + product.name + " (" + id + ")");
  } else {
    // Append new row
    sheet.appendRow(rowData);
    logToAuditSheet("PROD_ADD", "New Spare Part product added to server: " + product.name + " (" + id + ")");
  }

  return { success: true };
}

// 3. Subtract/Add Stock quantity on server
function adjustProductStockRecord(id, quantityDelta) {
  var ss = getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Products");
  var rows = sheet.getDataRange().getValues();
  
  var idColIdx = rows[0].indexOf("id");
  var stockColIdx = rows[0].indexOf("stock");
  
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][idColIdx].toString() === id.toString()) {
      var currentStock = Number(rows[i][stockColIdx]) || 0;
      var newStock = Math.max(0, currentStock + quantityDelta);
      sheet.getRange(i + 1, stockColIdx + 1).setValue(newStock);
      return;
    }
  }
  
  throw new Error("Unable to adjust warehouse stock. Product SKU not found: " + id);
}
