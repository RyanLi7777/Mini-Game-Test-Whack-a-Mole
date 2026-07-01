// 加载界面（§3.2 A）：预加载资源 + 进度反馈，完成进入主菜单。
import { Scaler } from "../scaler.js";
import { preloadAll, getMissingReport } from "../assets.js";
import { drawText, roundRect, drawFallbackBg } from "../ui.js";

export const BootScene = {
  game: null,
  progress: 0,
  done: false,

  enter() {
    this.progress = 0;
    this.done = false;
    preloadAll((p) => { this.progress = p; }).then(() => {
      this.done = true;
      const missing = getMissingReport();
      if (missing.length) {
        console.info("[资源降级] 以下素材缺失，已按 §5.4 兜底：", missing);
      }
      // 短暂停留展示 100%
      setTimeout(() => this.game.changeScene("menu"), 250);
    });
  },

  render(ctx) {
    const W = Scaler.logicalWidth, H = Scaler.logicalHeight;
    drawFallbackBg(ctx, W, H, "#2b3a55", "#1b2436");
    drawText(ctx, "欢乐打地鼠", W / 2, H / 2 - 120, {
      size: 96, align: "center", color: "#ffd23f", stroke: "#7a4a00", strokeWidth: 8
    });

    const bw = 700, bh = 36, bx = (W - bw) / 2, by = H / 2 + 40;
    ctx.save();
    roundRect(ctx, bx, by, bw, bh, bh / 2);
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.fill();
    roundRect(ctx, bx, by, bw * this.progress, bh, bh / 2);
    ctx.fillStyle = "#ffb24d";
    ctx.fill();
    ctx.restore();

    drawText(ctx, `加载中… ${Math.round(this.progress * 100)}%`, W / 2, by + bh + 60, {
      size: 40, align: "center", color: "#fff", bold: false
    });
  }
};
