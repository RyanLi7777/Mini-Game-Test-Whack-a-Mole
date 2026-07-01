// ============================================================================
//  一次性工具：把不带 Alpha 通道的素材 PNG（colorType=2 RGB）转换为透明背景
//  （colorType=6 RGBA）。纯 Node、零第三方依赖（自实现 PNG 解码/编码 + CRC32）。
//
//  原理：采样四角颜色作为“背景色”，按颜色距离做 chroma-key 抠图，
//        边缘做羽化（距离落在阈值区间内时给渐变 alpha，减少锯齿）。
//
//  用法：node tools/make-transparent.mjs
//  原始文件会先备份到 images_backup/ 下（保持相对路径），再原地覆盖。
//  仅处理 colorType=2（RGB，无 Alpha）的 8bit、非隔行 PNG；其余文件跳过。
// ============================================================================

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const TARGETS = [
  "images/animals/mole_1.png", "images/animals/mole_1_hit.png",
  "images/animals/mole_2.png", "images/animals/mole_2_hit.png",
  "images/animals/mole_3.png", "images/animals/mole_3_hit.png",
  "images/animals/rat.png", "images/animals/rat_hit.png",
  "images/animals/cat.png", "images/animals/cat_hit.png",
  "images/hammer/hammer.png", "images/hammer/hammer_down.png",
  "images/hammer/cursor_finger.png",
  "images/board/hole.png"
];

// ---------------- CRC32 ----------------
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// ---------------- PNG chunk helpers ----------------
function readChunks(buf) {
  const chunks = [];
  let off = 8; // skip signature
  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString("ascii", off + 4, off + 8);
    const data = buf.subarray(off + 8, off + 8 + len);
    chunks.push({ type, data });
    off += 8 + len + 4; // length + type + data + crc
  }
  return chunks;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

// ---------------- PNG unfilter (colorType=2/6, bitDepth=8) ----------------
function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

function unfilter(raw, width, height, bpp) {
  const stride = width * bpp;
  const out = Buffer.alloc(stride * height);
  let srcOff = 0;
  for (let y = 0; y < height; y++) {
    const filterType = raw[srcOff]; srcOff++;
    const rowOut = out.subarray(y * stride, (y + 1) * stride);
    const rowIn = raw.subarray(srcOff, srcOff + stride);
    const prevOut = y > 0 ? out.subarray((y - 1) * stride, y * stride) : null;
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? rowOut[x - bpp] : 0;
      const b = prevOut ? prevOut[x] : 0;
      const c = (prevOut && x >= bpp) ? prevOut[x - bpp] : 0;
      let v = rowIn[x];
      switch (filterType) {
        case 0: break;
        case 1: v = (v + a) & 0xff; break;
        case 2: v = (v + b) & 0xff; break;
        case 3: v = (v + Math.floor((a + b) / 2)) & 0xff; break;
        case 4: v = (v + paeth(a, b, c)) & 0xff; break;
        default: throw new Error("不支持的 filter type: " + filterType);
      }
      rowOut[x] = v;
    }
    srcOff += stride;
  }
  return out;
}

function decodePng(buf) {
  const chunks = readChunks(buf);
  const ihdr = chunks.find((c) => c.type === "IHDR").data;
  const width = ihdr.readUInt32BE(0);
  const height = ihdr.readUInt32BE(4);
  const bitDepth = ihdr.readUInt8(8);
  const colorType = ihdr.readUInt8(9);
  const interlace = ihdr.readUInt8(12);

  const idat = Buffer.concat(chunks.filter((c) => c.type === "IDAT").map((c) => c.data));
  const raw = zlib.inflateSync(idat);

  if (interlace !== 0) throw new Error("不支持隔行 PNG");
  if (bitDepth !== 8) throw new Error("仅支持 8bit");

  let bpp, hasAlpha;
  if (colorType === 2) { bpp = 3; hasAlpha = false; }
  else if (colorType === 6) { bpp = 4; hasAlpha = true; }
  else throw new Error("不支持的 colorType: " + colorType);

  const pixels = unfilter(raw, width, height, bpp);
  return { width, height, bpp, hasAlpha, pixels };
}

function encodePngRGBA(width, height, rgba) {
  // 添加每行 filter byte = 0（None），简单可靠
  const stride = width * 4;
  const withFilter = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    withFilter[y * (stride + 1)] = 0;
    rgba.copy(withFilter, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const idatData = zlib.deflateSync(withFilter, { level: 9 });

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8);   // bit depth
  ihdr.writeUInt8(6, 9);   // color type RGBA
  ihdr.writeUInt8(0, 10);  // compression
  ihdr.writeUInt8(0, 11);  // filter
  ihdr.writeUInt8(0, 12);  // interlace

  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return Buffer.concat([
    sig,
    makeChunk("IHDR", ihdr),
    makeChunk("IDAT", idatData),
    makeChunk("IEND", Buffer.alloc(0))
  ]);
}

// ---------------- Chroma key ----------------
function colorDist(r1, g1, b1, r2, g2, b2) {
  const dr = r1 - r2, dg = g1 - g2, db = b1 - b2;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

// 从图片四条边开始洪水填充（BFS），只有与边框连通、且颜色与背景色接近的像素才判定为
// 背景。牙齿、眼白这类被深色轮廓包围、与边框不连通的近白色区域不会被误判成背景——
// 这是与之前纯颜色距离判定（TOL_FULL 全局阈值）的关键区别，后者会把画面内部任何接近
// 背景色的像素（不管在哪、连不连通）都当成背景抠空，导致牙齿/眼白被镂空。
function floodFillBackgroundMask(width, height, bpp, pixels, bg, tolFlood) {
  const [br, bgc, bb] = bg;
  const mask = new Uint8Array(width * height); // 1 = 判定为背景（与边框连通）
  const queue = new Int32Array(width * height);
  let qHead = 0, qTail = 0;

  function tryAdd(idx) {
    if (mask[idx]) return;
    const off = idx * bpp;
    const d = colorDist(pixels[off], pixels[off + 1], pixels[off + 2], br, bgc, bb);
    if (d > tolFlood) return;
    mask[idx] = 1;
    queue[qTail++] = idx;
  }

  for (let x = 0; x < width; x++) { tryAdd(x); tryAdd((height - 1) * width + x); }
  for (let y = 0; y < height; y++) { tryAdd(y * width); tryAdd(y * width + (width - 1)); }

  while (qHead < qTail) {
    const idx = queue[qHead++];
    const x = idx % width, y = (idx / width) | 0;
    if (x > 0) tryAdd(idx - 1);
    if (x < width - 1) tryAdd(idx + 1);
    if (y > 0) tryAdd(idx - width);
    if (y < height - 1) tryAdd(idx + width);
  }
  return mask;
}

function chromaKeyToRGBA(width, height, bpp, pixels) {
  // 采样四角 + 边缘中点，取众数附近颜色作为背景色（更稳健）
  const sample = (x, y) => {
    const off = (y * width + x) * bpp;
    return [pixels[off], pixels[off + 1], pixels[off + 2]];
  };
  const corners = [
    sample(0, 0), sample(width - 1, 0), sample(0, height - 1), sample(width - 1, height - 1),
    sample(Math.floor(width / 2), 0), sample(0, Math.floor(height / 2))
  ];
  let br = 0, bg = 0, bb = 0;
  for (const c of corners) { br += c[0]; bg += c[1]; bb += c[2]; }
  br = Math.round(br / corners.length);
  bg = Math.round(bg / corners.length);
  bb = Math.round(bb / corners.length);

  const TOL_FLOOD = 40;         // 洪水填充连通阈值：与背景色距离小于此值才继续蔓延
  const TOL_EDGE_FEATHER = 60;  // 边界羽化范围：越接近此距离越不透明

  const mask = floodFillBackgroundMask(width, height, bpp, pixels, [br, bg, bb], TOL_FLOOD);
  const out = Buffer.alloc(width * height * 4);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const off = idx * bpp;
      const o2 = idx * 4;
      const r = pixels[off], g = pixels[off + 1], b = pixels[off + 2];

      if (mask[idx]) {
        // 背景连通区域：检查是否紧邻非背景像素（真正的轮廓边界），只在边界处做羽化，
        // 内部纯背景像素直接完全透明（颜色清零，避免渗色）。
        const isBoundary =
          (x > 0 && !mask[idx - 1]) || (x < width - 1 && !mask[idx + 1]) ||
          (y > 0 && !mask[idx - width]) || (y < height - 1 && !mask[idx + width]);

        if (!isBoundary) {
          out[o2] = 0; out[o2 + 1] = 0; out[o2 + 2] = 0; out[o2 + 3] = 0;
          continue;
        }

        const d = colorDist(r, g, b, br, bg, bb);
        const alpha = clamp255((d / TOL_EDGE_FEATHER) * 255);
        if (alpha === 0) {
          out[o2] = 0; out[o2 + 1] = 0; out[o2 + 2] = 0; out[o2 + 3] = 0;
          continue;
        }
        // 半透明羽化边缘：颜色去污染（decontamination），去掉残留的背景色成分
        const a = alpha / 255;
        let fr = clamp255((r - (1 - a) * br) / a);
        let fg = clamp255((g - (1 - a) * bg) / a);
        let fb = clamp255((b - (1 - a) * bb) / a);
        if (isNearWhite(fr, fg, fb)) { fr = 255; fg = 255; fb = 255; }
        out[o2] = fr; out[o2 + 1] = fg; out[o2 + 2] = fb; out[o2 + 3] = alpha;
      } else {
        // 非背景（含牙齿、眼白等内部近白区域）：完全保留，不透明
        let fr = r, fg = g, fb = b;
        // 近白色吸附为纯白（#ffffff）：牙齿/高光等区域在原图里往往偏灰白/偏暖白，
        // 用户希望游戏内所有动物的牙齿是纯白。用“高亮度+低饱和度”识别近白像素并吸附，
        // 其余有明显色偏的皮毛/五官不受影响。
        if (isNearWhite(fr, fg, fb)) { fr = 255; fg = 255; fb = 255; }
        out[o2] = fr; out[o2 + 1] = fg; out[o2 + 2] = fb; out[o2 + 3] = 255;
      }
    }
  }
  return { rgba: out, bg: [br, bg, bb] };
}

function clamp255(v) { return Math.max(0, Math.min(255, Math.round(v))); }

function isNearWhite(r, g, b) {
  const min = Math.min(r, g, b), max = Math.max(r, g, b);
  return min > 215 && (max - min) < 20; // 高亮度 + 低饱和度（灰阶偏白）
}

// ---------------- main ----------------
// 优先读取 images_backup/ 下的原始（未抠图）文件作为处理源——
// 若已运行过一次本脚本，images/ 下的文件已经是 RGBA，直接读它会被“已带 Alpha”规则跳过，
// 导致改进算法后无法重新处理。备份目录里的原图不受影响，可反复重跑本脚本迭代效果。
let done = 0, skipped = 0;
for (const rel of TARGETS) {
  const filePath = path.join(ROOT, rel);
  const backupPath = path.join(ROOT, "images_backup", path.relative(path.join(ROOT, "images"), filePath));
  const sourcePath = fs.existsSync(backupPath) ? backupPath : filePath;

  if (!fs.existsSync(sourcePath)) { console.log("跳过（不存在）:", rel); skipped++; continue; }

  const buf = fs.readFileSync(sourcePath);
  let info;
  try { info = decodePng(buf); } catch (e) { console.log("跳过（解码失败 " + e.message + "）:", rel); skipped++; continue; }

  if (info.hasAlpha) { console.log("跳过（已带 Alpha，非未处理原图）:", rel); skipped++; continue; }

  const { rgba, bg } = chromaKeyToRGBA(info.width, info.height, info.bpp, info.pixels);
  const newPng = encodePngRGBA(info.width, info.height, rgba);

  // 备份原图（若尚未备份过）
  fs.mkdirSync(path.dirname(backupPath), { recursive: true });
  if (!fs.existsSync(backupPath)) fs.copyFileSync(filePath, backupPath);

  fs.writeFileSync(filePath, newPng);
  console.log(`处理完成: ${rel}  (源=${sourcePath === backupPath ? "备份原图" : "当前文件"}，检测背景色 rgb(${bg.join(",")})，尺寸 ${info.width}x${info.height})`);
  done++;
}

console.log(`\n完成 ${done} 张，跳过 ${skipped} 张。原图备份于 images_backup/（可重复运行本脚本迭代效果）。`);
