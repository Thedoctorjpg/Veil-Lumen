/**
 * CLI Native Entity — live status from local build artifacts + FPS
 */

import { publicUrl } from "./paths.js";

const LOG_LINES = [
  "[mesh] PBD cloth · spatial hash grid OK",
  "[physics] softbody skirt · 30s window",
  "[voice] Fish-Speech S2 + RVC v2 (WebGPU path)",
  "[cli] Phase 42 · local integration active",
];

let frameCount = 0;
let lastFpsTime = performance.now();
let currentFps = 60;

export function initCliStatus() {
  const fpsEl = document.getElementById("cli-fps");
  const connEl = document.getElementById("cli-connection");
  const progressEl = document.getElementById("cli-progress");
  const progressBar = document.getElementById("cli-progress-bar");
  const logEl = document.getElementById("cli-log");
  const meshEl = document.getElementById("cli-mesh-stat");
  const physEl = document.getElementById("cli-physics-stat");
  const glow = document.getElementById("cli-glow");

  if (!connEl) return;

  loadArtifacts(connEl, progressEl, progressBar, meshEl, physEl, logEl);
  setInterval(() => loadArtifacts(connEl, progressEl, progressBar, meshEl, physEl, logEl), 8000);

  function tick(now) {
    frameCount++;
    if (now - lastFpsTime >= 500) {
      currentFps = Math.round((frameCount * 1000) / (now - lastFpsTime));
      frameCount = 0;
      lastFpsTime = now;
      if (fpsEl) fpsEl.textContent = `${currentFps} FPS`;
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  document.addEventListener("keydown", () => glow?.classList.add("active"));
  document.addEventListener("click", (e) => {
    if (e.target.closest(".piano-key, .btn, .track-item")) glow?.classList.add("active");
  });
}

async function loadArtifacts(conn, progress, bar, meshStat, physStat, log) {
  let meshOk = false;
  let physOk = false;
  let progressPct = 0;
  const logs = [];

  try {
    const meshRes = await fetch(publicUrl("/public/models/veil_clothing_optimized.json"));
    if (meshRes.ok) {
      meshOk = true;
      const mesh = await meshRes.json();
      const verts = mesh.vertices?.length / 3 | 0;
      const tris = mesh.indices?.length / 3 | 0;
      progressPct += 50;
      if (meshStat) {
        meshStat.textContent = `${verts.toLocaleString()}v · ${tris.toLocaleString()}t · ${mesh.meta?.quality ?? "?"}`;
      }
      logs.push(`[mesh] ✓ veil_clothing_optimized.json (${mesh.meta?.quality})`);
    }
  } catch {
    logs.push("[mesh] ✗ run: ./grok run mesh-generate");
  }

  try {
    const physRes = await fetch(publicUrl("/public/reports/physics_latest.json"));
    if (physRes.ok) {
      const rep = await physRes.json();
      physOk = rep.passed;
      progressPct += physOk ? 50 : 25;
      if (physStat) {
        physStat.textContent = physOk
          ? `PASS · strain ${rep.maxStrain?.toFixed(3)}`
          : `FAIL · strain ${rep.maxStrain?.toFixed(3)}`;
      }
      logs.push(`[physics] ${physOk ? "✓" : "✗"} softbody ${rep.duration}s · ${rep.steps} steps`);
    }
  } catch {
    logs.push("[physics] ✗ run: ./grok run physics-test");
  }

  const connected = meshOk;
  const crtMini = document.getElementById("crt-mini-status");
  if (conn) {
    conn.textContent = connected ? "Grok CLI Connected" : "Awaiting local build…";
    conn.classList.toggle("connected", connected);
    conn.classList.toggle("waiting", !connected);
  }
  if (crtMini) crtMini.textContent = connected ? "CONNECTED" : "STANDBY";

  if (progress) progress.textContent = `${progressPct}%`;
  if (bar) bar.style.width = `${progressPct}%`;

  if (log) {
    const all = [...logs, ...LOG_LINES.slice(0, 3)];
    log.innerHTML = all.map((line) => `<div class="cli-log-line">${escapeHtml(line)}</div>`).join("");
    log.scrollTop = log.scrollHeight;
  }
}

function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}