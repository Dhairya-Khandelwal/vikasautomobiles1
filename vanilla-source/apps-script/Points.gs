/**
 * Vikas Automobiles - Loyalty Rewards Portal
 * Google Apps Script - Points.gs
 * Points Multipliers, Ledger Updates, Tier Thresholds
 */

// Calculate points based on role and settings multiplier
function calculatePointsForClaim(role, basePoints, quantity) {
  var settings = getSettingsRecord();
  var multiplier = 1.0;
  
  if (role === "retailer") {
    multiplier = Number(settings.retailerMultiplier) || 1.0;
  } else if (role === "mechanic") {
    multiplier = Number(settings.mechanicMultiplier) || 1.2;
  }
  
  return Math.round(basePoints * multiplier * quantity);
}

// Check member loyalty tier (Silver, Gold, Platinum) based on current points
function getLoyaltyTier(points) {
  var settings = getSettingsRecord();
  var silver = Number(settings.silverThreshold) || 5000;
  var gold = Number(settings.goldThreshold) || 15000;
  
  if (points >= gold) {
    return "Gold Partner";
  } else if (points >= silver) {
    return "Silver Partner";
  } else {
    return "Bronze Partner";
  }
}
