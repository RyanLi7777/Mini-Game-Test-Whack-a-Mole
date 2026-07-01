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

export function buildTutorialPages(GameConfig) {
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
