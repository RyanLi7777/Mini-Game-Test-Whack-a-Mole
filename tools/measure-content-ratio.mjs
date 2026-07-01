// ============================================================================
//  一次性/可重复运行工具：测量透明 PNG 素材"内容本身"(排除透明留白)的真实宽高比。
//  用途：动物贴图周围留白不一致，若统一按整图比例或写死一个比例绘制会导致变形走样，
//  应按各素材各自的真实内容比例绘制（见 config.animal.aspectRatioBySkin）。
//
//  用法：node tools/measure-content-ratio.mjs images/animals/mole_1.png [更多文件...]
//  不传参数时默认测量 config 里 assets.moleSkinCount 张地鼠 + rat + cat。
//  输出：每个文件的内容宽高比（w/h），可直接抄进 config.animal.aspectRatioBySkin。
// ============================================================================

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");

function readChunks(buf) {
  const chunks = [];
  let off = 8;
  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString("ascii", off + 4, off + 8);
    const data = buf.subarray(off + 8, off + 8 + len);
    chunks.push({ type, data });
    off += 8 + len + 4;
  }
  return chunks;
}
function paeth(a, b, c) {
  const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}
function unfilter(raw, width, height, bpp) {
  const stride = width * bpp;
  const out = Buffer.alloc(stride * height);
  let srcOff = 0;
  for (let y = 0; y < height; y++) {
    const ft = raw[srcOff]; srcOff++;
    const rowOut = out.subarray(y * stride, (y + 1) * stride);
    const rowIn = raw.subarray(srcOff, srcOff + stride);
    const prevOut = y > 0 ? out.subarray((y - 1) * stride, y * stride) : null;
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? rowOut[x - bpp] : 0;
      const b = prevOut ? prevOut[x] : 0;
      const c = (prevOut && x >= bpp) ? prevOut[x - bpp] : 0;
      let v = rowIn[x];
      if (ft === 1) v = (v + a) & 0xff;
      else if (ft === 2) v = (v + b) & 0xff;
      else if (ft === 3) v = (v + Math.floor((a + b) / 2)) & 0xff;
      else if (ft === 4) v = (v + paeth(a, b, c)) & 0xff;
      rowOut[x] = v;
    }
    srcOff += stride;
  }
  return out;
}
function decodePng(buf) {
  const chunks = readChunks(buf);
  const ihdr = chunks.find((c) => c.type === "IHDR").data;
  const width = ihdr.readUInt32BE(0), height = ihdr.readUInt32BE(4);
  const colorType = ihdr.readUInt8(9);
  const bpp = colorType === 6 ? 4 : 3;
  const idat = Buffer.concat(chunks.filter((c) => c.type === "IDAT").map((c) => c.data));
  const raw = zlib.inflateSync(idat);
  const pixels = unfilter(raw, width, height, bpp);
  return { width, height, pixels, bpp };
}

function contentBBoxRatio(filePath) {
  const buf = fs.readFileSync(filePath);
  const { width, height, pixels, bpp } = decodePng(buf);
  if (bpp !== 4) return null; // 无 Alpha 通道，无法测内容边界
  let minX = width, maxX = 0, minY = height, maxY = 0, found = false;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const a = pixels[(y * width + x) * 4 + 3];
      if (a > 128) {
        found = true;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (!found) return null;
  const cw = maxX - minX, ch = maxY - minY;
  return { w: cw, h: ch, ratio: cw / ch };
}

const args = process.argv.slice(2);
const files = args.length > 0
  ? args
  : ["images/animals/mole_1.png", "images/animals/mole_2.png", "images/animals/mole_3.png",
     "images/animals/rat.png", "images/animals/cat.png"];

console.log("素材文件 → 内容包围盒尺寸 / 真实宽高比（w/h）\n");
for (const rel of files) {
  const full = path.join(ROOT, rel);
  if (!fs.existsSync(full)) { console.log(rel, "→ 跳过（文件不存在）"); continue; }
  const r = contentBBoxRatio(full);
  if (!r) { console.log(rel, "→ 跳过（无 Alpha 通道或全透明）"); continue; }
  console.log(`${rel} → ${r.w}x${r.h}  ratio=${r.ratio.toFixed(3)}`);
}
