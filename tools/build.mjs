// ============================================================================
//  打包脚本：把 ES Module 源码（src/**、config/**）转换为单个非模块化 bundle，
//  以便浏览器通过 file:// 双击直接打开（避免 ES Module 在 file:// 下的 CORS 限制）。
//
//  原理：实现一个最小化的 CommonJS 风格运行时（__req/缓存），
//        逐行正则转换 import/export 语句为普通变量声明 + exports 赋值，
//        不引入任何第三方依赖、不改变业务逻辑。
//
//  用法：node tools/build.mjs
//  产物：dist/bundle.js（被 index.offline.html 以普通 <script> 引入）
//
//  ⚠ 维护方式：以后修改游戏逻辑请编辑 src/**、config/** 源文件，
//     然后重新运行本脚本生成新的 dist/bundle.js（index.html 走开发服务器模式，
//     不受影响；index.offline.html 走打包模式，必须重新打包才能看到改动）。
// ============================================================================

import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const ENTRY = "src/main.js";

const moduleBodies = {}; // resolvedPath -> transformed body string
const visiting = new Set();

function resolveImportPath(fromFile, importPath) {
  const dir = path.posix.dirname(fromFile);
  return path.posix.normalize(path.posix.join(dir, importPath));
}

function processFile(relPath) {
  if (relPath in moduleBodies || visiting.has(relPath)) return;
  visiting.add(relPath);

  const absPath = path.join(ROOT, relPath);
  const src = fs.readFileSync(absPath, "utf8");
  const lines = src.split(/\r?\n/);
  const outLines = [];
  const exportedNames = new Set();
  let defaultExportName = null;
  const deps = [];

  for (const line of lines) {
    let m;

    // import Default from "path";
    if ((m = line.match(/^import\s+(\w+)\s+from\s+"([^"]+)";?\s*$/))) {
      const resolved = resolveImportPath(relPath, m[2]);
      deps.push(resolved);
      outLines.push(`var ${m[1]} = __req(${JSON.stringify(resolved)}).default;`);
      continue;
    }

    // import { A, B } from "path";
    if ((m = line.match(/^import\s*\{\s*([^}]+?)\s*\}\s*from\s+"([^"]+)";?\s*$/))) {
      const resolved = resolveImportPath(relPath, m[2]);
      deps.push(resolved);
      outLines.push(`var { ${m[1]} } = __req(${JSON.stringify(resolved)});`);
      continue;
    }

    // export default Name;
    if ((m = line.match(/^export\s+default\s+(\w+);\s*$/))) {
      defaultExportName = m[1];
      continue;
    }

    // export { A, B };
    if ((m = line.match(/^export\s*\{\s*([^}]+?)\s*\};\s*$/))) {
      for (const n of m[1].split(",").map((s) => s.trim()).filter(Boolean)) exportedNames.add(n);
      continue;
    }

    // export (async)? function Name(
    if ((m = line.match(/^export\s+(async\s+function|function)\s+(\w+)/))) {
      exportedNames.add(m[2]);
      outLines.push(line.replace(/^export\s+/, ""));
      continue;
    }

    // export const/let/var Name
    if ((m = line.match(/^export\s+(const|let|var)\s+(\w+)/))) {
      exportedNames.add(m[2]);
      outLines.push(line.replace(/^export\s+/, ""));
      continue;
    }

    outLines.push(line);
  }

  for (const d of deps) processFile(d);

  let body = outLines.join("\n");
  body += "\n\n// ---- module.exports ----\n";
  for (const name of exportedNames) body += `exports.${name} = ${name};\n`;
  if (defaultExportName) body += `exports.default = ${defaultExportName};\n`;

  visiting.delete(relPath);
  moduleBodies[relPath] = body;
}

processFile(ENTRY);

const keys = Object.keys(moduleBodies);
let out = "(function(){\n  \"use strict\";\n  var __cache = {};\n  var __factories = {};\n";
for (const key of keys) {
  out += `  __factories[${JSON.stringify(key)}] = function(exports, __req) {\n`;
  out += moduleBodies[key].split("\n").map((l) => "    " + l).join("\n");
  out += "\n  };\n";
}
out += `
  function __req(key) {
    if (__cache[key]) return __cache[key];
    var exports = {};
    __cache[key] = exports;
    if (!__factories[key]) throw new Error("模块未找到: " + key);
    __factories[key](exports, __req);
    return exports;
  }
  __req(${JSON.stringify(ENTRY)});
})();
`;

const distDir = path.join(ROOT, "dist");
fs.mkdirSync(distDir, { recursive: true });
fs.writeFileSync(path.join(distDir, "bundle.js"), out, "utf8");
console.log(`打包完成：dist/bundle.js（共 ${keys.length} 个模块）`);
for (const k of keys) console.log("  -", k);
