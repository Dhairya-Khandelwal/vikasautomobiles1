# Loyalty Rewards Portal — Vikas Automobiles

This is a complete, enterprise-grade, role-based Loyalty Management System designed for **Vikas Automobiles**. It supports four distinct user roles (Owner, Admin, Retailer, and Mechanic) with full server-side role validation, Google Sheets as the database, and Google Apps Script as the REST API backend.

## 👥 Roles & Registrations
1. **Owner** (Specific/Restricted Access): Complete system control, business analytics, admin approvals, points policies, financial reports.
2. **Admin** (Specific/Restricted Access): Daily operations, product catalog, inventory tracking, QR generation, purchase verification.
3. **Retailer** (Public Registration): Scans QR codes, view Retailer Price and Retailer Points, place purchase/point claims, redeem cashback/rewards.
4. **Mechanic** (Public Registration): Scans QR codes, view Mechanic Price and Mechanic Points, earn loyalty points, redeem accessories/coupons.

*Note: New registrations for Retailer and Mechanic are open to everyone but start with `Pending` status and must be approved by the Owner or Admin before they can log in. Owner and Admin accounts cannot be publicly registered and must be created directly or approved securely.*

## 📁 Project Folder Structure

This directory contains the pure HTML5, CSS3, and Vanilla JS implementation, perfectly separated, modularized, and ready to be deployed.

```text
├── index.html                    # Public homepage / portal router
├── login.html                    # Secure Unified Login (Email/Mobile/OTP)
├── register.html                 # Comprehensive Multi-Role Registration (Retailer & Mechanic)
├── owner.html                    # Owner Administrative & Financial Dashboard
├── admin.html                    # Admin Operations & Inventory Dashboard
├── retailer.html                 # Retailer Scans, Catalog, & Redemption Portal
├── mechanic.html                 # Mechanic Point Claims & Reward Portal
├── README.md                     # Documentation & Deployment Instructions
│
├── css/                          # 🎨 Stylesheets
│   ├── styles.css                # Base & Global Styles (Automotive Dark/Orange)
│   ├── login.css                 # Login & Registration Page Styles
│   ├── owner.css                 # Owner Dashboard Layout & Panels
│   ├── admin.css                 # Admin Operational Styles
│   ├── dashboard.css             # Shared Dashboard Grid & Card Elements
│   └── responsive.css            # Responsive Breakpoints for Mobile/Tablet/Desktop
│
├── js/                           # ⚙️ Client-Side Vanilla JS Logic
│   ├── config.js                 # API Endpoints & System Constants
│   ├── login.js                  # Login Page Form Handlers & Session Setups
│   ├── register.js               # Multi-Step Registration & Media Upload
│   ├── auth.js                   # Client-Side Session & Role Verification
│   ├── api.js                    # Generic Fetch & Error Wrapper for Gas API
│   ├── owner.js                  # Owner Analytics, Settings, & Rules
│   ├── admin.js                  # Admin Product, Purchase, & User Management
│   ├── retailer.js               # Retailer QR Scan & Points Redemption
│   ├── mechanic.js               # Mechanic Point Scans & Catalog Views
│   ├── products.js               # Shared Product Listing & Detail Modal Controls
│   ├── inventory.js              # Shared Stock Ledger & Purchase Forms
│   ├── purchase.js               # Shared Purchase Workflow Verification
│   ├── points.js                 # Points Ledger & Formula Renderers
│   ├── notifications.js          # Unified In-App Toast & Alert Center
│   ├── reports.js                # Report Generation & Data Exporter (PDF/CSV/XLS)
│   └── utils.js                  # Crypto helper, QR parser, and date utilities
│
└── apps-script/                  # ☁️ Backend Google Apps Script (GAS) Code
    ├── Code.gs                   # Core doGet() / doPost() router & Middleware
    ├── Auth.gs                   # Password hashing, Session manager, OTP verification
    ├── Users.gs                  # Registration, approval, user deletion & roles
    ├── Products.gs               # Product CRUD & Bulk uploading
    ├── Purchases.gs              # Multi-tier verification & purchase workflow
    ├── Inventory.gs              # Dynamic Stock Ledger & Inventory sync
    ├── Points.gs                 # Points multipliers, ledger updates, tier thresholds
    ├── Reports.gs                # Financial, Product, Purchase, & Activity reports
    ├── Settings.gs               # Owner Settings & point formulas
    └── Notifications.gs          # SMTP email notifications & SMS hooks
```

## 🚀 Deployment Instructions

### 1. Google Sheets (Database) Setup
We use a single Google Spreadsheet as our complete relational database with 14 tables:
- `Registration`, `Admins`, `Owners`
- `Products`, `Purchase Requests`, `Purchase Approvals`, `Inventory`
- `Points Ledger`, `Rewards`, `Notifications`, `Settings`, `Activity Logs`, `Sessions`, `Reports`

*Note: The Google Apps Script automatically bootstraps all of these tables with their correct schemas on its first run if they are missing.*

### 2. Google Apps Script (Backend) Setup
1. Create a new Google Sheet at [Google Sheets](https://sheets.google.com).
2. Click on **Extensions > Apps Script**.
3. Create files named matching the list in `apps-script/` and paste their contents.
4. Click on **Deploy > New Deployment**.
5. Select **Web App**.
6. Set **Execute as:** `Me (your-email@gmail.com)`.
7. Set **Who has access:** `Anyone`.
8. Copy the generated **Web App URL**.

### 3. Frontend Deployment
1. Paste your copied Google Apps Script **Web App URL** into `/js/config.js` as the `API_BASE_URL`.
2. Push this folder to a GitHub repository.
3. Enable **GitHub Pages** in the repository settings (under Settings > Pages, select main branch).
4. Your application is now live at `https://<your-username>.github.io/<repo-name>/`.
