/**
 * Veil Lumen Creative Corner — Melbourne Lantern skills UI
 */

import {
  SKILLS,
  MELBOURNE_QUEST,
  TAROT_SCAM_RED_FLAGS,
  CROSS_APPS,
  HEALING_FACTORS,
  getSkillById,
  hermesPreloadCmd,
} from "./skills-data.js";

const STORAGE_KEY = "veil-lumen-active-skill";

function el(id) {
  return document.getElementById(id);
}

function getActiveId() {
  return localStorage.getItem(STORAGE_KEY) || SKILLS[0]?.id || "";
}

function setActiveId(id) {
  localStorage.setItem(STORAGE_KEY, id);
}

function renderSkillList(activeId) {
  const list = el("skills-list");
  if (!list) return;
  list.innerHTML = "";

  SKILLS.forEach((skill) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = skill.id === activeId ? "skill-chip active" : "skill-chip";
    btn.style.setProperty("--skill-color", skill.color);
    btn.innerHTML = `<span class="skill-chip-icon">${skill.icon}</span><span>${skill.name}</span>`;
    btn.addEventListener("click", () => selectSkill(skill.id));
    list.appendChild(btn);
  });
}

function renderDetail(skill) {
  const detail = el("skill-detail");
  if (!detail || !skill) return;

  const phrases = skill.shadowingPhrases
    .map((p) => `<li><strong>${p.ko}</strong><br /><span>${p.en}</span></li>`)
    .join("");

  detail.innerHTML = `
    <header class="skill-detail-head" style="--skill-color:${skill.color}">
      <span class="skill-detail-icon">${skill.icon}</span>
      <div>
        <h3>${skill.name}</h3>
        <p class="skill-tagline">${skill.tagline}</p>
        <p class="skill-role">${skill.role}</p>
      </div>
    </header>
    <div class="skill-detail-grid">
      <article>
        <h4>Activation</h4>
        <ul>${skill.activationPhrases.map((p) => `<li>"${p}"</li>`).join("")}</ul>
      </article>
      <article>
        <h4>Ritual → Veil</h4>
        <ol>${skill.ritualSteps.map((s) => `<li>${s}</li>`).join("")}</ol>
        ${
          skill.dibAftercareSteps?.length
            ? `<h4 class="skill-aftercare-head">After blessing skit</h4><ol>${skill.dibAftercareSteps.map((s) => `<li>${s}</li>`).join("")}</ol>`
            : ""
        }
      </article>
      <article>
        <h4>Shadowing</h4>
        <ul class="shadow-list">${phrases}</ul>
      </article>
      <article>
        <h4>Creative prompts</h4>
        <ul>${skill.creativePrompts.map((p) => `<li>${p}</li>`).join("")}</ul>
      </article>
    </div>
    <p class="skill-veil-out"><strong>Veil outputs:</strong> ${skill.veilOutputs.join(" · ")}</p>
    <div class="skill-actions">
      <button type="button" class="btn btn-primary" id="skill-feed-veil">Feed Stage lyrics</button>
      <button type="button" class="btn btn-ghost" id="skill-copy-hermes">Copy Hermes cmd</button>
      <button type="button" class="btn btn-ghost" id="skill-copy-activation">Copy activation</button>
    </div>
    <p class="skill-status" id="skill-status" aria-live="polite"></p>
  `;

  el("skill-feed-veil")?.addEventListener("click", () => feedVeilLyrics(skill));
  el("skill-copy-hermes")?.addEventListener("click", () => copyText(hermesPreloadCmd([skill.id]), "Hermes command copied"));
  el("skill-copy-activation")?.addEventListener("click", () =>
    copyText(skill.activationPhrases[0], "Activation phrase copied")
  );
}

function selectSkill(id) {
  setActiveId(id);
  const skill = getSkillById(id);
  renderSkillList(id);
  renderDetail(skill);
}

async function copyText(text, msg) {
  const status = el("skill-status");
  try {
    await navigator.clipboard.writeText(text);
    if (status) status.textContent = msg;
  } catch {
    if (status) status.textContent = "Copy failed — select text manually";
  }
}

function feedVeilLyrics(skill) {
  const phrase = skill.shadowingPhrases[0];
  const line = `♪ ${phrase.ko} — ${phrase.en}`;
  const display = el("lyrics-display");
  if (display) {
    display.innerHTML = `<span class="lyrics-line active">${line}</span>`;
  }
  const compose = el("community-message");
  if (compose && !compose.value.trim()) {
    compose.value = `[${skill.name}] ${skill.activationPhrases[0]} → Veil export idea`;
  }
  const status = el("skill-status");
  if (status) status.textContent = "Fed Stage lyrics + community compose";
}

function renderQuest() {
  const quest = el("skills-quest");
  if (!quest) return;
  quest.innerHTML = `
    <h3>${MELBOURNE_QUEST.name}</h3>
    <p>${MELBOURNE_QUEST.dates} · ${MELBOURNE_QUEST.location}</p>
    <p class="quest-activation">"${MELBOURNE_QUEST.activationPhrase}"</p>
    <p><strong>Veil goal:</strong> ${MELBOURNE_QUEST.veilLumenGoal}</p>
  `;
}

function renderRedFlags() {
  const box = el("skills-redflags");
  if (!box) return;
  box.innerHTML = `<ul>${TAROT_SCAM_RED_FLAGS.map((f) => `<li>${f}</li>`).join("")}</ul>`;
}

function renderHealingFactors() {
  const box = el("skills-healing");
  if (!box) return;
  const factors = HEALING_FACTORS.factors
    .map((f) => {
      const bit = f.ko || f.phrase || f.note || f.edit || "";
      return `<li><strong>${f.label}</strong>${bit ? ` — ${bit}` : ""}</li>`;
    })
    .join("");
  const steps = HEALING_FACTORS.postBlessingSteps.map((s) => `<li>${s}</li>`).join("");
  box.innerHTML = `
    <p class="healing-mantra">${HEALING_FACTORS.mantra}</p>
    <ul class="healing-factors">${factors}</ul>
    <h4>Post-DIB ritual</h4>
    <ol class="healing-ritual">${steps}</ol>
    <a class="cross-app-link" href="${HEALING_FACTORS.urls.ttmikStep4}" target="_blank" rel="noopener">TTMIK step 4<span>Shadow + quest log</span></a>
  `;
}

function renderCrossApps() {
  const box = el("skills-crossapps");
  if (!box) return;
  box.innerHTML = CROSS_APPS.map((app) => {
    if (app.cmd) {
      return `<button type="button" class="cross-app-btn" data-cmd="${app.cmd}">${app.label}<span>${app.note}</span></button>`;
    }
    return `<a class="cross-app-link" href="${app.url}" target="_blank" rel="noopener">${app.label}<span>${app.note}</span></a>`;
  }).join("");

  box.querySelectorAll("[data-cmd]").forEach((btn) => {
    btn.addEventListener("click", () => copyText(btn.dataset.cmd, "Hermes preload copied"));
  });
}

export function initCreativeSkills() {
  const activeId = getActiveId();
  renderQuest();
  renderRedFlags();
  renderHealingFactors();
  renderCrossApps();
  renderSkillList(activeId);
  renderDetail(getSkillById(activeId));

  el("skills-preload-all")?.addEventListener("click", () => {
    copyText(hermesPreloadCmd(SKILLS.map((s) => s.id)), "Full skill stack copied");
  });
}