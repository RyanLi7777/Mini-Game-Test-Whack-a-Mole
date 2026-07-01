// 通关画面（§3.2 H，简单版）：祝贺 + 累计总星数（满分 27）+ 返回。
import GameConfig from "../../config/game-config.js";
import { Scaler } from "../scaler.js";
import { Pointer } from "../input.js";
import { playMusic, playSfx } from "../audio.js";
import { totalStars } from "../storage.js";
import { drawButton, pointInRect, drawText, drawStarRow, drawFallbackBg } from "../ui.js";

export const CompleteScene = {
  game: null,
  buttons: [],

  enter() {
    playMusic("music_menu");
    playSfx("sfx_star");
    const W = Scaler.logicalWidth, H = Scaler.logicalHeight;
    const bw = 360, bh = 100, gap = 60;
    this.buttons = [
      { id: "select", x: W / 2 - bw - gap / 2, y: H - 220, w: bw, h: bh, label: "返回选关" },
      { id: "menu", x: W / 2 + gap / 2, y: H - 220, w: bw, h: bh, label: "返回主菜单" }
    ];
  },

  onPointerDown(x, y) {
    for (const b of this.buttons) {
      if (pointInRect(x, y, b)) {
        playSfx("sfx_button");
        this.game.changeScene(b.id === "select" ? "levelselect" : "menu", {});
        return;
      }
    }
  },

  render(ctx) {
    const W = Scaler.logicalWidth, H = Scaler.logicalHeight;
    drawFallbackBg(ctx, W, H, "#ffcf6b", "#ff9e4f");
    drawText(ctx, "恭喜通关！", W / 2, 320, { size: 120, align: "center", color: "#fff", stroke: "#a55a00", strokeWidth: 12 });
    const max = GameConfig.levels.length * 3;
    drawText(ctx, `累计总星数：${totalStars()} / ${max}`, W / 2, 480, { size: 64, align: "center", color: "#5a3300" });
    drawStarRow(ctx, W / 2, 620, 56, 3, 3, 170);
    for (const b of this.buttons) {
      drawButton(ctx, b, { hovered: pointInRect(Pointer.x, Pointer.y, b) });
    }
  }
};
