// 主菜单（§3.2 B）：标题 + 新游戏/继续游戏/设置 + 菜单 BGM。
import { Scaler } from "../scaler.js";
import { Pointer } from "../input.js";
import { getImage } from "../assets.js";
import { playMusic, playSfx } from "../audio.js";
import { hasProgress, resetProgress } from "../storage.js";
import { drawButton, drawGearButton, pointInRect, pointInCircle, drawText, drawFallbackBg } from "../ui.js";

export const MenuScene = {
  game: null,
  buttons: [],
  gearButton: null,
  confirm: null, // 新游戏二次确认浮层

  enter() {
    playMusic("music_menu");
    const W = Scaler.logicalWidth;
    // 两个按钮居中对齐到 menu_bg.png 里木牌招牌的空白区域（约 x:490~1430, y:260~635）
    const bw = 440, bh = 96, x = W / 2 - bw / 2;
    this.buttons = [
      { id: "new", x, y: 377, w: bw, h: bh, label: "新游戏" },
      { id: "continue", x, y: 513, w: bw, h: bh, label: "继续游戏" }
    ];
    // 设置齿轮移到主页右上角，不占木牌位置
    this.gearButton = { id: "settings", cx: W - 90, cy: 90, r: 46 };
    this.confirm = null;
  },

  onPointerDown(x, y) {
    if (this.confirm) {
      for (const b of this.confirm.buttons) {
        if (pointInRect(x, y, b)) {
          playSfx("sfx_button");
          if (b.id === "yes") {
            resetProgress();
            this.confirm = null;
            this.game.changeScene("levelselect", { startLevel: 1 });
          } else {
            this.confirm = null;
          }
          return;
        }
      }
      return;
    }
    for (const b of this.buttons) {
      if (pointInRect(x, y, b)) {
        playSfx("sfx_button");
        if (b.id === "new") {
          if (hasProgress()) {
            this.openConfirm();
          } else {
            this.game.changeScene("levelselect", { startLevel: 1 });
          }
        } else if (b.id === "continue") {
          this.game.changeScene("levelselect", {});
        }
        return;
      }
    }
    if (pointInCircle(x, y, this.gearButton)) {
      playSfx("sfx_button");
      this.game.changeScene("settings", { from: "menu" });
      return;
    }
  },

  openConfirm() {
    const W = Scaler.logicalWidth, H = Scaler.logicalHeight;
    const bw = 240, bh = 90;
    this.confirm = {
      text: "开始新游戏将清空已有星星与进度，确认？",
      buttons: [
        { id: "yes", x: W / 2 - bw - 30, y: H / 2 + 60, w: bw, h: bh, label: "确认清空" },
        { id: "no", x: W / 2 + 30, y: H / 2 + 60, w: bw, h: bh, label: "取消" }
      ]
    };
  },

  render(ctx) {
    const W = Scaler.logicalWidth, H = Scaler.logicalHeight;
    const bg = getImage("menu_bg");
    if (bg) {
      ctx.drawImage(bg, 0, 0, W, H);
    } else {
      // 缺失背景图时兜底：纯色渐变 + 代码绘制标题（背景图本身已包含标题美术）
      drawFallbackBg(ctx, W, H, "#6fb1d6", "#a7d39a");
      drawText(ctx, "欢乐打地鼠", W / 2, 280, {
        size: 130, align: "center", color: "#ffd23f", stroke: "#7a4a00", strokeWidth: 10
      });
    }

    for (const b of this.buttons) {
      drawButton(ctx, b, { hovered: pointInRect(Pointer.x, Pointer.y, b) });
    }
    drawGearButton(ctx, this.gearButton, { hovered: pointInCircle(Pointer.x, Pointer.y, this.gearButton) });

    if (this.confirm) this.renderConfirm(ctx);
  },

  renderConfirm(ctx) {
    const W = Scaler.logicalWidth, H = Scaler.logicalHeight;
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#fff7e8";
    const pw = 920, ph = 360, px = (W - pw) / 2, py = (H - ph) / 2 - 40;
    ctx.fillRect(px, py, pw, ph);
    ctx.restore();
    drawText(ctx, this.confirm.text, W / 2, H / 2 - 30, {
      size: 44, align: "center", color: "#3a2410"
    });
    for (const b of this.confirm.buttons) {
      drawButton(ctx, b, { hovered: pointInRect(Pointer.x, Pointer.y, b) });
    }
  }
};
