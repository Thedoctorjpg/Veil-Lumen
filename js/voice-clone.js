import {
  getAudio,
  setCloneSample,
  getCloneSample,
  playClonePreview,
  getClonePitch,
} from "./audio-bus.js";
import { audioBufferToWav } from "./wav-encode.js";

const STORAGE_KEY = "veil_lumen_voice_clone_v1";
let mediaStream = null;
let recordChunks = [];
let recordRec = null;

export function initVoiceClone() {
  document.getElementById("clone-record")?.addEventListener("click", startCloneRecord);
  document.getElementById("clone-stop")?.addEventListener("click", stopCloneRecord);
  document.getElementById("clone-upload")?.addEventListener("change", handleUpload);
  document.getElementById("clone-apply")?.addEventListener("click", applyClone);
  document.getElementById("clone-preview")?.addEventListener("click", playClonePreview);
  document.getElementById("clone-pitch")?.addEventListener("input", onPitchInput);
  document.getElementById("clone-export-wav")?.addEventListener("click", exportCloneWav);

  loadStoredClone();
}

function setCloneStatus(msg, type = "") {
  const el = document.getElementById("clone-status");
  if (el) {
    el.textContent = msg;
    el.className = `clone-status ${type}`;
  }
}

async function startCloneRecord() {
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    recordChunks = [];
    recordRec = new MediaRecorder(mediaStream);
    recordRec.ondataavailable = (e) => recordChunks.push(e.data);
    recordRec.onstop = async () => {
      const blob = new Blob(recordChunks, { type: "audio/webm" });
      await ingestBlob(blob, "microphone");
      mediaStream.getTracks().forEach((t) => t.stop());
    };
    recordRec.start();
    setCloneStatus("Recording sample… 5–15s recommended", "rec");
  } catch (e) {
    setCloneStatus(`Mic access denied: ${e.message}`, "err");
  }
}

function stopCloneRecord() {
  if (recordRec?.state === "recording") recordRec.stop();
}

async function handleUpload(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  await ingestBlob(file, file.name);
  e.target.value = "";
}

async function ingestBlob(blob, label) {
  const ctx = getAudio();
  try {
    const buf = await blob.arrayBuffer();
    const buffer = await ctx.decodeAudioData(buf.slice(0));
    const maxSec = 30;
    const trimLen = Math.min(buffer.length, maxSec * buffer.sampleRate);
    const trimmed = ctx.createBuffer(
      buffer.numberOfChannels,
      trimLen,
      buffer.sampleRate
    );
    for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
      trimmed.copyToChannel(buffer.getChannelData(ch).subarray(0, trimLen), ch);
    }
    setCloneSample(trimmed, getPitchFromSlider());
    saveClone(trimmed);
    const dur = (trimLen / buffer.sampleRate).toFixed(1);
    setCloneStatus(`Sample loaded: ${label} · ${dur}s · RVC-style preview ready`, "ok");
    updateCloneMeter(trimmed);
  } catch (err) {
    setCloneStatus(`Could not decode audio: ${err.message}`, "err");
  }
}

function onPitchInput() {
  const pitch = getPitchFromSlider();
  const sample = getCloneSample();
  if (sample) setCloneSample(sample, pitch);
  const label = document.getElementById("clone-pitch-val");
  if (label) label.textContent = `${pitch.toFixed(2)}×`;
}

function getPitchFromSlider() {
  const el = document.getElementById("clone-pitch");
  return el ? Number(el.value) / 100 : 1;
}

function applyClone() {
  if (!getCloneSample()) {
    setCloneStatus("Record or upload a voice sample first", "err");
    return;
  }
  document.body.classList.add("clone-active");
  setCloneStatus("Clone applied — synth routes through Veil timbre chain", "ok");
}

function updateCloneMeter(buffer) {
  const wave = document.getElementById("clone-waveform");
  if (!wave || !buffer) return;
  const data = buffer.getChannelData(0);
  const step = Math.floor(data.length / 200);
  const bars = [];
  for (let i = 0; i < 200; i++) {
    const v = Math.abs(data[i * step] || 0);
    bars.push(`<span style="height:${Math.min(100, v * 400)}%"></span>`);
  }
  wave.innerHTML = bars.join("");
}

function saveClone(buffer) {
  try {
    const mono = buffer.getChannelData(0);
    const down = downsample(mono, buffer.sampleRate, 22050);
    const b64 = arrayBufferToBase64(float32ToArrayBuffer(down));
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        sampleRate: 22050,
        length: down.length,
        data: b64,
        savedAt: Date.now(),
      })
    );
  } catch {
    /* quota */
  }
}

async function loadStoredClone() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const { sampleRate, length, data } = JSON.parse(raw);
    const ctx = getAudio();
    const floats = arrayBufferToFloat32(base64ToArrayBuffer(data));
    const buffer = ctx.createBuffer(1, length, sampleRate);
    buffer.copyToChannel(floats, 0);
    setCloneSample(buffer, getPitchFromSlider());
    updateCloneMeter(buffer);
    setCloneStatus("Restored saved voice clone from local storage", "ok");
  } catch {
    /* ignore */
  }
}

function exportCloneWav() {
  const sample = getCloneSample();
  if (!sample) {
    setCloneStatus("No clone sample to export", "err");
    return;
  }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(audioBufferToWav(sample));
  a.download = `veil-clone-${Date.now()}.wav`;
  a.click();
  setCloneStatus("Exported clone sample as .wav", "ok");
}

function downsample(data, fromRate, toRate) {
  if (fromRate === toRate) return data;
  const ratio = fromRate / toRate;
  const len = Math.floor(data.length / ratio);
  const out = new Float32Array(len);
  for (let i = 0; i < len; i++) out[i] = data[Math.floor(i * ratio)];
  return out;
}

function float32ToArrayBuffer(arr) {
  return arr.buffer.slice(arr.byteOffset, arr.byteOffset + arr.byteLength);
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

function base64ToArrayBuffer(b64) {
  const s = atob(b64);
  const buf = new ArrayBuffer(s.length);
  const v = new Uint8Array(buf);
  for (let i = 0; i < s.length; i++) v[i] = s.charCodeAt(i);
  return buf;
}

function arrayBufferToFloat32(buffer) {
  return new Float32Array(buffer);
}