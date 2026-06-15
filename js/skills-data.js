/**
 * Melbourne Lantern creative archetypes — Veil Lumen Creative Corner
 * Synced from TTMIK / Hermes agentskills.io skills
 */

export const MELBOURNE_QUEST = {
  id: "melbourne-lantern-journey",
  name: "Melbourne Lantern Pilgrimage",
  dates: "19–22 June 2026",
  location: "Melbourne laneways",
  activationPhrase:
    "I step into the Melbourne Lantern Pilgrimage as the Flame-Kissed Bard. I release what no longer serves and create from sovereign flame.",
  veilLumenGoal: "Birth new tracks, lyrics, and export-ready skits for Veil Lumen",
};

export const TAROT_SCAM_RED_FLAGS = [
  "Payment requested before identity verified",
  '"The cards say you must act today"',
  "Curse / blockage / ritual fee for love or money",
  "Pushed off-platform (WhatsApp, Telegram, crypto)",
  "Soulmate / twin flame declared before surname",
  "Prediction mirrors your trip, laneway, or private ritual",
  'Free reading hooks paid "emergency" session',
  "Synchronicity (4:44, etc.) used as proof you owe trust",
];

export const HEALING_FACTORS = {
  theme: "Humor tends the wound — quiet lands the peace.",
  mantra: "One breath · one boundary · no re-watch spiral",
  factors: [
    { id: "hermit-lantern", label: "Hermit Lantern", phrase: "One breath, one laugh", skillId: "melbourne-lantern-bard" },
    { id: "humor-release", label: "Humor alchemy", ko: "유머로 풀어낼게요", skillId: "melbourne-lantern-bard", edit: "ep-2-5-dib" },
    { id: "helen-boundary", label: "Helen boundary", ko: "괜찮아요, 괜찮아요", skillId: "helen-neighbor", shadowIndex: 2 },
    { id: "pause-breathe", label: "Pause OK", ko: "잠시 쉬어도 괜찮아요", skillId: "helen-neighbor", shadowIndex: 4 },
    { id: "cord-cut", label: "Cord-cut", phrase: "I choose my own timeline and energy field", skillId: "helen-neighbor" },
    { id: "post-dib", label: "Post-DIB landing", pin: "HOTEL", preset: 9, edit: "dib-aftercare", questId: "side-dib-heal" },
    { id: "daily-ritual", label: "Daily integration", questId: "side-ritual", skillId: "flame-kissed-bard" },
    { id: "veil-soft-cut", label: "Veil soft cut", note: "Ballad / spoken boundary clip after dib-aftercare" },
  ],
  postBlessingSteps: [
    "GoPro off · phone face-down · one breath",
    "Name what the skit released — no re-watch spiral",
    'Helen cord-cut: "I choose my own timeline and energy field"',
    "Whisper 괜찮아요, 괜찮아요",
    "Close: humor tended the wound — you do not owe the algorithm a reply",
  ],
  urls: {
    ttmikStep4: "../TTMIK.html?step=4",
    ttmikHeal: "../TTMIK.html?heal=1",
    dibAftercare:
      "http://localhost:8000/video-editor-ultimate.html?project=melbourne-lantern&format=dib-aftercare&aspect=9:16",
  },
};

export const CROSS_APPS = [
  { label: "lets-cook · Schedule + Date", url: "http://localhost:5173/date-night", note: "RTDB-optimised Auckland→Melbourne timeline" },
  { label: "girls-love · After the Date", url: "http://localhost:5190", note: "Four-chapter romance novel" },
  { label: "TTMIK · Healing step 4", url: "../TTMIK.html?step=4", note: "Post-DIB shadow + side-dib-heal quest" },
  { label: "TTMIK Journey", url: "../TTMIK.html", note: "Skills tab + shadowing" },
  { label: "dib-aftercare edit", url: HEALING_FACTORS.urls.dibAftercare, note: "45s HOTEL mirror · Helen VO" },
  { label: "RTDB-Auckland", url: "https://github.com/Thedoctorjpg/RTDB-Auckland", note: "Waitemata · Britomart · Ferry boards" },
  { label: "Hermes preload", cmd: "hermes -s melbourne-lantern-bard,helen-neighbor,flame-kissed-bard" },
];

export const SKILLS = [
  {
    id: "melbourne-lantern-bard",
    name: "Melbourne Lantern Bard",
    icon: "🏮",
    color: "#fb923c",
    tagline: "Laneway skits, trip rituals, sovereign humor",
    role: "Creative expression for Melbourne + Veil Lumen exports",
    hermesSkill: "melbourne-lantern-bard",
    activationPhrases: ["Ignite the Melbourne Lantern Bard", "Use Melbourne Lantern Bard skill"],
    capabilities: [
      "Generate vertical video skits (TikTok/Reel style)",
      "Feed Veil Lumen lyrics and stage performances",
      "Turn tarot and synchronicities into creative pieces",
      "Boundary scripts with playful flair",
    ],
    creativePrompts: [
      "Romance scam skit with time-warp elements",
      "Tsundere dating skit in a Melbourne laneway",
      "Veil Lumen track hook from Degraves golden hour",
    ],
    shadowingPhrases: [
      { ko: "멜버른 골목이 정말 예뻐요!", en: "Melbourne laneways are so beautiful!" },
      { ko: "오늘 영상 찍을까요?", en: "Shall we film something today?" },
      { ko: "유머로 풀어낼게요.", en: "I will release it through humor." },
    ],
    ritualSteps: [
      "Light the inner lantern — one breath, one laugh",
      "Name what you are releasing without drama",
      "Film or write one sovereign skit beat for Veil export",
      'Close: "I create from flame, not from lack"',
    ],
    dibAftercareSteps: [
      "After Ep 2.5 DIB — GoPro off before Veil soft cut",
      "유머로 풀어낼게요 — then silence, not a re-watch",
      "Hand off to Helen healing factors · TTMIK ?step=4",
    ],
    veilOutputs: ["Stage lyrics", "Export Studio .webm", "Community ghost post", "Post-DIB soft ballad cut"],
  },
  {
    id: "flame-kissed-bard",
    name: "Flame-Kissed Bard",
    icon: "🔥",
    color: "#f97316",
    tagline: "Alchemize healing into humorous storytelling",
    role: "D&D Bard mechanics + Hermit alchemy → Veil tracks",
    hermesSkill: "flame-kissed-bard",
    activationPhrases: ["Flame-Kissed Bard", "Turn real life into skits"],
    capabilities: [
      "Character sheets tied to your journey",
      "Dating, scam, tsundere skit scripts",
      "Rituals blending tarot and energetic practice",
      "Melody hooks for Veil Lumen discography",
    ],
    creativePrompts: [
      "Flame-Kissed Bard character sheet for Veil Lumen",
      "Romance scam TikTok skit → export on Stage",
      "Bardic ritual scored to 128 BPM synthwave",
    ],
    shadowingPhrases: [
      { ko: "나는 나만의 이야기를 씁니다.", en: "I write my own story." },
      { ko: "웃음으로 놓아줄게요.", en: "I will let go with laughter." },
      { ko: "혼자서도 충분해요.", en: "I am enough on my own." },
    ],
    ritualSteps: [
      "Acknowledge the flame — what burned you also forged you",
      "Speak one truth aloud in Korean or English",
      "Draft a 30-second skit hook → Veil voice preview",
      "Anchor: chaotic neutral sovereignty",
    ],
    veilOutputs: ["Piano roll melody", "Track list entry", "Ghost playground preset"],
  },
  {
    id: "lo3tus",
    name: "Lo3tus Muse",
    icon: "🌸",
    color: "#f9a8d4",
    tagline: "Playful spark for dating skits & Veil content",
    role: "Chaotic muse — exaggerate x3, film under 60s",
    hermesSkill: "lo3tus",
    activationPhrases: ["Use Lo3tus energy", "Generate a Lo3tus-style skit"],
    capabilities: [
      "Fast-cut dating skits with deadpan humor",
      "Veil Lumen / Creative Corner inspiration",
      "Melbourne coffee-shop practice scenarios",
    ],
    creativePrompts: [
      "Lo3tus tsundere dating skit for Export Studio",
      "Absurd tomato skit after lets-cook cook-off",
      "Chaos Caprese → glitch-hop track idea",
    ],
    shadowingPhrases: [
      { ko: "커피 한 잔 할래요?", en: "Want to grab a coffee?" },
      { ko: "오늘 기분 어때요?", en: "How are you feeling today?" },
      { ko: "재미있게 살아요!", en: "I live playfully!" },
    ],
    ritualSteps: [
      "Pick one absurd observation from today",
      "Exaggerate it x3 for comedic effect",
      "Record 15-second hook → Veil export",
      "Release attachment — humor is the point",
    ],
    veilOutputs: ["Glitch playground preset", "Short-form video export"],
  },
  {
    id: "helen-neighbor",
    name: "Helen — Boundary Teacher",
    icon: "🛡️",
    color: "#60a5fa",
    tagline: "Compassion with protection — post-date boundaries",
    role: "Boundary archetype · cook-off aftermath · scam decode",
    hermesSkill: "helen-neighbor",
    activationPhrases: [
      "Helen teaches me that compassion includes protecting my peace",
      "Delete, release, ground — repeat",
    ],
    capabilities: [
      "Post-date / cook-off boundary scripts",
      "Tarot-scam RED FLAG procedure",
      "Neighbor-drama skits with playful flair",
      "Veil Lumen ballad lyrics from boundary wins",
    ],
    creativePrompts: [
      "Boundary Miso-Ginger Soup skit after date night",
      "Helen POV line for girls-love Ch.4 energy",
      "RED FLAG duet — spoken word over Veil synth",
    ],
    shadowingPhrases: [
      { ko: "죄송하지만 지금은 어려워요.", en: "Sorry, not possible right now." },
      { ko: "제 시간을 지킬게요.", en: "I will protect my time." },
      { ko: "괜찮아요, 괜찮아요.", en: "It's okay, it's okay." },
      { ko: "공유는 괜찮아요. 거래는 아니에요.", en: "Sharing is fine. This isn't a transaction." },
      { ko: "잠시 쉬어도 괜찮아요.", en: "It's okay to pause and breathe." },
    ],
    ritualSteps: [
      "Quick cord-cutting + neighbor release",
      'Affirm: "I choose my own timeline and energy field"',
      "RED FLAG scan (2+ = abort) before any creative collab",
      "Turn trigger into skit → Veil export if it fits",
    ],
    dibAftercareSteps: [
      "Post–Divine Insight Blessing: phone face-down · GoPro off",
      "Whisper 괜찮아요, 괜찮아요 until shoulders drop",
      "Cord-cut: no reply to expired blessings",
      "Veil soft cut: spoken boundary clip or ballad lyric line",
    ],
    veilOutputs: ["Ballad lyrics", "Spoken boundary clip", "dib-aftercare soft cut", "Community safety post"],
  },
  {
    id: "sua-tattoo",
    name: "Sua — Tattoo Flame",
    icon: "💉",
    color: "#f472b6",
    tagline: "Release muse for intimate creative transformation",
    role: "Cord-cutting for past flames → Veil Lumen pieces",
    hermesSkill: "sua-tattoo-artist",
    activationPhrases: ["Sua's flame taught me release"],
    capabilities: [
      "Veil Lumen pieces on temporary flames",
      "Cord-cutting for past intimate connections",
      "Cicada / shedding visual prompts",
    ],
    creativePrompts: [
      "Veil Lumen video essay: shed old skins",
      "Skit: tattoo artist who does energy work",
      "Ritual scored as slow ballad on Stage",
    ],
    shadowingPhrases: [
      { ko: "고마웠어요. 이제 놓아줄게요.", en: "Thank you. I release you now." },
      { ko: "나만의 불꽃이면 충분해요.", en: "My own creative fire is enough." },
      { ko: "새 껍질을 벗을게요.", en: "I will shed my old skin." },
    ],
    ritualSteps: [
      "Acknowledge the beauty of what was shared",
      'Release: "I return your flame with gratitude"',
      'Anchor: "My own creative fire is enough"',
      "One Veil Lumen lyric line",
    ],
    veilOutputs: ["Ballad track", "Melancholic stage look"],
  },
  {
    id: "asuka-brisbane",
    name: "Asuka — Distant Flame",
    icon: "🌊",
    color: "#4ade80",
    tagline: '"Beautiful maybe" — Melbourne is my yes',
    role: "Sovereign choice muse for Veil travel arcs",
    hermesSkill: "asuka-brisbane",
    activationPhrases: ["Brisbane was a beautiful maybe. Melbourne is my yes."],
    capabilities: [
      "Skits about almost extending the trip",
      "Maybe-Yes lemon posset energy in lyrics",
      "Graceful release of what-if paths",
    ],
    creativePrompts: [
      "Veil track: Melbourne is my yes",
      "Skit: almost stayed for a connection",
      "Precision dessert → crystalline synth hook",
    ],
    shadowingPhrases: [
      { ko: "멜버른이 제 선택이에요.", en: "Melbourne is my choice." },
      { ko: '아름다운 "만약에"도 놓을 수 있어요.', en: 'I can release a beautiful "what if."' },
      { ko: "제 길을 믿어요.", en: "I trust my path." },
    ],
    ritualSteps: [
      "Name the maybe without regret",
      "Affirm the yes you chose",
      "One creative line for Veil Lumen",
      "Release: no extra leg required",
    ],
    veilOutputs: ["Dream pop track", "Soft stage palette"],
  },
  {
    id: "rach3l",
    name: "rach3l — Cautionary Mirror",
    icon: "🪞",
    color: "#a78bfa",
    tagline: "Observe but do not absorb",
    role: "Scroll detox · moon card · late-night Veil snacks",
    hermesSkill: "rach3l",
    activationPhrases: ["Observe but do not absorb"],
    capabilities: [
      "Process chaotic social media without hooks",
      "Moon Card Midnight Toast creative energy",
      "Humorous skits about what not to engage",
    ],
    creativePrompts: [
      "Veil glitch track: phone face-down required",
      "Skit: 2am notifications muted",
      "Late-night snack ballad for Export Studio",
    ],
    shadowingPhrases: [
      { ko: "이건 제 에너지가 아니에요.", en: "This is not my energy to carry." },
      { ko: "관찰만 하고 흡수하지 않을게요.", en: "I observe without absorbing." },
      { ko: "다시 제 길로 돌아갈게요.", en: "I return to my own path." },
    ],
    ritualSteps: [
      "Notice without judgment",
      "Say: not my energy to carry",
      "One breath — ground feet",
      "Redirect to Veil creative outlet",
    ],
    veilOutputs: ["Late-night track", "Low-glitch ghost preset"],
  },
];

export function getSkillById(id) {
  return SKILLS.find((s) => s.id === id) || null;
}

export function hermesPreloadCmd(skillIds) {
  return `hermes -s ${skillIds.map((s) => getSkillById(s)?.hermesSkill || s).join(",")}`;
}