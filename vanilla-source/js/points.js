/* Client-Side Points Ledger & Formula Renderers - Vikas Automobiles */

const POINTS_HELPER = {
  // Determine user loyalty tier based on total points
  getLoyaltyTier: (points, settings = null) => {
    const s = settings || (window.CONFIG && window.CONFIG.DEFAULT_POLICIES) || {
      silverThreshold: 5000,
      goldThreshold: 15000
    };
    
    if (points >= s.goldThreshold) {
      return {
        name: "Gold Partner",
        color: "text-amber-400 bg-amber-400/10 border-amber-500/20",
        badge: "bg-amber-400 text-slate-950",
        icon: "award"
      };
    } else if (points >= s.silverThreshold) {
      return {
        name: "Silver Partner",
        color: "text-slate-300 bg-slate-300/10 border-slate-300/20",
        badge: "bg-slate-300 text-slate-950",
        icon: "shield"
      };
    } else {
      return {
        name: "Bronze Partner",
        color: "text-orange-400 bg-orange-400/10 border-orange-500/20",
        badge: "bg-orange-500 text-white",
        icon: "user"
      };
    }
  }
};

window.POINTS_HELPER = POINTS_HELPER;
