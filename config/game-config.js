// ============================================================================
//  欢乐打地鼠 —— 全局配置（唯一数值源）
//  依据《欢乐打地鼠-需求文档.md》§6 编写。
//  策划/玩家只需修改本文件即可调整难度与手感，无需改动代码。
//  ⚠ 标注“初始估值”的数字均为待 playtest 校准的占位值。
// ============================================================================

export const GameConfig = {
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
export function starThresholds(level) {
  const t = GameConfig.stars.thresholds;
  return {
    one: Math.ceil(level.targetScore * t.one),
    two: Math.ceil(level.targetScore * t.two),
    three: Math.ceil(level.targetScore * t.three)
  };
}

// 派生：根据得分判定星数（0–3）
export function starsForScore(level, score) {
  const th = starThresholds(level);
  if (score >= th.three) return 3;
  if (score >= th.two) return 2;
  if (score >= th.one) return 1;
  return 0;
}

export default GameConfig;
