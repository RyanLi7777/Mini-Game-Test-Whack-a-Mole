(function(){
  "use strict";
  var __cache = {};
  var __factories = {};
  __factories["config/game-config.js"] = function(exports, __req) {
    // ============================================================================
    //  欢乐打地鼠 —— 全局配置（唯一数值源）
    //  依据《欢乐打地鼠-需求文档.md》§6 编写。
    //  策划/玩家只需修改本文件即可调整难度与手感，无需改动代码。
    //  ⚠ 标注“初始估值”的数字均为待 playtest 校准的占位值。
    // ============================================================================
    
    const GameConfig = {
      // ---- 6.1 全局 ----
      resolution: { width: 1920, height: 1080 }, // 逻辑分辨率
      scaleMode: "letterbox",                     // 等比缩放 + 留黑边
      language: "zh-CN",
    
      defaultMusicVolume: 0.7,
      defaultSfxVolume: 0.8,
    
      scoring: {
        moleBaseScore: 1,
        // 连击位次 → 单只得分（minPos 升序；取 <= combo 的最大档）
        comboTiers: [
          { minPos: 1, pts: 1 },
          { minPos: 2, pts: 2 },
          { minPos: 6, pts: 3 }
        ],
        ratScore: 1,      // 老鼠固定分（初始估值）
        catPenalty: 2,    // 猫扣分
        scoreFloor: 0     // 分数下限（不为负）
      },
    
      buff: {
        doubleBuffDuration: 5,   // 双倍持续秒数
        doubleBuffMultiplier: 2, // 双倍倍率
        refreshOnReHit: true     // 再次敲老鼠刷新计时
      },
    
      stars: {
        thresholds: { one: 0.40, two: 0.65, three: 0.85 } // 占 targetScore 比例
      },
    
      animation: {
        emergeTime: 0.15,     // 冒出
        retreatTime: 0.15,    // 缩回
        hitTime: 0.25,        // 被砸
        hammerDownTime: 0.10  // 落锤
      },
    
      spawnJitter: 0.20, // 出怪间隔抖动 ±20%
    
      debug: {
        showUnlockAllButton: true, // 选关页“解锁全部关卡”按钮（发布置 false）
        showHitboxes: false        // 显示命中框
      },
    
      // ---- 资源相关 ----
      assets: {
        moleSkinCount: 3 // 地鼠外观数量（mole_1..mole_N）；新增外观时改这里即生效
      },
    
      // ---- 动画打磨（§7.2 动画清单，冒出/被砸补充效果）----
      effects: {
        dust: {
          count: 8,            // 每次尘土爆发的粒子数
          minSize: 4,
          maxSize: 9,
          minLife: 0.35,       // 秒
          maxLife: 0.6,
          gravity: 900          // 逻辑像素/秒²
        },
        hit: {
          fadeStartT: 0.4,      // HIT 动画进度超过此比例开始淡出（0~1）
          tiltMinDeg: 14,       // 被砸倒下的最小倾斜角
          tiltMaxDeg: 24        // 被砸倒下的最大倾斜角
        }
      },
    
      // ---- 洞口绘制（§4.1 / §7.2：背景仅作场景，洞口由程序绘制）----
      hole: {
        // 洞口显示尺寸相对单元格宽度的比例（按 cell 自适应）
        widthRatio: 0.78,
        heightRatio: 0.53  // 原 0.42 显得扁平，调大让洞口高宽比更立体（h/w 从 0.54 提到 0.68）
      },
    
      // ---- 动物显示尺寸与位置（相对洞口宽度，§7.2 动画打磨）----
      animal: {
        widthToHoleRatio: 0.82, // 动物宽度 = 洞口宽度 × 此值（原 1.05 太大，缩小到明显小于洞口）
        // 每种动物贴图“内容本身”（裁掉透明留白后）的真实高/宽比例，
        // 由 tools/measure-content-ratio.mjs 实测得出（宽高比 w/h 取倒数即为此处的 h/w）。
        // 换素材后重新跑一遍该工具、把新比例填在这里，避免整图强行拉伸变形走样。
        // 缺失 skin 的兜底比例见 aspectRatioDefault。
        aspectRatioBySkin: {
          mole_1: 727 / 758,  // 实测内容比例 w/h=1.043
          mole_2: 855 / 769,  // 实测内容比例 w/h=0.899
          mole_3: 798 / 803,  // 实测内容比例 w/h=1.006
          rat: 798 / 985,     // 实测内容比例 w/h=1.234
          cat: 796 / 862      // 实测内容比例 w/h=1.083
        },
        aspectRatioDefault: 1.0, // 新增/未测量的 skin 兜底比例（§5.4 优雅降级，不报错）
        // “站立/停留”时下沉进洞口的比例（相对动物自身高度，不随洞口比例变化而变化）。
        // 值越大，动物下半身被洞口前沿遮挡越多，越像“从洞里探出半身”而不是“浮在洞上”。
        // 取值范围建议 0.10~0.30。
        sinkRatio: 0.10
      },
    
      // ---- 锤子光标热点（§4.4）----
      hammer: {
        // 锤头在 hammer.png 里的质心占比（通过分析不透明像素算出，图片上半部分锤头区域质心
        // ≈ x=0.388, y=0.310）。渲染光标时用这个比例定位，让“锤头视觉位置”与“点击/命中判定点”
        // 精确重合——此前写死用 0.2/0.15（纯拍脑袋），导致锤头看着碰到动物但判定不中。
        headHotspotX: 0.388,
        headHotspotY: 0.310,
        displaySize: 140 // 光标显示尺寸（正方形，逻辑像素）
      },
    
      // ---- 6.3 每关数值表（初始估值）----
      levels: [
        {
          id: 1, boardRows: 3, boardCols: 3,
          boardArea: { x: 460, y: 230, w: 1000, h: 720 },
          timeLimit: 40, maxConcurrent: 1, moleStayTime: 1.50, spawnInterval: 1.20,
          spawnWeights: { mole: 100, rat: 0, cat: 0 },
          targetScore: 90,
          background: "assets/images/backgrounds/level_1.png", music: null
        },
        {
          id: 2, boardRows: 3, boardCols: 3,
          boardArea: { x: 460, y: 230, w: 1000, h: 720 },
          timeLimit: 40, maxConcurrent: 2, moleStayTime: 1.40, spawnInterval: 1.10,
          spawnWeights: { mole: 100, rat: 0, cat: 0 },
          targetScore: 110,
          background: "assets/images/backgrounds/level_2.png", music: null
        },
        {
          id: 3, boardRows: 3, boardCols: 3,
          boardArea: { x: 460, y: 230, w: 1000, h: 720 },
          timeLimit: 40, maxConcurrent: 2, moleStayTime: 1.30, spawnInterval: 1.00,
          spawnWeights: { mole: 100, rat: 0, cat: 0 },
          targetScore: 130,
          background: "assets/images/backgrounds/level_3.png", music: null
        },
        {
          id: 4, boardRows: 4, boardCols: 4,
          boardArea: { x: 360, y: 180, w: 1200, h: 820 },
          timeLimit: 40, maxConcurrent: 2, moleStayTime: 1.20, spawnInterval: 0.90,
          spawnWeights: { mole: 84, rat: 16, cat: 0 }, // 猫从第 6 关才出现，第 4 关权重转给地鼠
          targetScore: 150,
          background: "assets/images/backgrounds/level_4.png", music: null
        },
        {
          id: 5, boardRows: 4, boardCols: 4,
          boardArea: { x: 360, y: 180, w: 1200, h: 820 },
          timeLimit: 40, maxConcurrent: 2, moleStayTime: 1.10, spawnInterval: 0.82,
          spawnWeights: { mole: 83, rat: 17, cat: 0 }, // 猫从第 6 关才出现
          targetScore: 170,
          background: "assets/images/backgrounds/level_5.png", music: null
        },
        {
          id: 6, boardRows: 4, boardCols: 4,
          boardArea: { x: 360, y: 180, w: 1200, h: 820 },
          timeLimit: 40, maxConcurrent: 2, moleStayTime: 1.00, spawnInterval: 0.74,
          spawnWeights: { mole: 70, rat: 16, cat: 14 }, // 猫从本关开始出现
          targetScore: 190,
          background: "assets/images/backgrounds/level_6.png", music: null
        },
        {
          id: 7, boardRows: 4, boardCols: 4,
          boardArea: { x: 360, y: 180, w: 1200, h: 820 },
          timeLimit: 40, maxConcurrent: 2, moleStayTime: 0.90, spawnInterval: 0.66,
          spawnWeights: { mole: 67, rat: 15, cat: 18 },
          targetScore: 210,
          background: "assets/images/backgrounds/level_7.png", music: null
        },
        {
          id: 8, boardRows: 5, boardCols: 5,
          boardArea: { x: 310, y: 150, w: 1300, h: 870 },
          timeLimit: 40, maxConcurrent: 2, moleStayTime: 0.80, spawnInterval: 0.58,
          spawnWeights: { mole: 64, rat: 14, cat: 22 },
          targetScore: 235,
          background: "assets/images/backgrounds/level_8.png", music: null
        },
        {
          id: 9, boardRows: 5, boardCols: 5,
          boardArea: { x: 310, y: 150, w: 1300, h: 870 },
          timeLimit: 40, maxConcurrent: 3, moleStayTime: 0.70, spawnInterval: 0.50,
          spawnWeights: { mole: 60, rat: 14, cat: 26 },
          targetScore: 260,
          background: "assets/images/backgrounds/level_9.png", music: null
        }
      ]
    };
    
    // 派生：根据 targetScore 计算 1/2/3 星阈值（向上取整 → 与 §6.3 表对齐）
    function starThresholds(level) {
      const t = GameConfig.stars.thresholds;
      return {
        one: Math.ceil(level.targetScore * t.one),
        two: Math.ceil(level.targetScore * t.two),
        three: Math.ceil(level.targetScore * t.three)
      };
    }
    
    // 派生：根据得分判定星数（0–3）
    function starsForScore(level, score) {
      const th = starThresholds(level);
      if (score >= th.three) return 3;
      if (score >= th.two) return 2;
      if (score >= th.one) return 1;
      return 0;
    }
    
    
    
    // ---- module.exports ----
    exports.GameConfig = GameConfig;
    exports.starThresholds = starThresholds;
    exports.starsForScore = starsForScore;
    exports.default = GameConfig;
    
  };
  __factories["src/scaler.js"] = function(exports, __req) {
    // ============================================================================
    //  letterbox 自适应 + 横屏遮罩 —— 依据 §2.2 / §10.1。
    //  以 1920×1080 逻辑坐标系渲染，等比缩放居中、四周留黑边。
    //  提供屏幕坐标 → 逻辑坐标转换，供命中检测使用。
    // ============================================================================
    
    var GameConfig = __req("config/game-config.js").default;
    
    const LOGICAL_W = GameConfig.resolution.width;
    const LOGICAL_H = GameConfig.resolution.height;
    
    const Scaler = {
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
    
    
    // ---- module.exports ----
    exports.Scaler = Scaler;
    
  };
  __factories["src/input.js"] = function(exports, __req) {
    // ============================================================================
    //  输入 —— 鼠标 + 触摸（§2.4）。统一转换为逻辑坐标，分发给当前场景。
    //  - 移动：更新光标逻辑坐标（PC 锤子/手指跟随）。
    //  - 点击/点按：分发 onPointerDown(x, y)。
    // ============================================================================
    
    var { Scaler } = __req("src/scaler.js");
    
    const Pointer = { x: 0, y: 0, inside: false, isTouch: false };
    
    function initInput(canvas, getScene, onAnyGesture) {
      function updatePos(clientX, clientY) {
        const p = Scaler.toLogical(clientX, clientY);
        Pointer.x = p.x;
        Pointer.y = p.y;
        Pointer.inside = Scaler.inBounds(p.x, p.y);
      }
    
      function dispatchDown(clientX, clientY) {
        updatePos(clientX, clientY);
        if (onAnyGesture) onAnyGesture(); // 用户手势：恢复被拦截的音频
        const scene = getScene();
        if (scene && scene.onPointerDown && Pointer.inside) {
          scene.onPointerDown(Pointer.x, Pointer.y);
        }
      }
    
      // 鼠标
      canvas.addEventListener("mousemove", (e) => {
        Pointer.isTouch = false;
        updatePos(e.clientX, e.clientY);
      });
      canvas.addEventListener("mousedown", (e) => {
        if (e.button !== 0) return;
        Pointer.isTouch = false;
        dispatchDown(e.clientX, e.clientY);
      });
    
      // 触摸
      canvas.addEventListener("touchstart", (e) => {
        Pointer.isTouch = true;
        if (e.touches.length > 0) {
          const t = e.touches[0];
          dispatchDown(t.clientX, t.clientY);
        }
        e.preventDefault();
      }, { passive: false });
      canvas.addEventListener("touchmove", (e) => {
        Pointer.isTouch = true;
        if (e.touches.length > 0) {
          const t = e.touches[0];
          updatePos(t.clientX, t.clientY);
        }
        e.preventDefault();
      }, { passive: false });
    
      // 禁用右键菜单（游戏区）
      canvas.addEventListener("contextmenu", (e) => e.preventDefault());
    }
    
    
    // ---- module.exports ----
    exports.Pointer = Pointer;
    exports.initInput = initInput;
    
  };
  __factories["src/assets.js"] = function(exports, __req) {
    // ============================================================================
    //  资源管理 —— 依据 §5。
    //  - 按固定目录/命名加载（只换文件、不改代码）。
    //  - 任何缺失都不报错、不白屏：按 §5.4 回退链处理，必要时生成风格统一的占位图。
    //  - 音频缺失 → 静音；图片缺失 → 程序绘制占位。
    // ============================================================================
    
    var GameConfig = __req("config/game-config.js").default;
    
    // 注意：index.html 与 images/、audio/ 同级（项目根目录本身名为 "assets"，
    // 但这只是磁盘文件夹名，不代表 URL 需要再加一层 "assets/" 前缀）。
    const IMG_BASE = "images/";
    const AUD_BASE = "audio/";
    
    // 已成功加载的资源
    const images = {};   // key -> HTMLImageElement
    const audios = {};   // key -> HTMLAudioElement
    const placeholders = {}; // key -> HTMLCanvasElement（程序占位）
    const missing = new Set();
    
    // ---- 资源清单（M1：菜单/选关/通用 + 全部，后续里程碑共用此清单）----
    function buildImageList() {
      const list = [];
      // 动物
      for (let i = 1; i <= GameConfig.assets.moleSkinCount; i++) {
        list.push({ key: `mole_${i}`, src: `animals/mole_${i}.png`, optional: false });
        list.push({ key: `mole_${i}_hit`, src: `animals/mole_${i}_hit.png`, optional: true });
      }
      list.push({ key: "mole_hit", src: "animals/mole_hit.png", optional: true });
      list.push({ key: "rat", src: "animals/rat.png", optional: false });
      list.push({ key: "cat", src: "animals/cat.png", optional: false });
      list.push({ key: "rat_hit", src: "animals/rat_hit.png", optional: true });
      list.push({ key: "cat_hit", src: "animals/cat_hit.png", optional: true });
      // 锤子 / 光标
      list.push({ key: "hammer", src: "hammer/hammer.png", optional: false });
      list.push({ key: "hammer_down", src: "hammer/hammer_down.png", optional: true });
      list.push({ key: "cursor_finger", src: "hammer/cursor_finger.png", optional: false });
      // 洞口
      list.push({ key: "hole", src: "board/hole.png", optional: false });
      list.push({ key: "hole_front", src: "board/hole_front.png", optional: true });
      // 背景
      for (let i = 1; i <= GameConfig.levels.length; i++) {
        list.push({ key: `level_${i}`, src: `backgrounds/level_${i}.png`, optional: true });
      }
      list.push({ key: "menu_bg", src: "backgrounds/menu_bg.png", optional: true });
      // UI（可选）
      list.push({ key: "star_filled", src: "ui/star_filled.png", optional: true });
      list.push({ key: "star_empty", src: "ui/star_empty.png", optional: true });
      return list;
    }
    
    function buildAudioList() {
      return [
        { key: "music_menu", src: "music/menu.mp3" },
        { key: "music_gameplay", src: "music/gameplay.mp3" },
        // 按关音乐（可选覆盖）
        ...GameConfig.levels.map((l) => ({ key: `music_gameplay_level_${l.id}`, src: `music/gameplay_level_${l.id}.mp3` })),
        { key: "sfx_hammer_swing", src: "sfx/hammer_swing.mp3" },
        { key: "sfx_hit_mole", src: "sfx/hit_mole.mp3" },
        { key: "sfx_hit_rat", src: "sfx/hit_rat.mp3" },
        { key: "sfx_hit_cat", src: "sfx/hit_cat.mp3" },
        { key: "sfx_star", src: "sfx/star.mp3" },
        { key: "sfx_fail", src: "sfx/fail.mp3" },
        { key: "sfx_button", src: "sfx/button.mp3" }
      ];
    }
    
    function loadImage(key, src) {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => { images[key] = img; resolve(); };
        img.onerror = () => { missing.add(key); resolve(); };
        img.src = IMG_BASE + src;
      });
    }
    
    // 正式素材按 §5.1 固定为 .mp3；若缺失，尝试同名 .wav 占位音（由
    // tools/gen-placeholder-audio.mjs 生成，§5.4 "占位音可为极短提示音"）。
    // 用户放入正式 .mp3 后自动优先使用，无需删除 .wav、不改代码。
    function loadAudioOnce(fullSrc) {
      return new Promise((resolve) => {
        const a = new Audio();
        let done = false;
        const ok = () => { if (!done) { done = true; resolve(a); } };
        const fail = () => { if (!done) { done = true; resolve(null); } };
        a.oncanplaythrough = ok;
        a.onloadeddata = ok;
        a.onerror = fail;
        a.preload = "auto";
        a.src = fullSrc;
        setTimeout(() => { if (!done) fail(); }, 3000);
      });
    }
    
    async function loadAudio(key, src) {
      let a = await loadAudioOnce(AUD_BASE + src);
      if (!a && src.endsWith(".mp3")) {
        a = await loadAudioOnce(AUD_BASE + src.slice(0, -4) + ".wav");
      }
      if (a) audios[key] = a; else missing.add(key);
    }
    
    // ---- 公共加载入口：返回进度回调驱动的 Promise ----
    async function preloadAll(onProgress) {
      const imgList = buildImageList();
      const audList = buildAudioList();
      const total = imgList.length + audList.length;
      let loaded = 0;
      const tick = () => { loaded++; if (onProgress) onProgress(loaded / total); };
    
      const tasks = [];
      for (const it of imgList) tasks.push(loadImage(it.key, it.src).then(tick));
      for (const it of audList) tasks.push(loadAudio(it.key, it.src).then(tick));
      await Promise.all(tasks);
    
      // 为关键缺失图生成程序占位，保证渲染可用
      generatePlaceholders();
    }
    
    // ============================================================================
    //  程序占位图（风格统一：圆角卡通色块 + 标签）
    // ============================================================================
    const PLACEHOLDER_STYLE = {
      mole_1: { fill: "#a9743f", label: "鼠1" },
      mole_2: { fill: "#9c6736", label: "鼠2" },
      mole_3: { fill: "#b5824a", label: "鼠3" },
      rat:    { fill: "#888888", label: "鼠" },
      cat:    { fill: "#e0883c", label: "猫" },
      hammer: { fill: "#c75050", label: "锤" },
      cursor_finger: { fill: "#f2c14e", label: "✋" }
    };
    
    function makePlaceholder(key, size = 256) {
      const c = document.createElement("canvas");
      c.width = c.height = size;
      const g = c.getContext("2d");
      const st = PLACEHOLDER_STYLE[key] || { fill: "#7a7a7a", label: "?" };
      const r = size * 0.36;
      g.fillStyle = st.fill;
      g.beginPath();
      g.arc(size / 2, size / 2, r, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = "rgba(0,0,0,0.25)";
      g.lineWidth = size * 0.03;
      g.stroke();
      // 眼睛（让占位更像角色）
      g.fillStyle = "#fff";
      g.beginPath(); g.arc(size / 2 - r * 0.32, size / 2 - r * 0.1, r * 0.18, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.arc(size / 2 + r * 0.32, size / 2 - r * 0.1, r * 0.18, 0, Math.PI * 2); g.fill();
      g.fillStyle = "#222";
      g.beginPath(); g.arc(size / 2 - r * 0.32, size / 2 - r * 0.1, r * 0.08, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.arc(size / 2 + r * 0.32, size / 2 - r * 0.1, r * 0.08, 0, Math.PI * 2); g.fill();
      // 标签
      g.fillStyle = "rgba(0,0,0,0.6)";
      g.font = `bold ${size * 0.18}px sans-serif`;
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText(st.label, size / 2, size / 2 + r * 0.45);
      placeholders[key] = c;
      return c;
    }
    
    function generatePlaceholders() {
      // 只为缺失且需要的关键图生成占位
      const need = ["mole_1", "mole_2", "mole_3", "rat", "cat", "hammer", "cursor_finger"];
      for (const k of need) {
        if (!images[k]) makePlaceholder(k);
      }
      // 关卡背景缺失时：生成风格统一、按关区分色调的场景占位（而非千篇一律纯色，§5.4）
      for (let i = 1; i <= GameConfig.levels.length; i++) {
        const key = `level_${i}`;
        if (!images[key] && !images["menu_bg"]) {
          makeBackgroundPlaceholder(key, i);
        }
      }
    }
    
    // 按关号生成色调渐变的场景占位（草地+天空风格，色相随关卡递增，便于区分关卡）
    function makeBackgroundPlaceholder(key, levelIndex) {
      const w = 960, h = 540; // 16:9，渲染时整体拉伸到 1920×1080
      const c = document.createElement("canvas");
      c.width = w; c.height = h;
      const g = c.getContext("2d");
      const hue = (200 - levelIndex * 12 + 360) % 360; // 关卡越靠后色调越偏暖
    
      const sky = g.createLinearGradient(0, 0, 0, h * 0.6);
      sky.addColorStop(0, `hsl(${hue}, 55%, 78%)`);
      sky.addColorStop(1, `hsl(${hue}, 45%, 88%)`);
      g.fillStyle = sky;
      g.fillRect(0, 0, w, h * 0.62);
    
      const ground = g.createLinearGradient(0, h * 0.55, 0, h);
      ground.addColorStop(0, `hsl(${(hue + 70) % 360}, 38%, 46%)`);
      ground.addColorStop(1, `hsl(${(hue + 70) % 360}, 42%, 32%)`);
      g.fillStyle = ground;
      g.fillRect(0, h * 0.55, w, h * 0.45);
    
      g.fillStyle = "rgba(0,0,0,0.18)";
      g.font = "bold 34px sans-serif";
      g.textAlign = "center";
      g.fillText(`第 ${levelIndex} 关 · 场景占位`, w / 2, h * 0.5);
    
      images[key] = c;
    }
    
    // ============================================================================
    //  取用接口（含 §5.4 回退链）
    // ============================================================================
    
    // 取图：缺失返回占位（若有），否则 null
    function getImage(key) {
      if (images[key]) return images[key];
      if (placeholders[key]) return placeholders[key];
      return null;
    }
    
    function hasImage(key) {
      return !!images[key];
    }
    
    // 动物“被砸表情”回退链：mole_N_hit → mole_hit → 基础图（由渲染层做挤压动效）
    function getHitImage(baseKey) {
      if (baseKey.startsWith("mole_")) {
        const specific = `${baseKey}_hit`;
        if (images[specific]) return images[specific];
        if (images["mole_hit"]) return images["mole_hit"];
        return getImage(baseKey);
      }
      const specific = `${baseKey}_hit`;
      if (images[specific]) return images[specific];
      return getImage(baseKey);
    }
    
    // 关卡背景：缺失 → menu_bg → null（由渲染层用纯色兜底）
    function getBackground(levelId) {
      if (images[`level_${levelId}`]) return images[`level_${levelId}`];
      if (images["menu_bg"]) return images["menu_bg"];
      return null;
    }
    
    // 局内音乐 key：按关覆盖 → 通用
    function gameplayMusicKey(levelId) {
      if (audios[`music_gameplay_level_${levelId}`]) return `music_gameplay_level_${levelId}`;
      if (audios["music_gameplay"]) return "music_gameplay";
      return null;
    }
    
    function getAudio(key) {
      return audios[key] || null;
    }
    
    function hasAudio(key) {
      return !!audios[key];
    }
    
    function getMissingReport() {
      return Array.from(missing).sort();
    }
    
    
    // ---- module.exports ----
    exports.preloadAll = preloadAll;
    exports.getImage = getImage;
    exports.hasImage = hasImage;
    exports.getHitImage = getHitImage;
    exports.getBackground = getBackground;
    exports.gameplayMusicKey = gameplayMusicKey;
    exports.getAudio = getAudio;
    exports.hasAudio = hasAudio;
    exports.getMissingReport = getMissingReport;
    
  };
  __factories["src/storage.js"] = function(exports, __req) {
    // ============================================================================
    //  存档（localStorage，单存档）—— 依据 §8。
    //  localStorage 不可用（隐私模式）时降级为内存存档，单次会话可玩，不崩溃。
    // ============================================================================
    
    var GameConfig = __req("config/game-config.js").default;
    
    const SAVE_KEY = "happy_whack_save_v1";
    const SAVE_VERSION = 1;
    
    let memoryFallback = null;   // localStorage 不可用时的内存兜底
    let storageAvailable = true;
    
    function defaultSave() {
      return {
        version: SAVE_VERSION,
        unlockedLevel: 1,
        levels: {}, // { "1": { stars, bestScore } }
        settings: {
          musicVolume: GameConfig.defaultMusicVolume,
          sfxVolume: GameConfig.defaultSfxVolume
        },
        tutorialSeen: false // 新手教程是否已自动展示过（只自动弹一次）
      };
    }
    
    function rawRead() {
      try {
        const s = window.localStorage.getItem(SAVE_KEY);
        return s ? JSON.parse(s) : null;
      } catch (e) {
        storageAvailable = false;
        return memoryFallback;
      }
    }
    
    function rawWrite(data) {
      try {
        window.localStorage.setItem(SAVE_KEY, JSON.stringify(data));
      } catch (e) {
        storageAvailable = false;
        memoryFallback = data;
      }
    }
    
    // 探测可用性（隐私模式下 setItem 抛错）
    (function probe() {
      try {
        const k = "__hw_probe__";
        window.localStorage.setItem(k, "1");
        window.localStorage.removeItem(k);
      } catch (e) {
        storageAvailable = false;
      }
    })();
    
    let cache = null;
    
    function loadSave() {
      if (cache) return cache;
      let data = rawRead();
      if (!data || data.version !== SAVE_VERSION) {
        data = defaultSave();
        rawWrite(data);
      }
      cache = data;
      return cache;
    }
    
    function getSave() {
      return loadSave();
    }
    
    function persist() {
      rawWrite(cache);
    }
    
    // ---- 关卡成绩（取历史最高，§8.2/§8.3）----
    function getLevelRecord(levelId) {
      const s = loadSave();
      return s.levels[String(levelId)] || { stars: 0, bestScore: 0 };
    }
    
    function recordLevelResult(levelId, stars, score) {
      const s = loadSave();
      const key = String(levelId);
      const prev = s.levels[key] || { stars: 0, bestScore: 0 };
      s.levels[key] = {
        stars: Math.max(prev.stars, stars),
        bestScore: Math.max(prev.bestScore, score)
      };
      // ≥1 星解锁下一关（不超过总关数）
      if (stars >= 1) {
        const next = levelId + 1;
        if (next <= GameConfig.levels.length) {
          s.unlockedLevel = Math.max(s.unlockedLevel, next);
        }
      }
      persist();
      return s.levels[key];
    }
    
    function isUnlocked(levelId) {
      return levelId <= loadSave().unlockedLevel;
    }
    
    function unlockAll() {
      loadSave().unlockedLevel = GameConfig.levels.length;
      persist();
    }
    
    function totalStars() {
      const s = loadSave();
      return Object.values(s.levels).reduce((sum, l) => sum + (l.stars || 0), 0);
    }
    
    // ---- 设置 ----
    function getSettings() {
      return loadSave().settings;
    }
    
    function setMusicVolume(v) {
      loadSave().settings.musicVolume = v;
      persist();
    }
    
    function setSfxVolume(v) {
      loadSave().settings.sfxVolume = v;
      persist();
    }
    
    // ---- 重置 / 新游戏清空（保留音量设置，§8.4）----
    function resetProgress() {
      const s = loadSave();
      s.levels = {};
      s.unlockedLevel = 1;
      persist();
    }
    
    function hasProgress() {
      const s = loadSave();
      return s.unlockedLevel > 1 || Object.keys(s.levels).length > 0;
    }
    
    // ---- 新手教程（只自动弹一次，之后仅可通过 HUD 提示按钮手动查看）----
    function hasSeenTutorial() {
      return !!loadSave().tutorialSeen;
    }
    
    function markTutorialSeen() {
      loadSave().tutorialSeen = true;
      persist();
    }
    
    
    // ---- module.exports ----
    exports.storageAvailable = storageAvailable;
    exports.loadSave = loadSave;
    exports.getSave = getSave;
    exports.getLevelRecord = getLevelRecord;
    exports.recordLevelResult = recordLevelResult;
    exports.isUnlocked = isUnlocked;
    exports.unlockAll = unlockAll;
    exports.totalStars = totalStars;
    exports.getSettings = getSettings;
    exports.setMusicVolume = setMusicVolume;
    exports.setSfxVolume = setSfxVolume;
    exports.resetProgress = resetProgress;
    exports.hasProgress = hasProgress;
    exports.hasSeenTutorial = hasSeenTutorial;
    exports.markTutorialSeen = markTutorialSeen;
    
  };
  __factories["src/audio.js"] = function(exports, __req) {
    // ============================================================================
    //  音频管理 —— 依据 §7。缺失音频静音处理（不报错）。音量受设置控制并持久化。
    // ============================================================================
    
    var { getAudio, gameplayMusicKey } = __req("src/assets.js");
    var { getSettings, setMusicVolume, setSfxVolume } = __req("src/storage.js");
    
    let musicVolume = 0.7;
    let sfxVolume = 0.8;
    let currentMusic = null;      // 当前 HTMLAudioElement
    let currentMusicKey = null;
    
    function initAudio() {
      const s = getSettings();
      musicVolume = s.musicVolume;
      sfxVolume = s.sfxVolume;
    }
    
    // ---- 音乐 ----
    function playMusic(key) {
      if (key === currentMusicKey && currentMusic && !currentMusic.paused) return;
      stopMusic();
      const a = getAudio(key);
      if (!a) { currentMusicKey = key; return; } // 缺失 → 静音
      currentMusic = a;
      currentMusicKey = key;
      a.loop = true;
      a.volume = musicVolume;
      a.currentTime = 0;
      const p = a.play();
      if (p && p.catch) p.catch(() => {}); // 浏览器自动播放策略：失败则等待用户手势后重试
    }
    
    function playGameplayMusic(levelId) {
      const key = gameplayMusicKey(levelId);
      if (key) playMusic(key); else stopMusic();
    }
    
    function stopMusic() {
      if (currentMusic) {
        try { currentMusic.pause(); } catch (e) {}
      }
      currentMusic = null;
    }
    
    function pauseMusic() {
      if (currentMusic) { try { currentMusic.pause(); } catch (e) {} }
    }
    
    function resumeMusic() {
      if (currentMusic) {
        const p = currentMusic.play();
        if (p && p.catch) p.catch(() => {});
      }
    }
    
    // 浏览器自动播放被拦截时：首次用户手势后恢复当前音乐
    function retryMusicOnGesture() {
      if (currentMusicKey && (!currentMusic || currentMusic.paused)) {
        playMusic(currentMusicKey);
      }
    }
    
    // ---- 音效 ----
    function playSfx(key) {
      const a = getAudio(key);
      if (!a) return; // 缺失 → 静音
      try {
        const node = a.cloneNode(); // 允许重叠播放
        node.volume = sfxVolume;
        const p = node.play();
        if (p && p.catch) p.catch(() => {});
      } catch (e) {}
    }
    
    // ---- 音量（即时生效 + 持久化）----
    function setMusicVol(v) {
      musicVolume = clamp01(v);
      if (currentMusic) currentMusic.volume = musicVolume;
      setMusicVolume(musicVolume);
    }
    
    function setSfxVol(v) {
      sfxVolume = clamp01(v);
      setSfxVolume(sfxVolume);
    }
    
    function getMusicVol() { return musicVolume; }
    function getSfxVol() { return sfxVolume; }
    
    function clamp01(v) { return Math.max(0, Math.min(1, v)); }
    
    
    // ---- module.exports ----
    exports.initAudio = initAudio;
    exports.playMusic = playMusic;
    exports.playGameplayMusic = playGameplayMusic;
    exports.stopMusic = stopMusic;
    exports.pauseMusic = pauseMusic;
    exports.resumeMusic = resumeMusic;
    exports.retryMusicOnGesture = retryMusicOnGesture;
    exports.playSfx = playSfx;
    exports.setMusicVol = setMusicVol;
    exports.setSfxVol = setSfxVol;
    exports.getMusicVol = getMusicVol;
    exports.getSfxVol = getSfxVol;
    
  };
  __factories["src/ui.js"] = function(exports, __req) {
    // ============================================================================
    //  UI 绘制助手 —— 按钮、文字、星形（离线、无外部字体，使用系统字体栈）。
    //  按钮采用“逻辑坐标矩形 + 命中检测”模式，供各场景复用。
    // ============================================================================
    
    var { getImage } = __req("src/assets.js");
    
    const FONT_STACK =
      '"PingFang SC","Microsoft YaHei","Hiragino Sans GB","Noto Sans CJK SC",sans-serif';
    
    function setFont(ctx, px, bold = true) {
      ctx.font = `${bold ? "bold " : ""}${px}px ${FONT_STACK}`;
    }
    
    // 圆角矩形路径
    function roundRect(ctx, x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }
    
    // 按钮：{ x, y, w, h, label }，hover/disabled 影响外观
    function drawButton(ctx, btn, opts = {}) {
      const { x, y, w, h, label } = btn;
      const disabled = opts.disabled;
      const hovered = opts.hovered;
      ctx.save();
      roundRect(ctx, x, y, w, h, Math.min(24, h / 4));
      let base = disabled ? "#7d756c" : (hovered ? "#ffb24d" : "#ff9e2c");
      ctx.fillStyle = base;
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = "rgba(0,0,0,0.25)";
      ctx.stroke();
      ctx.fillStyle = disabled ? "#cfcabf" : "#3a2410";
      setFont(ctx, opts.fontSize || Math.floor(h * 0.42));
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, x + w / 2, y + h / 2);
      ctx.restore();
    }
    
    function pointInRect(px, py, rect) {
      return px >= rect.x && px <= rect.x + rect.w && py >= rect.y && py <= rect.y + rect.h;
    }
    
    function pointInCircle(px, py, circle) {
      const dx = px - circle.cx, dy = py - circle.cy;
      return dx * dx + dy * dy <= circle.r * circle.r;
    }
    
    // 圆形图标按钮（比如设置齿轮）：{ cx, cy, r }，程序绘制齿轮图案，无需额外贴图
    function drawGearButton(ctx, btn, opts = {}) {
      const { cx, cy, r } = btn;
      const hovered = opts.hovered;
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = hovered ? "#ffb24d" : "#ff9e2c";
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = "rgba(0,0,0,0.25)";
      ctx.stroke();
    
      // 齿轮图案（深棕色，和按钮文字同色系）
      ctx.translate(cx, cy);
      ctx.fillStyle = "#3a2410";
      const teeth = 8;
      const outer = r * 0.62, inner = r * 0.62 * 0.68, toothLen = r * 0.22;
      ctx.beginPath();
      for (let i = 0; i < teeth; i++) {
        const a0 = (i / teeth) * Math.PI * 2;
        const a1 = a0 + (Math.PI * 2) / teeth * 0.5;
        const aMid0 = a0 - 0.08, aMid1 = a1 + 0.08;
        ctx.lineTo(Math.cos(aMid0) * outer, Math.sin(aMid0) * outer);
        ctx.lineTo(Math.cos(a0) * (outer + toothLen), Math.sin(a0) * (outer + toothLen));
        ctx.lineTo(Math.cos(a1) * (outer + toothLen), Math.sin(a1) * (outer + toothLen));
        ctx.lineTo(Math.cos(aMid1) * outer, Math.sin(aMid1) * outer);
      }
      ctx.closePath();
      ctx.fill();
      // 内圈镂空
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(0, 0, inner, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";
      // 中心孔（用按钮底色填回，形成齿轮镂空中心的视觉）
      ctx.fillStyle = hovered ? "#ffb24d" : "#ff9e2c";
      ctx.beginPath();
      ctx.arc(0, 0, inner * 0.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    
    // 文本
    function drawText(ctx, text, x, y, opts = {}) {
      ctx.save();
      setFont(ctx, opts.size || 40, opts.bold !== false);
      ctx.fillStyle = opts.color || "#fff";
      ctx.textAlign = opts.align || "left";
      ctx.textBaseline = opts.baseline || "alphabetic";
      if (opts.stroke) {
        ctx.lineWidth = opts.strokeWidth || 6;
        ctx.strokeStyle = opts.stroke;
        ctx.strokeText(text, x, y);
      }
      ctx.fillText(text, x, y);
      ctx.restore();
    }
    
    // 一颗星（filled/空心），优先用 ui 素材，否则程序绘制
    function drawStar(ctx, cx, cy, r, filled) {
      const img = getImage(filled ? "star_filled" : "star_empty");
      if (img) {
        ctx.drawImage(img, cx - r, cy - r, r * 2, r * 2);
        return;
      }
      ctx.save();
      ctx.translate(cx, cy);
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a = (-90 + i * 72) * Math.PI / 180;
        const a2 = a + 36 * Math.PI / 180;
        ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        ctx.lineTo(Math.cos(a2) * r * 0.45, Math.sin(a2) * r * 0.45);
      }
      ctx.closePath();
      ctx.fillStyle = filled ? "#ffd23f" : "rgba(0,0,0,0.18)";
      ctx.fill();
      ctx.lineWidth = Math.max(2, r * 0.08);
      ctx.strokeStyle = filled ? "#c98a00" : "rgba(255,255,255,0.4)";
      ctx.stroke();
      ctx.restore();
    }
    
    // 一行星（0–3）
    function drawStarRow(ctx, cx, cy, r, stars, total = 3, gap = null) {
      const g = gap == null ? r * 2.2 : gap;
      const startX = cx - g * (total - 1) / 2;
      for (let i = 0; i < total; i++) {
        drawStar(ctx, startX + g * i, cy, r, i < stars);
      }
    }
    
    // 背景兜底纯色渐变（无背景图时）
    function drawFallbackBg(ctx, w, h, top = "#6fb1d6", bottom = "#cfe6c8") {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, top);
      grad.addColorStop(1, bottom);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    }
    
    
    // ---- module.exports ----
    exports.FONT_STACK = FONT_STACK;
    exports.setFont = setFont;
    exports.roundRect = roundRect;
    exports.drawButton = drawButton;
    exports.pointInRect = pointInRect;
    exports.pointInCircle = pointInCircle;
    exports.drawGearButton = drawGearButton;
    exports.drawText = drawText;
    exports.drawStar = drawStar;
    exports.drawStarRow = drawStarRow;
    exports.drawFallbackBg = drawFallbackBg;
    
  };
  __factories["src/game.js"] = function(exports, __req) {
    // ============================================================================
    //  游戏引擎 —— 状态机 / 主循环 / 横屏遮罩 / 自动暂停。
    //  依据 §3.1 流程状态机、§2.2 letterbox、§9 边界情况。
    // ============================================================================
    
    var { Scaler } = __req("src/scaler.js");
    var { Pointer, initInput } = __req("src/input.js");
    var { initAudio, retryMusicOnGesture, pauseMusic, resumeMusic } = __req("src/audio.js");
    var { drawText } = __req("src/ui.js");
    
    const Game = {
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
    
    
    
    // ---- module.exports ----
    exports.Game = Game;
    exports.Pointer = Pointer;
    
  };
  __factories["src/scenes/boot.js"] = function(exports, __req) {
    // 加载界面（§3.2 A）：预加载资源 + 进度反馈，完成进入主菜单。
    var { Scaler } = __req("src/scaler.js");
    var { preloadAll, getMissingReport } = __req("src/assets.js");
    var { drawText, roundRect, drawFallbackBg } = __req("src/ui.js");
    
    const BootScene = {
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
    
    
    // ---- module.exports ----
    exports.BootScene = BootScene;
    
  };
  __factories["src/scenes/menu.js"] = function(exports, __req) {
    // 主菜单（§3.2 B）：标题 + 新游戏/继续游戏/设置 + 菜单 BGM。
    var { Scaler } = __req("src/scaler.js");
    var { Pointer } = __req("src/input.js");
    var { getImage } = __req("src/assets.js");
    var { playMusic, playSfx } = __req("src/audio.js");
    var { hasProgress, resetProgress } = __req("src/storage.js");
    var { drawButton, drawGearButton, pointInRect, pointInCircle, drawText, drawFallbackBg } = __req("src/ui.js");
    
    const MenuScene = {
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
    
    
    // ---- module.exports ----
    exports.MenuScene = MenuScene;
    
  };
  __factories["src/scenes/settings.js"] = function(exports, __req) {
    // 设置界面（§3.2 G）：音乐/音效音量滑块 + 重置进度（二次确认）。
    var { Scaler } = __req("src/scaler.js");
    var { Pointer } = __req("src/input.js");
    var { playMusic, playSfx, setMusicVol, setSfxVol, getMusicVol, getSfxVol } = __req("src/audio.js");
    var { resetProgress } = __req("src/storage.js");
    var { drawButton, pointInRect, drawText, roundRect, drawFallbackBg } = __req("src/ui.js");
    
    const SettingsScene = {
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
    
    
    // ---- module.exports ----
    exports.SettingsScene = SettingsScene;
    
  };
  __factories["src/scenes/levelselect.js"] = function(exports, __req) {
    // 选关界面（§3.2 C）：9 关网格 + 锁定/星数 + 解锁全部（debug）+ 返回。
    var GameConfig = __req("config/game-config.js").default;
    var { Scaler } = __req("src/scaler.js");
    var { Pointer } = __req("src/input.js");
    var { playMusic, playSfx } = __req("src/audio.js");
    var { isUnlocked, getLevelRecord, unlockAll } = __req("src/storage.js");
    var { drawButton, pointInRect, drawText, drawStarRow, roundRect, drawFallbackBg } = __req("src/ui.js");
    
    const LevelSelectScene = {
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
    
    
    // ---- module.exports ----
    exports.LevelSelectScene = LevelSelectScene;
    
  };
  __factories["src/board.js"] = function(exports, __req) {
    // ============================================================================
    //  棋盘几何 —— 依据 §4.1 / §6.3。
    //  根据 boardArea + 行列数计算每个洞口（cell）中心坐标与尺寸。
    //  洞口由程序绘制：背景仅作场景、不含洞口（§7.2 渲染层次）。
    // ============================================================================
    
    var GameConfig = __req("config/game-config.js").default;
    var { getImage, hasImage } = __req("src/assets.js");
    
    function computeCells(level) {
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
    function holeSize(cell) {
      return {
        w: cell.cellW * GameConfig.hole.widthRatio,
        h: cell.cellH * GameConfig.hole.heightRatio
      };
    }
    
    // 绘制单个洞口（hole.png；缺失 → 深色椭圆兜底，§5.4）
    function drawHole(ctx, cell) {
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
    function drawHoleFront(ctx, cell) {
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
    
    
    // ---- module.exports ----
    exports.computeCells = computeCells;
    exports.holeSize = holeSize;
    exports.drawHole = drawHole;
    exports.drawHoleFront = drawHoleFront;
    
  };
  __factories["src/animal.js"] = function(exports, __req) {
    // ============================================================================
    //  动物 —— 状态机 + 动画（§4.2 / §4.3 / §7.2）。
    //  状态：EMERGING → VISIBLE → RETREATING / HIT。
    //  渲染层次（§7.2）：调用者在背景+洞口之上、hole_front 之下绘制此层。
    // ============================================================================
    
    var GameConfig = __req("config/game-config.js").default;
    var { getImage, getHitImage } = __req("src/assets.js");
    var { holeSize } = __req("src/board.js");
    
    const AnimalState = {
      EMERGING: "emerging",
      VISIBLE: "visible",
      RETREATING: "retreating",
      HIT: "hit",
      DEAD: "dead"  // 已完成退场，等待回收
    };
    
    function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
    function easeInCubic(t) { return t * t * t; }
    
    function createAnimal(type, skinKey, cell, stayTime) {
      return {
        type,        // 'mole' | 'rat' | 'cat'
        skinKey,     // 图片 key，如 'mole_1'、'rat'、'cat'
        cell,        // computeCells 返回的 cell 对象
        stayTime,    // 停留时长（秒）
        state: AnimalState.EMERGING,
        timer: 0,    // 当前状态已过时间
        hitted: false,
        scored: false // 防止同一只动物重复计分
      };
    }
    
    // 当前状态总时长（秒）
    function stateDuration(animal) {
      const a = GameConfig.animation;
      switch (animal.state) {
        case AnimalState.EMERGING: return a.emergeTime;
        case AnimalState.VISIBLE: return animal.stayTime;
        case AnimalState.RETREATING: return a.retreatTime;
        case AnimalState.HIT: return a.hitTime;
        default: return 0;
      }
    }
    
    // 返回 true 表示仍活跃（DEAD 后调用者可回收）
    function updateAnimal(animal, dt) {
      if (animal.state === AnimalState.DEAD) return false;
      animal.timer += dt;
      const dur = stateDuration(animal);
      if (animal.timer >= dur) {
        animal.timer -= dur;
        switch (animal.state) {
          case AnimalState.EMERGING:
            animal.state = AnimalState.VISIBLE;
            animal.timer = 0;
            break;
          case AnimalState.VISIBLE:
            // 停留超时 → 自行缩回（不计分、不中断连击，§4.3）
            animal.state = AnimalState.RETREATING;
            animal.timer = 0;
            break;
          case AnimalState.RETREATING:
          case AnimalState.HIT:
            animal.state = AnimalState.DEAD;
            return false;
        }
      }
      return true;
    }
    
    // 命中：切换到 HIT 状态，标记已计分
    function hitAnimal(animal) {
      if (animal.state === AnimalState.DEAD
        || animal.state === AnimalState.RETREATING
        || animal.state === AnimalState.HIT) return false;
      animal.hitted = true;
      animal.state = AnimalState.HIT;
      animal.timer = 0;
      // 随机倒下方向/角度（左倒或右倒），只在命中瞬间决定一次，动画期间保持不变
      const cfg = GameConfig.effects.hit;
      animal.hitTiltDir = Math.random() < 0.5 ? -1 : 1;
      animal.hitTiltDeg = cfg.tiltMinDeg + Math.random() * (cfg.tiltMaxDeg - cfg.tiltMinDeg);
      return true;
    }
    
    // 判断当前是否可被命中（在场且尚未被打）
    function isHittable(animal) {
      return (
        !animal.scored
        && (animal.state === AnimalState.EMERGING
          || animal.state === AnimalState.VISIBLE)
      );
    }
    
    // 共享几何计算：drawAnimal（渲染）与 getAnimalBounds（命中检测）必须用同一套公式，
    // 否则会出现“画在哪但打不中”的错位 bug（已被用户实测发现并反馈）。
    function computeGeometry(animal) {
      const cell = animal.cell;
      const { w: hw, h: hh } = holeSize(cell);
      const animalW = hw * GameConfig.animal.widthToHoleRatio;
      // 按该 skin 实测的真实内容比例绘制（见 config.animal.aspectRatioBySkin），
      // 而不是全体动物共用一个写死比例——避免比例对不上原始素材导致的拉伸变形。
      const ratio = GameConfig.animal.aspectRatioBySkin[animal.skinKey]
        ?? GameConfig.animal.aspectRatioDefault;
      const animalH = animalW * ratio;
    
      const hx = cell.cx;
      const hy = cell.cy + cell.cellH * 0.18;
      // 下沉深度基于“动物自身高度”而非洞口高度，这样调整洞口/动物任一方的比例配置
      // 都不会牵连另一方的相对位置（此前用 hh 计算导致改洞口高度后动物位置错位）。
      const restOffset = animalH * GameConfig.animal.sinkRatio;
    
      let yOffset = restOffset;
      let scaleY = 1;
      let rotation = 0;   // 弧度，绕底部中心（脚底）旋转
      let alpha = 1;
      const dur = stateDuration(animal);
      const t = animal.timer / (dur || 1);
    
      switch (animal.state) {
        case AnimalState.EMERGING:
          yOffset = restOffset + (1 - easeOutCubic(t)) * animalH;
          scaleY = 1 + 0.18 * Math.sin(t * Math.PI);
          break;
        case AnimalState.VISIBLE:
          yOffset = restOffset;
          break;
        case AnimalState.RETREATING:
          yOffset = restOffset + easeInCubic(t) * animalH;
          break;
        case AnimalState.HIT: {
          const hitCfg = GameConfig.effects.hit;
          yOffset = restOffset + easeInCubic(t) * animalH * 0.7;
          scaleY = 1 - t * 0.3;
          // 被砸倒下：绕脚底往一侧旋转（方向/角度在 hitAnimal() 命中瞬间随机决定一次）
          const tiltDir = animal.hitTiltDir || 1;
          const tiltDeg = animal.hitTiltDeg || hitCfg.tiltMaxDeg;
          rotation = easeInCubic(t) * (tiltDeg * Math.PI / 180) * tiltDir;
          // 动画后半段淡出退场，避免“瞬间消失”的生硬切换
          if (t > hitCfg.fadeStartT) {
            alpha = 1 - (t - hitCfg.fadeStartT) / (1 - hitCfg.fadeStartT);
          }
          break;
        }
      }
    
      return {
        hx, hy, animalW, animalH, yOffset, scaleY, rotation, alpha,
        drawX: hx - animalW / 2,
        drawY: hy - animalH + yOffset
      };
    }
    
    // 当前命中判定包围盒（供 level.js 的 findHit 使用，与渲染完全一致）。
    // 略微收窄（92%）以贴近贴图内实际可见轮廓，避免透明留白区域也能点中。
    function getAnimalBounds(animal) {
      const g = computeGeometry(animal);
      const shrink = 0.92;
      const w = g.animalW * shrink, h = g.animalH * shrink;
      return {
        x: g.drawX + (g.animalW - w) / 2,
        y: g.drawY + (g.animalH - h) / 2,
        w, h
      };
    }
    
    // 绘制单只动物（调用者已设好逻辑坐标变换）
    function drawAnimal(ctx, animal) {
      if (animal.state === AnimalState.DEAD) return;
    
      const g = computeGeometry(animal);
      const { hx, hy, animalW, animalH, yOffset, scaleY, rotation, alpha, drawX, drawY } = g;
    
      // 选图：HIT 状态用被砸表情回退链（§5.4）
      const img = animal.state === AnimalState.HIT
        ? getHitImage(animal.skinKey)
        : getImage(animal.skinKey);
    
      if (!img) return;
    
      ctx.save();
      // 裁剪至洞口以下区域，实现"从洞后冒出"视觉（不依赖 hole_front）
      ctx.beginPath();
      ctx.rect(hx - animalW, hy - animalH * 2, animalW * 2, animalH * 3);
      ctx.clip();
    
      if (alpha !== 1) ctx.globalAlpha = alpha;
    
      // 挤压 + 倒下旋转变换（统一以动物底部/脚底为轴心）
      if (scaleY !== 1 || rotation !== 0) {
        const pivotX = hx, pivotY = hy + yOffset;
        ctx.translate(pivotX, pivotY);
        if (rotation !== 0) ctx.rotate(rotation);
        if (scaleY !== 1) ctx.scale(1, scaleY);
        ctx.translate(-pivotX, -pivotY);
      }
    
      ctx.drawImage(img, drawX, drawY, animalW, animalH);
      ctx.restore();
    }
    
    
    // ---- module.exports ----
    exports.AnimalState = AnimalState;
    exports.createAnimal = createAnimal;
    exports.updateAnimal = updateAnimal;
    exports.hitAnimal = hitAnimal;
    exports.isHittable = isHittable;
    exports.getAnimalBounds = getAnimalBounds;
    exports.drawAnimal = drawAnimal;
    
  };
  __factories["src/spawner.js"] = function(exports, __req) {
    // ============================================================================
    //  出怪调度器 —— 依据 §4.9。
    //  每隔 spawnInterval × (1 ± jitter) 秒尝试生成，
    //  在场 < maxConcurrent 且有空闲洞口时才生成。
    // ============================================================================
    
    var GameConfig = __req("config/game-config.js").default;
    var { createAnimal } = __req("src/animal.js");
    
    // 加权随机：{ mole:72, rat:16, cat:12 } → 随机选 key
    function weightedRandom(weights) {
      const keys = Object.keys(weights);
      const total = keys.reduce((s, k) => s + weights[k], 0);
      let r = Math.random() * total;
      for (const k of keys) {
        r -= weights[k];
        if (r <= 0) return k;
      }
      return keys[keys.length - 1];
    }
    
    function nextInterval(base, jitter) {
      return base * (1 + (Math.random() * 2 - 1) * jitter);
    }
    
    function createSpawner(level) {
      return {
        level,
        timer: 0,
        nextSpawn: nextInterval(level.spawnInterval, GameConfig.spawnJitter)
      };
    }
    
    // animals: 当前在场动物列表；cells: 所有 cell
    // 返回新生成的 animal（或 null）
    function tickSpawner(spawner, dt, animals, cells) {
      spawner.timer += dt;
      if (spawner.timer < spawner.nextSpawn) return null;
      spawner.timer = 0;
      spawner.nextSpawn = nextInterval(spawner.level.spawnInterval, GameConfig.spawnJitter);
    
      // 同屏上限检测（§4.9 / §6.3）
      const alive = animals.filter((a) => a.state !== "dead");
      if (alive.length >= spawner.level.maxConcurrent) return null;
    
      // 找空闲洞口
      const occupied = new Set(alive.map((a) => a.cell.index));
      const free = cells.filter((c) => !occupied.has(c.index));
      if (free.length === 0) return null;
    
      const cell = free[Math.floor(Math.random() * free.length)];
    
      // 类型加权（1–3 关权重已在配置中设为 mole:100）
      const type = weightedRandom(spawner.level.spawnWeights);
    
      // 皮肤（地鼠随机外观；老鼠/猫固定）
      let skinKey;
      if (type === "mole") {
        const n = Math.floor(Math.random() * GameConfig.assets.moleSkinCount) + 1;
        skinKey = `mole_${n}`;
      } else {
        skinKey = type; // 'rat' | 'cat'
      }
    
      return createAnimal(type, skinKey, cell, spawner.level.moleStayTime);
    }
    
    
    // ---- module.exports ----
    exports.createSpawner = createSpawner;
    exports.tickSpawner = tickSpawner;
    
  };
  __factories["src/scoring.js"] = function(exports, __req) {
    // ============================================================================
    //  计分核心（纯函数，便于单元测试）—— 依据 §4.6 / §4.7 / §4.8。
    //  本模块不依赖渲染/DOM，可被测试页或单测直接调用。
    //  M1 先落地纯逻辑；M2/M3 由关卡场景调用其结算多重命中。
    // ============================================================================
    
    var GameConfig = __req("config/game-config.js").default;
    
    // 连击位次 → 单只地鼠得分（取 minPos <= combo 的最大档）
    function comboPointsFor(combo, cfg = GameConfig) {
      let pts = cfg.scoring.moleBaseScore;
      for (const tier of cfg.scoring.comboTiers) {
        if (combo >= tier.minPos) pts = tier.pts;
      }
      return pts;
    }
    
    // 可变游戏状态容器
    function createScoreState() {
      return { score: 0, combo: 0, doubleUntil: -Infinity };
    }
    
    // 结算一次挥锤命中的动物集合（§4.7 固定顺序：地鼠→老鼠→猫）
    // contacted: [{type:'mole'|'rat'|'cat'}]；now: 当前时间(秒)
    function resolveSwing(state, contacted, now, cfg = GameConfig) {
      const floaters = [];
    
      if (!contacted || contacted.length === 0) {
        state.combo = 0; // 空砸：中断连击
        return { floaters, empty: true };
      }
    
      const moles = contacted.filter((a) => a.type === "mole");
      const rats = contacted.filter((a) => a.type === "rat");
      const cats = contacted.filter((a) => a.type === "cat");
    
      const doubleActive = now < state.doubleUntil;
    
      // 1) 地鼠
      for (const m of moles) {
        state.combo += 1;
        let pts = comboPointsFor(state.combo, cfg);
        if (doubleActive) pts *= cfg.buff.doubleBuffMultiplier;
        state.score += pts;
        floaters.push({ kind: "mole", text: "+" + pts, ref: m });
      }
    
      // 2) 老鼠：固定分、不改连击、激活/刷新双倍
      for (const r of rats) {
        state.score += cfg.scoring.ratScore;
        state.doubleUntil = now + cfg.buff.doubleBuffDuration;
        floaters.push({ kind: "rat", text: "×2!", ref: r });
      }
    
      // 3) 猫：扣分、下限、随后清零连击
      for (const c of cats) {
        state.score = Math.max(cfg.scoring.scoreFloor, state.score - cfg.scoring.catPenalty);
        floaters.push({ kind: "cat", text: "-" + cfg.scoring.catPenalty, ref: c });
      }
      if (cats.length > 0) state.combo = 0;
    
      return { floaters, empty: false };
    }
    
    function isDoubleActive(state, now) {
      return now < state.doubleUntil;
    }
    
    
    // ---- module.exports ----
    exports.comboPointsFor = comboPointsFor;
    exports.createScoreState = createScoreState;
    exports.resolveSwing = resolveSwing;
    exports.isDoubleActive = isDoubleActive;
    
  };
  __factories["src/floater.js"] = function(exports, __req) {
    // ============================================================================
    //  飘字（得/扣分，§7.2）：在命中处弹出数值并上浮淡出。
    // ============================================================================
    
    const FLOATER_LIFE = 0.8; // 秒
    
    function createFloater(x, y, text, color) {
      return { x, y, baseY: y, text, color: color || "#ffd23f", life: FLOATER_LIFE, t: 0 };
    }
    
    // color 枚举
    const FloaterColors = {
      mole: "#ffd23f",
      rat:  "#5fcfff",
      cat:  "#ff6b6b",
      bonus: "#ff9e2c"
    };
    
    function updateFloaters(floaters, dt) {
      for (let i = floaters.length - 1; i >= 0; i--) {
        const f = floaters[i];
        f.t += dt;
        if (f.t >= f.life) { floaters.splice(i, 1); continue; }
        const k = f.t / f.life;
        const eased = 1 - Math.pow(1 - k, 2); // 缓出：先快后慢上浮，更自然
        f.y = f.baseY - eased * 120;
      }
    }
    
    function drawFloaters(ctx, floaters) {
      for (const f of floaters) {
        const alpha = 1 - (f.t / f.life);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.font = `bold 64px "PingFang SC","Microsoft YaHei",sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.lineWidth = 6;
        ctx.strokeStyle = "rgba(0,0,0,0.5)";
        ctx.strokeText(f.text, f.x, f.y);
        ctx.fillStyle = f.color;
        ctx.fillText(f.text, f.x, f.y);
        ctx.restore();
      }
    }
    
    
    // ---- module.exports ----
    exports.createFloater = createFloater;
    exports.FloaterColors = FloaterColors;
    exports.updateFloaters = updateFloaters;
    exports.drawFloaters = drawFloaters;
    
  };
  __factories["src/particles.js"] = function(exports, __req) {
    // ============================================================================
    //  尘土粒子 —— 动物冒出/被砸时的打击反馈（§7.2 动画打磨，纯程序绘制，无需贴图）。
    // ============================================================================
    
    var GameConfig = __req("config/game-config.js").default;
    
    // 在 (cx, cy) 附近生成一簇向外飞散的尘土颗粒，spreadW 控制水平散布范围（通常传洞口宽度）
    function createDustBurst(cx, cy, spreadW) {
      const cfg = GameConfig.effects.dust;
      const particles = [];
      for (let i = 0; i < cfg.count; i++) {
        // 主要朝上方扇形散开（-150°~-30°，标准数学角度，向上为负 y），带一点水平散射
        const angle = (-150 + Math.random() * 120) * Math.PI / 180;
        const speed = 120 + Math.random() * 220;
        particles.push({
          x: cx + (Math.random() - 0.5) * spreadW * 0.6,
          y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: cfg.minSize + Math.random() * (cfg.maxSize - cfg.minSize),
          life: 0,
          maxLife: cfg.minLife + Math.random() * (cfg.maxLife - cfg.minLife),
          color: Math.random() < 0.5 ? "#8a5a2b" : "#6b4420"
        });
      }
      return particles;
    }
    
    function updateParticles(particles, dt) {
      const g = GameConfig.effects.dust.gravity;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life += dt;
        if (p.life >= p.maxLife) { particles.splice(i, 1); continue; }
        p.vy += g * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      }
    }
    
    function drawParticles(ctx, particles) {
      for (const p of particles) {
        const k = p.life / p.maxLife; // 0→1
        const alpha = 1 - k;
        const size = p.size * (1 - k * 0.4);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
    
    
    // ---- module.exports ----
    exports.createDustBurst = createDustBurst;
    exports.updateParticles = updateParticles;
    exports.drawParticles = drawParticles;
    
  };
  __factories["src/tutorial.js"] = function(exports, __req) {
    // ============================================================================
    //  新手教程 —— 常驻 HUD "?" 提示按钮，点开可翻页查看（3 页）。
    //  首次进入第 1 关自动弹一次（之后仅可手动查看，见 storage.js hasSeenTutorial）。
    //  老鼠/猫的首次出现关卡号从配置动态算出，配置里调整出怪权重后教程文案自动跟着变，
    //  不需要手动改文案里的数字。
    // ============================================================================
    
    // 找到某个动物类型（'rat' | 'cat'）权重首次 > 0 的最小关卡号
    function firstAppearLevel(GameConfig, type) {
      for (const lv of GameConfig.levels) {
        if ((lv.spawnWeights[type] || 0) > 0) return lv.id;
      }
      return null; // 理论上不会发生（rat/cat 总会在某关出现）
    }
    
    function buildTutorialPages(GameConfig) {
      const ratLevel = firstAppearLevel(GameConfig, "rat");
      const catLevel = firstAppearLevel(GameConfig, "cat");
    
      return [
        {
          title: "新手指南",
          color: "#e08a2c",
          lines: [
            "地鼠会从洞里冒出来，看准时机挥锤敲它们！",
            "连续敲中地鼠会积累“连击”——连击越高，单次得分越多。",
            "如果一锤子没敲中任何动物，连击会清零，小心别空砸哦！"
          ],
          images: ["mole_1", "mole_2", "mole_3"]
        },
        {
          title: "新伙伴——老鼠",
          color: "#2b6fc9",
          lines: [
            `老鼠从第 ${ratLevel} 关开始出现！`,
            "敲中老鼠会触发“双倍积分”，持续 5 秒！",
            "老鼠不会打断你的连击，放心大胆地敲！"
          ],
          images: ["rat"]
        },
        {
          title: "小心——猫",
          color: "#c93030",
          lines: [
            `猫从第 ${catLevel} 关开始出现！`,
            "敲中猫会扣分，还会清空你的连击，尽量避开它！",
            "猫不会主动伤害你，只有敲中它才会受罚——看清楚再下锤！"
          ],
          images: ["cat"]
        }
      ];
    }
    
    
    // ---- module.exports ----
    exports.buildTutorialPages = buildTutorialPages;
    
  };
  __factories["src/scenes/level.js"] = function(exports, __req) {
    // ============================================================================
    //  关卡进行中（§3.2 D/E）—— M2 版：出怪 + 命中判定 + 计分/连击 + 飘字 + HUD。
    //  §4.7 多重命中顺序：地鼠→老鼠→猫，由 src/scoring.js 保证。
    //  渲染层次（§7.2）：背景 → 洞口 → 动物 → （可选）hole_front → HUD → 光标。
    // ============================================================================
    
    var GameConfig = __req("config/game-config.js").default;
    var { Scaler } = __req("src/scaler.js");
    var { Pointer } = __req("src/input.js");
    var { getImage, getBackground, hasImage } = __req("src/assets.js");
    var { playGameplayMusic, playSfx, pauseMusic, resumeMusic } = __req("src/audio.js");
    var { computeCells, drawHole, drawHoleFront } = __req("src/board.js");
    var { starsForScore } = __req("config/game-config.js");
    var { createAnimal, updateAnimal, hitAnimal, isHittable, drawAnimal, getAnimalBounds, AnimalState } = __req("src/animal.js");
    var { createSpawner, tickSpawner } = __req("src/spawner.js");
    var { createScoreState, resolveSwing } = __req("src/scoring.js");
    var { createFloater, updateFloaters, drawFloaters, FloaterColors } = __req("src/floater.js");
    var { createDustBurst, updateParticles, drawParticles } = __req("src/particles.js");
    var { drawButton, pointInRect, drawText, roundRect, drawFallbackBg } = __req("src/ui.js");
    var { buildTutorialPages } = __req("src/tutorial.js");
    var { hasSeenTutorial, markTutorialSeen } = __req("src/storage.js");
    
    // 教程页内容只依赖静态配置，模块加载时算一次即可（老鼠/猫首次出现关卡号随配置自动更新）
    const TUTORIAL_PAGES = buildTutorialPages(GameConfig);
    // 教程浮层面板尺寸：enter()（算导航按钮位置）与 renderTutorial()（画面板）共用同一份数值，避免脱节
    const TUTORIAL_PANEL = { w: 1020, h: 660 };
    
    const LevelScene = {
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
    
    
    // ---- module.exports ----
    exports.LevelScene = LevelScene;
    
  };
  __factories["src/scenes/result.js"] = function(exports, __req) {
    // 结算浮层（§3.2 F）：本局得分/星数（带得星动画与音效）/是否过关 + 按钮。
    var GameConfig = __req("config/game-config.js").default;
    var { Scaler } = __req("src/scaler.js");
    var { Pointer } = __req("src/input.js");
    var { playSfx, playMusic } = __req("src/audio.js");
    var { recordLevelResult, isUnlocked } = __req("src/storage.js");
    var { drawButton, pointInRect, drawText, drawStarRow, roundRect, drawFallbackBg } = __req("src/ui.js");
    
    const ResultScene = {
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
    
    
    // ---- module.exports ----
    exports.ResultScene = ResultScene;
    
  };
  __factories["src/scenes/complete.js"] = function(exports, __req) {
    // 通关画面（§3.2 H，简单版）：祝贺 + 累计总星数（满分 27）+ 返回。
    var GameConfig = __req("config/game-config.js").default;
    var { Scaler } = __req("src/scaler.js");
    var { Pointer } = __req("src/input.js");
    var { playMusic, playSfx } = __req("src/audio.js");
    var { totalStars } = __req("src/storage.js");
    var { drawButton, pointInRect, drawText, drawStarRow, drawFallbackBg } = __req("src/ui.js");
    
    const CompleteScene = {
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
    
    
    // ---- module.exports ----
    exports.CompleteScene = CompleteScene;
    
  };
  __factories["src/main.js"] = function(exports, __req) {
    // 入口：注册场景、启动引擎。
    var { Game } = __req("src/game.js");
    var { BootScene } = __req("src/scenes/boot.js");
    var { MenuScene } = __req("src/scenes/menu.js");
    var { SettingsScene } = __req("src/scenes/settings.js");
    var { LevelSelectScene } = __req("src/scenes/levelselect.js");
    var { LevelScene } = __req("src/scenes/level.js");
    var { ResultScene } = __req("src/scenes/result.js");
    var { CompleteScene } = __req("src/scenes/complete.js");
    
    const canvas = document.getElementById("game");
    
    Game.register("boot", BootScene);
    Game.register("menu", MenuScene);
    Game.register("settings", SettingsScene);
    Game.register("levelselect", LevelSelectScene);
    Game.register("level", LevelScene);
    Game.register("result", ResultScene);
    Game.register("complete", CompleteScene);
    
    Game.start(canvas);
    Game.changeScene("boot");
    
    
    // ---- module.exports ----
    
  };

  function __req(key) {
    if (__cache[key]) return __cache[key];
    var exports = {};
    __cache[key] = exports;
    if (!__factories[key]) throw new Error("模块未找到: " + key);
    __factories[key](exports, __req);
    return exports;
  }
  __req("src/main.js");
})();
