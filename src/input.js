// ============================================================================
//  输入 —— 鼠标 + 触摸（§2.4）。统一转换为逻辑坐标，分发给当前场景。
//  - 移动：更新光标逻辑坐标（PC 锤子/手指跟随）。
//  - 点击/点按：分发 onPointerDown(x, y)。
// ============================================================================

import { Scaler } from "./scaler.js";

export const Pointer = { x: 0, y: 0, inside: false, isTouch: false };

export function initInput(canvas, getScene, onAnyGesture) {
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
