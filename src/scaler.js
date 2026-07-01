// ============================================================================
//  letterbox 自适应 + 横屏遮罩 —— 依据 §2.2 / §10.1。
//  以 1920×1080 逻辑坐标系渲染，等比缩放居中、四周留黑边。
//  提供屏幕坐标 → 逻辑坐标转换，供命中检测使用。
// ============================================================================

import GameConfig from "../config/game-config.js";

const LOGICAL_W = GameConfig.resolution.width;
const LOGICAL_H = GameConfig.resolution.height;

export const Scaler = {
  scale: 1,
  offsetX: 0,
  offsetY: 0,
  cssWidth: 0,
  cssHeight: 0,
  dpr: 1,
  portrait: false, // 手机竖持

  logicalWidth: LOGICAL_W,
  logicalHeight: LOGICAL_H,

  resize(canvas) {
    const cssW = window.innerWidth;
    const cssH = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;
    this.cssWidth = cssW;
    this.cssHeight = cssH;
    this.dpr = dpr;

    // 物理像素尺寸
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    canvas.style.width = cssW + "px";
    canvas.style.height = cssH + "px";

    // letterbox 缩放
    const scale = Math.min(cssW / LOGICAL_W, cssH / LOGICAL_H);
    this.scale = scale;
    this.offsetX = (cssW - LOGICAL_W * scale) / 2;
    this.offsetY = (cssH - LOGICAL_H * scale) / 2;

    // 竖持判定（仅用于遮罩；窄屏且高>宽）
    this.portrait = cssH > cssW;
  },

  // 在绘制每帧前调用：设置变换，使后续以逻辑坐标绘制
  applyTransform(ctx) {
    ctx.setTransform(
      this.dpr * this.scale, 0,
      0, this.dpr * this.scale,
      this.dpr * this.offsetX, this.dpr * this.offsetY
    );
  },

  // 屏幕(CSS)坐标 → 逻辑坐标
  toLogical(clientX, clientY) {
    return {
      x: (clientX - this.offsetX) / this.scale,
      y: (clientY - this.offsetY) / this.scale
    };
  },

  // 逻辑坐标是否在画面内
  inBounds(x, y) {
    return x >= 0 && y >= 0 && x <= LOGICAL_W && y <= LOGICAL_H;
  }
};
