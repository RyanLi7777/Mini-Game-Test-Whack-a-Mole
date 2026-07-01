// ============================================================================
//  尘土粒子 —— 动物冒出/被砸时的打击反馈（§7.2 动画打磨，纯程序绘制，无需贴图）。
// ============================================================================

import GameConfig from "../config/game-config.js";

// 在 (cx, cy) 附近生成一簇向外飞散的尘土颗粒，spreadW 控制水平散布范围（通常传洞口宽度）
export function createDustBurst(cx, cy, spreadW) {
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

export function updateParticles(particles, dt) {
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

export function drawParticles(ctx, particles) {
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
