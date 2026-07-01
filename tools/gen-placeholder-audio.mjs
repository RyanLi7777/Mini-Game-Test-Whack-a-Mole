// ============================================================================
//  占位音频生成脚本（一次性工具，不在运行时执行）。
//  纯 Node、零依赖：生成最小合法 WAV（PCM16 单声道），风格统一的短提示音。
//  用途：在用户提供正式 .mp3 前，给 §5.4 静音降级一个可听的占位反馈。
//  正式 mp3 放入 audio/ 同名目录后，加载器优先使用 mp3，本文件生成的 .wav 自动失效。
// ============================================================================

import fs from "node:fs";
import path from "node:path";

const SR = 22050; // 采样率（占位音无需高保真）

function tone(freqStart, freqEnd, durationSec, vol = 0.35, shape = "sine") {
  const n = Math.floor(SR * durationSec);
  const samples = new Int16Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const k = i / n; // 0..1
    const freq = freqStart + (freqEnd - freqStart) * k;
    const env = Math.sin(Math.PI * k); // 简单包络，避免咔哒声
    let v;
    if (shape === "square") {
      v = Math.sign(Math.sin(2 * Math.PI * freq * t));
    } else {
      v = Math.sin(2 * Math.PI * freq * t);
    }
    samples[i] = Math.round(v * env * vol * 32767);
  }
  return samples;
}

function concat(...chunks) {
  const total = chunks.reduce((s, c) => s + c.length, 0);
  const out = new Int16Array(total);
  let off = 0;
  for (const c of chunks) { out.set(c, off); off += c.length; }
  return out;
}

function writeWav(filePath, samples) {
  const byteRate = SR * 2;
  const dataSize = samples.length * 2;
  const buf = Buffer.alloc(44 + dataSize);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + dataSize, 4);
  buf.write("WAVE", 8);
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);   // PCM
  buf.writeUInt16LE(1, 22);   // mono
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(byteRate, 28);
  buf.writeUInt16LE(2, 32);   // block align
  buf.writeUInt16LE(16, 34);  // bits per sample
  buf.write("data", 36);
  buf.writeUInt32LE(dataSize, 40);
  for (let i = 0; i < samples.length; i++) {
    buf.writeInt16LE(samples[i], 44 + i * 2);
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, buf);
  console.log("生成:", filePath);
}

const OUT = path.resolve("audio");

// ---- 音效（各一条，§7.3）----
writeWav(path.join(OUT, "sfx/hammer_swing.wav"), tone(180, 90, 0.08, 0.3));
writeWav(path.join(OUT, "sfx/hit_mole.wav"), tone(420, 620, 0.10, 0.35));
writeWav(path.join(OUT, "sfx/hit_rat.wav"), tone(700, 1100, 0.10, 0.3));
writeWav(path.join(OUT, "sfx/hit_cat.wav"), tone(220, 120, 0.18, 0.32, "square"));
writeWav(path.join(OUT, "sfx/star.wav"), concat(
  tone(660, 660, 0.08, 0.3), tone(880, 880, 0.08, 0.3), tone(1320, 1320, 0.14, 0.32)
));
writeWav(path.join(OUT, "sfx/fail.wav"), tone(440, 180, 0.35, 0.3));
writeWav(path.join(OUT, "sfx/button.wav"), tone(900, 900, 0.05, 0.25));

// ---- 背景音乐（占位：极短柔和循环音，§5.4 允许"极短提示音或留空"）----
writeWav(path.join(OUT, "music/menu.wav"), concat(
  tone(523, 523, 0.4, 0.12), tone(659, 659, 0.4, 0.12), tone(784, 784, 0.5, 0.12)
));
writeWav(path.join(OUT, "music/gameplay.wav"), concat(
  tone(392, 392, 0.35, 0.1), tone(440, 440, 0.35, 0.1), tone(523, 523, 0.45, 0.1)
));

console.log("\n占位音频生成完成。放入对应同名 .mp3 正式文件后将自动优先使用，无需删除 .wav。");
