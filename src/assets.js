// ============================================================================
//  资源管理 —— 依据 §5。
//  - 按固定目录/命名加载（只换文件、不改代码）。
//  - 任何缺失都不报错、不白屏：按 §5.4 回退链处理，必要时生成风格统一的占位图。
//  - 音频缺失 → 静音；图片缺失 → 程序绘制占位。
// ============================================================================

import GameConfig from "../config/game-config.js";

// 注意：index.html 与 images/、audio/ 同级（项目根目录本身名为 "assets"，
// 但这只是磁盘文件夹名，不代表 URL 需要再加一层 "assets/" 前缀）。
const IMG_BASE = "images/";
const AUD_BASE = "audio/";

// 已成功加载的资源
const images = {};   // key -> HTMLImageElement
const audios = {};   // key -> HTMLAudioElement
const placeholders = {}; // key -> HTMLCanvasElement（程序占位）
const missing = new Set();

// ---- 资源清单（M1：菜单/选关/通用 + 全部，后续里程碑共用此清单）----
function buildImageList() {
  const list = [];
  // 动物
  for (let i = 1; i <= GameConfig.assets.moleSkinCount; i++) {
    list.push({ key: `mole_${i}`, src: `animals/mole_${i}.png`, optional: false });
    list.push({ key: `mole_${i}_hit`, src: `animals/mole_${i}_hit.png`, optional: true });
  }
  list.push({ key: "mole_hit", src: "animals/mole_hit.png", optional: true });
  list.push({ key: "rat", src: "animals/rat.png", optional: false });
  list.push({ key: "cat", src: "animals/cat.png", optional: false });
  list.push({ key: "rat_hit", src: "animals/rat_hit.png", optional: true });
  list.push({ key: "cat_hit", src: "animals/cat_hit.png", optional: true });
  // 锤子 / 光标
  list.push({ key: "hammer", src: "hammer/hammer.png", optional: false });
  list.push({ key: "hammer_down", src: "hammer/hammer_down.png", optional: true });
  list.push({ key: "cursor_finger", src: "hammer/cursor_finger.png", optional: false });
  // 洞口
  list.push({ key: "hole", src: "board/hole.png", optional: false });
  list.push({ key: "hole_front", src: "board/hole_front.png", optional: true });
  // 背景
  for (let i = 1; i <= GameConfig.levels.length; i++) {
    list.push({ key: `level_${i}`, src: `backgrounds/level_${i}.png`, optional: true });
  }
  list.push({ key: "menu_bg", src: "backgrounds/menu_bg.png", optional: true });
  // UI（可选）
  list.push({ key: "star_filled", src: "ui/star_filled.png", optional: true });
  list.push({ key: "star_empty", src: "ui/star_empty.png", optional: true });
  return list;
}

function buildAudioList() {
  return [
    { key: "music_menu", src: "music/menu.mp3" },
    { key: "music_gameplay", src: "music/gameplay.mp3" },
    // 按关音乐（可选覆盖）
    ...GameConfig.levels.map((l) => ({ key: `music_gameplay_level_${l.id}`, src: `music/gameplay_level_${l.id}.mp3` })),
    { key: "sfx_hammer_swing", src: "sfx/hammer_swing.mp3" },
    { key: "sfx_hit_mole", src: "sfx/hit_mole.mp3" },
    { key: "sfx_hit_rat", src: "sfx/hit_rat.mp3" },
    { key: "sfx_hit_cat", src: "sfx/hit_cat.mp3" },
    { key: "sfx_star", src: "sfx/star.mp3" },
    { key: "sfx_fail", src: "sfx/fail.mp3" },
    { key: "sfx_button", src: "sfx/button.mp3" }
  ];
}

function loadImage(key, src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => { images[key] = img; resolve(); };
    img.onerror = () => { missing.add(key); resolve(); };
    img.src = IMG_BASE + src;
  });
}

// 正式素材按 §5.1 固定为 .mp3；若缺失，尝试同名 .wav 占位音（由
// tools/gen-placeholder-audio.mjs 生成，§5.4 "占位音可为极短提示音"）。
// 用户放入正式 .mp3 后自动优先使用，无需删除 .wav、不改代码。
function loadAudioOnce(fullSrc) {
  return new Promise((resolve) => {
    const a = new Audio();
    let done = false;
    const ok = () => { if (!done) { done = true; resolve(a); } };
    const fail = () => { if (!done) { done = true; resolve(null); } };
    a.oncanplaythrough = ok;
    a.onloadeddata = ok;
    a.onerror = fail;
    a.preload = "auto";
    a.src = fullSrc;
    setTimeout(() => { if (!done) fail(); }, 3000);
  });
}

async function loadAudio(key, src) {
  let a = await loadAudioOnce(AUD_BASE + src);
  if (!a && src.endsWith(".mp3")) {
    a = await loadAudioOnce(AUD_BASE + src.slice(0, -4) + ".wav");
  }
  if (a) audios[key] = a; else missing.add(key);
}

// ---- 公共加载入口：返回进度回调驱动的 Promise ----
export async function preloadAll(onProgress) {
  const imgList = buildImageList();
  const audList = buildAudioList();
  const total = imgList.length + audList.length;
  let loaded = 0;
  const tick = () => { loaded++; if (onProgress) onProgress(loaded / total); };

  const tasks = [];
  for (const it of imgList) tasks.push(loadImage(it.key, it.src).then(tick));
  for (const it of audList) tasks.push(loadAudio(it.key, it.src).then(tick));
  await Promise.all(tasks);

  // 为关键缺失图生成程序占位，保证渲染可用
  generatePlaceholders();
}

// ============================================================================
//  程序占位图（风格统一：圆角卡通色块 + 标签）
// ============================================================================
const PLACEHOLDER_STYLE = {
  mole_1: { fill: "#a9743f", label: "鼠1" },
  mole_2: { fill: "#9c6736", label: "鼠2" },
  mole_3: { fill: "#b5824a", label: "鼠3" },
  rat:    { fill: "#888888", label: "鼠" },
  cat:    { fill: "#e0883c", label: "猫" },
  hammer: { fill: "#c75050", label: "锤" },
  cursor_finger: { fill: "#f2c14e", label: "✋" }
};

function makePlaceholder(key, size = 256) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d");
  const st = PLACEHOLDER_STYLE[key] || { fill: "#7a7a7a", label: "?" };
  const r = size * 0.36;
  g.fillStyle = st.fill;
  g.beginPath();
  g.arc(size / 2, size / 2, r, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "rgba(0,0,0,0.25)";
  g.lineWidth = size * 0.03;
  g.stroke();
  // 眼睛（让占位更像角色）
  g.fillStyle = "#fff";
  g.beginPath(); g.arc(size / 2 - r * 0.32, size / 2 - r * 0.1, r * 0.18, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.arc(size / 2 + r * 0.32, size / 2 - r * 0.1, r * 0.18, 0, Math.PI * 2); g.fill();
  g.fillStyle = "#222";
  g.beginPath(); g.arc(size / 2 - r * 0.32, size / 2 - r * 0.1, r * 0.08, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.arc(size / 2 + r * 0.32, size / 2 - r * 0.1, r * 0.08, 0, Math.PI * 2); g.fill();
  // 标签
  g.fillStyle = "rgba(0,0,0,0.6)";
  g.font = `bold ${size * 0.18}px sans-serif`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(st.label, size / 2, size / 2 + r * 0.45);
  placeholders[key] = c;
  return c;
}

function generatePlaceholders() {
  // 只为缺失且需要的关键图生成占位
  const need = ["mole_1", "mole_2", "mole_3", "rat", "cat", "hammer", "cursor_finger"];
  for (const k of need) {
    if (!images[k]) makePlaceholder(k);
  }
  // 关卡背景缺失时：生成风格统一、按关区分色调的场景占位（而非千篇一律纯色，§5.4）
  for (let i = 1; i <= GameConfig.levels.length; i++) {
    const key = `level_${i}`;
    if (!images[key] && !images["menu_bg"]) {
      makeBackgroundPlaceholder(key, i);
    }
  }
}

// 按关号生成色调渐变的场景占位（草地+天空风格，色相随关卡递增，便于区分关卡）
function makeBackgroundPlaceholder(key, levelIndex) {
  const w = 960, h = 540; // 16:9，渲染时整体拉伸到 1920×1080
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const g = c.getContext("2d");
  const hue = (200 - levelIndex * 12 + 360) % 360; // 关卡越靠后色调越偏暖

  const sky = g.createLinearGradient(0, 0, 0, h * 0.6);
  sky.addColorStop(0, `hsl(${hue}, 55%, 78%)`);
  sky.addColorStop(1, `hsl(${hue}, 45%, 88%)`);
  g.fillStyle = sky;
  g.fillRect(0, 0, w, h * 0.62);

  const ground = g.createLinearGradient(0, h * 0.55, 0, h);
  ground.addColorStop(0, `hsl(${(hue + 70) % 360}, 38%, 46%)`);
  ground.addColorStop(1, `hsl(${(hue + 70) % 360}, 42%, 32%)`);
  g.fillStyle = ground;
  g.fillRect(0, h * 0.55, w, h * 0.45);

  g.fillStyle = "rgba(0,0,0,0.18)";
  g.font = "bold 34px sans-serif";
  g.textAlign = "center";
  g.fillText(`第 ${levelIndex} 关 · 场景占位`, w / 2, h * 0.5);

  images[key] = c;
}

// ============================================================================
//  取用接口（含 §5.4 回退链）
// ============================================================================

// 取图：缺失返回占位（若有），否则 null
export function getImage(key) {
  if (images[key]) return images[key];
  if (placeholders[key]) return placeholders[key];
  return null;
}

export function hasImage(key) {
  return !!images[key];
}

// 动物“被砸表情”回退链：mole_N_hit → mole_hit → 基础图（由渲染层做挤压动效）
export function getHitImage(baseKey) {
  if (baseKey.startsWith("mole_")) {
    const specific = `${baseKey}_hit`;
    if (images[specific]) return images[specific];
    if (images["mole_hit"]) return images["mole_hit"];
    return getImage(baseKey);
  }
  const specific = `${baseKey}_hit`;
  if (images[specific]) return images[specific];
  return getImage(baseKey);
}

// 关卡背景：缺失 → menu_bg → null（由渲染层用纯色兜底）
export function getBackground(levelId) {
  if (images[`level_${levelId}`]) return images[`level_${levelId}`];
  if (images["menu_bg"]) return images["menu_bg"];
  return null;
}

// 局内音乐 key：按关覆盖 → 通用
export function gameplayMusicKey(levelId) {
  if (audios[`music_gameplay_level_${levelId}`]) return `music_gameplay_level_${levelId}`;
  if (audios["music_gameplay"]) return "music_gameplay";
  return null;
}

export function getAudio(key) {
  return audios[key] || null;
}

export function hasAudio(key) {
  return !!audios[key];
}

export function getMissingReport() {
  return Array.from(missing).sort();
}
