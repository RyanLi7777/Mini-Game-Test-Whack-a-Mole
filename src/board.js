// ============================================================================
//  棋盘几何 —— 依据 §4.1 / §6.3。
//  根据 boardArea + 行列数计算每个洞口（cell）中心坐标与尺寸。
//  洞口由程序绘制：背景仅作场景、不含洞口（§7.2 渲染层次）。
// ============================================================================

import GameConfig from "../config/game-config.js";
import { getImage, hasImage } from "./assets.js";

export function computeCells(level) {
  const { x, y, w, h } = level.boardArea;
  const rows = level.boardRows;
  const cols = level.boardCols;
  const cellW = w / cols;
  const cellH = h / rows;
  const cells = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      cells.push({
        index: r * cols + c,
        row: r, col: c,
        cx: x + cellW * (c + 0.5),
        cy: y + cellH * (r + 0.5),
        cellW, cellH
      });
    }
  }
  return cells;
}

// 洞口显示尺寸（按 cell 自适应，比例见配置）
export function holeSize(cell) {
  return {
    w: cell.cellW * GameConfig.hole.widthRatio,
    h: cell.cellH * GameConfig.hole.heightRatio
  };
}

// 绘制单个洞口（hole.png；缺失 → 深色椭圆兜底，§5.4）
export function drawHole(ctx, cell) {
  const img = getImage("hole");
  const { w, h } = holeSize(cell);
  // 洞口绘制在 cell 偏下，给动物“从洞后冒出”留出空间
  const hx = cell.cx;
  const hy = cell.cy + cell.cellH * 0.18;
  if (img) {
    ctx.drawImage(img, hx - w / 2, hy - h / 2, w, h);
  } else {
    ctx.save();
    ctx.fillStyle = "rgba(20,16,12,0.85)";
    ctx.beginPath();
    ctx.ellipse(hx, hy, w / 2, h / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.4)";
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.restore();
  }
  return { hx, hy, w, h };
}

// 洞口前沿（画在动物之上，制造“从洞里探出半身”的遮挡深度感，§7.2）。
// 优先用户提供的 hole_front.png（整图直接画在洞口范围内）；
// 缺失时用 hole.png（或兜底椭圆）裁切出下半部分当作前沿遮挡（§5.4 优雅降级）。
export function drawHoleFront(ctx, cell) {
  const { w, h } = holeSize(cell);
  const hx = cell.cx;
  const hy = cell.cy + cell.cellH * 0.18;

  if (hasImage("hole_front")) {
    const img = getImage("hole_front");
    ctx.drawImage(img, hx - w / 2, hy - h / 2, w, h);
    return;
  }

  // 兜底：裁切洞图下半部分（贴近观察者一侧）盖在动物之上
  ctx.save();
  ctx.beginPath();
  ctx.rect(hx - w / 2 - 4, hy, w + 8, h / 2 + 4);
  ctx.clip();

  const img = getImage("hole");
  if (img) {
    ctx.drawImage(img, hx - w / 2, hy - h / 2, w, h);
  } else {
    ctx.fillStyle = "rgba(20,16,12,0.85)";
    ctx.beginPath();
    ctx.ellipse(hx, hy, w / 2, h / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.4)";
    ctx.lineWidth = 4;
    ctx.stroke();
  }
  ctx.restore();
}
