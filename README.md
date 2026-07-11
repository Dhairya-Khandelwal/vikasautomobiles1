# Loyalty Rewards Portal — Vikas Automobiles

A static, client-side loyalty & rewards management portal (Owner, Admin, Retailer, Mechanic roles). No backend required — data is stored in the browser (localStorage) with an optional Google Apps Script API for a real backend (see `js/config.js` → `API_URL`).

The whole app is plain HTML/CSS/JS at the repo root (`index.html`, `css/`, `js/`, `assets/`) — no build tool is required to run it. `build.js` just copies these into `dist/` for a clean deploy folder.

> Note: `src/`, `vite.config.ts`, `tsconfig.json` are leftover scaffolding from an AI Studio template and are **not** used by this app — safe to ignore or delete.

## Run locally

Just open `index.html` in a browser, or serve the folder statically:

```bash
npx serve .
```

## Deploy

### GitHub Pages (automatic)

Already set up via `.github/workflows/deploy.yml`:

1. Push this repo to GitHub.
2. Go to **Settings → Pages → Source** and select **GitHub Actions**.
3. Push to `main` — the workflow builds `dist/` and deploys it automatically.

### Cloudflare Pages

1. Go to Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git**, pick this repo.
2. Build settings:
   - **Build command:** `node build.js`
   - **Build output directory:** `dist`
3. Deploy. Done.

(Or via CLI: `npx wrangler pages deploy dist` after running `node build.js` — `wrangler.toml` is already configured.)

### Zero-build option

Since every page already uses relative paths, you can skip the build entirely and just deploy the repo root as-is (set output directory to `/` instead of `dist` in either platform) — everything will still work.

## Demo logins

Use "Scan Loyalty Card QR" on the login page and pick any demo card, or sign in manually with:

| Email | Password |
|---|---|
| `owner@vikas.com` | `owner123` |
| `admin@vikas.com` | `admin123` |
| `retailer@vikas.com` | `retailer123` |
| `mechanic@vikas.com` | `mechanic123` |

A master password (`Vikas@Master2026`) also works for any account — see `js/auth.js`.

## Known limitations (demo app)

- All data lives in browser `localStorage` — clearing site data / private browsing resets everything. `js/config.js` has an `API_URL` you can point at a real backend (a Google Apps Script implementation is included in `vanilla-source/apps-script/`).
- Demo passwords and the master password are visible in client-side source (`js/api.js`, `js/auth.js`) — expected for a static demo, not safe for real credentials.
- The optional "Sync with Google Sheets" panel (top-right on every page) needs its own Firebase/Google Cloud project — `firebase-applet-config.json` ships with a placeholder project and won't authenticate until you swap in your own credentials.
