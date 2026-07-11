/* Access Control and Session Authentications - Vikas Automobiles */

const AUTH = {
  // Read active logged-in user profile
  getCurrentSession: () => {
    return window.UTILS.getLocal(window.CONFIG.STORAGE_KEYS.SESSION, null);
  },

  // Save/Renew current login token
  setCurrentSession: (user) => {
    window.UTILS.setLocal(window.CONFIG.STORAGE_KEYS.SESSION, user);
  },

  // Authorize credentials
  login: async (emailOrMobile, password, loginType = "email") => {
    const users = await window.API.getUsers();
    const query = emailOrMobile.trim().toLowerCase();

    // Search profile matches
    const user = users.find(u => {
      if (loginType === "mobile" || /^\d{10}$/.test(query)) {
        return u.mobile === emailOrMobile.trim() && u.password === password;
      }
      return u.email.toLowerCase() === query && u.password === password;
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

  // Registration dispatch
  register: async (userData) => {
    await window.API.createUser(userData);
    return { success: true };
  },

  // Clean logoff
  logout: async () => {
    const session = AUTH.getCurrentSession();
    if (session) {
      await window.API.addLog("AUTH_OUT", `Logoff session destroyed: ${session.fullname}`);
    }
    localStorage.removeItem(window.CONFIG.STORAGE_KEYS.SESSION);
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
    overlay.className = "fixed inset-0 bg-[#0B192C] z-50 flex flex-col items-center justify-center p-6 text-center";

    const isPending = type === "pending";
    const title = isPending ? "Approval Pending" : "Account Suspended";
    const icon = isPending ? "clock" : "shield-alert";
    const iconColor = isPending ? "text-amber-500" : "text-red-500";
    const btnText = "Back to Login";

    overlay.innerHTML = `
      <div class="max-w-md bg-slate-900 border border-slate-800 p-8 rounded-3xl space-y-6 shadow-2xl relative overflow-hidden">
        <div class="inline-flex p-4 rounded-full bg-slate-950 border border-slate-800 ${iconColor} mb-2">
          <i data-lucide="${icon}" class="w-12 h-12"></i>
        </div>
        <div class="space-y-2">
          <h2 class="text-xl font-black text-white uppercase tracking-wider">${title}</h2>
          <p class="text-xs text-slate-400 leading-relaxed">${message}</p>
          <p class="text-[10px] text-slate-500 font-mono">Vikas Automobiles Corporate Node: Hisar, Haryana</p>
        </div>
        <div class="pt-4 border-t border-slate-800/80 flex flex-col gap-3">
          <a href="tel:+919999988888" class="py-2.5 bg-[#FF6B00] hover:bg-[#E56000] text-slate-950 font-black text-xs rounded-xl transition flex items-center justify-center gap-2">
            <i data-lucide="phone-call" class="w-4 h-4"></i>
            <span>Call Corporate Helpline</span>
          </a>
          <button onclick="AUTH.logout()" class="py-2.5 bg-slate-950 border border-slate-800 hover:text-white text-slate-400 font-bold text-xs rounded-xl transition">
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
  }
};

window.AUTH = AUTH;
