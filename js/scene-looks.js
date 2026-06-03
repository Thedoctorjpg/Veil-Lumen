/**
 * Outfit & background presets for the Model viewport
 */

const STORAGE_KEY = "veil_scene_looks_v1";

export const OUTFITS = {
  spectral: {
    id: "spectral",
    label: "Spectral Default",
    body: 0x39c5bb,
    emissive: 0x0a2826,
    emissiveIntensity: 0.35,
    metalness: 0.15,
    roughness: 0.35,
    hair: 0x00e5ff,
    hairEmissive: 0x062a28,
    eyeEmissive: 0xe040fb,
    rim: 0xe040fb,
    hemiSky: 0x00e5ff,
    hemiGround: 0x1e1b4b,
  },
  neon: {
    id: "neon",
    label: "Neon Magenta",
    body: 0xff2d9a,
    emissive: 0x2a0818,
    emissiveIntensity: 0.45,
    metalness: 0.2,
    roughness: 0.3,
    hair: 0xff4db8,
    hairEmissive: 0x3d0a24,
    eyeEmissive: 0x00e5ff,
    rim: 0xff2d9a,
    hemiSky: 0xff6ec7,
    hemiGround: 0x1a0a14,
  },
  ghost: {
    id: "ghost",
    label: "Ghost White",
    body: 0xd8e8f0,
    emissive: 0x1a2830,
    emissiveIntensity: 0.2,
    metalness: 0.05,
    roughness: 0.55,
    hair: 0xe8f4ff,
    hairEmissive: 0x0a1820,
    eyeEmissive: 0x88ccff,
    rim: 0xaaccff,
    hemiSky: 0xc8e0ff,
    hemiGround: 0x182028,
  },
  circuit: {
    id: "circuit",
    label: "Circuit Green",
    body: 0x4ade80,
    emissive: 0x0a2818,
    emissiveIntensity: 0.4,
    metalness: 0.12,
    roughness: 0.38,
    hair: 0x39ff14,
    hairEmissive: 0x0a3010,
    eyeEmissive: 0x00e5ff,
    rim: 0x4ade80,
    hemiSky: 0x6ee7b7,
    hemiGround: 0x0f1a14,
  },
  void: {
    id: "void",
    label: "Void Purple",
    body: 0x7c3aed,
    emissive: 0x1a0a30,
    emissiveIntensity: 0.42,
    metalness: 0.18,
    roughness: 0.32,
    hair: 0xa78bfa,
    hairEmissive: 0x2e1065,
    eyeEmissive: 0xc4b5fd,
    rim: 0x7c3aed,
    hemiSky: 0x8b5cf6,
    hemiGround: 0x12082a,
  },
  crimson: {
    id: "crimson",
    label: "Crimson Pulse",
    body: 0xf43f5e,
    emissive: 0x280810,
    emissiveIntensity: 0.38,
    metalness: 0.16,
    roughness: 0.34,
    hair: 0xff6b8a,
    hairEmissive: 0x3d0814,
    eyeEmissive: 0xffd166,
    rim: 0xf43f5e,
    hemiSky: 0xff8fa3,
    hemiGround: 0x1a080c,
  },
};

export const BACKGROUNDS = {
  "cli-void": {
    id: "cli-void",
    label: "CLI Void",
    bg: 0x0c0a1a,
    fog: 0x0c0a1a,
    fogNear: 4,
    fogFar: 12,
    gridA: 0x00e5ff,
    gridB: 0x1a1730,
    starfield: false,
    ambient: 1,
  },
  indigo: {
    id: "indigo",
    label: "Deep Indigo",
    bg: 0x0f0a24,
    fog: 0x0f0a24,
    fogNear: 3,
    fogFar: 14,
    gridA: 0x6366f1,
    gridB: 0x1e1b4b,
    starfield: false,
    ambient: 1,
  },
  terminal: {
    id: "terminal",
    label: "Terminal Green",
    bg: 0x050f0a,
    fog: 0x050f0a,
    fogNear: 5,
    fogFar: 11,
    gridA: 0x4ade80,
    gridB: 0x0a1a10,
    starfield: false,
    ambient: 1.05,
  },
  dusk: {
    id: "dusk",
    label: "Dusk Magenta",
    bg: 0x140818,
    fog: 0x140818,
    fogNear: 4,
    fogFar: 13,
    gridA: 0xe040fb,
    gridB: 0x2a1028,
    starfield: false,
    ambient: 1,
  },
  starfield: {
    id: "starfield",
    label: "Starfield",
    bg: 0x020408,
    fog: 0x020408,
    fogNear: 6,
    fogFar: 18,
    gridA: 0x334155,
    gridB: 0x0f172a,
    starfield: true,
    ambient: 0.85,
  },
  scan: {
    id: "scan",
    label: "Scanline Blue",
    bg: 0x061018,
    fog: 0x061018,
    fogNear: 3.5,
    fogFar: 10,
    gridA: 0x00e5ff,
    gridB: 0x0a2030,
    starfield: false,
    ambient: 1.1,
  },
};

let api = null;

export function registerSceneLooks(sceneApi) {
  api = sceneApi;
}

export function getSceneLooksApi() {
  return api;
}

export function loadLooksState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveLooksState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore quota */
  }
}

function applyLighting(brightness) {
  if (!api) return;
  const outfit = OUTFITS[api.currentOutfit] || OUTFITS.spectral;
  const bg = BACKGROUNDS[api.currentBackground] || BACKGROUNDS["cli-void"];
  const amb = (bg.ambient ?? 1) * brightness;
  api.keyLight.intensity = 1.1 * amb;
  api.rimLight.intensity = 0.6 * amb * (outfit.id === "ghost" ? 0.85 : 1);
  api.hemiLight.intensity = 0.9 * amb;
}

export function applyOutfit(id, opts = {}) {
  if (!api) return;
  const preset = OUTFITS[id] || OUTFITS.spectral;
  const emissiveMul = opts.emissiveMul ?? 1;

  api.bodyMaterial.color.setHex(preset.body);
  api.bodyMaterial.emissive.setHex(preset.emissive);
  const bodyGlow = preset.emissiveIntensity * emissiveMul;
  api.bodyMaterial.emissiveIntensity = bodyGlow;
  api.setBaseEmissive?.(bodyGlow);
  api.bodyMaterial.metalness = preset.metalness;
  api.bodyMaterial.roughness = preset.roughness;

  api.hairMaterial.color.setHex(preset.hair);
  api.hairMaterial.emissive.setHex(preset.hairEmissive);
  api.hairMaterial.emissiveIntensity = 0.5 * emissiveMul;

  for (const eye of api.eyeMaterials) {
    eye.emissive.setHex(preset.eyeEmissive);
    eye.emissiveIntensity = 0.8 * emissiveMul;
  }

  api.rimLight.color.setHex(preset.rim);
  api.hemiLight.color.setHex(preset.hemiSky);
  api.hemiLight.groundColor.setHex(preset.hemiGround);

  api.currentOutfit = id;
  if (opts.brightness !== undefined) applyLighting(opts.brightness);
}

export function applyBackground(id) {
  if (!api) return;
  const preset = BACKGROUNDS[id] || BACKGROUNDS["cli-void"];

  api.scene.background.setHex(preset.bg);
  if (api.scene.fog) {
    api.scene.fog.color.setHex(preset.fog);
    api.scene.fog.near = preset.fogNear;
    api.scene.fog.far = preset.fogFar;
  }

  api.replaceGrid(preset.gridA, preset.gridB);
  api.setStarfield(!!preset.starfield);

  api.currentBackground = id;
}

export function applyLooksState(state) {
  if (!state) return;
  const brightness = (state.brightness ?? 100) / 100;
  applyOutfit(state.outfit || "spectral", {
    emissiveMul: (state.emissive ?? 35) / 35,
  });
  applyBackground(state.background || "cli-void");
  applyLighting(brightness);
}