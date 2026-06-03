/**
 * Unified glitch — audio crush/stutter + video RGB/scan/slice
 */

let intensity = 0.35;
let audioNodes = null;
let stutterTimer = null;

export function getGlitchIntensity() {
  return intensity;
}

export function setGlitchIntensity(amount) {
  intensity = Math.max(0, Math.min(1, amount));
  updateAudioGlitch();
  applyVideoGlitchCss();
}

export function initAudioGlitchChain(ctx, inputNode, outputNode) {
  const crush = ctx.createWaveShaper();
  crush.curve = makeCrushCurve(0);
  crush.oversample = "4x";

  const stutter = ctx.createGain();
  stutter.gain.value = 1;

  const delay = ctx.createDelay(0.12);
  delay.delayTime.value = 0.03;
  const delayFb = ctx.createGain();
  delayFb.gain.value = 0;
  const delayMix = ctx.createGain();
  delayMix.gain.value = 0;

  const noise = ctx.createBufferSource();
  const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.15, ctx.sampleRate);
  const nd = noiseBuf.getChannelData(0);
  for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
  noise.buffer = noiseBuf;
  noise.loop = true;
  const noiseGain = ctx.createGain();
  noiseGain.gain.value = 0;
  noise.connect(noiseGain);

  inputNode.connect(crush);
  crush.connect(stutter);
  stutter.connect(delay);
  delay.connect(delayFb);
  delayFb.connect(delay);
  delay.connect(delayMix);
  delayMix.connect(outputNode);
  stutter.connect(outputNode);
  noiseGain.connect(outputNode);

  audioNodes = { crush, stutter, delay, delayFb, delayMix, noiseGain, noise };
  audioNodes.noise.start();

  startStutterLoop();
  updateAudioGlitch();
  return audioNodes;
}

function updateAudioGlitch() {
  if (!audioNodes) return;
  const g = intensity;
  audioNodes.crush.curve = makeCrushCurve(g);
  audioNodes.delayFb.gain.value = g * 0.45;
  audioNodes.delayMix.gain.value = g * 0.35;
  audioNodes.delay.delayTime.value = 0.02 + g * 0.08;
  audioNodes.noiseGain.gain.value = g * 0.04;
}

function startStutterLoop() {
  if (stutterTimer) clearInterval(stutterTimer);
  stutterTimer = setInterval(() => {
    if (!audioNodes || intensity < 0.08) return;
    const ctx = audioNodes.stutter.context;
    const t = ctx.currentTime;
    if (Math.random() < intensity * 0.35) {
      audioNodes.stutter.gain.setValueAtTime(0.02, t);
      audioNodes.stutter.gain.linearRampToValueAtTime(1, t + 0.02 + Math.random() * 0.04);
    }
    if (Math.random() < intensity * 0.15) {
      audioNodes.stutter.gain.setValueAtTime(1.4, t);
      audioNodes.stutter.gain.linearRampToValueAtTime(1, t + 0.01);
    }
  }, 40 + (1 - intensity) * 120);
}

function makeCrushCurve(amount) {
  const steps = Math.max(2, Math.floor(64 - amount * 58));
  const curve = new Float32Array(256);
  for (let i = 0; i < 256; i++) {
    const x = (i / 128 - 1) * (1 + amount * 2);
    curve[i] = (Math.round(x * steps) / steps) * 0.9;
  }
  return curve;
}

/** Per-note micro glitch (audio) */
export function applyNoteGlitch(gainNode, ctx, duration) {
  if (intensity < 0.12) return;
  const t = ctx.currentTime;
  if (Math.random() < intensity * 0.5) {
    gainNode.gain.setValueAtTime(0, t + duration * 0.2);
    gainNode.gain.linearRampToValueAtTime(0.18, t + duration * 0.25);
  }
  if (Math.random() < intensity * 0.35) {
    gainNode.gain.setValueAtTime(0.35, t + duration * 0.5);
    gainNode.gain.linearRampToValueAtTime(0.001, t + duration);
  }
}

export function applyVideoGlitchCss() {
  const g = intensity;
  const hue = g * 40;
  const sat = 1 + g * 0.8;
  const contrast = 1 + g * 0.5;
  const filter = `hue-rotate(${hue}deg) saturate(${sat}) contrast(${contrast})`;
  for (const sel of [".stage-wrap", ".model-viewport", "#stage-visualizer"]) {
    const el = document.querySelector(sel);
    if (el) el.style.filter = g > 0.05 ? filter : "";
  }
  document.body.style.setProperty("--glitch-intensity", String(g));
}

/**
 * Draw RGB-split + scanline glitch on overlay canvas (video)
 */
export function drawVideoGlitch(overlayCtx, w, h, sourceCanvas) {
  const g = intensity;
  if (g < 0.08 || !overlayCtx) return;

  const shift = Math.floor(g * 14);
  if (sourceCanvas && g > 0.25) {
    try {
      overlayCtx.globalCompositeOperation = "screen";
      overlayCtx.drawImage(sourceCanvas, shift, 0, w, h);
      overlayCtx.globalCompositeOperation = "multiply";
      overlayCtx.fillStyle = `rgba(0, 229, 255, ${g * 0.12})`;
      overlayCtx.fillRect(-shift, 0, w, h);
      overlayCtx.globalCompositeOperation = "source-over";
      overlayCtx.fillStyle = `rgba(224, 64, 251, ${g * 0.1})`;
      overlayCtx.fillRect(shift * 2, 0, w, h);
    } catch {
      /* tainted or zero size */
    }
  }

  overlayCtx.fillStyle = `rgba(0, 0, 0, ${0.08 + g * 0.12})`;
  for (let y = 0; y < h; y += 3 + Math.floor((1 - g) * 4)) {
    if (Math.random() < g * 0.15) overlayCtx.fillRect(0, y, w, 1);
  }
}

export function exportPlaygroundState() {
  return { glitch: intensity };
}