/* Announcements Bulletin Broadcaster - Vikas Automobiles */

const NOTIFICATIONS = {
  // Read and render active announcements
  renderDashboardAnnouncements: async (targetContainerId, userRole = "all") => {
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
            <span class="text-[9px] text-slate-500 font-mono">${window.UTILS.formatDate(item.date)}</span>
          </div>
          <p class="text-xs text-slate-400 leading-relaxed">${item.body}</p>
          <div class="absolute right-3 bottom-2 text-slate-900/40 font-mono text-[24px] pointer-events-none select-none font-black uppercase">
            ${item.id}
          </div>
        </div>
      `).join("");
    } catch (e) {
      console.error("Failed to render announcements bulletins", e);
      container.innerHTML = `<p class="text-xs text-red-500 py-3">Error synchronising announcement bulletins.</p>`;
    }
  }
};

window.NOTIFICATIONS = NOTIFICATIONS;
