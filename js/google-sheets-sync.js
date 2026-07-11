/* Google Sheets Backend Sync Controller - Vikas Automobiles */

const GOOGLE_SYNC = {
  firebaseApp: null,
  firebaseAuth: null,
  accessToken: null,
  spreadsheetId: null,
  isInitializing: false,
  isSyncing: false,

  // Expected sheets and their schema column mappings
  SHEET_SCHEMAS: {
    users: ["fullname", "email", "mobile", "password", "role", "status", "firmName", "address", "pincode", "gstin", "panCard", "points", "regDate", "photo"],
    products: ["id", "name", "brand", "category", "mrp", "packSize", "retailerPrice", "mechanicPrice", "retailerPoints", "mechanicPoints"],
    purchases: ["id", "email", "fullname", "role", "firmName", "productID", "productName", "quantity", "pointsCalculated", "status", "date"],
    logs: ["timestamp", "tag", "text"],
    settings: ["retailerMultiplier", "mechanicMultiplier", "silverThreshold", "goldThreshold"],
    broadcasts: ["id", "subject", "body", "target", "channel", "date"]
  },

  // Dynamic script loader helper
  loadScript: (src) => {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  },

  // Initialize Firebase and restore session state if possible
  init: async function() {
    if (this.isInitializing) return;
    this.isInitializing = true;

    try {
      // 1. Load Firebase SDK Compat libraries
      await this.loadScript('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
      await this.loadScript('https://www.gstatic.com/firebasejs/10.8.0/firebase-auth-compat.js');

      // 2. Fetch config
      const res = await fetch('firebase-applet-config.json');
      if (!res.ok) throw new Error("Could not find firebase-applet-config.json");
      const firebaseConfig = await res.json();

      // 3. Initialize Firebase Compat
      if (!firebase.apps.length) {
        this.firebaseApp = firebase.initializeApp(firebaseConfig);
      } else {
        this.firebaseApp = firebase.app();
      }
      this.firebaseAuth = firebase.auth();

      // Retrieve cached access token from session state if available
      const sessionToken = sessionStorage.getItem('g_sheets_access_token');
      const sessionSheetId = sessionStorage.getItem('g_sheets_spreadsheet_id');
      if (sessionToken) {
        this.accessToken = sessionToken;
        this.spreadsheetId = sessionSheetId;
        console.log("Restored cached Google API session.");
      }

      // Render the floating Google Sheets Sync Panel
      this.renderSyncPanel();

      if (this.accessToken) {
        setTimeout(() => {
          this.backupToDrive(false).catch(err => console.error("Auto backup failed:", err));
        }, 3000);
      }
    } catch (e) {
      console.error("Failed to initialize Google Sheets Sync helper:", e);
    } finally {
      this.isInitializing = false;
    }
  },

  // Connect / Sign In with Google popup flow
  connect: async function() {
    try {
      if (!this.firebaseAuth) {
        await this.init();
      }
      window.UTILS.showLoader("Opening Google Authentication popup...");
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/drive');
      provider.addScope('https://www.googleapis.com/auth/spreadsheets');

      const result = await this.firebaseAuth.signInWithPopup(provider);
      if (result.credential && result.credential.accessToken) {
        this.accessToken = result.credential.accessToken;
        sessionStorage.setItem('g_sheets_access_token', this.accessToken);
        window.UTILS.showToast("Signed in with Google successfully!", "success");
        
        // Find or Create spreadsheet "db"
        await this.findOrCreateSpreadsheet();

        // Trigger automatic daily backup
        setTimeout(() => {
          this.backupToDrive(false).catch(err => console.error("Auto backup failed:", err));
        }, 1000);
      } else {
        throw new Error("No OAuth access token returned.");
      }
    } catch (e) {
      console.error("Google Sheets Connection Failed:", e);
      window.UTILS.showToast(`Connection failed: ${e.message || e}`, "error");
    } finally {
      window.UTILS.hideLoader();
      this.renderSyncPanel();
    }
  },

  // Logout/Disconnect Google Sheets
  disconnect: function() {
    this.accessToken = null;
    this.spreadsheetId = null;
    sessionStorage.removeItem('g_sheets_access_token');
    sessionStorage.removeItem('g_sheets_spreadsheet_id');
    if (this.firebaseAuth) {
      this.firebaseAuth.signOut();
    }
    window.UTILS.showToast("Google Sheets disconnected.", "info");
    this.renderSyncPanel();
  },

  // Find existing spreadsheet named "db" or create a new one
  findOrCreateSpreadsheet: async function() {
    if (!this.accessToken) return;
    
    window.UTILS.showLoader("Locating spreadsheet 'db' in Google Drive...");
    try {
      // Query Drive API
      const q = encodeURIComponent("name='db' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false");
      const url = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)`;
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${this.accessToken}` }
      });
      
      if (res.status === 401) {
        this.disconnect();
        window.UTILS.showToast("Google session expired. Please reconnect.", "warning");
        return;
      }

      if (!res.ok) {
        let errMsg = `Drive API responded with status ${res.status}`;
        try {
          const errJson = await res.json();
          if (errJson && errJson.error && errJson.error.message) {
            errMsg = errJson.error.message;
          }
        } catch (inner) {}
        throw new Error(errMsg);
      }
      const data = await res.json();
      
      if (data.files && data.files.length > 0) {
        this.spreadsheetId = data.files[0].id;
        console.log(`Found existing 'db' spreadsheet: ${this.spreadsheetId}`);
        window.UTILS.showToast("Found existing 'db' spreadsheet in your Google Drive!", "success");
      } else {
        // Create new
        window.UTILS.showLoader("Creating new 'db' spreadsheet in your Google Drive...");
        const createRes = await fetch("https://www.googleapis.com/drive/v3/files", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${this.accessToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name: "db",
            mimeType: "application/vnd.google-apps.spreadsheet"
          })
        });

        if (createRes.status === 401) {
          this.disconnect();
          window.UTILS.showToast("Google session expired. Please reconnect.", "warning");
          return;
        }

        if (!createRes.ok) {
          let errMsg = `Could not create spreadsheet: ${createRes.status}`;
          try {
            const errJson = await createRes.json();
            if (errJson && errJson.error && errJson.error.message) {
              errMsg = errJson.error.message;
            }
          } catch (inner) {}
          throw new Error(errMsg);
        }
        const createData = await createRes.json();
        this.spreadsheetId = createData.id;
        console.log(`Created new 'db' spreadsheet with ID: ${this.spreadsheetId}`);
        window.UTILS.showToast("Created a new 'db' spreadsheet successfully!", "success");
      }
      
      sessionStorage.setItem('g_sheets_spreadsheet_id', this.spreadsheetId);
      
      // Ensure all sheets (users, products, etc.) exist in the spreadsheet
      await this.ensureSheetsExist();

      // Perform initial bidirectional sync
      await this.syncDataBidirectional();

    } catch (e) {
      console.error("Error finding/creating spreadsheet 'db':", e);
      // Format nice message for API not enabled
      let displayMsg = e.message || e;
      if (displayMsg.includes("API has not been used") || displayMsg.includes("disabled")) {
        displayMsg = `Google Sheets or Drive API is disabled. Please open your browser console, find the Google Developers URL in the error logs, and click it to enable the APIs, then try again.`;
      }
      window.UTILS.showToast(`Spreadsheet initialization failed: ${displayMsg}`, "error");
    } finally {
      window.UTILS.hideLoader();
    }
  },

  // Ensure sheets exist inside spreadsheet
  ensureSheetsExist: async function() {
    if (!this.accessToken || !this.spreadsheetId) return;

    try {
      // Get sheet list
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}?fields=sheets(properties(title))`;
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${this.accessToken}` }
      });

      if (res.status === 401) {
        this.disconnect();
        window.UTILS.showToast("Google session expired. Please reconnect.", "warning");
        return;
      }

      if (!res.ok) {
        let errMsg = `Could not fetch sheets metadata: ${res.status}`;
        try {
          const errJson = await res.json();
          if (errJson && errJson.error && errJson.error.message) {
            errMsg = errJson.error.message;
          }
        } catch (inner) {}
        throw new Error(errMsg);
      }
      const data = await res.json();
      
      const existingSheets = (data.sheets || []).map(s => s.properties.title);
      const requiredSheets = Object.keys(this.SHEET_SCHEMAS);
      
      const missingSheets = requiredSheets.filter(s => !existingSheets.includes(s));
      
      if (missingSheets.length > 0) {
        window.UTILS.showLoader("Provisioning database tables inside Google Sheet...");
        const batchUpdateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}:batchUpdate`;
        const batchRes = await fetch(batchUpdateUrl, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${this.accessToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            requests: missingSheets.map(title => ({
              addSheet: { properties: { title } }
            }))
          })
        });

        if (batchRes.status === 401) {
          this.disconnect();
          window.UTILS.showToast("Google session expired. Please reconnect.", "warning");
          return;
        }

        if (!batchRes.ok) {
          let errMsg = "Could not create database tables.";
          try {
            const errJson = await batchRes.json();
            if (errJson && errJson.error && errJson.error.message) {
              errMsg = errJson.error.message;
            }
          } catch (inner) {}
          throw new Error(errMsg);
        }
        console.log("Created missing database tables (sheets) inside 'db' Google Sheet.");
      }
    } catch (e) {
      console.error("Error creating missing sheets:", e);
      throw e;
    }
  },

  // Bidirectional Synchronization Layer
  syncDataBidirectional: async function() {
    if (!this.accessToken || !this.spreadsheetId || this.isSyncing) return;
    this.isSyncing = true;
    window.UTILS.showLoader("Synchronizing data with Google Sheet 'db'...");

    try {
      const keys = window.CONFIG.STORAGE_KEYS;
      const requiredSheets = Object.keys(this.SHEET_SCHEMAS);

      for (const sheetName of requiredSheets) {
        // Map local storage key
        let storageKey = "";
        if (sheetName === "users") storageKey = keys.USERS;
        else if (sheetName === "products") storageKey = keys.PRODUCTS;
        else if (sheetName === "purchases") storageKey = keys.PURCHASES;
        else if (sheetName === "logs") storageKey = keys.LOGS;
        else if (sheetName === "settings") storageKey = keys.SETTINGS;
        else if (sheetName === "broadcasts") storageKey = keys.BROADCASTS;

        if (!storageKey) continue;

        // Fetch sheet contents
        const sheetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${sheetName}!A1:Z1000`;
        const res = await fetch(sheetUrl, {
          headers: { 'Authorization': `Bearer ${this.accessToken}` }
        });

        if (!res.ok) {
          console.warn(`Could not read sheet: ${sheetName}. Pushing current local data.`);
          await this.pushToGoogleSheet(sheetName, storageKey);
          continue;
        }

        const data = await res.json();
        const values = data.values || [];

        if (values.length <= 1) {
          // Sheet is empty or only has headers. Let's push our local data!
          console.log(`Sheet '${sheetName}' is empty. Pushing current offline dataset.`);
          await this.pushToGoogleSheet(sheetName, storageKey);
        } else {
          // Sheet has rows. Let's parse them and merge into local storage!
          const headers = values[0];
          const rows = values.slice(1);
          const sheetItems = rows.map(row => {
            const obj = {};
            headers.forEach((header, idx) => {
              let val = row[idx] !== undefined ? row[idx] : "";
              // Parse booleans and numbers where applicable
              if (val === "true") val = true;
              else if (val === "false") val = false;
              else if (val !== "" && !isNaN(val) && (sheetName !== "users" || (header !== "mobile" && header !== "password" && header !== "gstin"))) {
                val = Number(val);
              }
              obj[header] = val;
            });
            return obj;
          });

          // Perform smart merge to avoid data overwrites
          const localItems = window.UTILS.getLocal(storageKey, []);
          let mergedItems = [];

          if (sheetName === "settings") {
            // Settings is a single object, we take Google Sheets as source of truth
            mergedItems = sheetItems[0] || localItems;
          } else {
            // For array collections, map by id or unique field (email for users, timestamp for logs)
            const idField = (sheetName === "users") ? "email" : (sheetName === "logs") ? "timestamp" : "id";
            const mergedMap = new Map();

            // Load local items first
            localItems.forEach(item => {
              if (item && item[idField]) {
                mergedMap.set(item[idField].toString().toLowerCase(), item);
              }
            });

            // Google Sheets overrides or adds new items
            sheetItems.forEach(item => {
              if (item && item[idField]) {
                mergedMap.set(item[idField].toString().toLowerCase(), item);
              }
            });

            mergedItems = Array.from(mergedMap.values());
            
            // Retain original logs ordering (newest first)
            if (sheetName === "logs" || sheetName === "purchases" || sheetName === "broadcasts") {
              mergedItems.sort((a, b) => {
                const dateA = new Date(a.timestamp || a.date);
                const dateB = new Date(b.timestamp || b.date);
                return dateB - dateA;
              });
            }
          }

          // Save merged data back to localStorage
          window.UTILS.setLocal(storageKey, mergedItems);
          
          // Push final synchronized state back to Google Sheet to ensure consistency
          await this.pushToGoogleSheet(sheetName, storageKey);
        }
      }

      window.UTILS.showToast("Bi-directional Google Sheet synchronization complete!", "success");
      
      // Reload the current page's table lists if functions exist
      if (typeof loadPartners === "function") loadPartners();
      if (typeof loadProducts === "function") loadProducts();
      if (typeof loadPurchases === "function") loadPurchases();
      if (typeof loadLogs === "function") loadLogs();
      if (typeof loadDashboardStats === "function") loadDashboardStats();
      if (typeof loadAnnouncements === "function") loadAnnouncements();

    } catch (e) {
      console.error("Bidirectional sync error:", e);
      window.UTILS.showToast(`Sync failed: ${e.message || e}`, "error");
    } finally {
      window.UTILS.hideLoader();
      this.isSyncing = false;
    }
  },

  // Uploads a base64 data-URI image to the connected Google Drive and makes it publicly
  // viewable via link, returning a short stable URL. Keeps large images out of Sheets
  // cells, which have a hard 50,000-character limit.
  uploadImageToDrive: async function(dataUri, filename) {
    if (!this.accessToken) throw new Error("Not connected to Google Drive.");

    const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.*)$/.exec(dataUri);
    if (!match) throw new Error("Unrecognized image data format.");
    const mimeType = match[1];
    const base64Payload = match[2];

    const metadata = { name: filename, mimeType: mimeType };

    // Construct multipart body (same technique used for the JSON database backup upload)
    const boundary = '314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const body = delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      `Content-Type: ${mimeType}\r\n` +
      'Content-Transfer-Encoding: base64\r\n\r\n' +
      base64Payload +
      closeDelimiter;

    const uploadRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`
      },
      body: body
    });

    if (uploadRes.status === 401) {
      this.disconnect();
      throw new Error("Google session expired. Please reconnect.");
    }
    if (!uploadRes.ok) {
      throw new Error(`Drive photo upload failed with status ${uploadRes.status}`);
    }

    const uploadData = await uploadRes.json();
    const fileId = uploadData.id;

    // Make the file viewable via link so the URL actually resolves to an image
    try {
      await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: 'reader', type: 'anyone' })
      });
    } catch (permErr) {
      console.warn("Could not set public link permission on uploaded photo:", permErr);
    }

    return `https://drive.google.com/uc?export=view&id=${fileId}`;
  },

  // Ensures a user's photo field is a short Drive URL - not a giant base64 blob -
  // before it gets written into a Google Sheets cell. Mutates and returns the user object.
  resolveUserPhotoForSync: async function(user) {
    if (!user || typeof user.photo !== "string" || !user.photo.startsWith("data:image")) {
      return user;
    }
    try {
      const safeName = (user.email || user.mobile || "user").toString().replace(/[^a-zA-Z0-9.@_-]/g, "_");
      const driveUrl = await this.uploadImageToDrive(user.photo, `profile_${safeName}.jpg`);
      user.photo = driveUrl;
    } catch (e) {
      console.warn(`Could not upload photo for ${user.email || user.mobile} to Drive:`, e);
      // Fall back to a placeholder so the sheet write doesn't fail on the oversized cell
      user.photo = "";
    }
    return user;
  },

  // Push single collection to Google Sheets
  pushToGoogleSheet: async function(sheetName, storageKey) {
    if (!this.accessToken || !this.spreadsheetId) return;

    try {
      const headers = this.SHEET_SCHEMAS[sheetName];
      let rawData = window.UTILS.getLocal(storageKey, []);
      
      // Normalize to array if it is a single object (like settings)
      if (!Array.isArray(rawData)) {
        rawData = [rawData];
      }

      // Google Sheets caps any single cell at 50,000 characters. Profile photos are
      // stored locally as base64 data-URIs, which easily blow past that limit, so
      // before writing the "users" table we swap any base64 photo for a small Drive
      // link (uploading it to Drive first if needed).
      if (sheetName === "users" && rawData.length > 0) {
        for (const user of rawData) {
          await this.resolveUserPhotoForSync(user);
        }
        // Persist the resolved (now-small) photo URLs back to localStorage so the app's
        // own UI also switches to the Drive-hosted image, and future syncs don't re-upload.
        window.UTILS.setLocal(storageKey, rawData);
      }

      // Convert array of objects to 2D values array
      const values = [headers];
      rawData.forEach(item => {
        if (!item) return;
        const row = headers.map(header => {
          const val = item[header];
          return val !== undefined && val !== null ? val.toString() : "";
        });
        values.push(row);
      });

      // 1. Clear the sheet range
      const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${sheetName}!A1:Z1000:clear`;
      const clearRes = await fetch(clearUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.accessToken}`,
          "Content-Type": "application/json"
        }
      });

      if (clearRes.status === 401) {
        this.disconnect();
        window.UTILS.showToast("Google session expired. Please reconnect.", "warning");
        return;
      }

      // 2. Write new rows
      const writeUrl = `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${sheetName}!A1?valueInputOption=USER_ENTERED`;
      const res = await fetch(writeUrl, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${this.accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          range: `${sheetName}!A1`,
          majorDimension: "ROWS",
          values: values
        })
      });

      if (res.status === 401) {
        this.disconnect();
        window.UTILS.showToast("Google session expired. Please reconnect.", "warning");
        return;
      }

      if (!res.ok) {
        let errMsg = `Failed to write to sheet ${sheetName}`;
        try {
          const errJson = await res.json();
          if (errJson && errJson.error && errJson.error.message) {
            errMsg = errJson.error.message;
          }
        } catch (inner) {}
        throw new Error(errMsg);
      }
      console.log(`Successfully uploaded dataset to sheet '${sheetName}'`);
    } catch (e) {
      console.error(`Error uploading sheet ${sheetName}:`, e);
      throw e;
    }
  },

  // Daily system data backup to Google Drive
  backupToDrive: async function(isManual = false) {
    if (!this.accessToken) {
      if (isManual) {
        window.UTILS.showToast("Please connect to Google Drive first.", "warning");
      }
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const lastBackupDate = localStorage.getItem('gdrive_last_backup_date');
    if (!isManual && lastBackupDate === todayStr) {
      console.log("Daily autobackup already completed for today:", todayStr);
      return;
    }

    if (isManual) {
      window.UTILS.showLoader("Creating system backup in Google Drive...");
    } else {
      console.log("Triggering automatic daily backup to Google Drive...");
    }

    try {
      const keys = window.CONFIG.STORAGE_KEYS;
      const backupData = {
        backup_date: new Date().toISOString(),
        users: window.UTILS.getLocal(keys.USERS) || [],
        products: window.UTILS.getLocal(keys.PRODUCTS) || [],
        purchases: window.UTILS.getLocal(keys.PURCHASES) || [],
        logs: window.UTILS.getLocal(keys.LOGS) || [],
        settings: window.UTILS.getLocal(keys.SETTINGS) || [],
        broadcasts: window.UTILS.getLocal(keys.BROADCASTS) || [],
        otp_logs: window.UTILS.getLocal(keys.OTP_LOGS) || []
      };

      const fileContent = JSON.stringify(backupData, null, 2);
      const metadata = {
        name: `vikas_backup_${todayStr}.json`,
        mimeType: 'application/json'
      };

      // Construct multipart body
      const boundary = '314159265358979323846';
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelimiter = `\r\n--${boundary}--`;

      const body = delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        fileContent +
        closeDelimiter;

      const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`
        },
        body: body
      });

      if (response.status === 401) {
        this.disconnect();
        if (isManual) window.UTILS.showToast("Google session expired. Please reconnect.", "warning");
        return;
      }

      if (!response.ok) {
        throw new Error(`Drive upload returned status ${response.status}`);
      }

      const resData = await response.json();
      console.log("Database backup file successfully saved in Google Drive. File ID:", resData.id);
      
      localStorage.setItem('gdrive_last_backup_date', todayStr);
      
      if (isManual) {
        window.UTILS.showToast(`System database backup file "vikas_backup_${todayStr}.json" created successfully in your Google Drive!`, "success");
      } else {
        window.UTILS.showToast(`Daily database autobackup saved to Google Drive.`, "success");
      }
      
      // Log backup to audit logs
      try {
        await window.API.addLog("SYSTEM", `Daily Google Drive database backup created: vikas_backup_${todayStr}.json`);
      } catch (logErr) {
        console.warn("Could not log system backup event:", logErr);
      }
    } catch (e) {
      console.error("Backup to Google Drive failed:", e);
      if (isManual) {
        window.UTILS.showToast(`Backup failed: ${e.message || e}`, "error");
      }
    } finally {
      if (isManual) {
        window.UTILS.hideLoader();
      }
    }
  },

  // Direct trigger to push all current local state to Sheet
  pushAllLocalStateToGoogleSheet: async function() {
    if (!this.accessToken || !this.spreadsheetId) {
      window.UTILS.showToast("Connect Google Sheets first.", "warning");
      return;
    }

    window.UTILS.showLoader("Saving all database tables to Google Drive...");
    try {
      const keys = window.CONFIG.STORAGE_KEYS;
      await this.pushToGoogleSheet("users", keys.USERS);
      await this.pushToGoogleSheet("products", keys.PRODUCTS);
      await this.pushToGoogleSheet("purchases", keys.PURCHASES);
      await this.pushToGoogleSheet("logs", keys.LOGS);
      await this.pushToGoogleSheet("settings", keys.SETTINGS);
      await this.pushToGoogleSheet("broadcasts", keys.BROADCASTS);
      window.UTILS.showToast("All local database records saved to Google Sheet!", "success");
    } catch (e) {
      console.error("Push all failed:", e);
      window.UTILS.showToast(`Could not save to Google Sheet: ${e.message || e}`, "error");
    } finally {
      window.UTILS.hideLoader();
    }
  },

  // Beautiful UI Rendering of inline connection panel (No more annoying floating popup!)
  renderSyncPanel: function() {
    let panel = document.getElementById("google-sheets-sync-container");
    if (!panel) {
      // Return early and do not render any floating popup
      return;
    }

    panel.className = "bg-slate-50 border border-slate-200 shadow-sm rounded-xl p-5 space-y-4 text-xs mt-4 block";

    const isConnected = !!this.accessToken;

    if (isConnected) {
      panel.innerHTML = `
        <div class="flex items-center justify-between gap-4 border-b border-slate-200/60 pb-3">
          <div class="flex items-center gap-2">
            <span class="relative flex h-3 w-3">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <div class="truncate">
              <h4 class="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <i data-lucide="database" class="w-4 h-4 text-blue-600"></i>
                Google Sheets Database Active
              </h4>
              <p class="text-[10px] text-slate-500 font-mono truncate max-w-[200px]" title="${this.spreadsheetId || ''}">
                Spreadsheet: db (${this.spreadsheetId ? this.spreadsheetId.substring(0, 8) + '...' : 'Syncing'})
              </p>
            </div>
          </div>
          <button onclick="window.GOOGLE_SYNC.disconnect()" class="text-[11px] font-bold text-red-600 hover:text-red-800 transition cursor-pointer px-2 py-1 bg-red-50 hover:bg-red-100 rounded-lg">
            Disconnect
          </button>
        </div>
        <div class="grid grid-cols-2 gap-2.5 mt-2">
          <button onclick="window.GOOGLE_SYNC.syncDataBidirectional()" class="w-full text-[11px] font-black py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-1.5 shadow transition cursor-pointer">
            <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i>
            Pull & Merge Sheets
          </button>
          <button onclick="window.GOOGLE_SYNC.pushAllLocalStateToGoogleSheet()" class="w-full text-[11px] font-black py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center justify-center gap-1.5 shadow transition cursor-pointer">
            <i data-lucide="upload-cloud" class="w-3.5 h-3.5"></i>
            Push All Local Data
          </button>
        </div>
        <button onclick="window.GOOGLE_SYNC.backupToDrive(true)" class="w-full text-[11px] font-black py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center justify-center gap-1.5 shadow transition cursor-pointer mt-1">
          <i data-lucide="hard-drive" class="w-3.5 h-3.5"></i>
          Backup Database to Google Drive
        </button>
      `;
    } else {
      panel.innerHTML = `
        <div class="flex items-center gap-3 border-b border-slate-200/60 pb-3">
          <div class="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <i data-lucide="file-spreadsheet" class="w-6 h-6"></i>
          </div>
          <div>
            <h4 class="text-xs font-black text-slate-800">Google Sheets Database Integrations</h4>
            <p class="text-[10px] text-slate-500 max-w-[240px] leading-relaxed">
              Connect to a Google Sheet named "db" in your Drive to synchronise and persist all local tables in real-time.
            </p>
          </div>
        </div>
        <button onclick="window.GOOGLE_SYNC.connect()" class="mt-2 w-full text-xs font-black py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl flex items-center justify-center gap-2 shadow-md transition cursor-pointer">
          <svg class="w-4 h-4" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
          </svg>
          Connect Google Sheets & Drive
        </button>
      `;
    }

    if (window.lucide) {
      window.lucide.createIcons({
        node: panel
      });
    }
  }
};

window.GOOGLE_SYNC = GOOGLE_SYNC;

// Auto boot on page load
document.addEventListener("DOMContentLoaded", () => {
  GOOGLE_SYNC.init();
});
