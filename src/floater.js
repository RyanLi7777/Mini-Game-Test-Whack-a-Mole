// ============================================================================
//  飘字（得/扣分，§7.2）：在命中处弹出数值并上浮淡出。
// ============================================================================

const FLOATER_LIFE = 0.8; // 秒

export function createFloater(x, y, text, color) {
  return { x, y, baseY: y, text, color: color || "#ffd23f", life: FLOATER_LIFE, t: 0 };
}

// color 枚举
export const FloaterColors = {
  mole: "#ffd23f",
  rat:  "#5fcfff",
  cat:  "#ff6b6b",
  bonus: "#ff9e2c"
};

export function updateFloaters(floaters, dt) {
  for (let i = floaters.length - 1; i >= 0; i--) {
    const f = floaters[i];
    f.t += dt;
    if (f.t >= f.life) { floaters.splice(i, 1); continue; }
    const k = f.t / f.life;
    const eased = 1 - Math.pow(1 - k, 2); // 缓出：先快后慢上浮，更自然
    f.y = f.baseY - eased * 120;
  }
}

export function drawFloaters(ctx, floaters) {
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
