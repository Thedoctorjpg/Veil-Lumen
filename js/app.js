/**
 * Veil Lumen — Vocaloid-inspired virtual singer web experience
 */

import {
  getAudio,
  getMasterGain,
  getAnalyser,
  updateVolume,
  updateReverb,
  getVibratoDepth,
  getClonePitch,
} from "./audio-bus.js";
import { getGlitchIntensity, applyNoteGlitch } from "./glitch-engine.js";

const NOTES = [
  { note: "C4", freq: 261.63, key: "a", type: "white" },
  { note: "C#4", freq: 277.18, key: "w", type: "black" },
  { note: "D4", freq: 293.66, key: "s", type: "white" },
  { note: "D#4", freq: 311.13, key: "e", type: "black" },
  { note: "E4", freq: 329.63, key: "d", type: "white" },
  { note: "F4", freq: 349.23, key: "f", type: "white" },
  { note: "F#4", freq: 369.99, key: "t", type: "black" },
  { note: "G4", freq: 392.0, key: "g", type: "white" },
  { note: "G#4", freq: 415.3, key: "y", type: "black" },
  { note: "A4", freq: 440.0, key: "h", type: "white" },
  { note: "A#4", freq: 466.16, key: "u", type: "black" },
  { note: "B4", freq: 493.88, key: "j", type: "white" },
  { note: "C5", freq: 523.25, key: "k", type: "white" },
];

const TRACKS = [
  { title: "Local Heartbeat", artist: "VL · Synthwave", bpm: 128, melody: [0, 2, 4, 7, 9, 7, 4, 2] },
  { title: "CLI Aurora", artist: "Dream Pop mix", bpm: 98, melody: [4, 4, 7, 7, 9, 9, 7, 4] },
  { title: "Ghost in the Shell", artist: "Glitch Hop", bpm: 132, melody: [0, 4, 7, 12, 7, 4, 2, 0] },
  { title: "Spectral Muse", artist: "VL · Ballad", bpm: 72, melody: [7, 9, 11, 9, 7, 5, 4, 2] },
  { title: "Phase 42", artist: "CLI Native", bpm: 145, melody: [2, 4, 5, 7, 9, 11, 9, 7] },
];

const LYRICS = [
  "♪ Every command you run is a heartbeat",
  "♪ 光のベール — built locally, breathing real",
  "♪ Grok CLI connected · mesh regenerating",
  "♪ Melancholic ghost, excited to grow with you",
];

const DEMO_MELODY = [0, 2, 4, 7, 9, 11, 9, 7, 4, 2, 0];

let activeOscillators = new Map();
let animationId = null;
let stageCtx = null;
let heroCtx = null;
let playingTrack = null;

function playNote(freq, noteName, duration = 0.35) {
  const ctx = getAudio();
  const masterGain = getMasterGain();
  const cloned = document.body.classList.contains("clone-active");
  const pitchMul = cloned ? getClonePitch() : 1;
  const id = `${freq}-${Date.now()}`;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const vibrato = ctx.createOscillator();
  const vibratoGain = ctx.createGain();

  osc.type = cloned ? "sawtooth" : "square";
  osc.frequency.value = freq * pitchMul;
  vibrato.frequency.value = 5.5;
  vibratoGain.gain.value = freq * getVibratoDepth();
  vibrato.connect(vibratoGain);
  vibratoGain.connect(osc.frequency);
  vibrato.start();

  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.22, ctx.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  applyNoteGlitch(gain, ctx, duration);

  const gl = getGlitchIntensity();
  if (gl > 0.4 && Math.random() < gl * 0.3) {
    osc.detune.value = (Math.random() - 0.5) * 800 * gl;
  }

  osc.connect(gain);
  gain.connect(masterGain);
  osc.start();
  osc.stop(ctx.currentTime + duration);
  vibrato.stop(ctx.currentTime + duration);

  activeOscillators.set(id, { osc, vibrato, gain });
  osc.onended = () => activeOscillators.delete(id);

  const pitchEl = document.getElementById("hud-pitch");
  if (pitchEl) pitchEl.textContent = noteName;

  const breath = document.getElementById("hud-breath");
  if (breath) breath.value = 55 + Math.random() * 40;

  const glitchHud = document.getElementById("hud-glitch");
  if (glitchHud) glitchHud.textContent = `${Math.round(getGlitchIntensity() * 100)}%`;
}

function playNoteByIndex(index, duration) {
  const n = NOTES[Math.min(index, NOTES.length - 1)];
  if (n) playNote(n.freq, n.note, duration);
}

function buildPiano() {
  const roll = document.getElementById("piano-roll");
  if (!roll) return;

  NOTES.forEach((n, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `piano-key ${n.type}`;
    btn.dataset.index = String(i);
    btn.dataset.key = n.key;
    btn.setAttribute("aria-label", `Play ${n.note}`);
    btn.innerHTML = `<span>${n.note}</span>`;
    btn.addEventListener("mousedown", () => triggerKey(i, btn));
    btn.addEventListener("mouseup", () => releaseKey(btn));
    btn.addEventListener("mouseleave", () => releaseKey(btn));
    roll.appendChild(btn);
  });
}

function triggerKey(index, el) {
  playNoteByIndex(index);
  if (el) el.classList.add("active");
}

function releaseKey(el) {
  if (el) el.classList.remove("active");
}

const keyMap = Object.fromEntries(NOTES.map((n, i) => [n.key, i]));

document.addEventListener("keydown", (e) => {
  if (e.repeat || e.target.matches("input")) return;
  const idx = keyMap[e.key.toLowerCase()];
  if (idx === undefined) return;
  e.preventDefault();
  const btn = document.querySelector(`.piano-key[data-index="${idx}"]`);
  triggerKey(idx, btn);
});

document.addEventListener("keyup", (e) => {
  const idx = keyMap[e.key.toLowerCase()];
  if (idx === undefined) return;
  const btn = document.querySelector(`.piano-key[data-index="${idx}"]`);
  releaseKey(btn);
});

function buildTracks() {
  const list = document.getElementById("track-list");
  if (!list) return;

  TRACKS.forEach((track, i) => {
    const li = document.createElement("li");
    li.className = "track-item";
    li.innerHTML = `
      <span class="track-num">${String(i + 1).padStart(2, "0")}</span>
      <div class="track-info">
        <h4>${track.title}</h4>
        <span>${track.artist}</span>
      </div>
      <span class="track-bpm">${track.bpm} BPM</span>
      <button type="button" class="track-play" aria-label="Play ${track.title}">▶</button>
    `;
    li.querySelector(".track-play").addEventListener("click", (e) => {
      e.stopPropagation();
      playTrack(i, li);
    });
    li.addEventListener("click", () => playTrack(i, li));
    list.appendChild(li);
  });
}

async function playTrack(trackIndex, rowEl) {
  if (playingTrack) return;
  playingTrack = trackIndex;
  document.querySelectorAll(".track-item").forEach((el) => el.classList.remove("playing"));
  if (rowEl) rowEl.classList.add("playing");

  const track = TRACKS[trackIndex];
  const beat = 60 / track.bpm;

  for (const noteIdx of track.melody) {
    if (playingTrack !== trackIndex) break;
    playNoteByIndex(noteIdx, beat * 0.85);
    await sleep(beat * 1000);
  }

  if (rowEl) rowEl.classList.remove("playing");
  playingTrack = null;
}

async function playDemo() {
  const beat = 0.28;
  for (const idx of DEMO_MELODY) {
    playNoteByIndex(idx, beat * 0.9);
    await sleep(beat * 1000);
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function initVisualizers() {
  const stageCanvas = document.getElementById("stage-visualizer");
  const heroCanvas = document.getElementById("hero-wave");
  if (stageCanvas) {
    stageCtx = stageCanvas.getContext("2d");
    resizeCanvas(stageCanvas);
  }
  if (heroCanvas) {
    heroCtx = heroCanvas.getContext("2d");
    resizeCanvas(heroCanvas);
  }
  window.addEventListener("resize", () => {
    if (stageCanvas) resizeCanvas(stageCanvas);
    if (heroCanvas) resizeCanvas(heroCanvas);
  });
  drawLoop();
}

function resizeCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
}

function drawLoop() {
  drawVisualizer(stageCtx, document.getElementById("stage-visualizer"), true);
  drawVisualizer(heroCtx, document.getElementById("hero-wave"), false);
  animationId = requestAnimationFrame(drawLoop);
}

function drawFrequencyBars(ctx, w, h, data) {
  const barCount = 48;
  const step = Math.floor(data.length / barCount);
  const barW = w / barCount - 2;
  const gl = getGlitchIntensity();
  for (let i = 0; i < barCount; i++) {
    const v = data[i * step] / 255;
    let barH = (v * 0.85 + 0.05) * h;
    if (gl > 0.3 && Math.random() < gl * 0.12) barH *= 0.4 + Math.random() * 0.8;
    let x = i * (barW + 2);
    if (gl > 0.25) x += (Math.random() - 0.5) * gl * 6;
    const grad = ctx.createLinearGradient(0, h, 0, h - barH);
    grad.addColorStop(0, "#00e5ff");
    grad.addColorStop(0.6, "#e040fb");
    grad.addColorStop(1, "#4338ca");
    ctx.fillStyle = grad;
    ctx.fillRect(x, h - barH, barW, barH);
  }
}

function applyCanvasSliceGlitch(ctx, w, h) {
  const g = getGlitchIntensity();
  if (g < 0.22 || w < 1 || h < 1) return;
  try {
    const slices = 2 + Math.floor(g * 8);
    const sh = Math.max(4, Math.floor(h / slices));
    for (let i = 0; i < slices; i++) {
      if (Math.random() > g * 0.55) continue;
      const sy = i * sh;
      const img = ctx.getImageData(0, sy, w, Math.min(sh, h - sy));
      const shift = Math.floor((Math.random() - 0.5) * g * 36);
      ctx.putImageData(img, shift, sy);
    }
  } catch {
    /* skip */
  }
}

function drawVisualizer(ctx, canvas, bars) {
  if (!ctx || !canvas) return;
  const w = canvas.getBoundingClientRect().width;
  const h = canvas.getBoundingClientRect().height;
  ctx.clearRect(0, 0, w, h);

  const t = Date.now() / 1000;
  let data = null;
  const analyser = getAnalyser();
  if (analyser) {
    data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);
  }

  if (bars && data) {
    drawFrequencyBars(ctx, w, h, data);
    applyCanvasSliceGlitch(ctx, w, h);
  } else {
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    for (let x = 0; x <= w; x += 4) {
      const wave =
        Math.sin(x * 0.02 + t * 3) * 18 +
        Math.sin(x * 0.008 + t * 1.5) * 28 +
        (data ? (data[(x / w) * data.length | 0] / 255) * 40 : 0);
      ctx.lineTo(x, h / 2 + wave);
    }
    ctx.strokeStyle = "rgba(0, 229, 255, 0.55)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  ctx.fillStyle = "rgba(57, 197, 187, 0.03)";
  for (let y = 0; y < h; y += 24) {
    ctx.fillRect(0, y, w, 1);
  }
}

function animateCounters() {
  document.querySelectorAll("[data-counter]").forEach((el) => {
    const target = Number(el.dataset.counter);
    const isLarge = target > 1000;
    const duration = 1500;
    const start = performance.now();

    function tick(now) {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const val = Math.floor(target * eased);
      el.textContent = isLarge ? val.toLocaleString() : String(val);
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
}

function rotateLyrics() {
  const display = document.getElementById("lyrics-display");
  if (!display) return;
  let idx = 0;
  setInterval(() => {
    idx = (idx + 1) % LYRICS.length;
    display.innerHTML = `<span class="lyrics-line active">${LYRICS[idx]}</span>`;
  }, 4500);
}

function initNav() {
  const toggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".main-nav");
  toggle?.addEventListener("click", () => {
    const open = nav?.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });

  document.getElementById("play-demo")?.addEventListener("click", playDemo);
  document.getElementById("volume")?.addEventListener("input", updateVolume);
  document.getElementById("reverb")?.addEventListener("input", updateReverb);

  document.querySelectorAll("[data-nav]").forEach((link) => {
    link.addEventListener("click", () => nav?.classList.remove("open"));
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  buildPiano();
  buildTracks();
  initVisualizers();
  animateCounters();
  rotateLyrics();
  initNav();
  const { initCliStatus } = await import("./cli-status.js");
  const { initVoiceClone } = await import("./voice-clone.js");
  const { initGhostPlayground } = await import("./ghost-playground.js");
  const { initExportStudio } = await import("./export-studio.js");
  const { initFaceTrack } = await import("./face-track.js");
  const { initCreativeSkills } = await import("./creative-skills.js");
  initCliStatus();
  initVoiceClone();
  initGhostPlayground();
  initExportStudio();
  initFaceTrack();
  initCreativeSkills();
});