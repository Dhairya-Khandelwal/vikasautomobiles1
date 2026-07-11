/* Announcements Bulletin Broadcaster - Vikas Automobiles */

const NOTIFICATIONS = {
  // Read and render active announcements
  // `deletable` (default false) shows a delete button per bulletin — only pass
  // true from owner/admin views; retailer/mechanic feeds stay read-only.
  renderDashboardAnnouncements: async (targetContainerId, userRole = "all", deletable = false) => {
    const container = document.getElementById(targetContainerId);
    if (!container) return;

    try {
      const announcements = await window.API.getAnnouncements();
      
      // Filter by role match
      const filtered = announcements.filter(a => 
        a.target === "all" || a.target === userRole
      );

      if (filtered.length === 0) {
        container.innerHTML = `
          <p class="text-xs text-slate-500 font-mono text-center py-6">No active bonus schemes available right now.</p>
        `;
        return;
      }

      container.innerHTML = filtered.map(item => `
        <div class="bg-slate-950 p-4 rounded-xl border border-slate-800/60 hover:border-slate-700/80 transition space-y-2 relative overflow-hidden">
          <div class="flex items-center justify-between">
            <h4 class="font-bold text-white text-xs">${item.subject}</h4>
            <div class="flex items-center gap-2">
              <span class="text-[9px] text-slate-500 font-mono">${window.UTILS.formatDate(item.date)}</span>
              ${deletable ? `<button onclick="window.NOTIFICATIONS.handleDeleteAnnouncement('${item.id}', '${targetContainerId}', '${userRole}', ${deletable})" class="text-slate-500 hover:text-rose-500 transition" title="Delete announcement"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>` : ""}
            </div>
          </div>
          <p class="text-xs text-slate-400 leading-relaxed">${item.body}</p>
          <div class="absolute right-3 bottom-2 text-slate-900/40 font-mono text-[24px] pointer-events-none select-none font-black uppercase">
            ${item.id}
          </div>
        </div>
      `).join("");

      if (deletable && window.lucide) window.lucide.createIcons();
    } catch (e) {
      console.error("Failed to render announcements bulletins", e);
      container.innerHTML = `<p class="text-xs text-red-500 py-3">Error synchronising announcement bulletins.</p>`;
    }
  },

  handleDeleteAnnouncement: async (id, targetContainerId, userRole, deletable) => {
    const confirmed = confirm("Are you sure you want to permanently delete this announcement? This cannot be undone.");
    if (!confirmed) return;

    window.UTILS.showLoader("Deleting announcement...");
    try {
      await window.API.deleteAnnouncement(id);
      window.UTILS.showToast("Announcement permanently deleted.", "success");
      await NOTIFICATIONS.renderDashboardAnnouncements(targetContainerId, userRole, deletable);
    } catch (err) {
      console.error("Failed to delete announcement", err);
      window.UTILS.showToast(err.message, "error");
    } finally {
      window.UTILS.hideLoader();
    }
  },

  // Populate the "Direct Helpline Support" widget (#support-phone / #support-email)
  // from the owner's Corporate Settings instead of static hardcoded text.
  loadHelplineInfo: async () => {
    const phoneEl = document.getElementById("support-phone");
    const emailEl = document.getElementById("support-email");
    if (!phoneEl && !emailEl) return;

    try {
      const settings = await window.API.getSettings();
      if (phoneEl) phoneEl.innerText = settings.supportPhone || "+91 99999 88888";
      if (emailEl) emailEl.innerText = settings.supportEmail || "loyalty@vikasautomobiles.com";
    } catch (e) {
      console.error("Failed to load helpline info", e);
    }
  }
};

window.NOTIFICATIONS = NOTIFICATIONS;
