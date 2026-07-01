// 一次性工具：把动物贴图缩小并输出 base64（仅用于生成预览缩略图，不影响正式素材）
import fs from "node:fs";
import zlib from "node:zlib";

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
  const idat = Buffer.concat(chunks.filter((c) => c.type === "IDAT").map((c) => c.data));
  const raw = zlib.inflateSync(idat);
  const pixels = unfilter(raw, width, height, 4);
  return { width, height, pixels };
}
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1); t[n] = c >>> 0; }
  return t;
})();
function crc32(buf) { let c = 0xffffffff; for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
function makeChunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4); crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}
function encodePngRGBA(width, height, rgba) {
  const stride = width * 4;
  const withFilter = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) { withFilter[y * (stride + 1)] = 0; rgba.copy(withFilter, y * (stride + 1) + 1, y * stride, (y + 1) * stride); }
  const idatData = zlib.deflateSync(withFilter, { level: 9 });
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); ihdr.writeUInt8(6, 9); ihdr.writeUInt8(0, 10); ihdr.writeUInt8(0, 11); ihdr.writeUInt8(0, 12);
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return Buffer.concat([sig, makeChunk("IHDR", ihdr), makeChunk("IDAT", idatData), makeChunk("IEND", Buffer.alloc(0))]);
}

function downsample(width, height, pixels, targetW) {
  const targetH = Math.round(height * (targetW / width));
  const out = Buffer.alloc(targetW * targetH * 4);
  const sx = width / targetW, sy = height / targetH;
  for (let ty = 0; ty < targetH; ty++) {
    for (let tx = 0; tx < targetW; tx++) {
      const x0 = Math.floor(tx * sx), x1 = Math.min(width, Math.floor((tx + 1) * sx));
      const y0 = Math.floor(ty * sy), y1 = Math.min(height, Math.floor((ty + 1) * sy));
      let r = 0, g = 0, b = 0, a = 0, n = 0;
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const o = (y * width + x) * 4;
          const alpha = pixels[o + 3];
          r += pixels[o] * alpha; g += pixels[o + 1] * alpha; b += pixels[o + 2] * alpha; a += alpha;
          n++;
        }
      }
      const o2 = (ty * targetW + tx) * 4;
      if (a > 0) { out[o2] = Math.round(r / a); out[o2 + 1] = Math.round(g / a); out[o2 + 2] = Math.round(b / a); }
      out[o2 + 3] = n > 0 ? Math.round(a / n) : 0;
    }
  }
  return { width: targetW, height: targetH, pixels: out };
}

const files = process.argv.slice(2);
for (const f of files) {
  const buf = fs.readFileSync(f);
  const { width, height, pixels } = decodePng(buf);
  const small = downsample(width, height, pixels, 140);
  const png = encodePngRGBA(small.width, small.height, small.pixels);
  const b64 = png.toString("base64");
  console.log(f, "→", small.width + "x" + small.height, (b64.length / 1024).toFixed(1) + "KB(base64)");
  fs.writeFileSync(f + ".thumb.b64.txt", b64);
}
