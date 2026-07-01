// ============================================================================
//  游戏引擎 —— 状态机 / 主循环 / 横屏遮罩 / 自动暂停。
//  依据 §3.1 流程状态机、§2.2 letterbox、§9 边界情况。
// ============================================================================

import { Scaler } from "./scaler.js";
import { Pointer, initInput } from "./input.js";
import { initAudio, retryMusicOnGesture, pauseMusic, resumeMusic } from "./audio.js";
import { drawText } from "./ui.js";

export const Game = {
  canvas: null,
  ctx: null,
  scenes: {},        // name -> scene 实例
  current: null,
  currentName: null,
  lastT: 0,
  running: false,

  register(name, scene) {
    this.scenes[name] = scene;
    scene.game = this;
  },

  changeScene(name, params = {}) {
    if (this.current && this.current.exit) this.current.exit();
    this.current = this.scenes[name];
    this.currentName = name;
    if (!this.current) {
      console.error("未知场景:", name);
      return;
    }
    if (this.current.enter) this.current.enter(params);
  },

  start(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    initAudio();

    const onResize = () => Scaler.resize(canvas);
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    onResize();

    initInput(canvas, () => this.current, () => retryMusicOnGesture());

    // 切后台/失焦 → 自动暂停（§9.7）
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        pauseMusic();
        if (this.current && this.current.onHide) this.current.onHide();
      } else {
        resumeMusic();
        if (this.current && this.current.onShow) this.current.onShow();
      }
    });

    this.running = true;
    this.lastT = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  },

  loop(t) {
    if (!this.running) return;
    let dt = (t - this.lastT) / 1000;
    this.lastT = t;
    if (dt > 0.1) dt = 0.1; // 防止切后台回来一次大跳

    const ctx = this.ctx;
    // 清整块物理画布（黑边）
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    Scaler.applyTransform(ctx);

    if (this.current) {
      if (this.current.update) this.current.update(dt);
      if (this.current.render) this.current.render(ctx);
    }

    // 竖持遮罩（§2.2 / §10.1）—— 覆盖在最上层，游戏状态不丢
    if (Scaler.portrait) {
      this.drawOrientationOverlay(ctx);
    }

    requestAnimationFrame((tt) => this.loop(tt));
  },

  drawOrientationOverlay(ctx) {
    const W = Scaler.logicalWidth, H = Scaler.logicalHeight;
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.92)";
    ctx.fillRect(0, 0, W, H);
    // 旋转手机图标
    ctx.translate(W / 2, H / 2 - 60);
    ctx.strokeStyle = "#ffd23f";
    ctx.lineWidth = 10;
    ctx.strokeRect(-70, -120, 140, 240);
    ctx.restore();
    drawText(ctx, "请横屏游玩", W / 2, H / 2 + 120, {
      size: 72, align: "center", color: "#ffd23f"
    });
    drawText(ctx, "（转回横屏将自动继续）", W / 2, H / 2 + 200, {
      size: 40, align: "center", color: "#ddd", bold: false
    });
  }
};

export { Pointer };
