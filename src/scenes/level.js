// ============================================================================
//  关卡进行中（§3.2 D/E）—— M2 版：出怪 + 命中判定 + 计分/连击 + 飘字 + HUD。
//  §4.7 多重命中顺序：地鼠→老鼠→猫，由 src/scoring.js 保证。
//  渲染层次（§7.2）：背景 → 洞口 → 动物 → （可选）hole_front → HUD → 光标。
// ============================================================================

import GameConfig from "../../config/game-config.js";
import { Scaler } from "../scaler.js";
import { Pointer } from "../input.js";
import { getImage, getBackground, hasImage } from "../assets.js";
import { playGameplayMusic, playSfx, pauseMusic, resumeMusic } from "../audio.js";
import { computeCells, drawHole, drawHoleFront } from "../board.js";
import { starsForScore } from "../../config/game-config.js";
import { createAnimal, updateAnimal, hitAnimal, isHittable, drawAnimal, getAnimalBounds, AnimalState } from "../animal.js";
import { createSpawner, tickSpawner } from "../spawner.js";
import { createScoreState, resolveSwing } from "../scoring.js";
import { createFloater, updateFloaters, drawFloaters, FloaterColors } from "../floater.js";
import { createDustBurst, updateParticles, drawParticles } from "../particles.js";
import { drawButton, pointInRect, drawText, roundRect, drawFallbackBg } from "../ui.js";
import { buildTutorialPages } from "../tutorial.js";
import { hasSeenTutorial, markTutorialSeen } from "../storage.js";

// 教程页内容只依赖静态配置，模块加载时算一次即可（老鼠/猫首次出现关卡号随配置自动更新）
const TUTORIAL_PAGES = buildTutorialPages(GameConfig);
// 教程浮层面板尺寸：enter()（算导航按钮位置）与 renderTutorial()（画面板）共用同一份数值，避免脱节
const TUTORIAL_PANEL = { w: 1020, h: 660 };

export const LevelScene = {
  game: null,
  level: null,
  cells: [],
  spawner: null,
  animals: [],
  scoreState: null,
  doubleTimer: 0,  // 双倍剩余秒数（仅用于 HUD 显示，由 scoreState.doubleUntil 驱动）
  floaters: [],
  particles: [],   // 尘土粒子（冒出/命中反馈）
  timeLeft: 0,
  gameTime: 0,     // 关卡已过时间（秒），作为 "now" 传给 resolveSwing
  paused: false,
  finished: false,
  hammerDown: 0,
  hudButtons: [],
  pauseButtons: [],
  tutorialOpen: false,
  tutorialPage: 0,
  tutorialNavButtons: [],

  enter(params) {
    this.level = GameConfig.levels.find((l) => l.id === params.levelId);
    this.cells = computeCells(this.level);
    this.spawner = createSpawner(this.level);
    this.animals = [];
    this.scoreState = createScoreState();
    this.floaters = [];
    this.particles = [];
    this.timeLeft = this.level.timeLimit;
    this.gameTime = 0;
    this.paused = false;
    this.finished = false;
    this.hammerDown = 0;
    this.catFlash = 0; // 猫被打时短暂红色闪屏时长（秒）

    const W = Scaler.logicalWidth;
    this.hudButtons = [
      { id: "hint",  x: W - 470, y: 30, w: 80,  h: 80, label: "?" },
      { id: "pause", x: W - 320, y: 30, w: 130, h: 80, label: "暂停" },
      { id: "exit",  x: W - 170, y: 30, w: 130, h: 80, label: "退出" }
    ];
    const H = Scaler.logicalHeight;
    const bw = 480, bh = 100, bx = (W - bw) / 2;
    this.pauseButtons = [
      { id: "resume",  x: bx, y: H / 2 - 170, w: bw, h: bh, label: "继续" },
      { id: "restart", x: bx, y: H / 2 - 30,  w: bw, h: bh, label: "重新开始本关" },
      { id: "quit",    x: bx, y: H / 2 + 110,  w: bw, h: bh, label: "退出到选关" }
    ];
    const navW = 900, navX = W / 2 - navW / 2;
    const panelTop = H / 2 - TUTORIAL_PANEL.h / 2 - 40;
    const navY = panelTop + TUTORIAL_PANEL.h + 30;
    this.tutorialNavButtons = [
      { id: "prev",  x: navX,             y: navY, w: 140, h: 80, label: "◀ 上一页" },
      { id: "close", x: W / 2 - 90,       y: navY, w: 180, h: 80, label: "知道了" },
      { id: "next",  x: navX + navW - 140, y: navY, w: 140, h: 80, label: "下一页 ▶" }
    ];

    playGameplayMusic(this.level.id);
    document.body.classList.add("hide-cursor");

    // 首次进入第 1 关，自动弹一次新手教程（之后仅可点 HUD “?” 手动查看）
    this.tutorialOpen = false;
    this.tutorialPage = 0;
    if (this.level.id === 1 && !hasSeenTutorial()) {
      this.openTutorial();
      markTutorialSeen();
    }
  },

  exit() {
    document.body.classList.remove("hide-cursor");
  },

  onHide() { this.setPaused(true); },

  setPaused(p) {
    if (this.finished) return;
    this.paused = p;
    if (p) pauseMusic(); else resumeMusic();
  },

  openTutorial() {
    this.tutorialPage = 0;
    this.tutorialOpen = true;
    this.setPaused(true); // 教程期间冻结计时/出怪/动画，与暂停共用同一套冻结逻辑
  },

  closeTutorial() {
    this.tutorialOpen = false;
    this.setPaused(false);
  },

  inGameArea(x, y) {
    const a = this.level.boardArea;
    return x >= a.x && x <= a.x + a.w && y >= a.y && y <= a.y + a.h;
  },

  // 命中检测：找出覆盖点 (px,py) 的全部可命中动物
  // 命中框直接取自动物当前的真实渲染包围盒（getAnimalBounds，与 drawAnimal 同一套公式），
  // 保证“画在哪就能打中哪”，不再用与实际绘制脱节的固定格子框（§4.5 单次命中多只 → 全部命中）。
  findHit(px, py) {
    const hit = [];
    for (const animal of this.animals) {
      if (!isHittable(animal)) continue;
      const b = getAnimalBounds(animal);
      if (px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h) {
        hit.push(animal);
      }
    }
    return hit;
  },

  onPointerDown(x, y) {
    // 新手教程浮层最优先
    if (this.tutorialOpen) {
      for (const b of this.tutorialNavButtons) {
        if (pointInRect(x, y, b)) {
          playSfx("sfx_button");
          if (b.id === "prev") this.tutorialPage = Math.max(0, this.tutorialPage - 1);
          else if (b.id === "next") this.tutorialPage = Math.min(TUTORIAL_PAGES.length - 1, this.tutorialPage + 1);
          else if (b.id === "close") this.closeTutorial();
          return;
        }
      }
      return;
    }

    // 暂停浮层优先
    if (this.paused) {
      for (const b of this.pauseButtons) {
        if (pointInRect(x, y, b)) {
          playSfx("sfx_button");
          if (b.id === "resume")  this.setPaused(false);
          else if (b.id === "restart") this.game.changeScene("level", { levelId: this.level.id });
          else if (b.id === "quit")    this.game.changeScene("levelselect", {});
          return;
        }
      }
      return;
    }
    if (this.finished) return;

    // HUD 按钮（点 UI 不算挥锤，§4.5）
    for (const b of this.hudButtons) {
      if (pointInRect(x, y, b)) {
        playSfx("sfx_button");
        if (b.id === "hint") this.openTutorial();
        else if (b.id === "pause") this.setPaused(true);
        else if (b.id === "exit") this.game.changeScene("levelselect", {});
        return;
      }
    }

    // 游戏区外点击：不触发挥锤（§4.5 点 HUD/UI 不影响连击）
    if (!this.inGameArea(x, y)) return;

    // ---- 挥锤 ----
    this.hammerDown = GameConfig.animation.hammerDownTime;
    playSfx("sfx_hammer_swing");

    const contacted = this.findHit(x, y);

    // 标记命中、防重复；直接推入 animal 对象（scoring.js 只需 .type，ref 是 animal 本身）
    const toScore = [];
    for (const a of contacted) {
      if (hitAnimal(a)) {
        a.scored = true;
        toScore.push(a); // a.type 供 resolveSwing 判断；f.ref = a，f.ref.cell 可用
        // 命中瞬间的尘土反馈（§7.2 动画打磨）
        const c = a.cell;
        this.particles.push(...createDustBurst(c.cx, c.cy + c.cellH * 0.18, c.cellW * 0.7));
      }
    }

    // 计分（§4.7 顺序由 resolveSwing 保证）
    const { floaters: scored, empty } = resolveSwing(this.scoreState, toScore, this.gameTime);

    // 飘字（位置取动物 cell 中心）
    for (const f of scored) {
      const cell = f.ref.cell; // f.ref 是 animal 对象，.cell 已定义
      const color = f.kind === "cat" ? FloaterColors.cat
        : f.kind === "rat" ? FloaterColors.rat
        : FloaterColors.mole;
      this.floaters.push(createFloater(cell.cx, cell.cy - 60, f.text, color));
    }

    // 音效
    const hasMole = toScore.some((a) => a.type === "mole");
    const hasRat  = toScore.some((a) => a.type === "rat");
    const hasCat  = toScore.some((a) => a.type === "cat");
    if (hasMole) playSfx("sfx_hit_mole");
    if (hasRat)  playSfx("sfx_hit_rat");
    if (hasCat)  { playSfx("sfx_hit_cat"); this.catFlash = 0.35; } // 红色闪屏

    // 空砸（连击已在 resolveSwing 清零）
    if (empty) { /* 无额外处理 */ }
  },

  update(dt) {
    if (this.paused || this.finished) return;

    this.hammerDown = Math.max(0, this.hammerDown - dt);
    this.gameTime += dt;
    this.timeLeft -= dt;
    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.finish();
      return;
    }

    // 出怪
    const newAnimal = tickSpawner(this.spawner, dt, this.animals, this.cells);
    if (newAnimal) {
      this.animals.push(newAnimal);
      // 冒出瞬间的尘土反馈（§7.2 动画打磨）
      const c = newAnimal.cell;
      this.particles.push(...createDustBurst(c.cx, c.cy + c.cellH * 0.18, c.cellW * 0.7));
    }

    // 更新动物状态
    for (let i = this.animals.length - 1; i >= 0; i--) {
      const alive = updateAnimal(this.animals[i], dt);
      if (!alive) this.animals.splice(i, 1);
    }

    // 猫闪屏衰减
    if (this.catFlash > 0) this.catFlash = Math.max(0, this.catFlash - dt);

    // 飘字 + 尘土粒子
    updateFloaters(this.floaters, dt);
    updateParticles(this.particles, dt);
  },

  finish() {
    this.finished = true;
    const stars = starsForScore(this.level, this.scoreState.score);
    this.game.changeScene("result", {
      levelId: this.level.id,
      score: this.scoreState.score,
      stars
    });
  },

  render(ctx) {
    const W = Scaler.logicalWidth, H = Scaler.logicalHeight;

    // 1) 背景
    const bg = getBackground(this.level.id);
    if (bg) ctx.drawImage(bg, 0, 0, W, H);
    else drawFallbackBg(ctx, W, H, "#7fae5a", "#cde3a8");

    // 2) 洞口（程序绘制，§7.2）
    for (const cell of this.cells) drawHole(ctx, cell);

    // 3) 动物
    for (const animal of this.animals) drawAnimal(ctx, animal);

    // 3.5) 尘土粒子（冒出/命中反馈，画在动物之上、洞口前沿之下）
    drawParticles(ctx, this.particles);

    // 4) 洞口前沿：优先用户提供的 hole_front.png，缺失则用洞图裁切下半部分兜底
    //    （drawHoleFront 内部已处理两种情况，§5.4 优雅降级），制造“从洞里探出半身”的遮挡感
    for (const cell of this.cells) drawHoleFront(ctx, cell);

    // 5) 飘字
    drawFloaters(ctx, this.floaters);

    // 6) 调试命中框
    if (GameConfig.debug.showHitboxes) {
      ctx.save();
      ctx.strokeStyle = "rgba(255,0,0,0.5)"; ctx.lineWidth = 2;
      for (const cell of this.cells) {
        ctx.strokeRect(
          cell.cx - cell.cellW * 0.45, cell.cy - cell.cellH * 0.45,
          cell.cellW * 0.9, cell.cellH * 0.9
        );
      }
      ctx.restore();
    }

    // 7) 猫扣分红色闪屏（brief flash，§4.2 猫视觉反馈）
    if (this.catFlash > 0) {
      ctx.save();
      ctx.fillStyle = `rgba(220,30,30,${(this.catFlash / 0.35) * 0.28})`;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }

    // 8) HUD + 光标
    this.renderHUD(ctx);
    // 光标必须画在暂停/教程遮罩之后，否则会被半透明黑色遮罩盖住变灰、显得脱层
    if (this.tutorialOpen) this.renderTutorial(ctx);
    else if (this.paused) this.renderPause(ctx);
    this.renderCursor(ctx);
  },

  renderHUD(ctx) {
    const W = Scaler.logicalWidth;
    ctx.save();
    roundRect(ctx, 30, 30, 800, 85, 16);
    ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fill();
    ctx.restore();

    const t = Math.ceil(this.timeLeft);
    const score = this.scoreState.score;
    const combo = this.scoreState.combo;

    drawText(ctx, `第 ${this.level.id} 关`, 55, 88, { size: 44, color: "#ffd23f" });
    drawText(ctx, `时间 ${t}s`, 265, 88, { size: 44, color: t <= 10 ? "#ff7676" : "#fff" });
    drawText(ctx, `分 ${score}`, 460, 88, { size: 44, color: "#fff" });
    drawText(ctx, `连击 ×${combo}`, 630, 88, { size: 44, color: combo >= 6 ? "#ffb24d" : "#9fe6ff" });

    // 双倍状态（§4.6）
    const doubleLeft = Math.max(0, this.scoreState.doubleUntil - this.gameTime);
    let statusY = 130;
    if (doubleLeft > 0) {
      ctx.save();
      roundRect(ctx, 30, statusY, 380, 68, 12);
      ctx.fillStyle = "rgba(90,160,255,0.88)"; ctx.fill();
      ctx.restore();
      drawText(ctx, `×2 双倍  ${doubleLeft.toFixed(1)}s`, 48, statusY + 46, { size: 40, color: "#fff" });
      statusY += 80;
    }

    // 连击里程碑提示（≥6 时高亮告知玩家进入最高加成档）
    if (combo >= 6) {
      ctx.save();
      roundRect(ctx, 30, statusY, 340, 68, 12);
      ctx.fillStyle = "rgba(220,130,20,0.88)"; ctx.fill();
      ctx.restore();
      drawText(ctx, `🔥 连击 ×${combo}  每鼠+3`, 48, statusY + 46, { size: 36, color: "#fff" });
    }

    for (const b of this.hudButtons) {
      drawButton(ctx, b, { hovered: pointInRect(Pointer.x, Pointer.y, b), fontSize: 34 });
    }
  },

  renderCursor(ctx) {
    if (!Pointer.inside) return;
    // 暂停/教程浮层期间：只显示手指光标（不判定挥锤），不再完全隐藏光标
    const overlayActive = this.paused || this.tutorialOpen;
    const inArea = !overlayActive && this.inGameArea(Pointer.x, Pointer.y);
    const overHud = this.hudButtons.some((b) => pointInRect(Pointer.x, Pointer.y, b));
    const useHammer = inArea && !overHud;
    const size = GameConfig.hammer.displaySize;
    // 锤头质心热点：让锤头视觉位置精确对准点击/命中判定点（Pointer.x/y），见 config.hammer
    const hotX = size * GameConfig.hammer.headHotspotX;
    const hotY = size * GameConfig.hammer.headHotspotY;

    if (useHammer) {
      // 落锤动效：无 hammer_down 时旋转 hammer.png 模拟（§5.4）
      const down = this.hammerDown > 0;
      const key = (down && hasImage("hammer_down")) ? "hammer_down" : "hammer";
      const img = getImage(key);
      if (img) {
        ctx.save();
        if (down && !hasImage("hammer_down")) {
          // 代码模拟落锤：旋转向下砸
          const k = this.hammerDown / GameConfig.animation.hammerDownTime; // 1→0
          ctx.translate(Pointer.x, Pointer.y);
          ctx.rotate(-0.55 * k);
          ctx.translate(-Pointer.x, -Pointer.y);
        }
        ctx.drawImage(img, Pointer.x - hotX, Pointer.y - hotY, size, size);
        ctx.restore();
      }
    } else {
      const img = getImage("cursor_finger");
      if (img) ctx.drawImage(img, Pointer.x - size * 0.2, Pointer.y - size * 0.1, size, size);
    }
  },

  renderPause(ctx) {
    const W = Scaler.logicalWidth, H = Scaler.logicalHeight;
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.62)"; ctx.fillRect(0, 0, W, H);
    ctx.restore();
    drawText(ctx, "已暂停", W / 2, H / 2 - 250, { size: 80, align: "center", color: "#ffd23f" });
    for (const b of this.pauseButtons) {
      drawButton(ctx, b, { hovered: pointInRect(Pointer.x, Pointer.y, b) });
    }
  },

  // 新手教程浮层：3 页翻页说明书（首次进第 1 关自动弹一次，之后仅可点 HUD “?” 手动查看）
  renderTutorial(ctx) {
    const W = Scaler.logicalWidth, H = Scaler.logicalHeight;
    const page = TUTORIAL_PAGES[this.tutorialPage];
    const { w: pw, h: ph } = TUTORIAL_PANEL;
    const px = W / 2 - pw / 2, py = H / 2 - ph / 2 - 40;

    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0, 0, W, H);
    ctx.restore();

    ctx.save();
    roundRect(ctx, px, py, pw, 90, 20);
    ctx.fillStyle = page.color; ctx.fill();
    ctx.restore();
    drawText(ctx, page.title, W / 2, py + 60, { size: 42, align: "center", color: "#fff2df" });

    ctx.save();
    roundRect(ctx, px, py + 90, pw, ph - 90, 20);
    ctx.fillStyle = "#fff7e8"; ctx.fill();
    ctx.restore();

    let ly = py + 90 + 76;
    for (const line of page.lines) {
      drawText(ctx, line, W / 2, ly, { size: 30, align: "center", color: "#3a2410", bold: false });
      ly += 50;
    }

    // 底部空白处：画出对应动物素材（§5.4 缺失时 getImage 回退到占位图，不会报错）
    this.renderTutorialImages(ctx, page, W / 2, ly + 30, py + ph - 100);

    // 页码指示点
    const dotY = py + ph - 46;
    const dotGap = 28;
    const dotStartX = W / 2 - dotGap * (TUTORIAL_PAGES.length - 1) / 2;
    for (let i = 0; i < TUTORIAL_PAGES.length; i++) {
      ctx.beginPath();
      ctx.arc(dotStartX + i * dotGap, dotY, i === this.tutorialPage ? 9 : 6, 0, Math.PI * 2);
      ctx.fillStyle = i === this.tutorialPage ? "#e08a2c" : "rgba(58,36,16,0.3)";
      ctx.fill();
    }

    for (const b of this.tutorialNavButtons) {
      if (b.id === "prev" && this.tutorialPage === 0) continue;
      if (b.id === "next" && this.tutorialPage === TUTORIAL_PAGES.length - 1) continue;
      drawButton(ctx, b, { hovered: pointInRect(Pointer.x, Pointer.y, b), fontSize: 30 });
    }
  },

  // 在 [topY, bottomLimit] 的空白区域内，水平居中画出一排动物素材图片
  renderTutorialImages(ctx, page, centerX, topY, bottomLimit) {
    const images = (page.images || []).map((key) => getImage(key)).filter(Boolean);
    if (images.length === 0) return;

    const availH = Math.max(60, bottomLimit - topY);
    const targetH = Math.min(150, availH);
    const gap = 36;

    const sizes = images.map((img) => {
      const ratio = img.width && img.height ? img.width / img.height : 1;
      return { w: targetH * ratio, h: targetH };
    });
    const totalW = sizes.reduce((s, sz) => s + sz.w, 0) + gap * (sizes.length - 1);

    let x = centerX - totalW / 2;
    const y = topY + (availH - targetH) / 2;
    for (let i = 0; i < images.length; i++) {
      ctx.drawImage(images[i], x, y, sizes[i].w, sizes[i].h);
      x += sizes[i].w + gap;
    }
  }
};
