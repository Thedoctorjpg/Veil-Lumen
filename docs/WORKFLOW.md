# Veil Lumen — Daily Development Workflow

**Browser Ghost v4.2** · Complete loop: **status → mesh → physics → voice → full preview**

Every command below runs from the project root. Use the **project-local** `./grok` CLI — the global xAI `grok` binary (e.g. v0.2.x) does **not** implement `status`, `run`, or `dev` for this repo.

```bash
cd /home/david/.grok/bin/veil-lumen
chmod +x grok   # once per clone
```

---

## Prerequisites

| Requirement | Notes |
|-------------|--------|
| Node.js **18+** | CLI scripts only; the static app runs in the browser |
| `./grok` executable | `chmod +x grok` |
| Modern browser | WebGL, Web Audio, `getUserMedia` (face tracking) |

Optional alias:

```bash
alias grok-veil='cd /home/david/.grok/bin/veil-lumen && ./grok'
```

---

## Morning routine (2 minutes)

```bash
./grok status veil-lumen
```

Read the report:

- **Mesh ✓** — `public/models/veil_clothing_optimized.json` exists with vert/tri counts
- **Physics ✓ PASSED** — `public/reports/physics_latest.json` has `"passed": true`
- If either is missing or physics failed, run the pipeline below before editing the app

Quick health script (copy/paste):

```bash
./grok status veil-lumen && \
./grok run voice-test --duration 5s && \
echo "OK — open preview with: ./grok dev veil-lumen"
```

---

## Full pipeline (recommended order)

Run this after changing mesh generation, physics tuning, or before a release commit.

### Step 1 — Status

```bash
./grok status veil-lumen
```

Confirms project root, version, mesh age, and last physics result.

### Step 2 — Mesh generate / regenerate

Regenerate when you change `scripts/mesh-generate.mjs` (topology, quality tiers, export schema). **Outfit color presets** in the browser do **not** require regen — those live in `js/scene-looks.js`.

```bash
./grok run mesh-generate --out public/models/veil_clothing_optimized.json --quality high
```

| `--quality` | When to use |
|-------------|-------------|
| `low` | Fast iteration, fewer vertices |
| `medium` | Balanced dev builds |
| `high` | Daily default, production preview & deploy (~28k verts, ~4 MB JSON) |

**Output:** `public/models/veil_clothing_optimized.json`

### Step 3 — Physics test

Run after edits to `scripts/physics-test.mjs` or when validating softbody before deploy.

```bash
./grok run physics-test --component softbody --duration 30s
```

- Writes `public/reports/physics_latest.json`
- **Exit code 1** on failure — fix springs/strain thresholds before shipping
- Target: `"passed": true`, strain within configured limits

### Step 4 — Voice test

Run after synth, stage, glitch, or voice-clone pipeline changes.

```bash
./grok run voice-test --duration 5s
```

Headless check of the note engine used by the piano roll and demo phrase (no browser required).

### Step 5 — Production build (CI gate)

```bash
npm run build
```

Runs **mesh-generate** then **physics-test**. Fails the build if physics does not pass.

### Step 6 — Full preview (browser QA)

```bash
./grok dev veil-lumen
```

Opens **http://127.0.0.1:5173** (override with `PORT=3000 ./grok dev veil-lumen`).

Stop with `Ctrl+C`.

---

## Browser QA checklist (full preview)

Click the page once if audio is silent (browser autoplay policy).

| Section | Nav | Verify |
|---------|-----|--------|
| CLI | `#cli` | CRT status loads mesh + physics JSON |
| Voice | `#voice` | Record/upload sample → Apply to synth |
| Playground | `#playground` | Glitch/ghost sliders affect stage overlays |
| Export | `#export` | Record audio → `.wav` / `.mp3`; video → `.webm` / `.mp4` (first MP4 may load ffmpeg.wasm — wait) |
| Stage | `#stage` | Visualizer + lyrics; glitch affects audio + video |
| Model | `#model` | 3D mesh loads; **outfit** + **background** presets; circuit glow / brightness |
| Face | `#face` | Webcam starts; head follows face in Model viewport |
| Synth | `#synth` | Piano keys or `A`–`K` keyboard |

**Hero:** Voice Preview button plays demo phrase after user gesture.

---

## npm shortcuts

Equivalent to `./grok` for daily use:

```bash
npm run status          # ./grok status veil-lumen
npm run mesh-generate   # high quality → public/models/...
npm run physics-test    # softbody 30s
npm run voice-test      # 5s note engine
npm run build           # mesh + physics (deploy gate)
npm run dev             # static dev server :5173
```

---

## Typical day (decision table)

| You changed… | Run |
|--------------|-----|
| Nothing / start of day | `./grok status veil-lumen` |
| `scripts/mesh-generate.mjs` | `./grok run mesh-generate ... --quality high` |
| `scripts/physics-test.mjs` | `./grok run physics-test --component softbody --duration 30s` |
| `js/*` audio, synth, glitch, export, voice | `./grok run voice-test --duration 5s` |
| Outfit **colors** only (`scene-looks.js`, CSS) | `./grok dev veil-lumen` only |
| HTML/CSS/3D rig (no mesh script) | `npm run dev` + Model/Face QA |
| Before `git commit` / deploy | `npm run build` then full browser checklist |
| Release candidate | `npm run build` → `./grok dev veil-lumen` → [DEPLOYMENT.md](./DEPLOYMENT.md) |

---

## End-of-day checklist

```bash
npm run build                    # must pass
./grok status veil-lumen         # Mesh ✓ Physics ✓
./grok dev veil-lumen            # spot-check #model #face #export
git status                       # commit assets if mesh/physics regen’d
```

Commit when regenerated:

- `public/models/veil_clothing_optimized.json` (if mesh changed)
- `public/reports/physics_latest.json` (if physics re-run)

---

## Command reference

| Documented command | From `veil-lumen/` |
|--------------------|--------------------|
| `grok status veil-lumen` | `./grok status veil-lumen` |
| `grok run mesh-generate --out public/models/veil_clothing_optimized.json --quality high` | same |
| `grok run physics-test --component softbody --duration 30s` | same |
| `grok run voice-test --duration 5s` | same |
| `grok dev veil-lumen` | same |

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `unrecognized subcommand 'status'` | Using **global** `grok`; `cd` into `veil-lumen` and use `./grok` |
| Model section empty / loading forever | Run mesh-generate; hard-refresh dev server |
| Physics **FAILED** | Read `public/reports/physics_latest.json`; tune `scripts/physics-test.mjs` |
| No sound | Click piano key, **Play Demo**, or Export record once |
| Face tracking won’t start | Allow camera; use localhost or HTTPS |
| Port 5173 in use | `PORT=3000 ./grok dev veil-lumen` |
| MP4 export hangs | First visit downloads ffmpeg.wasm — wait, retry |
| Global vs local CLI | Only `./grok` in this folder runs Veil commands |

---

## Project layout

```
veil-lumen/
  grok                      # local CLI entry (bash → node scripts/cli.mjs)
  scripts/
    cli.mjs                 # status, run, dev
    mesh-generate.mjs
    physics-test.mjs
    voice-test.mjs
    dev-server.mjs
  public/models/            # generated mesh JSON
  public/reports/           # physics_latest.json
  index.html                # app shell
  js/                       # app modules (preview3d, face-track, export, …)
  css/styles.css
  docs/WORKFLOW.md          # this file
  docs/DEPLOYMENT.md        # production guide
```

---

## Related

- Character spec: [CHARACTER.md](./CHARACTER.md)
- Go live: [DEPLOYMENT.md](./DEPLOYMENT.md)