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

  // Unique identifier generator for database items
  generateID: (prefix = "ID") => {
    return `${prefix}-${Math.floor(100000 + Math.random() * 900000)}`;
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
