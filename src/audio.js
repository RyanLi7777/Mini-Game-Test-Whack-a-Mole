// ============================================================================
//  音频管理 —— 依据 §7。缺失音频静音处理（不报错）。音量受设置控制并持久化。
// ============================================================================

import { getAudio, gameplayMusicKey } from "./assets.js";
import { getSettings, setMusicVolume, setSfxVolume } from "./storage.js";

let musicVolume = 0.7;
let sfxVolume = 0.8;
let currentMusic = null;      // 当前 HTMLAudioElement
let currentMusicKey = null;

export function initAudio() {
  const s = getSettings();
  musicVolume = s.musicVolume;
  sfxVolume = s.sfxVolume;
}

// ---- 音乐 ----
export function playMusic(key) {
  if (key === currentMusicKey && currentMusic && !currentMusic.paused) return;
  stopMusic();
  const a = getAudio(key);
  if (!a) { currentMusicKey = key; return; } // 缺失 → 静音
  currentMusic = a;
  currentMusicKey = key;
  a.loop = true;
  a.volume = musicVolume;
  a.currentTime = 0;
  const p = a.play();
  if (p && p.catch) p.catch(() => {}); // 浏览器自动播放策略：失败则等待用户手势后重试
}

export function playGameplayMusic(levelId) {
  const key = gameplayMusicKey(levelId);
  if (key) playMusic(key); else stopMusic();
}

export function stopMusic() {
  if (currentMusic) {
    try { currentMusic.pause(); } catch (e) {}
  }
  currentMusic = null;
}

export function pauseMusic() {
  if (currentMusic) { try { currentMusic.pause(); } catch (e) {} }
}

export function resumeMusic() {
  if (currentMusic) {
    const p = currentMusic.play();
    if (p && p.catch) p.catch(() => {});
  }
}

// 浏览器自动播放被拦截时：首次用户手势后恢复当前音乐
export function retryMusicOnGesture() {
  if (currentMusicKey && (!currentMusic || currentMusic.paused)) {
    playMusic(currentMusicKey);
  }
}

// ---- 音效 ----
export function playSfx(key) {
  const a = getAudio(key);
  if (!a) return; // 缺失 → 静音
  try {
    const node = a.cloneNode(); // 允许重叠播放
    node.volume = sfxVolume;
    const p = node.play();
    if (p && p.catch) p.catch(() => {});
  } catch (e) {}
}

// ---- 音量（即时生效 + 持久化）----
export function setMusicVol(v) {
  musicVolume = clamp01(v);
  if (currentMusic) currentMusic.volume = musicVolume;
  setMusicVolume(musicVolume);
}

export function setSfxVol(v) {
  sfxVolume = clamp01(v);
  setSfxVolume(sfxVolume);
}

export function getMusicVol() { return musicVolume; }
export function getSfxVol() { return sfxVolume; }

function clamp01(v) { return Math.max(0, Math.min(1, v)); }
