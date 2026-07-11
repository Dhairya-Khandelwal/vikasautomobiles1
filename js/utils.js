/* Core Utility Helpers - Vikas Automobiles */

const UTILS = {
  // Local storage abstract reads/writes
  getLocal: (key, fallback = []) => {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch (e) {
      console.error(`Error reading local storage key: ${key}`, e);
      return fallback;
    }
  },

  setLocal: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      
      // Auto-trigger Google Sheets Sync in background if active
      if (window.GOOGLE_SYNC && window.GOOGLE_SYNC.accessToken && window.GOOGLE_SYNC.spreadsheetId) {
        let sheetName = "";
        const keys = window.CONFIG.STORAGE_KEYS;
        if (key === keys.USERS) sheetName = "users";
        else if (key === keys.PRODUCTS) sheetName = "products";
        else if (key === keys.PURCHASES) sheetName = "purchases";
        else if (key === keys.LOGS) sheetName = "logs";
        else if (key === keys.SETTINGS) sheetName = "settings";
        else if (key === keys.BROADCASTS) sheetName = "broadcasts";

        if (sheetName) {
          window.GOOGLE_SYNC.pushToGoogleSheet(sheetName, key).catch(err => {
            console.error(`Auto-trigger Google Sheet upload failed for ${sheetName}:`, err);
          });
        }
      }
    } catch (e) {
      console.error(`Error writing local storage key: ${key}`, e);
    }
  },

  // Beautiful Indian Rupee formatter (INR)
  formatCurrency: (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(amount);
  },

  // Concise timestamp formatting
  formatDate: (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  },

  // Registration email is optional; users without one get an internal
  // placeholder address (see api.js createUser). Show "Not provided"
  // instead of leaking that placeholder domain in the UI.
  displayEmail: (email) => {
    if (!email || /@no-email\.vikas\.internal$/i.test(email)) return "Not provided";
    return email;
  },

  // Unique identifier generator for database items
  generateID: (prefix = "ID") => {
    return `${prefix}-${Math.floor(100000 + Math.random() * 900000)}`;
  },

  // ---- Parts Sticker format (visual template) preference ----
  getStickerTemplateKey: () => {
    const key = localStorage.getItem(window.CONFIG.STORAGE_KEYS.STICKER_TEMPLATE);
    return (key && window.CONFIG.STICKER_TEMPLATES[key]) ? key : "classic";
  },
  getStickerTemplate: () => {
    const key = UTILS.getStickerTemplateKey();
    return window.CONFIG.STICKER_TEMPLATES[key];
  },
  setStickerTemplateKey: (key) => {
    if (!window.CONFIG.STICKER_TEMPLATES[key]) return;
    localStorage.setItem(window.CONFIG.STORAGE_KEYS.STICKER_TEMPLATE, key);
  },

  // ---- Loyalty Pass / Member ID card format (visual template) preference ----
  getPassTemplateKey: () => {
    const key = localStorage.getItem(window.CONFIG.STORAGE_KEYS.PASS_TEMPLATE);
    return (key && window.CONFIG.PASS_TEMPLATES[key]) ? key : "classic";
  },
  getPassTemplate: () => {
    const key = UTILS.getPassTemplateKey();
    return window.CONFIG.PASS_TEMPLATES[key];
  },
  setPassTemplateKey: (key) => {
    if (!window.CONFIG.PASS_TEMPLATES[key]) return;
    localStorage.setItem(window.CONFIG.STORAGE_KEYS.PASS_TEMPLATE, key);
  },

  // Paints the live sticker-label preview card (border/header/QR-frame)
  // with the colors of whichever sticker template is currently selected.
  applyStickerTemplateStyle: () => {
    const t = UTILS.getStickerTemplate();
    const card = document.getElementById("sticker-label");
    if (!card) return;
    card.style.borderColor = t.border;
    const header = card.querySelector(".border-b-2");
    if (header) header.style.borderBottomColor = t.border;
    const idBadge = document.getElementById("label-prod-id");
    if (idBadge) { idBadge.style.backgroundColor = t.headerBg; idBadge.style.color = t.headerText; }
    const qrBox = document.getElementById("qr-canvas-container");
    if (qrBox) qrBox.style.borderColor = t.qrBorder;
    const footer = card.querySelector(".border-t");
    if (footer) footer.style.borderTopColor = t.qrBorder;
  },

  // Paints the live loyalty-pass preview card (border/accent/QR-frame)
  // with the colors of whichever pass template is currently selected.
  applyPassTemplateStyle: () => {
    const t = UTILS.getPassTemplate();
    const card = document.getElementById("loyalty-printable-card");
    if (!card) return;
    card.style.borderColor = t.border;
    const header = card.querySelector(".border-b-2");
    if (header) header.style.borderBottomColor = t.accent;
    const subtitle = card.querySelector("p.text-blue-600");
    if (subtitle) subtitle.style.color = t.accent;
    const qrBox = document.getElementById("modal-qr-code-box");
    if (qrBox) qrBox.style.borderColor = t.accent;
  },

  // Full Global Toast Trigger
  showToast: (message, type = "info") => {
    const root = document.getElementById("toast-root");
    if (!root) return;

    const toast = document.createElement("div");
    toast.className = `p-4 rounded-xl border flex items-center gap-3 shadow-2xl pointer-events-auto transform translate-y-2 opacity-0 transition duration-300 glass-panel animate-fade-in`;
    
    let colorClass = "border-slate-800 text-slate-100";
    let icon = "info";

    if (type === "success") {
      colorClass = "border-emerald-500/20 text-emerald-400 bg-emerald-500/10";
      icon = "check-circle";
    } else if (type === "error") {
      colorClass = "border-red-500/20 text-red-400 bg-red-500/10";
      icon = "alert-octagon";
    } else if (type === "warning") {
      colorClass = "border-amber-500/20 text-amber-400 bg-amber-500/10";
      icon = "alert-triangle";
    }

    toast.className += ` ${colorClass}`;
    toast.innerHTML = `
      <i data-lucide="${icon}" class="w-5 h-5 shrink-0"></i>
      <span class="text-xs font-bold font-sans">${message}</span>
    `;

    root.appendChild(toast);
    lucide.createIcons();

    // Trigger entering slide
    setTimeout(() => {
      toast.classList.remove("translate-y-2", "opacity-0");
    }, 10);

    // Auto dispose toast
    setTimeout(() => {
      toast.classList.add("opacity-0", "translate-y-2");
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 3000);
  },

  // Global Progress indicators loading screen
  showLoader: (text = "Contacting central node...") => {
    const loader = document.getElementById("loading-overlay");
    const label = document.getElementById("loading-text");
    if (loader) {
      if (label) label.innerText = text;
      loader.classList.remove("hidden");
    }
  },

  hideLoader: () => {
    const loader = document.getElementById("loading-overlay");
    if (loader) {
      loader.classList.add("hidden");
    }
  }
};

window.UTILS = UTILS;
