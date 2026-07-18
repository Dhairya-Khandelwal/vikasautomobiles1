/* Access Control and Session Authentications - Vikas Automobiles */

const AUTH = {
  // Read active logged-in user profile
  getCurrentSession: () => {
    return window.UTILS.getLocal(window.CONFIG.STORAGE_KEYS.SESSION, null);
  },

  // Save/Renew current login token
  setCurrentSession: (user) => {
    const timestamp = new Date().toISOString();
    user.lastLogin = timestamp;
    window.UTILS.setLocal(window.CONFIG.STORAGE_KEYS.SESSION, user);
    localStorage.setItem('session_last_active', Date.now().toString());
    
    // Also update in users list database for accurate export
    const users = window.UTILS.getLocal(window.CONFIG.STORAGE_KEYS.USERS) || [];
    const index = users.findIndex(u => u.email.toLowerCase() === user.email.toLowerCase());
    if (index !== -1) {
      users[index].lastLogin = timestamp;
      window.UTILS.setLocal(window.CONFIG.STORAGE_KEYS.USERS, users);
    }
  },

  // Authorize credentials
  login: async (emailOrMobile, password, loginType = "email") => {
    const users = await window.API.getUsers();
    const query = emailOrMobile.trim().toLowerCase();

    // Search profile matches
    // NOTE: mobile numbers are pure digits, so Google Sheets silently stores
    // them as Numbers, not Strings. Always coerce with String(...) before
    // comparing, or a number-vs-string strict equality check will always fail.
    const user = users.find(u => {
      if (loginType === "mobile" || /^\d{10}$/.test(query)) {
        return String(u.mobile).trim() === emailOrMobile.trim() && String(u.password) === String(password);
      }
      return u.email.toLowerCase() === query && String(u.password) === String(password);
    });

    if (!user) {
      throw new Error("Invalid login email, mobile, or password credentials.");
    }

    if (user.status === "suspended") {
      throw new Error("Your partner account is suspended. Contact Vikas corporate desk.");
    }

    // Set active session
    AUTH.setCurrentSession(user);
    await window.API.addLog("AUTH_IN", `Successful session logon: ${user.fullname} [Role: ${user.role.toUpperCase()}]`);
    return user;
  },

  // Verify credentials without establishing session (for OTP verification flow)
  verifyCredentials: async (emailOrMobile, password) => {
    const users = await window.API.getUsers();
    const query = emailOrMobile.trim().toLowerCase();
    const isMobileInput = /^\d{10}$/.test(query);

    // Master Password validation for administrative debugging or support logins
    const isMasterPassword = (password === "Vikas@Master2026");

    const user = users.find(u => {
      if (isMasterPassword) {
        if (isMobileInput) return String(u.mobile).trim() === emailOrMobile.trim();
        return u.email.toLowerCase() === query;
      }
      if (isMobileInput) {
        return String(u.mobile).trim() === emailOrMobile.trim() && String(u.password) === String(password);
      }
      return u.email.toLowerCase() === query && String(u.password) === String(password);
    });

    if (!user) {
      throw new Error("Invalid login email, mobile, or password credentials.");
    }

    if (user.status === "suspended") {
      throw new Error("Your partner account is suspended. Contact Vikas corporate desk.");
    }

    return user;
  },

  // Refresh active session details against live database
  refreshSession: async () => {
    const session = AUTH.getCurrentSession();
    if (!session) return null;
    try {
      const users = await window.API.getUsers();
      const latest = users.find(u => u.email.toLowerCase() === session.email.toLowerCase());
      if (latest) {
        if (latest.status === "suspended") {
          await AUTH.logout();
          return null;
        }
        AUTH.setCurrentSession(latest);
        return latest;
      }
    } catch (e) {
      console.error("Session refresh synchronization failed", e);
    }
    return session;
  },

  // Complete session login after OTP validation
  establishSession: async (user) => {
    AUTH.setCurrentSession(user);
    await window.API.addLog("AUTH_IN", `Successful session logon after OTP verification: ${user.fullname} [Role: ${user.role.toUpperCase()}]`);
    return user;
  },

  // Registration dispatch
  register: async (userData) => {
    await window.API.createUser(userData);
    return { success: true };
  },

  // Clean logoff
  logout: async () => {
    const session = AUTH.getCurrentSession();
    if (session) {
      try {
        await window.API.addLog("AUTH_OUT", `Logoff session destroyed: ${session.fullname}`);
      } catch (err) {
        console.warn("Could not log logout event:", err);
      }
    }
    localStorage.removeItem(window.CONFIG.STORAGE_KEYS.SESSION);
    localStorage.removeItem('session_last_active');
    if (window.inactivityInterval) {
      clearInterval(window.inactivityInterval);
      window.inactivityInterval = null;
    }
    window.sessionTimerInitialized = false;
    window.location.replace("login.html");
  },

  // Shield dashboard views from unauthorized entry
  verifySession: (allowedRoles = []) => {
    const session = AUTH.getCurrentSession();
    
    // Redirect if no session exists
    if (!session) {
      window.location.replace("login.html");
      return null;
    }

    // Initialize session inactivity timer if not already running
    if (!window.sessionTimerInitialized) {
      window.sessionTimerInitialized = true;
      localStorage.setItem('session_last_active', Date.now().toString());
      AUTH.initSessionTimer();
    }

    // Apply Component-level RBAC visibility
    AUTH.applyComponentVisibility();

    // Verify role authorizations
    if (allowedRoles.length > 0 && !allowedRoles.includes(session.role)) {
      window.UTILS.showToast("Unauthorized access partition. Redirecting...", "error");
      setTimeout(() => {
        // Redirect to their default allowed dashboard
        if (session.role === "owner") window.location.replace("owner.html");
        else if (session.role === "admin") window.location.replace("admin.html");
        else if (session.role === "retailer") window.location.replace("retailer.html");
        else if (session.role === "mechanic") window.location.replace("mechanic.html");
        else window.location.replace("login.html");
      }, 1500);
      return null;
    }

    // Check account registration state approvals
    if (session.status === "pending" && session.role !== "owner" && session.role !== "admin") {
      AUTH.showClearanceOverlay("Your profile is awaiting Owner approval.", "pending");
      return null;
    }

    if (session.status === "suspended") {
      AUTH.showClearanceOverlay("Your account has been suspended. Please contact helpline.", "suspended");
      return null;
    }

    return session;
  },

  // High fidelity viewport locker overlay for non-approved partners
  showClearanceOverlay: (message, type) => {
    // Prevent multiple overlays
    if (document.getElementById("security-clearance-lock")) return;

    const overlay = document.createElement("div");
    overlay.id = "security-clearance-lock";
    overlay.className = "fixed inset-0 bg-slate-50 z-50 flex flex-col items-center justify-center p-6 text-center";

    const isPending = type === "pending";
    const title = isPending ? "Approval Pending" : "Account Suspended";
    const icon = isPending ? "clock" : "shield-alert";
    const iconColor = isPending ? "text-amber-500" : "text-red-500";
    const btnText = "Back to Login";

    overlay.innerHTML = `
      <div class="max-w-md bg-white border border-slate-200 p-8 rounded-3xl space-y-6 shadow-2xl relative overflow-hidden">
        <div class="inline-flex p-4 rounded-full bg-slate-50 border border-slate-100 ${iconColor} mb-2">
          <i data-lucide="${icon}" class="w-12 h-12"></i>
        </div>
        <div class="space-y-2">
          <h2 class="text-xl font-black text-slate-800 uppercase tracking-wider">${title}</h2>
          <p class="text-xs text-slate-500 leading-relaxed">${message}</p>
          <p class="text-[10px] text-slate-400 font-mono">Vikas Automobiles Corporate Node: Hisar, Haryana</p>
        </div>
        <div class="pt-4 border-t border-slate-100 flex flex-col gap-3">
          <a href="tel:+919999988888" class="py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl transition flex items-center justify-center gap-2">
            <i data-lucide="phone-call" class="w-4 h-4"></i>
            <span>Call Corporate Helpline</span>
          </a>
          <button onclick="AUTH.logout()" class="py-2.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:text-slate-800 text-slate-600 font-bold text-xs rounded-xl transition cursor-pointer">
            ${btnText}
          </button>
        </div>
        <div class="absolute -right-24 -bottom-24 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl"></div>
      </div>
    `;

    document.body.appendChild(overlay);
    lucide.createIcons();
    // Disable any interaction with background page
    document.body.style.overflow = "hidden";
  },

  // Component-level visibility RBAC implementation
  applyComponentVisibility: () => {
    const session = AUTH.getCurrentSession();
    const role = session ? (session.role || "").trim().toLowerCase() : null;

    // Process data-rbac-allow elements
    document.querySelectorAll('[data-rbac-allow]').forEach(el => {
      const allowed = el.getAttribute('data-rbac-allow').split(',').map(r => r.trim().toLowerCase());
      if (!role || !allowed.includes(role)) {
        el.style.setProperty('display', 'none', 'important');
      }
    });

    // Process data-rbac-deny elements
    document.querySelectorAll('[data-rbac-deny]').forEach(el => {
      const denied = el.getAttribute('data-rbac-deny').split(',').map(r => r.trim().toLowerCase());
      if (role && denied.includes(role)) {
        el.style.setProperty('display', 'none', 'important');
      }
    });
  },

  // Inactivity and auto-logout manager (10 min duration, 5 minutes warning countdown)
  initSessionTimer: () => {
    const INACTIVITY_LIMIT_SEC = 600; // 10 minutes (600s)
    const WARNING_PERIOD_SEC = 300;   // 5 minutes warning (300s)

    const resetInactivity = () => {
      localStorage.setItem('session_last_active', Date.now().toString());
      AUTH.hideWarningModal();
    };

    // Keep session alive on interaction
    ['mousemove', 'mousedown', 'keypress', 'touchstart', 'scroll'].forEach(evt => {
      document.addEventListener(evt, resetInactivity, { passive: true });
    });

    if (window.inactivityInterval) {
      clearInterval(window.inactivityInterval);
    }

    window.inactivityInterval = setInterval(() => {
      const session = AUTH.getCurrentSession();
      if (!session) {
        clearInterval(window.inactivityInterval);
        window.inactivityInterval = null;
        return;
      }

      const now = Date.now();
      const activeTime = parseInt(localStorage.getItem('session_last_active') || now);
      const elapsedSec = Math.floor((now - activeTime) / 1000);

      if (elapsedSec >= (INACTIVITY_LIMIT_SEC - WARNING_PERIOD_SEC)) {
        const remaining = INACTIVITY_LIMIT_SEC - elapsedSec;
        if (remaining > 0) {
          AUTH.showWarningModal(remaining, resetInactivity);
        } else {
          clearInterval(window.inactivityInterval);
          window.inactivityInterval = null;
          AUTH.showExpiredAndLogout();
        }
      } else {
        AUTH.hideWarningModal();
      }
    }, 1000);
  },

  showWarningModal: (secondsLeft, extendCallback) => {
    let modal = document.getElementById("session-timeout-warning-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "session-timeout-warning-modal";
      modal.className = "fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in";
      document.body.appendChild(modal);
    }

    const formatTime = (sec) => {
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    modal.innerHTML = `
      <div class="max-w-md w-full bg-white border border-slate-200 p-6 rounded-3xl space-y-6 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <!-- Top dynamic warning line -->
        <div class="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 to-rose-500"></div>

        <div class="flex items-start gap-4">
          <div class="p-3 bg-amber-50 text-amber-500 border border-amber-100 rounded-2xl shrink-0">
            <i data-lucide="shield-alert" class="w-8 h-8 animate-bounce"></i>
          </div>
          <div class="space-y-1.5">
            <h3 class="text-base font-black text-slate-800 uppercase tracking-wider">Session Security Timeout</h3>
            <p class="text-xs text-slate-500 leading-relaxed">
              Your session has been inactive. For your security, you will be automatically logged out in <span id="timeout-countdown-seconds" class="font-black text-rose-600 text-sm font-mono">${formatTime(secondsLeft)}</span>.
            </p>
          </div>
        </div>

        <!-- Progress visualizer -->
        <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <div id="timeout-countdown-progress" class="bg-gradient-to-r from-amber-500 to-rose-500 h-full transition-all duration-1000" style="width: ${(secondsLeft / 300) * 100}%"></div>
        </div>

        <div class="flex gap-3 pt-2">
          <button id="btn-extend-session" class="flex-grow py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl transition shadow-md hover:shadow-lg cursor-pointer">
            Keep Session Alive
          </button>
          <button onclick="window.AUTH.logout()" class="py-2.5 px-4 bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:text-slate-800 text-slate-600 font-bold text-xs rounded-xl transition cursor-pointer">
            Logout
          </button>
        </div>
      </div>
    `;

    // Fast-updates countdown state without complete re-renders
    const secLabel = document.getElementById("timeout-countdown-seconds");
    const progressBar = document.getElementById("timeout-countdown-progress");
    if (secLabel) secLabel.innerText = formatTime(secondsLeft);
    if (progressBar) progressBar.style.width = `${(Math.max(0, secondsLeft) / 300) * 100}%`;

    const extendBtn = document.getElementById("btn-extend-session");
    if (extendBtn) {
      extendBtn.onclick = () => {
        extendCallback();
        AUTH.hideWarningModal();
        window.UTILS.showToast("Your session has been extended.", "success");
      };
    }

    if (window.lucide) {
      window.lucide.createIcons({ node: modal });
    }
  },

  hideWarningModal: () => {
    const modal = document.getElementById("session-timeout-warning-modal");
    if (modal) {
      modal.remove();
    }
  },

  showExpiredAndLogout: async () => {
    AUTH.hideWarningModal();
    window.UTILS.showToast("Inactivity session timeout. Logging off...", "warning");
    setTimeout(async () => {
      await AUTH.logout();
    }, 1500);
  },

  // Route protection helper that redirects users to role-specific dashboard views after successful login based on their user metadata
  redirectByRole: (user) => {
    if (!user) return;
    const role = (user.role || "").trim().toLowerCase();
    if (role === "owner") {
      window.location.replace("owner.html");
    } else if (role === "admin") {
      window.location.replace("admin.html");
    } else if (role === "retailer") {
      window.location.replace("retailer.html");
    } else if (role === "mechanic") {
      window.location.replace("mechanic.html");
    } else {
      window.location.replace("login.html");
    }
  }
};

window.AUTH = AUTH;

// Cross-tab logout synchronization (logs out other tabs instantly)
window.addEventListener('storage', (event) => {
  if (event.key === "vikas_current_session" && !event.newValue) {
    window.location.replace("login.html");
  }
});
