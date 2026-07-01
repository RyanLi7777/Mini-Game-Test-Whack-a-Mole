// 设置界面（§3.2 G）：音乐/音效音量滑块 + 重置进度（二次确认）。
import { Scaler } from "../scaler.js";
import { Pointer } from "../input.js";
import { playMusic, playSfx, setMusicVol, setSfxVol, getMusicVol, getSfxVol } from "../audio.js";
import { resetProgress } from "../storage.js";
import { drawButton, pointInRect, drawText, roundRect, drawFallbackBg } from "../ui.js";

export const SettingsScene = {
  game: null,
  from: "menu",
  sliders: [],
  buttons: [],
  confirm: null,
  dragging: null,

  enter(params) {
    playMusic("music_menu");
    this.from = params.from || "menu";
    const W = Scaler.logicalWidth;
    const sw = 760, sx = (W - sw) / 2;
    this.sliders = [
      { id: "music", x: sx, y: 380, w: sw, label: "音乐音量", get: getMusicVol, set: setMusicVol },
      { id: "sfx", x: sx, y: 560, w: sw, label: "音效音量", get: getSfxVol, set: setSfxVol }
    ];
    this.buttons = [
      { id: "reset", x: W / 2 - 240, y: 740, w: 480, h: 100, label: "重置进度" },
      { id: "back", x: W / 2 - 240, y: 880, w: 480, h: 100, label: "返回" }
    ];
    this.confirm = null;
    this.dragging = null;
    if (!this._up) {
      this._up = () => { this.dragging = null; };
      window.addEventListener("mouseup", this._up);
      window.addEventListener("touchend", this._up);
    }
  },

  exit() {
    this.dragging = null;
  },

  sliderKnobX(s) { return s.x + s.w * s.get(); },

  onPointerDown(x, y) {
    if (this.confirm) {
      for (const b of this.confirm.buttons) {
        if (pointInRect(x, y, b)) {
          playSfx("sfx_button");
          if (b.id === "yes") resetProgress();
          this.confirm = null;
          return;
        }
      }
      return;
    }
    // 滑块：点击轨道直接定位
    for (const s of this.sliders) {
      if (x >= s.x - 20 && x <= s.x + s.w + 20 && Math.abs(y - s.y) < 50) {
        const v = Math.max(0, Math.min(1, (x - s.x) / s.w));
        s.set(v);
        this.dragging = s;
        return;
      }
    }
    for (const b of this.buttons) {
      if (pointInRect(x, y, b)) {
        playSfx("sfx_button");
        if (b.id === "reset") this.openConfirm();
        else this.game.changeScene(this.from === "menu" ? "menu" : "menu");
        return;
      }
    }
  },

  // 拖动（在 update 中根据 Pointer 持续更新）—— 简化：松手由全局 mouseup 难以接入，
  // 这里采用“按下即定位 + 持续跟随当指针仍在轨道附近”策略
  update() {
    if (this.dragging && Pointer.inside) {
      const s = this.dragging;
      if (Math.abs(Pointer.y - s.y) < 120) {
        const v = Math.max(0, Math.min(1, (Pointer.x - s.x) / s.w));
        s.set(v);
      }
    }
  },

  openConfirm() {
    const W = Scaler.logicalWidth, H = Scaler.logicalHeight;
    const bw = 240, bh = 90;
    this.confirm = {
      text: "重置将清空全部星星与解锁状态，确认？",
      buttons: [
        { id: "yes", x: W / 2 - bw - 30, y: H / 2 + 60, w: bw, h: bh, label: "确认重置" },
        { id: "no", x: W / 2 + 30, y: H / 2 + 60, w: bw, h: bh, label: "取消" }
      ]
    };
  },

  render(ctx) {
    const W = Scaler.logicalWidth, H = Scaler.logicalHeight;
    drawFallbackBg(ctx, W, H, "#5a6f8c", "#9bb0c4");
    drawText(ctx, "设置", W / 2, 220, { size: 96, align: "center", color: "#fff", stroke: "#27384f", strokeWidth: 8 });

    for (const s of this.sliders) {
      drawText(ctx, `${s.label}  ${Math.round(s.get() * 100)}%`, s.x, s.y - 50, { size: 44, color: "#fff" });
      ctx.save();
      roundRect(ctx, s.x, s.y - 10, s.w, 20, 10);
      ctx.fillStyle = "rgba(255,255,255,0.3)"; ctx.fill();
      roundRect(ctx, s.x, s.y - 10, s.w * s.get(), 20, 10);
      ctx.fillStyle = "#ffb24d"; ctx.fill();
      const kx = this.sliderKnobX(s);
      ctx.beginPath(); ctx.arc(kx, s.y, 28, 0, Math.PI * 2);
      ctx.fillStyle = "#fff"; ctx.fill();
      ctx.lineWidth = 4; ctx.strokeStyle = "#c98a00"; ctx.stroke();
      ctx.restore();
    }

    for (const b of this.buttons) {
      drawButton(ctx, b, { hovered: pointInRect(Pointer.x, Pointer.y, b) });
    }

    if (this.confirm) {
      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,0.55)"; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#fff7e8";
      const pw = 920, ph = 360, px = (W - pw) / 2, py = (H - ph) / 2 - 40;
      ctx.fillRect(px, py, pw, ph);
      ctx.restore();
      drawText(ctx, this.confirm.text, W / 2, H / 2 - 30, { size: 44, align: "center", color: "#3a2410" });
      for (const b of this.confirm.buttons) {
        drawButton(ctx, b, { hovered: pointInRect(Pointer.x, Pointer.y, b) });
      }
    }
  }
};
