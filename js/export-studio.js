import { getAudio, getRecordStream } from "./audio-bus.js";
import { audioBufferToWav } from "./wav-encode.js";

let recording = false;
let mediaRecorder = null;
let recordedChunks = [];

export function initExportStudio() {
  document.getElementById("export-record-start")?.addEventListener("click", startAudioRecord);
  document.getElementById("export-record-stop")?.addEventListener("click", stopAudioRecord);
  document.getElementById("export-wav")?.addEventListener("click", () => exportLastAs("wav"));
  document.getElementById("export-mp3")?.addEventListener("click", () => exportLastAs("mp3"));
  document.getElementById("export-webm-audio")?.addEventListener("click", () => exportLastAs("webm"));
  document.getElementById("export-video-start")?.addEventListener("click", startVideoRecord);
  document.getElementById("export-video-stop")?.addEventListener("click", stopVideoRecord);
  document.getElementById("export-mp4")?.addEventListener("click", () => exportLastVideoAs("mp4"));
  document.getElementById("export-webm-video")?.addEventListener("click", () => exportLastVideoAs("webm"));
}

let lastAudioBlob = null;
let lastVideoBlob = null;

function setStatus(msg, type = "") {
  const el = document.getElementById("export-status");
  if (el) {
    el.textContent = msg;
    el.className = `export-status ${type}`;
  }
}

async function startAudioRecord() {
  getAudio();
  const stream = getRecordStream();
  recordedChunks = [];
  const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
    ? "audio/webm;codecs=opus"
    : "audio/webm";
  mediaRecorder = new MediaRecorder(stream, { mimeType: mime });
  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size) recordedChunks.push(e.data);
  };
  mediaRecorder.onstop = () => {
    lastAudioBlob = new Blob(recordedChunks, { type: mime });
    setStatus(`Recorded ${(lastAudioBlob.size / 1024).toFixed(1)} KB — choose export format`, "ok");
  };
  mediaRecorder.start(100);
  recording = true;
  setStatus("Recording audio… play synth or run voice clone", "rec");
}

function stopAudioRecord() {
  if (mediaRecorder?.state === "recording") mediaRecorder.stop();
  recording = false;
}

let videoRecorder = null;
let videoChunks = [];

let compositeRaf = null;
let compositeCanvas = null;

async function startVideoRecord() {
  getAudio();
  const fps = 30;
  const canvasStream = createCompositedVideoStream(fps);
  if (!canvasStream) {
    setStatus("No canvas found for video capture", "err");
    return;
  }
  const audioStream = getRecordStream();
  const combined = new MediaStream([
    ...canvasStream.getVideoTracks(),
    ...audioStream.getAudioTracks(),
  ]);
  const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
    ? "video/webm;codecs=vp9,opus"
    : "video/webm";
  videoChunks = [];
  videoRecorder = new MediaRecorder(combined, { mimeType: mime, videoBitsPerSecond: 2_500_000 });
  videoRecorder.ondataavailable = (e) => {
    if (e.data.size) videoChunks.push(e.data);
  };
  videoRecorder.onstop = () => {
    lastVideoBlob = new Blob(videoChunks, { type: mime });
    setStatus(`Video captured ${(lastVideoBlob.size / 1024 / 1024).toFixed(2)} MB`, "ok");
  };
  videoRecorder.start(200);
  setStatus("Recording video (stage/model + audio)… max 60s auto-stop", "rec");
  setTimeout(() => {
    if (videoRecorder?.state === "recording") stopVideoRecord();
  }, 60000);
}

function stopVideoRecord() {
  if (videoRecorder?.state === "recording") videoRecorder.stop();
  if (compositeRaf) cancelAnimationFrame(compositeRaf);
  compositeRaf = null;
  compositeCanvas = null;
}

/** Composite stage/model canvas + glitch overlay so video export includes visual glitch */
function createCompositedVideoStream(fps) {
  const base =
    document.querySelector("#model-viewport canvas") ||
    document.getElementById("stage-visualizer");
  if (!base) return null;

  const wrap = base.closest(".stage-wrap, .model-viewport") || base.parentElement;
  const overlay = wrap?.querySelector(".ghost-overlay");
  const rect = wrap?.getBoundingClientRect() || base.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;

  compositeCanvas = document.createElement("canvas");
  compositeCanvas.width = Math.floor(rect.width * dpr);
  compositeCanvas.height = Math.floor(rect.height * dpr);
  const ctx = compositeCanvas.getContext("2d");

  const paint = () => {
    ctx.fillStyle = "#0c0a1a";
    ctx.fillRect(0, 0, compositeCanvas.width, compositeCanvas.height);
    try {
      ctx.drawImage(base, 0, 0, compositeCanvas.width, compositeCanvas.height);
      if (overlay?.width) {
        ctx.drawImage(overlay, 0, 0, compositeCanvas.width, compositeCanvas.height);
      }
    } catch {
      /* skip frame */
    }
    compositeRaf = requestAnimationFrame(paint);
  };
  paint();

  return compositeCanvas.captureStream(fps);
}

function download(blob, filename) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

async function exportLastAs(format) {
  if (!lastAudioBlob) {
    setStatus("Record audio first (Start → Stop)", "err");
    return;
  }
  const stamp = dateStamp();

  if (format === "webm") {
    download(lastAudioBlob, `veil-lumen-${stamp}.webm`);
    setStatus("Downloaded .webm", "ok");
    return;
  }

  const buffer = await blobToAudioBuffer(lastAudioBlob);
  if (!buffer) {
    setStatus("Could not decode recording", "err");
    return;
  }

  if (format === "wav") {
    download(audioBufferToWav(buffer), `veil-lumen-${stamp}.wav`);
    setStatus("Downloaded .wav", "ok");
    return;
  }

  if (format === "mp3") {
    setStatus("Encoding MP3…", "rec");
    try {
      const mp3 = await encodeMp3(buffer);
      download(mp3, `veil-lumen-${stamp}.mp3`);
      setStatus("Downloaded .mp3", "ok");
    } catch (e) {
      setStatus(`MP3 failed: ${e.message}. Try .wav or .webm`, "err");
    }
  }
}

async function exportLastVideoAs(format) {
  if (!lastVideoBlob) {
    setStatus("Record video first", "err");
    return;
  }
  const stamp = dateStamp();
  if (format === "webm") {
    download(lastVideoBlob, `veil-lumen-stage-${stamp}.webm`);
    setStatus("Downloaded .webm video", "ok");
    return;
  }
  if (format === "mp4") {
    if (lastVideoBlob.type.includes("mp4")) {
      download(lastVideoBlob, `veil-lumen-stage-${stamp}.mp4`);
      return;
    }
    setStatus("Converting to MP4 (ffmpeg)… large download on first use", "rec");
    try {
      const mp4 = await convertWebmToMp4(lastVideoBlob);
      download(mp4, `veil-lumen-stage-${stamp}.mp4`);
      setStatus("Downloaded .mp4", "ok");
    } catch (e) {
      setStatus(`MP4: ${e.message}. Downloaded .webm instead — use VLC or convert locally`, "err");
      download(lastVideoBlob, `veil-lumen-stage-${stamp}.webm`);
    }
  }
}

async function blobToAudioBuffer(blob) {
  const ctx = getAudio();
  const ab = await blob.arrayBuffer();
  return ctx.decodeAudioData(ab.slice(0));
}

async function loadLame() {
  if (window.lamejs) return window.lamejs;
  await new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/lamejs@1.2.1/lame.min.js";
    s.onload = resolve;
    s.onerror = () => reject(new Error("lamejs load failed"));
    document.head.appendChild(s);
  });
  return window.lamejs;
}

async function encodeMp3(buffer) {
  const lame = await loadLame();
  const ch = buffer.numberOfChannels;
  const left = floatTo16(buffer.getChannelData(0));
  const right = ch > 1 ? floatTo16(buffer.getChannelData(1)) : left;
  const enc = new lame.Mp3Encoder(ch, buffer.sampleRate, 192);
  const block = 1152;
  const parts = [];
  for (let i = 0; i < left.length; i += block) {
    const l = left.subarray(i, i + block);
    const r = right.subarray(i, i + block);
    const buf = ch === 2 ? enc.encodeBuffer(l, r) : enc.encodeBuffer(l);
    if (buf.length) parts.push(buf);
  }
  const end = enc.flush();
  if (end.length) parts.push(end);
  return new Blob(parts, { type: "audio/mp3" });
}

function floatTo16(float32) {
  const out = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return out;
}

let ffmpegLoading = null;

async function getFfmpeg() {
  if (window._veilFfmpeg) return window._veilFfmpeg;
  if (ffmpegLoading) return ffmpegLoading;
  ffmpegLoading = (async () => {
    const { FFmpeg } = await import("https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.10/dist/esm/index.js");
    const { fetchFile, toBlobURL } = await import(
      "https://cdn.jsdelivr.net/npm/@ffmpeg/util@0.12.1/dist/esm/index.js"
    );
    const ff = new FFmpeg();
    const base = "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm";
    await ff.load({
      coreURL: await toBlobURL(`${base}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${base}/ffmpeg-core.wasm`, "application/wasm"),
    });
    window._veilFfmpeg = { ff, fetchFile };
    return window._veilFfmpeg;
  })();
  return ffmpegLoading;
}

async function convertWebmToMp4(webmBlob) {
  const { ff, fetchFile } = await getFfmpeg();
  await ff.writeFile("in.webm", await fetchFile(webmBlob));
  await ff.exec(["-i", "in.webm", "-c:v", "libx264", "-preset", "fast", "-c:a", "aac", "out.mp4"]);
  const data = await ff.readFile("out.mp4");
  return new Blob([data.buffer], { type: "video/mp4" });
}

function dateStamp() {
  return new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
}