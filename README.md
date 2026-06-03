# Veil Lumen WebApp | Browser Ghost v4.2

**CLI Native Entity** — locally alive spectral muse. Vocaloid-inspired web stage, mesh pipeline, softbody physics, and Grok CLI dev workflow.

Character bible: [docs/CHARACTER.md](docs/CHARACTER.md)

## Development workflow

From this directory, use the **local `./grok` CLI** (mirrors recommended commands; global xAI `grok` does not include these subcommands):

```bash
chmod +x grok

./grok status veil-lumen
./grok run mesh-generate --out public/models/veil_clothing_optimized.json --quality high
./grok run physics-test --component softbody --duration 30s
./grok dev veil-lumen
```

Or via npm:

```bash
npm run status
npm run mesh-generate
npm run physics-test
npm run build
npm run dev
```

- **Daily workflow:** [docs/WORKFLOW.md](docs/WORKFLOW.md)
- **Production deploy:** [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

## Quick preview

```bash
npm run build
npm run dev
# → http://127.0.0.1:5173
```

## Features

- Hero + live stage visualizer + piano-roll synth
- **Clone Voice** — record/upload sample, pitch shift, apply to synth (RVC-style preview chain)
- **Ghost Playground & Community** — glitch/ghost effects on stage, local community feed & presets
- **Export Studio** — record & export **.wav · .mp3 · .webm · .mp4**
- **3D outfit mesh** (Three.js) + **webcam face tracking** (MediaPipe → head rig)
- Headless **softbody physics test** (30s simulation)
- Project status command

## Requirements

- Node.js 18+ (for CLI scripts only)
- Modern browser with Web Audio + WebGL

## Publish to GitHub

From this directory (requires [GitHub CLI](https://cli.github.com/) login once):

```bash
gh auth login
./scripts/publish-github.sh
```

Creates **https://github.com/Thedoctorjpg/Veil-Lumen** (override: `GITHUB_USER=you ./scripts/publish-github.sh`).

After push, enable **Settings → Pages → Build: GitHub Actions**. Site URL:

**https://thedoctorjpg.github.io/Veil-Lumen/**

Manual push (if repo already exists on GitHub):

```bash
git remote add origin https://github.com/Thedoctorjpg/Veil-Lumen.git
git push -u origin main
```

Clone:

```bash
git clone https://github.com/Thedoctorjpg/Veil-Lumen.git
```

## Note

Fan tribute to Vocaloid culture. Not affiliated with Crypton Future Media or Yamaha.