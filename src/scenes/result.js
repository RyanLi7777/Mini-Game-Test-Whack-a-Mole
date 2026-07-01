// 结算浮层（§3.2 F）：本局得分/星数（带得星动画与音效）/是否过关 + 按钮。
import GameConfig from "../../config/game-config.js";
import { Scaler } from "../scaler.js";
import { Pointer } from "../input.js";
import { playSfx, playMusic } from "../audio.js";
import { recordLevelResult, isUnlocked } from "../storage.js";
import { drawButton, pointInRect, drawText, drawStarRow, roundRect, drawFallbackBg } from "../ui.js";

export const ResultScene = {
  game: null,
  levelId: 1,
  score: 0,
  stars: 0,
  passed: false,
  isLast: false,
  nextUnlocked: false,
  buttons: [],
  animT: 0,          // 得星动画计时
  shownStars: 0,
  starSfxPlayed: 0,

  enter(params) {
    this.levelId = params.levelId;
    this.score = params.score;
    this.stars = params.stars;
    this.passed = this.stars >= 1;
    this.isLast = this.levelId >= GameConfig.levels.length;
    this.animT = 0;
    this.shownStars = 0;
    this.starSfxPlayed = 0;

    // 写存档（仅更高成绩更新，§8.3）
    recordLevelResult(this.levelId, this.stars, this.score);
    this.nextUnlocked = !this.isLast && isUnlocked(this.levelId + 1);

    playMusic("music_menu"); // 局内音乐已停，结算回到菜单 BGM（轻量处理）
    if (this.passed) playSfx("sfx_star"); else playSfx("sfx_fail");

    this.buildButtons();
  },

  buildButtons() {
    const W = Scaler.logicalWidth, H = Scaler.logicalHeight;
    const bw = 300, bh = 96, gap = 40;
    const list = [{ id: "replay", label: "重玩本关" }];
    if (this.passed && !this.isLast && this.nextUnlocked) list.push({ id: "next", label: "下一关" });
    if (this.passed && this.isLast) list.push({ id: "complete", label: "查看通关" });
    list.push({ id: "select", label: "返回选关" });
    const totalW = list.length * bw + (list.length - 1) * gap;
    let x = (W - totalW) / 2;
    const y = H - 220;
    this.buttons = list.map((b) => { const r = { ...b, x, y, w: bw, h: bh }; x += bw + gap; return r; });
  },

  onPointerDown(x, y) {
    for (const b of this.buttons) {
      if (pointInRect(x, y, b)) {
        playSfx("sfx_button");
        if (b.id === "replay") this.game.changeScene("level", { levelId: this.levelId });
        else if (b.id === "next") this.game.changeScene("level", { levelId: this.levelId + 1 });
        else if (b.id === "complete") this.game.changeScene("complete", {});
        else if (b.id === "select") this.game.changeScene("levelselect", {});
        return;
      }
    }
  },

  update(dt) {
    this.animT += dt;
    // 每 0.4s 点亮一颗星，并播放音效
    const want = Math.min(this.stars, Math.floor(this.animT / 0.4));
    if (want > this.shownStars) {
      this.shownStars = want;
      if (this.shownStars > this.starSfxPlayed) {
        this.starSfxPlayed = this.shownStars;
        playSfx("sfx_star");
      }
    }
  },

  render(ctx) {
    const W = Scaler.logicalWidth, H = Scaler.logicalHeight;
    drawFallbackBg(ctx, W, H, "#3d5174", "#243049");

    ctx.save();
    roundRect(ctx, W / 2 - 520, 180, 1040, 560, 36);
    ctx.fillStyle = "rgba(255,247,232,0.97)"; ctx.fill();
    ctx.restore();

    drawText(ctx, this.passed ? "过关！" : "未过关", W / 2, 320, {
      size: 96, align: "center", color: this.passed ? "#e08a2c" : "#b04040"
    });

    drawStarRow(ctx, W / 2, 470, 70, this.shownStars, 3, 200);

    drawText(ctx, `本局得分：${this.score}`, W / 2, 640, { size: 56, align: "center", color: "#3a2410" });
    drawText(ctx, `目标分：${GameConfig.levels[this.levelId - 1].targetScore}`, W / 2, 710, {
      size: 40, align: "center", color: "#6a5530", bold: false
    });

    for (const b of this.buttons) {
      drawButton(ctx, b, { hovered: pointInRect(Pointer.x, Pointer.y, b), fontSize: 38 });
    }
  }
};
