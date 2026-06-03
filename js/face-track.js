/**
 * Webcam face tracking → Veil Lumen character rig (MediaPipe Face Landmarker)
 */

import {
  setHeadPoseTarget,
  setTrackingActive,
  resetHeadPose,
  isTrackingActive,
  setSmoothing,
} from "./character-rig.js";

const WASM_BASE = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";
const MODEL_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm/face_landmarker.task";

let faceLandmarker = null;
let videoEl = null;
let stream = null;
let rafId = null;
let lastVideoTime = -1;
let mirror = true;
let sensitivity = 1;
let faceDetected = false;

export function initFaceTrack() {
  videoEl = document.getElementById("face-video");
  document.getElementById("face-start")?.addEventListener("click", startTracking);
  document.getElementById("face-stop")?.addEventListener("click", stopTracking);
  document.getElementById("face-mirror")?.addEventListener("change", (e) => {
    mirror = e.target.checked;
    if (videoEl) videoEl.style.transform = mirror ? "scaleX(-1)" : "none";
  });
  document.getElementById("face-sensitivity")?.addEventListener("input", (e) => {
    sensitivity = Number(e.target.value) / 100;
    const label = document.getElementById("face-sensitivity-val");
    if (label) label.textContent = `${Math.round(sensitivity * 100)}%`;
    setSmoothing(0.1 + sensitivity * 0.2);
  });
}

async function loadFaceLandmarker() {
  if (faceLandmarker) return faceLandmarker;
  setStatus("Loading face model…", "rec");
  const { FaceLandmarker, FilesetResolver } = await import(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/+esm"
  );
  const vision = await FilesetResolver.forVisionTasks(WASM_BASE);
  faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: MODEL_URL,
      delegate: "GPU",
    },
    runningMode: "VIDEO",
    numFaces: 1,
    outputFaceBlendshapes: false,
  });
  return faceLandmarker;
}

async function startTracking() {
  if (!videoEl) return;
  try {
    setStatus("Starting webcam…", "rec");
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
      audio: false,
    });
    videoEl.srcObject = stream;
    await videoEl.play();
    videoEl.classList.add("active");
    syncOverlaySize();
    videoEl.addEventListener("loadedmetadata", syncOverlaySize);

    await loadFaceLandmarker();
    setTrackingActive(true);
    setStatus("Face tracking active — look at the camera", "ok");
    document.getElementById("face-start")?.setAttribute("disabled", "true");
    document.getElementById("face-stop")?.removeAttribute("disabled");
    lastVideoTime = -1;
    trackLoop();
  } catch (err) {
    setStatus(`Camera error: ${err.message}`, "err");
    stopTracking();
  }
}

function stopTracking() {
  setTrackingActive(false);
  resetHeadPose();
  if (rafId) cancelAnimationFrame(rafId);
  rafId = null;
  lastVideoTime = -1;
  faceDetected = false;
  if (stream) {
    stream.getTracks().forEach((t) => t.stop());
    stream = null;
  }
  if (videoEl) {
    videoEl.srcObject = null;
    videoEl.classList.remove("active");
  }
  setStatus("Face tracking stopped", "");
  document.getElementById("face-start")?.removeAttribute("disabled");
  document.getElementById("face-stop")?.setAttribute("disabled", "true");
  updateHud(false);
}

function trackLoop() {
  if (!faceLandmarker || !videoEl || videoEl.readyState < 2) {
    rafId = requestAnimationFrame(trackLoop);
    return;
  }

  const now = performance.now();
  if (videoEl.currentTime !== lastVideoTime) {
    lastVideoTime = videoEl.currentTime;
    const results = faceLandmarker.detectForVideo(videoEl, now);
    if (results.faceLandmarks?.[0]) {
      faceDetected = true;
      const pose = estimatePose(results.faceLandmarks[0]);
      setHeadPoseTarget(pose);
      updateHud(true, pose);
      drawOverlay(results.faceLandmarks[0]);
    } else {
      faceDetected = false;
      updateHud(false);
    }
  }

  if (isTrackingActive()) rafId = requestAnimationFrame(trackLoop);
}

/** MediaPipe landmark indices */
const NOSE = 1;
const CHIN = 152;
const L_EYE = 33;
const R_EYE = 263;
const U_LIP = 13;
const L_LIP = 14;
const FOREHEAD = 10;

function estimatePose(lm) {
  const le = lm[L_EYE];
  const re = lm[R_EYE];
  const nose = lm[NOSE];
  const chin = lm[CHIN];
  const forehead = lm[FOREHEAD];

  const eyeCx = (le.x + re.x) * 0.5;
  const eyeCy = (le.y + re.y) * 0.5;
  const s = sensitivity * 1.15;

  const yaw = (nose.x - eyeCx) * 3.4 * s * (mirror ? -1 : 1);
  const pitch = ((nose.y - eyeCy) * 2.6 + (chin.y - forehead.y) * 0.35 - 0.12) * s;
  const roll = Math.atan2(re.y - le.y, re.x - le.x) * (mirror ? -1 : 1);

  const mouthOpen = Math.min(1, Math.hypot(lm[U_LIP].x - lm[L_LIP].x, lm[U_LIP].y - lm[L_LIP].y) * 14);

  return {
    yaw,
    pitch,
    roll,
    mouth: mouthOpen,
    leanX: (eyeCx - 0.5) * 1.2 * s,
    leanY: (eyeCy - 0.52) * 0.8 * s,
  };
}

function drawOverlay(lm) {
  const canvas = document.getElementById("face-overlay");
  if (!canvas || !videoEl) return;
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.strokeStyle = "rgba(0, 229, 255, 0.7)";
  ctx.lineWidth = 1;
  const pts = [NOSE, L_EYE, R_EYE, CHIN, U_LIP, L_LIP];
  for (const i of pts) {
    const p = lm[i];
    const x = mirror ? (1 - p.x) * w : p.x * w;
    const y = p.y * h;
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function updateHud(ok, pose) {
  const el = document.getElementById("face-hud");
  if (!el) return;
  if (!ok) {
    el.textContent = "No face detected";
    return;
  }
  el.textContent = `yaw ${pose.yaw.toFixed(2)} · pitch ${pose.pitch.toFixed(2)} · roll ${pose.roll.toFixed(2)} · mouth ${(pose.mouth * 100) | 0}%`;
}

function syncOverlaySize() {
  const canvas = document.getElementById("face-overlay");
  if (!canvas || !videoEl) return;
  canvas.width = videoEl.videoWidth || 640;
  canvas.height = videoEl.videoHeight || 480;
}

function setStatus(msg, type) {
  const el = document.getElementById("face-status");
  if (el) {
    el.textContent = msg;
    el.className = `face-status ${type}`;
  }
}