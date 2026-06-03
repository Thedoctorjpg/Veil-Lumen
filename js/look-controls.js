import {
  OUTFITS,
  BACKGROUNDS,
  registerSceneLooks,
  getSceneLooksApi,
  loadLooksState,
  saveLooksState,
  applyOutfit,
  applyBackground,
  applyLooksState,
} from "./scene-looks.js";

const DEFAULT_STATE = {
  outfit: "spectral",
  background: "cli-void",
  emissive: 35,
  brightness: 100,
};

let state = { ...DEFAULT_STATE, ...loadLooksState() };

function fillSelect(el, items) {
  if (!el) return;
  el.innerHTML = Object.values(items)
    .map((p) => `<option value="${p.id}">${p.label}</option>`)
    .join("");
}

function syncLabels() {
  const emVal = document.getElementById("look-emissive-val");
  const brVal = document.getElementById("look-brightness-val");
  if (emVal) emVal.textContent = `${state.emissive}%`;
  if (brVal) brVal.textContent = `${state.brightness}%`;
}

function pushToScene() {
  const api = getSceneLooksApi();
  if (!api) return;
  const emissiveMul = state.emissive / 35;
  const brightness = state.brightness / 100;
  applyOutfit(state.outfit, { emissiveMul, brightness });
  applyBackground(state.background);
  updateMetaLooks();
}

function updateMetaLooks() {
  const meta = document.getElementById("model-meta");
  if (!meta) return;
  const outfitLabel = OUTFITS[state.outfit]?.label ?? state.outfit;
  const bgLabel = BACKGROUNDS[state.background]?.label ?? state.background;
  let row = meta.querySelector("[data-look-meta]");
  if (!row) {
    row = document.createElement("div");
    row.setAttribute("data-look-meta", "");
    row.innerHTML = "<dt>Look</dt><dd></dd>";
    meta.appendChild(row);
  }
  row.querySelector("dd").textContent = `${outfitLabel} · ${bgLabel}`;
}

function bindControls() {
  const outfitSel = document.getElementById("look-outfit");
  const bgSel = document.getElementById("look-background");
  const emissive = document.getElementById("look-emissive");
  const brightness = document.getElementById("look-brightness");
  const resetBtn = document.getElementById("look-reset");

  fillSelect(outfitSel, OUTFITS);
  fillSelect(bgSel, BACKGROUNDS);

  if (outfitSel) outfitSel.value = state.outfit;
  if (bgSel) bgSel.value = state.background;
  if (emissive) emissive.value = String(state.emissive);
  if (brightness) brightness.value = String(state.brightness);
  syncLabels();

  outfitSel?.addEventListener("change", () => {
    state.outfit = outfitSel.value;
    saveLooksState(state);
    pushToScene();
  });

  bgSel?.addEventListener("change", () => {
    state.background = bgSel.value;
    saveLooksState(state);
    pushToScene();
  });

  emissive?.addEventListener("input", () => {
    state.emissive = Number(emissive.value);
    syncLabels();
    saveLooksState(state);
    pushToScene();
  });

  brightness?.addEventListener("input", () => {
    state.brightness = Number(brightness.value);
    syncLabels();
    saveLooksState(state);
    pushToScene();
  });

  resetBtn?.addEventListener("click", () => {
    state = { ...DEFAULT_STATE };
    saveLooksState(state);
    if (outfitSel) outfitSel.value = state.outfit;
    if (bgSel) bgSel.value = state.background;
    if (emissive) emissive.value = String(state.emissive);
    if (brightness) brightness.value = String(state.brightness);
    syncLabels();
    pushToScene();
  });
}

export function initLookControls() {
  bindControls();

  window.addEventListener("veil:character-ready", (e) => {
    if (e.detail?.api) registerSceneLooks(e.detail.api);
    applyLooksState(state);
    updateMetaLooks();
  });

  if (getSceneLooksApi()) {
    applyLooksState(state);
    updateMetaLooks();
  }
}

initLookControls();