/* Global System Configuration - Vikas Automobiles */

const CONFIG = {
  // Google Apps Script Web App Endpoint URL (Will fallback to stateful local db if empty)
  API_URL: "", 

  // Local Storage Database Keys for extreme offline reliability
  STORAGE_KEYS: {
    USERS: "vikas_users_db",
    PRODUCTS: "vikas_products_db",
    PURCHASES: "vikas_purchases_db",
    LOGS: "vikas_audit_logs",
    SETTINGS: "vikas_system_settings",
    SESSION: "vikas_current_session",
    BROADCASTS: "vikas_announcements_db"
  },

  // Default Policy Multipliers
  DEFAULT_POLICIES: {
    retailerMultiplier: 1.0,
    mechanicMultiplier: 1.2,
    silverThreshold: 5000,
    goldThreshold: 15000
  },

  // Seed Data: Genuine Vikas Automobiles Spares Catalog
  DEFAULT_PRODUCTS: [
    { id: "P-001", name: "Premium Front Disc Brake Pads (Set of 4)", brand: "Vikas Genuine", category: "Brake Systems", mrp: 1650, packSize: "1 Set", retailerPrice: 1250, mechanicPrice: 1450, retailerPoints: 120, mechanicPoints: 180, stock: 45, minStock: 10 },
    { id: "P-002", name: "Heavy Duty Rear Shock Absorbers (Left/Right)", brand: "Vikas Genuine", category: "Suspension", mrp: 4500, packSize: "1 Pair", retailerPrice: 3800, mechanicPrice: 4100, retailerPoints: 350, mechanicPoints: 500, stock: 12, minStock: 5 },
    { id: "P-003", name: "Synthetic Premium Engine Oil 15W-40 5L", brand: "Vikas Lube", category: "Lubricants", mrp: 2100, packSize: "5 Litre Can", retailerPrice: 1650, mechanicPrice: 1850, retailerPoints: 150, mechanicPoints: 220, stock: 80, minStock: 15 },
    { id: "P-004", name: "Maintenance-Free 12V 35AH Car Battery", brand: "Vikas Power", category: "Electricals", mrp: 4200, packSize: "1 Unit", retailerPrice: 3500, mechanicPrice: 3800, retailerPoints: 400, mechanicPoints: 600, stock: 18, minStock: 4 },
    { id: "P-005", name: "Multi-Coat High Filtration Air Filter", brand: "Vikas Genuine", category: "Filters", mrp: 450, packSize: "1 Unit", retailerPrice: 320, mechanicPrice: 380, retailerPoints: 30, mechanicPoints: 50, stock: 110, minStock: 20 },
    { id: "P-006", name: "Genuine Cabin AC Particle Filter", brand: "Vikas Genuine", category: "Filters", mrp: 680, packSize: "1 Unit", retailerPrice: 480, mechanicPrice: 580, retailerPoints: 50, mechanicPoints: 80, stock: 3, minStock: 10 },
    { id: "P-007", name: "Graphite Treated Wiper Blades (24\" & 16\")", brand: "Vikas Clear", category: "Accessories", mrp: 850, packSize: "1 Pair", retailerPrice: 600, mechanicPrice: 720, retailerPoints: 60, mechanicPoints: 100, stock: 65, minStock: 12 },
    { id: "P-008", name: "High Temp Synthetic Wheel Grease 1Kg", brand: "Vikas Lube", category: "Lubricants", mrp: 550, packSize: "1 Kg Tub", retailerPrice: 400, mechanicPrice: 480, retailerPoints: 40, mechanicPoints: 65, stock: 4, minStock: 8 }
  ]
};
window.CONFIG = CONFIG;
