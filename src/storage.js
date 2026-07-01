// ============================================================================
//  存档（localStorage，单存档）—— 依据 §8。
//  localStorage 不可用（隐私模式）时降级为内存存档，单次会话可玩，不崩溃。
// ============================================================================

import GameConfig from "../config/game-config.js";

const SAVE_KEY = "happy_whack_save_v1";
const SAVE_VERSION = 1;

let memoryFallback = null;   // localStorage 不可用时的内存兜底
export let storageAvailable = true;

function defaultSave() {
  return {
    version: SAVE_VERSION,
    unlockedLevel: 1,
    levels: {}, // { "1": { stars, bestScore } }
    settings: {
      musicVolume: GameConfig.defaultMusicVolume,
      sfxVolume: GameConfig.defaultSfxVolume
    },
    tutorialSeen: false // 新手教程是否已自动展示过（只自动弹一次）
  };
}

function rawRead() {
  try {
    const s = window.localStorage.getItem(SAVE_KEY);
    return s ? JSON.parse(s) : null;
  } catch (e) {
    storageAvailable = false;
    return memoryFallback;
  }
}

function rawWrite(data) {
  try {
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch (e) {
    storageAvailable = false;
    memoryFallback = data;
  }
}

// 探测可用性（隐私模式下 setItem 抛错）
(function probe() {
  try {
    const k = "__hw_probe__";
    window.localStorage.setItem(k, "1");
    window.localStorage.removeItem(k);
  } catch (e) {
    storageAvailable = false;
  }
})();

let cache = null;

export function loadSave() {
  if (cache) return cache;
  let data = rawRead();
  if (!data || data.version !== SAVE_VERSION) {
    data = defaultSave();
    rawWrite(data);
  }
  cache = data;
  return cache;
}

export function getSave() {
  return loadSave();
}

function persist() {
  rawWrite(cache);
}

// ---- 关卡成绩（取历史最高，§8.2/§8.3）----
export function getLevelRecord(levelId) {
  const s = loadSave();
  return s.levels[String(levelId)] || { stars: 0, bestScore: 0 };
}

export function recordLevelResult(levelId, stars, score) {
  const s = loadSave();
  const key = String(levelId);
  const prev = s.levels[key] || { stars: 0, bestScore: 0 };
  s.levels[key] = {
    stars: Math.max(prev.stars, stars),
    bestScore: Math.max(prev.bestScore, score)
  };
  // ≥1 星解锁下一关（不超过总关数）
  if (stars >= 1) {
    const next = levelId + 1;
    if (next <= GameConfig.levels.length) {
      s.unlockedLevel = Math.max(s.unlockedLevel, next);
    }
  }
  persist();
  return s.levels[key];
}

export function isUnlocked(levelId) {
  return levelId <= loadSave().unlockedLevel;
}

export function unlockAll() {
  loadSave().unlockedLevel = GameConfig.levels.length;
  persist();
}

export function totalStars() {
  const s = loadSave();
  return Object.values(s.levels).reduce((sum, l) => sum + (l.stars || 0), 0);
}

// ---- 设置 ----
export function getSettings() {
  return loadSave().settings;
}

export function setMusicVolume(v) {
  loadSave().settings.musicVolume = v;
  persist();
}

export function setSfxVolume(v) {
  loadSave().settings.sfxVolume = v;
  persist();
}

// ---- 重置 / 新游戏清空（保留音量设置，§8.4）----
export function resetProgress() {
  const s = loadSave();
  s.levels = {};
  s.unlockedLevel = 1;
  persist();
}

export function hasProgress() {
  const s = loadSave();
  return s.unlockedLevel > 1 || Object.keys(s.levels).length > 0;
}

// ---- 新手教程（只自动弹一次，之后仅可通过 HUD 提示按钮手动查看）----
export function hasSeenTutorial() {
  return !!loadSave().tutorialSeen;
}

export function markTutorialSeen() {
  loadSave().tutorialSeen = true;
  persist();
}
