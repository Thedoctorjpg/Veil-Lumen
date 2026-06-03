import { setGlitchIntensity, drawVideoGlitch } from "./glitch-engine.js";

const COMMUNITY_KEY = "veil_ghost_community_v1";
const PRESETS_KEY = "veil_ghost_presets_v1";

const SEED_POSTS = [
  {
    id: "seed-1",
    author: "spectral_dev",
    message: "First mesh regen on local CLI — Veil looks amazing in cyan!",
    likes: 12,
    at: Date.now() - 86400000,
    preset: { glitch: 0.3, ghost: 0.5 },
  },
  {
    id: "seed-2",
    author: "cli_native",
    message: "Exported Stage capture to .webm then MP4 — ghost playground glitch at 0.7 hits different",
    likes: 8,
    at: Date.now() - 43200000,
    preset: { glitch: 0.7, ghost: 0.8, particles: 40 },
  },
];

let playgroundState = { glitch: 0.35, ghost: 0.6, particles: 24 };

export function initGhostPlayground() {
  initPlaygroundControls();
  initCommunity();
  applyPlaygroundToStage();
}

function initPlaygroundControls() {
  const glitch = document.getElementById("pg-glitch");
  const ghost = document.getElementById("pg-ghost");
  const particles = document.getElementById("pg-particles");

  const update = () => {
    playgroundState = {
      glitch: Number(glitch?.value ?? 35) / 100,
      ghost: Number(ghost?.value ?? 60) / 100,
      particles: Number(particles?.value ?? 24),
    };
    document.getElementById("pg-glitch-val").textContent = `${Math.round(playgroundState.glitch * 100)}%`;
    document.getElementById("pg-ghost-val").textContent = `${Math.round(playgroundState.ghost * 100)}%`;
    document.getElementById("pg-particles-val").textContent = String(playgroundState.particles);
    applyPlaygroundToStage();
  };

  glitch?.addEventListener("input", update);
  ghost?.addEventListener("input", update);
  particles?.addEventListener("input", update);

  document.getElementById("pg-save-preset")?.addEventListener("click", savePreset);
  document.getElementById("pg-load-preset")?.addEventListener("change", loadPreset);
  document.getElementById("pg-share-community")?.addEventListener("click", shareToCommunity);

  refreshPresetSelect();
  update();
}

const overlays = { stage: null, model: null };
let particles = [];

function ensureOverlay(target) {
  const parent =
    target === "model"
      ? document.getElementById("model-viewport")
      : document.querySelector(".stage-wrap");
  if (!parent || overlays[target]) return;
  const canvas = document.createElement("canvas");
  canvas.className = "ghost-overlay";
  canvas.dataset.overlay = target;
  parent.appendChild(canvas);
  overlays[target] = { canvas, ctx: canvas.getContext("2d") };
  if (target === "stage") {
    resizeOverlays();
    window.addEventListener("resize", resizeOverlays);
    animateOverlay();
  } else {
    resizeOverlayOne("model");
  }
}

function resizeOverlays() {
  resizeOverlayOne("stage");
  resizeOverlayOne("model");
}

function resizeOverlayOne(target) {
  const o = overlays[target];
  if (!o) return;
  const parent =
    target === "model"
      ? document.getElementById("model-viewport")
      : document.querySelector(".stage-wrap");
  const rect = parent?.getBoundingClientRect();
  if (!rect) return;
  o.canvas.width = rect.width;
  o.canvas.height = rect.height;
}

function applyPlaygroundToStage() {
  ensureOverlay("stage");
  ensureOverlay("model");
  setGlitchIntensity(playgroundState.glitch);
  const stage = document.querySelector(".stage-wrap");
  if (stage) {
    stage.style.setProperty("--pg-glitch", playgroundState.glitch);
    stage.style.setProperty("--pg-ghost", playgroundState.ghost);
  }
  initParticles(playgroundState.particles);
}

function initParticles(n) {
  particles = Array.from({ length: n }, () => ({
    x: Math.random(),
    y: Math.random(),
    vx: (Math.random() - 0.5) * 0.002,
    vy: -Math.random() * 0.003 - 0.001,
    life: Math.random(),
  }));
}

function animateOverlay() {
  paintOverlay("stage", document.getElementById("stage-visualizer"));
  paintOverlay("model", document.querySelector("#model-viewport canvas"));
  requestAnimationFrame(animateOverlay);
}

function paintOverlay(target, sourceCanvas) {
  const o = overlays[target];
  if (!o?.ctx) return;
  const { ctx, canvas } = o;
  const w = canvas.width;
  const h = canvas.height;
  const g = playgroundState.ghost;
  const gl = playgroundState.glitch;

  ctx.clearRect(0, 0, w, h);

  drawVideoGlitch(ctx, w, h, sourceCanvas);

  if (g > 0.05) {
    ctx.fillStyle = `rgba(0, 229, 255, ${g * 0.06})`;
    ctx.fillRect(0, 0, w, h);
    if (target === "stage") {
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.004;
        if (p.life < 0 || p.y < 0) {
          p.x = Math.random();
          p.y = 1;
          p.life = 1;
        }
        ctx.beginPath();
        ctx.arc(p.x * w, p.y * h, 2 + g * 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(224, 64, 251, ${g * 0.5 * p.life})`;
        ctx.fill();
      }
    }
  }

  if (gl > 0.15 && Math.random() < gl * 0.08) {
    const slice = Math.floor(Math.random() * h);
    const shift = (Math.random() - 0.5) * gl * 28;
    ctx.fillStyle = `rgba(224, 64, 251, ${0.3 * gl})`;
    ctx.fillRect(shift, slice, w, 4);
    ctx.fillStyle = `rgba(0, 229, 255, ${0.2 * gl})`;
    ctx.fillRect(-shift, slice + 5, w, 2);
  }
}

function getCommunity() {
  try {
    const raw = localStorage.getItem(COMMUNITY_KEY);
    const posts = raw ? JSON.parse(raw) : [];
    const ids = new Set(posts.map((p) => p.id));
    const merged = [...posts];
    for (const s of SEED_POSTS) {
      if (!ids.has(s.id)) merged.push(s);
    }
    return merged.sort((a, b) => b.at - a.at);
  } catch {
    return [...SEED_POSTS];
  }
}

function saveCommunity(posts) {
  localStorage.setItem(COMMUNITY_KEY, JSON.stringify(posts.slice(0, 50)));
}

function initCommunity() {
  renderFeed();
  document.getElementById("community-post")?.addEventListener("click", submitPost);
  document.getElementById("community-feed")?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-like]");
    const load = e.target.closest("[data-load-preset]");
    if (btn) likePost(btn.dataset.like);
    if (load) applyPostPreset(load.dataset.loadPreset);
  });
}

function renderFeed() {
  const feed = document.getElementById("community-feed");
  if (!feed) return;
  const posts = getCommunity();
  feed.innerHTML = posts
    .map(
      (p) => `
    <article class="community-card" data-id="${p.id}">
      <header>
        <strong>@${escapeHtml(p.author)}</strong>
        <time>${formatTime(p.at)}</time>
      </header>
      <p>${escapeHtml(p.message)}</p>
      <footer>
        <button type="button" class="btn-sm" data-like="${p.id}">♥ ${p.likes}</button>
        <button type="button" class="btn-sm btn-ghost-sm" data-load-preset="${p.id}">Load preset</button>
      </footer>
    </article>`
    )
    .join("");
}

function submitPost() {
  const input = document.getElementById("community-message");
  const author = document.getElementById("community-author");
  const msg = input?.value?.trim();
  if (!msg) return;
  const posts = getCommunity();
  posts.unshift({
    id: `u-${Date.now()}`,
    author: author?.value?.trim() || "ghost_builder",
    message: msg,
    likes: 0,
    at: Date.now(),
    preset: { ...playgroundState },
  });
  saveCommunity(posts);
  if (input) input.value = "";
  renderFeed();
}

function likePost(id) {
  const posts = getCommunity();
  const p = posts.find((x) => x.id === id);
  if (p) p.likes++;
  saveCommunity(posts);
  renderFeed();
}

function applyPostPreset(id) {
  const posts = getCommunity();
  const p = posts.find((x) => x.id === id);
  if (!p?.preset) return;
  playgroundState = { ...playgroundState, ...p.preset };
  document.getElementById("pg-glitch").value = Math.round((p.preset.glitch ?? 0.35) * 100);
  document.getElementById("pg-ghost").value = Math.round((p.preset.ghost ?? 0.6) * 100);
  document.getElementById("pg-particles").value = p.preset.particles ?? 24;
  document.getElementById("pg-glitch").dispatchEvent(new Event("input"));
}

function shareToCommunity() {
  const input = document.getElementById("community-message");
  if (input) {
    input.value = `Shared playground preset — glitch ${Math.round(playgroundState.glitch * 100)}%, ghost ${Math.round(playgroundState.ghost * 100)}%`;
  }
  submitPost();
}

function savePreset() {
  const name = prompt("Preset name", "my-ghost-preset");
  if (!name) return;
  const presets = getPresets();
  presets[name] = { ...playgroundState, savedAt: Date.now() };
  localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
  refreshPresetSelect();
}

function loadPreset(e) {
  const name = e.target.value;
  if (!name) return;
  const presets = getPresets();
  const p = presets[name];
  if (!p) return;
  playgroundState = { glitch: p.glitch, ghost: p.ghost, particles: p.particles };
  document.getElementById("pg-glitch").value = Math.round(p.glitch * 100);
  document.getElementById("pg-ghost").value = Math.round(p.ghost * 100);
  document.getElementById("pg-particles").value = p.particles;
  document.getElementById("pg-glitch").dispatchEvent(new Event("input"));
}

function getPresets() {
  try {
    return JSON.parse(localStorage.getItem(PRESETS_KEY) || "{}");
  } catch {
    return {};
  }
}

function refreshPresetSelect() {
  const sel = document.getElementById("pg-load-preset");
  if (!sel) return;
  const presets = getPresets();
  sel.innerHTML = '<option value="">Load saved preset…</option>';
  for (const name of Object.keys(presets)) {
    sel.innerHTML += `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`;
  }
}

function formatTime(ts) {
  const d = new Date(ts);
  const diff = Date.now() - ts;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString();
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}