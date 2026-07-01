// 选关界面（§3.2 C）：9 关网格 + 锁定/星数 + 解锁全部（debug）+ 返回。
import GameConfig from "../../config/game-config.js";
import { Scaler } from "../scaler.js";
import { Pointer } from "../input.js";
import { playMusic, playSfx } from "../audio.js";
import { isUnlocked, getLevelRecord, unlockAll } from "../storage.js";
import { drawButton, pointInRect, drawText, drawStarRow, roundRect, drawFallbackBg } from "../ui.js";

export const LevelSelectScene = {
  game: null,
  cards: [],
  buttons: [],

  enter() {
    playMusic("music_menu");
    this.rebuild();
  },

  rebuild() {
    const W = Scaler.logicalWidth;
    const cols = 3, rows = 3;
    const cw = 380, ch = 240, gapX = 60, gapY = 50;
    const totalW = cols * cw + (cols - 1) * gapX;
    const startX = (W - totalW) / 2;
    const startY = 240;
    this.cards = [];
    GameConfig.levels.forEach((lv, i) => {
      const r = Math.floor(i / cols), c = i % cols;
      this.cards.push({
        id: lv.id,
        x: startX + c * (cw + gapX),
        y: startY + r * (ch + gapY),
        w: cw, h: ch
      });
    });

    this.buttons = [{ id: "back", x: 60, y: 60, w: 220, h: 90, label: "← 返回" }];
    if (GameConfig.debug.showUnlockAllButton) {
      this.buttons.push({ id: "unlockAll", x: W - 380, y: 60, w: 320, h: 90, label: "解锁全部关卡" });
    }
  },

  onPointerDown(x, y) {
    for (const b of this.buttons) {
      if (pointInRect(x, y, b)) {
        playSfx("sfx_button");
        if (b.id === "back") this.game.changeScene("menu");
        else if (b.id === "unlockAll") { unlockAll(); this.rebuild(); }
        return;
      }
    }
    for (const card of this.cards) {
      if (pointInRect(x, y, card) && isUnlocked(card.id)) {
        playSfx("sfx_button");
        this.game.changeScene("level", { levelId: card.id });
        return;
      }
    }
  },

  render(ctx) {
    const W = Scaler.logicalWidth, H = Scaler.logicalHeight;
    drawFallbackBg(ctx, W, H, "#4f7a52", "#bcd9a6");
    drawText(ctx, "选择关卡", W / 2, 170, { size: 88, align: "center", color: "#fff", stroke: "#274a2a", strokeWidth: 8 });

    for (const card of this.cards) {
      const unlocked = isUnlocked(card.id);
      const rec = getLevelRecord(card.id);
      ctx.save();
      roundRect(ctx, card.x, card.y, card.w, card.h, 28);
      ctx.fillStyle = unlocked ? "#fff4dd" : "#8a8a8a";
      ctx.fill();
      ctx.lineWidth = 5;
      ctx.strokeStyle = "rgba(0,0,0,0.25)";
      ctx.stroke();
      ctx.restore();

      drawText(ctx, `第 ${card.id} 关`, card.x + card.w / 2, card.y + 80, {
        size: 56, align: "center", color: unlocked ? "#3a2410" : "#dddddd"
      });

      if (unlocked) {
        drawStarRow(ctx, card.x + card.w / 2, card.y + 165, 36, rec.stars, 3);
      } else {
        drawText(ctx, "🔒 未解锁", card.x + card.w / 2, card.y + 170, {
          size: 40, align: "center", color: "#eeeeee", bold: false
        });
      }
    }

    for (const b of this.buttons) {
      drawButton(ctx, b, { hovered: pointInRect(Pointer.x, Pointer.y, b), fontSize: 40 });
    }
  }
};
