/* Global System Configuration - Vikas Automobiles */

const CONFIG = {
  // Google Apps Script Web App Endpoint URL (Will fallback to stateful local db if empty)
  API_URL: "https://script.google.com/macros/s/AKfycbyF49xr3E3qPcHcU9a5iOMa6mXpuuKxGYW7YGMXFs3x5u6J4aXzNYcHNjg8NsFLitqM7A/exec", 

  // Google reCAPTCHA v2 ("I'm not a robot") site key used as the login verification step.
  // This ships with Google's official PUBLIC TEST key, which always validates successfully
  // and is safe to use on any domain during development. Replace it with your own site key
  // from https://www.google.com/recaptcha/admin before going live.
  RECAPTCHA_SITE_KEY: "6Ld85U8tAAAAAJmB3McZgH9l802Rgwd_TtQo9Z0K",

  // Local Storage Database Keys for extreme offline reliability
  STORAGE_KEYS: {
    USERS: "vikas_users_db",
    PRODUCTS: "vikas_products_db",
    PURCHASES: "vikas_purchases_db",
    LOGS: "vikas_audit_logs",
    SETTINGS: "vikas_system_settings",
    SESSION: "vikas_current_session",
    BROADCASTS: "vikas_announcements_db",
    OTP_LOGS: "vikas_otp_logs",
    QR_CLAIMS: "vikas_qr_claims_db",
    REVIEWS: "vikas_product_reviews_db",
    NOTIFICATIONS: "vikas_notifications_db",
    REWARDS: "vikas_rewards_db",
    REDEMPTIONS: "vikas_redemptions_db",
    STICKER_TEMPLATE: "vikas_sticker_template_pref",
    PASS_TEMPLATE: "vikas_pass_template_pref"
  },

  // Selectable visual formats for the printable Parts Sticker (QR label).
  // Swap the "current" pointer via UTILS.setStickerTemplate(key) to restyle
  // every preview / download / print / bulk-zip sticker at once.
  STICKER_TEMPLATES: {
    classic: { label: "Classic Black", headerBg: "#0f172a", headerText: "#ffffff", border: "#000000", qrBorder: "#94a3b8" },
    modern:  { label: "Modern Blue",   headerBg: "#2563eb", headerText: "#ffffff", border: "#2563eb", qrBorder: "#2563eb" },
    premium: { label: "Premium Gold",  headerBg: "#78350f", headerText: "#fef3c7", border: "#b45309", qrBorder: "#b45309" }
  },

  // Selectable visual formats for the Loyalty Pass / member ID card.
  PASS_TEMPLATES: {
    classic: { label: "Classic Navy", accent: "#0f172a", border: "#94a3b8" },
    modern:  { label: "Modern Blue",  accent: "#2563eb", border: "#2563eb" },
    premium: { label: "Premium Gold", accent: "#b45309", border: "#b45309" }
  },

  // Default Policy Multipliers
  DEFAULT_POLICIES: {
    retailerMultiplier: 1.0,
    mechanicMultiplier: 1.2,
    silverThreshold: 5000,
    goldThreshold: 15000,
    companyName: "Vikas Automobiles Ltd.",
    supportEmail: "loyalty@vikasautomobiles.com",
    supportPhone: "+91 99999 88888"
  },

  // Seed Data: Genuine Vikas Automobiles Spares Catalog
  DEFAULT_PRODUCTS: [
    { id: "P-001", itemCode: "HP-0001", name: "Premium Front Disc Brake Pads (Set of 4)", brand: "Vikas Genuine", category: "Brake Systems", mrp: 1650, packSize: "1 Set", retailerPrice: 1250, mechanicPrice: 1450, distributorPrice: 1100, retailerPoints: 120, mechanicPoints: 180, status: "Active", createdDate: "2026-01-10", image: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=150&auto=format&fit=crop" },
    { id: "P-002", itemCode: "HP-0002", name: "Heavy Duty Rear Shock Absorbers (Left/Right)", brand: "Vikas Genuine", category: "Suspension", mrp: 4500, packSize: "1 Pair", retailerPrice: 3800, mechanicPrice: 4100, distributorPrice: 3400, retailerPoints: 350, mechanicPoints: 500, status: "Active", createdDate: "2026-01-12", image: "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=150&auto=format&fit=crop" },
    { id: "P-003", itemCode: "HP-0003", name: "Synthetic Premium Engine Oil 15W-40 5L", brand: "Vikas Lube", category: "Lubricants", mrp: 2100, packSize: "5 Litre Can", retailerPrice: 1650, mechanicPrice: 1850, distributorPrice: 1450, retailerPoints: 150, mechanicPoints: 220, status: "Active", createdDate: "2026-01-15", image: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=150&auto=format&fit=crop" },
    { id: "P-004", itemCode: "HP-0004", name: "Maintenance-Free 12V 35AH Car Battery", brand: "Vikas Power", category: "Electricals", mrp: 4200, packSize: "1 Unit", retailerPrice: 3500, mechanicPrice: 3800, distributorPrice: 3100, retailerPoints: 400, mechanicPoints: 600, status: "Active", createdDate: "2026-01-18", image: "https://images.unsplash.com/photo-1558441719-ff34b0524a24?w=150&auto=format&fit=crop" },
    { id: "P-005", itemCode: "HP-0005", name: "Multi-Coat High Filtration Air Filter", brand: "Vikas Genuine", category: "Filters", mrp: 450, packSize: "1 Unit", retailerPrice: 320, mechanicPrice: 380, distributorPrice: 280, retailerPoints: 30, mechanicPoints: 50, status: "Active", createdDate: "2026-01-20", image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=150&auto=format&fit=crop" },
    { id: "P-006", itemCode: "HP-0006", name: "Genuine Cabin AC Particle Filter", brand: "Vikas Genuine", category: "Filters", mrp: 680, packSize: "1 Unit", retailerPrice: 480, mechanicPrice: 580, distributorPrice: 410, retailerPoints: 50, mechanicPoints: 80, status: "Active", createdDate: "2026-01-22", image: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=150&auto=format&fit=crop" },
    { id: "P-007", itemCode: "HP-0007", name: "Graphite Treated Wiper Blades (24\" & 16\")", brand: "Vikas Clear", category: "Accessories", mrp: 850, packSize: "1 Pair", retailerPrice: 600, mechanicPrice: 720, distributorPrice: 520, retailerPoints: 60, mechanicPoints: 100, status: "Active", createdDate: "2026-01-25", image: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=150&auto=format&fit=crop" },
    { id: "P-008", itemCode: "HP-0008", name: "High Temp Synthetic Wheel Grease 1Kg", brand: "Vikas Lube", category: "Lubricants", mrp: 550, packSize: "1 Kg Tub", retailerPrice: 400, mechanicPrice: 480, distributorPrice: 350, retailerPoints: 40, mechanicPoints: 65, status: "Active", createdDate: "2026-01-28", image: "https://images.unsplash.com/photo-1532635241-17e820add50f?w=150&auto=format&fit=crop" }
  ],

  // Default Rewards Catalogue (with images, stock, and points required)
  DEFAULT_REWARDS: [
    { id: "REW-001", name: "HP Brand Sports T-Shirt", pointsRequired: 500, stock: 45, image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=150&auto=format&fit=crop" },
    { id: "REW-002", name: "Heavy Duty Workshop Toolbox (Set of 36)", pointsRequired: 2500, stock: 12, image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=150&auto=format&fit=crop" },
    { id: "REW-003", name: "₹1,000 Paytm Cash Voucher", pointsRequired: 1000, stock: 150, image: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=150&auto=format&fit=crop" },
    { id: "REW-004", name: "Vikas Executive Genuine Leather Wallet", pointsRequired: 750, stock: 35, image: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=150&auto=format&fit=crop" },
    { id: "REW-005", name: "Premium Hydraulic Car Jack 3 Ton", pointsRequired: 4000, stock: 8, image: "https://images.unsplash.com/photo-1558441719-ff34b0524a24?w=150&auto=format&fit=crop" },
    { id: "REW-006", name: "Pure Gold Plated 10 Gram Collector Coin", pointsRequired: 15000, stock: 3, image: "https://images.unsplash.com/photo-1610375461246-83df859d849d?w=150&auto=format&fit=crop" }
  ],

  // Seed Data for QR Claim Validation Management
  DEFAULT_QR_CLAIMS: [
    { id: "QRC-001", qrCode: "STICKER-HP-0001-9981", itemCode: "HP-0001", productName: "Premium Front Disc Brake Pads (Set of 4)", userName: "Arun Kumar", role: "retailer", date: "2026-07-01T10:30:00.000Z", status: "Pending", remarks: "Awaiting hologram verification", points: 120 },
    { id: "QRC-002", qrCode: "STICKER-HP-0002-4412", itemCode: "HP-0002", productName: "Heavy Duty Rear Shock Absorbers (Left/Right)", userName: "Rajesh Sharma", role: "mechanic", date: "2026-07-02T11:45:00.000Z", status: "Approved", remarks: "Hologram sticker verified manually.", points: 500 },
    { id: "QRC-003", qrCode: "STICKER-HP-0003-1288", itemCode: "HP-0003", productName: "Synthetic Premium Engine Oil 15W-40 5L", userName: "Suresh Gupta", role: "retailer", date: "2026-07-03T14:15:00.000Z", status: "Pending", remarks: "", points: 150 },
    { id: "QRC-004", qrCode: "STICKER-HP-0001-9981", itemCode: "HP-0001", productName: "Premium Front Disc Brake Pads (Set of 4)", userName: "Vikram Singh", role: "mechanic", date: "2026-07-04T09:20:00.000Z", status: "Pending", remarks: "Suspected duplicate scan of QRC-001.", points: 180 },
    { id: "QRC-005", qrCode: "INVALID-CODE-XYZ", itemCode: "", productName: "Unknown Product", userName: "Amit Verma", role: "retailer", date: "2026-07-05T16:05:00.000Z", status: "Pending", remarks: "Does not match any item code prefix.", points: 0 }
  ]
};
window.CONFIG = CONFIG;

