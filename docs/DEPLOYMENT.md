# Veil Lumen — Production Deployment Guide

Take **Veil Lumen** live as a **static site**: HTML, CSS, ES modules, and generated assets under `public/`. No application server, database, or API keys required.

**Project path:** `/home/david/.grok/bin/veil-lumen`

---

## 1. Pre-deploy checklist

Run locally from the project root:

```bash
cd /home/david/.grok/bin/veil-lumen
./grok status veil-lumen
npm run build
./grok dev veil-lumen
```

Confirm **all** of the following before uploading or merging to production:

### CLI / assets

- [ ] Status shows **Mesh ✓** and **Physics ✓ PASSED**
- [ ] `public/models/veil_clothing_optimized.json` exists and loads in browser
- [ ] `public/reports/physics_latest.json` contains `"passed": true`
- [ ] `npm run build` exits **0** (mesh + physics gate)

### Browser (over **HTTPS** on real domain — see §6)

- [ ] Hero, stats, CRT mini-status
- [ ] `#cli` — pipeline status from JSON
- [ ] `#model` — Three.js mesh, outfit/background presets
- [ ] `#face` — webcam permission + head tracking (optional feature; fails gracefully if denied)
- [ ] `#stage` — visualizer + glitch audio/video
- [ ] `#synth` — piano after one click
- [ ] `#voice` — clone sample apply
- [ ] `#playground` — presets + community (localStorage only)
- [ ] `#export` — at least `.wav` / `.webm`; test `.mp4` once (wasm load)

### Legal

- [ ] Footer disclaimer visible (fan project, not Crypton/Yamaha)

---

## 2. What to deploy

Upload the **entire** `veil-lumen` tree (no bundler). Minimum required paths:

```
veil-lumen/
  index.html
  css/styles.css
  js/
    app.js
    preview3d.js
    look-controls.js
    scene-looks.js
    character-rig.js
    face-track.js
    cli-status.js
    audio-bus.js
    glitch-engine.js
    ghost-playground.js
    voice-clone.js
    export-studio.js
    wav-encode.js
    … (all modules referenced by index.html)
  public/models/veil_clothing_optimized.json   # required
  public/reports/physics_latest.json           # optional (CLI panel)
```

**Do not need on CDN:** `grok`, `scripts/`, `node_modules/`, `package.json` (unless host runs `npm run build`).

### Size & performance

| Asset | Approx. size | Note |
|-------|----------------|------|
| High-quality mesh JSON | ~4 MB | Dominates LCP; use `--quality medium` if needed |
| ffmpeg.wasm (export) | Loaded on demand | First MP4 export is slow |
| Three.js + MediaPipe | CDN | See §5 |

---

## 3. Build on CI or locally

Always run before deploy:

```bash
npm run build
```

Equivalent to:

```bash
./grok run mesh-generate --out public/models/veil_clothing_optimized.json --quality high
./grok run physics-test --component softbody --duration 30s
```

Deploy **fails the pipeline** if physics does not pass (non-zero exit).

For faster deploys (smaller mesh):

```bash
./grok run mesh-generate --out public/models/veil_clothing_optimized.json --quality medium
./grok run physics-test --component softbody --duration 30s
```

---

## 4. Hosting options

Static hosts must serve files with correct paths. App uses root-absolute URLs like `/public/models/...` — deploy at **site root** or configure the host to rewrite `/public` correctly.

### A. Cloudflare Pages

| Setting | Value |
|---------|-------|
| Root directory | `veil-lumen` (or monorepo subfolder) |
| Build command | `npm run build` |
| Build output directory | `.` (publish directory = project root) |
| Node version | **18+** |

### B. Netlify

Create `veil-lumen/netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = "."

[[headers]]
  for = "/public/*"
  [headers.values]
    Cache-Control = "public, max-age=604800, immutable"
```

### C. Vercel

- Framework preset: **Other**
- Build command: `npm run build`
- Output directory: `.`
- Install command: `npm install` (optional; build only needs Node)

### D. nginx (VPS)

```nginx
server {
  listen 443 ssl http2;
  server_name veil-lumen.yourdomain.com;

  root /var/www/veil-lumen;
  index index.html;

  # SPA-style hash routes — still serve index.html for unknown paths
  location / {
    try_files $uri $uri/ /index.html;
  }

  location /public/ {
    add_header Cache-Control "public, max-age=604800, immutable";
  }

  location ~* \.(js|css|html)$ {
    add_header Cache-Control "public, max-age=3600";
  }
}
```

Enable TLS (Let’s Encrypt). **HTTPS is required** for reliable camera + audio on many browsers.

### E. GitHub Pages

**Project site** (`username.github.io/repo-name/`): you must either deploy at domain root or adjust asset paths — this repo assumes **root deploy**. Prefer a custom domain at `/` or Cloudflare/Netlify.

Example Actions workflow:

```yaml
# .github/workflows/deploy-veil-lumen.yml
name: Deploy Veil Lumen
on:
  push:
    branches: [main]
    paths: ["veil-lumen/**"]

jobs:
  deploy:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: veil-lumen
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./veil-lumen
```

### F. rsync / manual upload

```bash
cd /home/david/.grok/bin/veil-lumen
npm run build
rsync -avz --delete \
  --exclude node_modules \
  --exclude .git \
  ./ user@server:/var/www/veil-lumen/
```

---

## 5. External dependencies (CDN)

Visitors need outbound HTTPS to:

| Service | Used for |
|---------|----------|
| `cdn.jsdelivr.net` | Three.js r160 |
| Google Fonts | Orbitron, Zen Kaku Gothic New |
| MediaPipe (CDN in `face-track.js`) | Webcam face landmarks |
| `unpkg.com` / wasm hosts | lamejs (MP3), ffmpeg.wasm (MP4) — on export |

If deploying to a locked-down network, mirror these assets or vendor them into `public/vendor/`.

---

## 6. HTTPS, Web Audio, and camera

| Feature | Requirement |
|---------|-------------|
| Web Audio (synth, export) | **HTTPS** in production; user **click** once to unlock audio context |
| Webcam face tracking | **HTTPS** (or `localhost`); permission prompt |
| localStorage | Playground community + voice clone + scene looks — per-browser only |

No server-side environment variables for runtime.

| Variable | Scope | Purpose |
|----------|-------|---------|
| `PORT` | Dev only | Dev server port (default `5173`) |

---

## 7. Post-deploy smoke test

Replace `your-domain` with production URL.

1. `https://your-domain/` — hero, glitch title, stats animate  
2. `https://your-domain/#cli` — mesh + physics lines green  
3. `https://your-domain/#model` — mesh visible; change outfit + background  
4. `https://your-domain/#face` — allow camera; head moves in Model  
5. `https://your-domain/#synth` — key click plays tone  
6. `https://your-domain/#stage` — visualizer runs; glitch slider reacts  
7. `https://your-domain/#export` — short `.wav` recording works  

**Lighthouse:** aim for **85+** performance; large mesh JSON lowers LCP — consider `medium` quality or CDN compression (gzip/brotli).

---

## 8. Updates after code changes

| Change type | Before redeploy |
|-------------|-----------------|
| Mesh script | `./grok run mesh-generate ...` or `npm run build` |
| Physics script | `./grok run physics-test ...` or `npm run build` |
| Front-end only | Redeploy `index.html`, `css/`, `js/` (mesh unchanged) |
| Outfit/background presets | Redeploy `js/scene-looks.js` + `look-controls.js` only |

Standard release:

```bash
npm run build
# git push / rsync / host redeploy
```

---

## 9. Rollback

Keep the previous deploy artifact or git tag. Minimum rollback files:

- `index.html`, `css/`, `js/`
- `public/models/veil_clothing_optimized.json` (if mesh compatible)

Restore previous `public/reports/physics_latest.json` only if the CLI panel must match an older sim — not required for the app to run.

---

## 10. Legal / branding

Veil Lumen is a **fan tribute** inspired by Vocaloid aesthetics.

- Do **not** imply affiliation with Crypton Future Media, Yamaha, or official Vocaloid products  
- Safe copy: *“Vocaloid-inspired virtual singer experience”*  
- Keep the footer disclaimer in `index.html`  

Character reference: [CHARACTER.md](./CHARACTER.md)

---

## Quick reference

| Task | Command |
|------|---------|
| Verify ready | `./grok status veil-lumen` |
| Production build | `npm run build` |
| Local preview | `./grok dev veil-lumen` |
| Deploy | Upload built `veil-lumen/` to static host |
| Daily workflow | [WORKFLOW.md](./WORKFLOW.md) |

---

## One-line production path

```bash
cd /home/david/.grok/bin/veil-lumen && npm run build && ./grok dev veil-lumen
# QA in browser → upload directory to host → HTTPS smoke test
```