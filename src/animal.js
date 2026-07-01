// ============================================================================
//  动物 —— 状态机 + 动画（§4.2 / §4.3 / §7.2）。
//  状态：EMERGING → VISIBLE → RETREATING / HIT。
//  渲染层次（§7.2）：调用者在背景+洞口之上、hole_front 之下绘制此层。
// ============================================================================

import GameConfig from "../config/game-config.js";
import { getImage, getHitImage } from "./assets.js";
import { holeSize } from "./board.js";

export const AnimalState = {
  EMERGING: "emerging",
  VISIBLE: "visible",
  RETREATING: "retreating",
  HIT: "hit",
  DEAD: "dead"  // 已完成退场，等待回收
};

function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
function easeInCubic(t) { return t * t * t; }

export function createAnimal(type, skinKey, cell, stayTime) {
  return {
    type,        // 'mole' | 'rat' | 'cat'
    skinKey,     // 图片 key，如 'mole_1'、'rat'、'cat'
    cell,        // computeCells 返回的 cell 对象
    stayTime,    // 停留时长（秒）
    state: AnimalState.EMERGING,
    timer: 0,    // 当前状态已过时间
    hitted: false,
    scored: false // 防止同一只动物重复计分
  };
}

// 当前状态总时长（秒）
function stateDuration(animal) {
  const a = GameConfig.animation;
  switch (animal.state) {
    case AnimalState.EMERGING: return a.emergeTime;
    case AnimalState.VISIBLE: return animal.stayTime;
    case AnimalState.RETREATING: return a.retreatTime;
    case AnimalState.HIT: return a.hitTime;
    default: return 0;
  }
}

// 返回 true 表示仍活跃（DEAD 后调用者可回收）
export function updateAnimal(animal, dt) {
  if (animal.state === AnimalState.DEAD) return false;
  animal.timer += dt;
  const dur = stateDuration(animal);
  if (animal.timer >= dur) {
    animal.timer -= dur;
    switch (animal.state) {
      case AnimalState.EMERGING:
        animal.state = AnimalState.VISIBLE;
        animal.timer = 0;
        break;
      case AnimalState.VISIBLE:
        // 停留超时 → 自行缩回（不计分、不中断连击，§4.3）
        animal.state = AnimalState.RETREATING;
        animal.timer = 0;
        break;
      case AnimalState.RETREATING:
      case AnimalState.HIT:
        animal.state = AnimalState.DEAD;
        return false;
    }
  }
  return true;
}

// 命中：切换到 HIT 状态，标记已计分
export function hitAnimal(animal) {
  if (animal.state === AnimalState.DEAD
    || animal.state === AnimalState.RETREATING
    || animal.state === AnimalState.HIT) return false;
  animal.hitted = true;
  animal.state = AnimalState.HIT;
  animal.timer = 0;
  // 随机倒下方向/角度（左倒或右倒），只在命中瞬间决定一次，动画期间保持不变
  const cfg = GameConfig.effects.hit;
  animal.hitTiltDir = Math.random() < 0.5 ? -1 : 1;
  animal.hitTiltDeg = cfg.tiltMinDeg + Math.random() * (cfg.tiltMaxDeg - cfg.tiltMinDeg);
  return true;
}

// 判断当前是否可被命中（在场且尚未被打）
export function isHittable(animal) {
  return (
    !animal.scored
    && (animal.state === AnimalState.EMERGING
      || animal.state === AnimalState.VISIBLE)
  );
}

// 共享几何计算：drawAnimal（渲染）与 getAnimalBounds（命中检测）必须用同一套公式，
// 否则会出现“画在哪但打不中”的错位 bug（已被用户实测发现并反馈）。
function computeGeometry(animal) {
  const cell = animal.cell;
  const { w: hw, h: hh } = holeSize(cell);
  const animalW = hw * GameConfig.animal.widthToHoleRatio;
  // 按该 skin 实测的真实内容比例绘制（见 config.animal.aspectRatioBySkin），
  // 而不是全体动物共用一个写死比例——避免比例对不上原始素材导致的拉伸变形。
  const ratio = GameConfig.animal.aspectRatioBySkin[animal.skinKey]
    ?? GameConfig.animal.aspectRatioDefault;
  const animalH = animalW * ratio;

  const hx = cell.cx;
  const hy = cell.cy + cell.cellH * 0.18;
  // 下沉深度基于“动物自身高度”而非洞口高度，这样调整洞口/动物任一方的比例配置
  // 都不会牵连另一方的相对位置（此前用 hh 计算导致改洞口高度后动物位置错位）。
  const restOffset = animalH * GameConfig.animal.sinkRatio;

  let yOffset = restOffset;
  let scaleY = 1;
  let rotation = 0;   // 弧度，绕底部中心（脚底）旋转
  let alpha = 1;
  const dur = stateDuration(animal);
  const t = animal.timer / (dur || 1);

  switch (animal.state) {
    case AnimalState.EMERGING:
      yOffset = restOffset + (1 - easeOutCubic(t)) * animalH;
      scaleY = 1 + 0.18 * Math.sin(t * Math.PI);
      break;
    case AnimalState.VISIBLE:
      yOffset = restOffset;
      break;
    case AnimalState.RETREATING:
      yOffset = restOffset + easeInCubic(t) * animalH;
      break;
    case AnimalState.HIT: {
      const hitCfg = GameConfig.effects.hit;
      yOffset = restOffset + easeInCubic(t) * animalH * 0.7;
      scaleY = 1 - t * 0.3;
      // 被砸倒下：绕脚底往一侧旋转（方向/角度在 hitAnimal() 命中瞬间随机决定一次）
      const tiltDir = animal.hitTiltDir || 1;
      const tiltDeg = animal.hitTiltDeg || hitCfg.tiltMaxDeg;
      rotation = easeInCubic(t) * (tiltDeg * Math.PI / 180) * tiltDir;
      // 动画后半段淡出退场，避免“瞬间消失”的生硬切换
      if (t > hitCfg.fadeStartT) {
        alpha = 1 - (t - hitCfg.fadeStartT) / (1 - hitCfg.fadeStartT);
      }
      break;
    }
  }

  return {
    hx, hy, animalW, animalH, yOffset, scaleY, rotation, alpha,
    drawX: hx - animalW / 2,
    drawY: hy - animalH + yOffset
  };
}

// 当前命中判定包围盒（供 level.js 的 findHit 使用，与渲染完全一致）。
// 略微收窄（92%）以贴近贴图内实际可见轮廓，避免透明留白区域也能点中。
export function getAnimalBounds(animal) {
  const g = computeGeometry(animal);
  const shrink = 0.92;
  const w = g.animalW * shrink, h = g.animalH * shrink;
  return {
    x: g.drawX + (g.animalW - w) / 2,
    y: g.drawY + (g.animalH - h) / 2,
    w, h
  };
}

// 绘制单只动物（调用者已设好逻辑坐标变换）
export function drawAnimal(ctx, animal) {
  if (animal.state === AnimalState.DEAD) return;

  const g = computeGeometry(animal);
  const { hx, hy, animalW, animalH, yOffset, scaleY, rotation, alpha, drawX, drawY } = g;

  // 选图：HIT 状态用被砸表情回退链（§5.4）
  const img = animal.state === AnimalState.HIT
    ? getHitImage(animal.skinKey)
    : getImage(animal.skinKey);

  if (!img) return;

  ctx.save();
  // 裁剪至洞口以下区域，实现"从洞后冒出"视觉（不依赖 hole_front）
  ctx.beginPath();
  ctx.rect(hx - animalW, hy - animalH * 2, animalW * 2, animalH * 3);
  ctx.clip();

  if (alpha !== 1) ctx.globalAlpha = alpha;

  // 挤压 + 倒下旋转变换（统一以动物底部/脚底为轴心）
  if (scaleY !== 1 || rotation !== 0) {
    const pivotX = hx, pivotY = hy + yOffset;
    ctx.translate(pivotX, pivotY);
    if (rotation !== 0) ctx.rotate(rotation);
    if (scaleY !== 1) ctx.scale(1, scaleY);
    ctx.translate(-pivotX, -pivotY);
  }

  ctx.drawImage(img, drawX, drawY, animalW, animalH);
  ctx.restore();
}
