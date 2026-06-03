/** Resolve /public/... URLs for root deploy and GitHub Pages project sites (/Veil-Lumen/). */
const REPO_SEGMENTS = ["Veil-Lumen", "veil-lumen"];

function detectBasePath() {
  const htmlBase = document.documentElement.dataset?.basePath;
  if (htmlBase !== undefined) return htmlBase.replace(/\/$/, "");

  const parts = location.pathname.split("/").filter(Boolean);
  const seg = parts[0];
  if (seg && REPO_SEGMENTS.includes(seg)) return `/${seg}`;
  return "";
}

let cachedBase;

export function getBasePath() {
  if (cachedBase === undefined) cachedBase = detectBasePath();
  return cachedBase;
}

export function publicUrl(path) {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${getBasePath()}${p}`;
}