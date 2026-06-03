/** Resolve /public/... URLs for root deploy and GitHub Pages project sites (/veil-lumen/). */
const REPO_SEGMENT = "veil-lumen";

function detectBasePath() {
  const htmlBase = document.documentElement.dataset?.basePath;
  if (htmlBase !== undefined) return htmlBase.replace(/\/$/, "");

  const parts = location.pathname.split("/").filter(Boolean);
  if (parts[0] === REPO_SEGMENT) return `/${REPO_SEGMENT}`;
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