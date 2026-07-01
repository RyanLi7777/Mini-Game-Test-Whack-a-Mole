// ============================================================================
//  出怪调度器 —— 依据 §4.9。
//  每隔 spawnInterval × (1 ± jitter) 秒尝试生成，
//  在场 < maxConcurrent 且有空闲洞口时才生成。
// ============================================================================

import GameConfig from "../config/game-config.js";
import { createAnimal } from "./animal.js";

// 加权随机：{ mole:72, rat:16, cat:12 } → 随机选 key
function weightedRandom(weights) {
  const keys = Object.keys(weights);
  const total = keys.reduce((s, k) => s + weights[k], 0);
  let r = Math.random() * total;
  for (const k of keys) {
    r -= weights[k];
    if (r <= 0) return k;
  }
  return keys[keys.length - 1];
}

function nextInterval(base, jitter) {
  return base * (1 + (Math.random() * 2 - 1) * jitter);
}

export function createSpawner(level) {
  return {
    level,
    timer: 0,
    nextSpawn: nextInterval(level.spawnInterval, GameConfig.spawnJitter)
  };
}

// animals: 当前在场动物列表；cells: 所有 cell
// 返回新生成的 animal（或 null）
export function tickSpawner(spawner, dt, animals, cells) {
  spawner.timer += dt;
  if (spawner.timer < spawner.nextSpawn) return null;
  spawner.timer = 0;
  spawner.nextSpawn = nextInterval(spawner.level.spawnInterval, GameConfig.spawnJitter);

  // 同屏上限检测（§4.9 / §6.3）
  const alive = animals.filter((a) => a.state !== "dead");
  if (alive.length >= spawner.level.maxConcurrent) return null;

  // 找空闲洞口
  const occupied = new Set(alive.map((a) => a.cell.index));
  const free = cells.filter((c) => !occupied.has(c.index));
  if (free.length === 0) return null;

  const cell = free[Math.floor(Math.random() * free.length)];

  // 类型加权（1–3 关权重已在配置中设为 mole:100）
  const type = weightedRandom(spawner.level.spawnWeights);

  // 皮肤（地鼠随机外观；老鼠/猫固定）
  let skinKey;
  if (type === "mole") {
    const n = Math.floor(Math.random() * GameConfig.assets.moleSkinCount) + 1;
    skinKey = `mole_${n}`;
  } else {
    skinKey = type; // 'rat' | 'cat'
  }

  return createAnimal(type, skinKey, cell, spawner.level.moleStayTime);
}
