// ============================================================================
//  计分核心（纯函数，便于单元测试）—— 依据 §4.6 / §4.7 / §4.8。
//  本模块不依赖渲染/DOM，可被测试页或单测直接调用。
//  M1 先落地纯逻辑；M2/M3 由关卡场景调用其结算多重命中。
// ============================================================================

import GameConfig from "../config/game-config.js";

// 连击位次 → 单只地鼠得分（取 minPos <= combo 的最大档）
export function comboPointsFor(combo, cfg = GameConfig) {
  let pts = cfg.scoring.moleBaseScore;
  for (const tier of cfg.scoring.comboTiers) {
    if (combo >= tier.minPos) pts = tier.pts;
  }
  return pts;
}

// 可变游戏状态容器
export function createScoreState() {
  return { score: 0, combo: 0, doubleUntil: -Infinity };
}

// 结算一次挥锤命中的动物集合（§4.7 固定顺序：地鼠→老鼠→猫）
// contacted: [{type:'mole'|'rat'|'cat'}]；now: 当前时间(秒)
export function resolveSwing(state, contacted, now, cfg = GameConfig) {
  const floaters = [];

  if (!contacted || contacted.length === 0) {
    state.combo = 0; // 空砸：中断连击
    return { floaters, empty: true };
  }

  const moles = contacted.filter((a) => a.type === "mole");
  const rats = contacted.filter((a) => a.type === "rat");
  const cats = contacted.filter((a) => a.type === "cat");

  const doubleActive = now < state.doubleUntil;

  // 1) 地鼠
  for (const m of moles) {
    state.combo += 1;
    let pts = comboPointsFor(state.combo, cfg);
    if (doubleActive) pts *= cfg.buff.doubleBuffMultiplier;
    state.score += pts;
    floaters.push({ kind: "mole", text: "+" + pts, ref: m });
  }

  // 2) 老鼠：固定分、不改连击、激活/刷新双倍
  for (const r of rats) {
    state.score += cfg.scoring.ratScore;
    state.doubleUntil = now + cfg.buff.doubleBuffDuration;
    floaters.push({ kind: "rat", text: "×2!", ref: r });
  }

  // 3) 猫：扣分、下限、随后清零连击
  for (const c of cats) {
    state.score = Math.max(cfg.scoring.scoreFloor, state.score - cfg.scoring.catPenalty);
    floaters.push({ kind: "cat", text: "-" + cfg.scoring.catPenalty, ref: c });
  }
  if (cats.length > 0) state.combo = 0;

  return { floaters, empty: false };
}

export function isDoubleActive(state, now) {
  return now < state.doubleUntil;
}
