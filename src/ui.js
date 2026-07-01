// ============================================================================
//  UI 绘制助手 —— 按钮、文字、星形（离线、无外部字体，使用系统字体栈）。
//  按钮采用“逻辑坐标矩形 + 命中检测”模式，供各场景复用。
// ============================================================================

import { getImage } from "./assets.js";

export const FONT_STACK =
  '"PingFang SC","Microsoft YaHei","Hiragino Sans GB","Noto Sans CJK SC",sans-serif';

export function setFont(ctx, px, bold = true) {
  ctx.font = `${bold ? "bold " : ""}${px}px ${FONT_STACK}`;
}

// 圆角矩形路径
export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// 按钮：{ x, y, w, h, label }，hover/disabled 影响外观
export function drawButton(ctx, btn, opts = {}) {
  const { x, y, w, h, label } = btn;
  const disabled = opts.disabled;
  const hovered = opts.hovered;
  ctx.save();
  roundRect(ctx, x, y, w, h, Math.min(24, h / 4));
  let base = disabled ? "#7d756c" : (hovered ? "#ffb24d" : "#ff9e2c");
  ctx.fillStyle = base;
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = "rgba(0,0,0,0.25)";
  ctx.stroke();
  ctx.fillStyle = disabled ? "#cfcabf" : "#3a2410";
  setFont(ctx, opts.fontSize || Math.floor(h * 0.42));
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x + w / 2, y + h / 2);
  ctx.restore();
}

export function pointInRect(px, py, rect) {
  return px >= rect.x && px <= rect.x + rect.w && py >= rect.y && py <= rect.y + rect.h;
}

export function pointInCircle(px, py, circle) {
  const dx = px - circle.cx, dy = py - circle.cy;
  return dx * dx + dy * dy <= circle.r * circle.r;
}

// 圆形图标按钮（比如设置齿轮）：{ cx, cy, r }，程序绘制齿轮图案，无需额外贴图
export function drawGearButton(ctx, btn, opts = {}) {
  const { cx, cy, r } = btn;
  const hovered = opts.hovered;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = hovered ? "#ffb24d" : "#ff9e2c";
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = "rgba(0,0,0,0.25)";
  ctx.stroke();

  // 齿轮图案（深棕色，和按钮文字同色系）
  ctx.translate(cx, cy);
  ctx.fillStyle = "#3a2410";
  const teeth = 8;
  const outer = r * 0.62, inner = r * 0.62 * 0.68, toothLen = r * 0.22;
  ctx.beginPath();
  for (let i = 0; i < teeth; i++) {
    const a0 = (i / teeth) * Math.PI * 2;
    const a1 = a0 + (Math.PI * 2) / teeth * 0.5;
    const aMid0 = a0 - 0.08, aMid1 = a1 + 0.08;
    ctx.lineTo(Math.cos(aMid0) * outer, Math.sin(aMid0) * outer);
    ctx.lineTo(Math.cos(a0) * (outer + toothLen), Math.sin(a0) * (outer + toothLen));
    ctx.lineTo(Math.cos(a1) * (outer + toothLen), Math.sin(a1) * (outer + toothLen));
    ctx.lineTo(Math.cos(aMid1) * outer, Math.sin(aMid1) * outer);
  }
  ctx.closePath();
  ctx.fill();
  // 内圈镂空
  ctx.globalCompositeOperation = "destination-out";
  ctx.beginPath();
  ctx.arc(0, 0, inner, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = "source-over";
  // 中心孔（用按钮底色填回，形成齿轮镂空中心的视觉）
  ctx.fillStyle = hovered ? "#ffb24d" : "#ff9e2c";
  ctx.beginPath();
  ctx.arc(0, 0, inner * 0.45, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// 文本
export function drawText(ctx, text, x, y, opts = {}) {
  ctx.save();
  setFont(ctx, opts.size || 40, opts.bold !== false);
  ctx.fillStyle = opts.color || "#fff";
  ctx.textAlign = opts.align || "left";
  ctx.textBaseline = opts.baseline || "alphabetic";
  if (opts.stroke) {
    ctx.lineWidth = opts.strokeWidth || 6;
    ctx.strokeStyle = opts.stroke;
    ctx.strokeText(text, x, y);
  }
  ctx.fillText(text, x, y);
  ctx.restore();
}

// 一颗星（filled/空心），优先用 ui 素材，否则程序绘制
export function drawStar(ctx, cx, cy, r, filled) {
  const img = getImage(filled ? "star_filled" : "star_empty");
  if (img) {
    ctx.drawImage(img, cx - r, cy - r, r * 2, r * 2);
    return;
  }
  ctx.save();
  ctx.translate(cx, cy);
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = (-90 + i * 72) * Math.PI / 180;
    const a2 = a + 36 * Math.PI / 180;
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    ctx.lineTo(Math.cos(a2) * r * 0.45, Math.sin(a2) * r * 0.45);
  }
  ctx.closePath();
  ctx.fillStyle = filled ? "#ffd23f" : "rgba(0,0,0,0.18)";
  ctx.fill();
  ctx.lineWidth = Math.max(2, r * 0.08);
  ctx.strokeStyle = filled ? "#c98a00" : "rgba(255,255,255,0.4)";
  ctx.stroke();
  ctx.restore();
}

// 一行星（0–3）
export function drawStarRow(ctx, cx, cy, r, stars, total = 3, gap = null) {
  const g = gap == null ? r * 2.2 : gap;
  const startX = cx - g * (total - 1) / 2;
  for (let i = 0; i < total; i++) {
    drawStar(ctx, startX + g * i, cy, r, i < stars);
  }
}

// 背景兜底纯色渐变（无背景图时）
export function drawFallbackBg(ctx, w, h, top = "#6fb1d6", bottom = "#cfe6c8") {
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, top);
  grad.addColorStop(1, bottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}
