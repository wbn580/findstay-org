// D1 运行时渲染站（R254，Cloudflare Pages Functions Advanced Mode）构建收尾。
//
// 由 d1_runtime_scaffold.py 从模板生成；模板正本：
// cowork-cloud-tools/scripts/templates/d1-runtime-pages/postbuild-d1-runtime-pages.mjs.tmpl
// Workers Static Assets 对照：cowork-cloud-tools/scripts/templates/d1-runtime/postbuild-d1-runtime.mjs.tmpl
//
// 步骤 1-3（sitemap/llms 复活闸 + 静态正本改名 + 验收）与 Workers 版逻辑
// 完全一致，不重复注释。Pages 形态在此之外还有两件 Workers 版不需要的事：
//
//   4. dist/404.html 存在性闸——Cloudflare Pages 对未匹配路径的默认行为是
//      SPA 兜底（200 + index.html 内容），不是真 404，除非 dist/ 里有
//      404.html。没有它，_worker.js 里 `assetRes.status !== 404` 永远为假，
//      D1 回落逻辑形同虚设，且所有不存在路径都会误显示成首页——这是
//      Pages Functions 方案里唯一"部署成功但功能静默失效"的坑，必须 fail
//      closed，不能假设它存在（detect_layout 阶段已经查过一次，这里是
//      构建产物角度的第二道保险，两处都查是因为本机构建产物和云构建产物
//      可能不是同一份）。
//   5. 拼装 dist/_worker.js + dist/_routes.json——Cloudflare 不读
//      _worker.ts、也不对 _worker.js 做打包（官方文档原话："We do not
//      read _worker.ts"），所以这里手动把 worker/template.ts 切出的
//      HEAD/TAIL 常量与 worker/pages-worker.body.js 的纯 JS 逻辑拼成
//      单文件，不依赖 import。worker/pages-routes.json（generate_site_kit
//      生成，纯静态内容）原样复制成 dist/_routes.json。
//
// --verify：只做闸和验收，不改名/不重新拼装（接在云构建 build_command 的
// 最后防线，同 Workers 版）。
import { existsSync, renameSync, readFileSync, writeFileSync, copyFileSync } from "node:fs";
import { join } from "node:path";

const DIST = "dist";
const SITEMAP_MODE = "index"; // rename | index | public | none
const SITEMAP_BASE_FILE = "sitemap-0.xml"; // e.g. sitemap-base.xml / sitemap-0.xml
const REQUIRE_LLMS = true;
const verifyOnly = process.argv.includes("--verify");

function die(msg) {
  console.error(`\n❌ [postbuild-d1-runtime-pages] ${msg}\n`);
  process.exit(1);
}

// 1. 复活闸：正本必须叫 *-base，写回旧名会盖掉 Worker 运行时合成的版本
for (const [bad, good] of [
  ["public/sitemap.xml", "public/sitemap-base.xml"],
  ["public/llms.txt", "public/llms-base.txt"],
]) {
  if (existsSync(bad)) {
    die(`${bad} 不应存在——它会盖掉 Worker 运行时合成的版本，让新文章从索引里消失。` +
        `请把内容并进 ${good} 后删除 ${bad}。详见站内 AGENTS.md。`);
  }
}

// 2. 构建生成的 dist 索引文件改名为静态正本
if (!verifyOnly) {
  if (SITEMAP_MODE === "rename" && existsSync(join(DIST, "sitemap.xml"))) {
    renameSync(join(DIST, "sitemap.xml"), join(DIST, "sitemap-base.xml"));
    console.log("[postbuild-d1-runtime-pages] dist/sitemap.xml -> dist/sitemap-base.xml");
  }
  if (existsSync(join(DIST, "llms.txt"))) {
    renameSync(join(DIST, "llms.txt"), join(DIST, "llms-base.txt"));
    console.log("[postbuild-d1-runtime-pages] dist/llms.txt -> dist/llms-base.txt");
  }
}

// 3. 索引文件验收（同 Workers 版）
if (existsSync(join(DIST, "sitemap.xml"))) die(`${DIST}/sitemap.xml 仍存在（应只有 ${SITEMAP_BASE_FILE} 静态正本）`);
if (existsSync(join(DIST, "llms.txt"))) die(`${DIST}/llms.txt 仍存在（应只有 llms-base.txt 静态正本）`);
if (SITEMAP_MODE !== "none" && !existsSync(join(DIST, SITEMAP_BASE_FILE))) {
  die(`${DIST}/${SITEMAP_BASE_FILE} 缺失——Worker 合成 /sitemap.xml 需要它`);
}
if (REQUIRE_LLMS && !existsSync(join(DIST, "llms-base.txt"))) {
  die(`${DIST}/llms-base.txt 缺失——Worker 合成 /llms.txt 需要它`);
}

// 4. Pages 专属：404.html 存在性闸（fail closed，不静默假设）
if (!existsSync(join(DIST, "404.html"))) {
  die(
    `${DIST}/404.html 缺失——没有它 Cloudflare Pages 对未匹配路径默认返回 200+首页内容，` +
    `dist/_worker.js 的 D1 回落逻辑（判断 assetRes.status !== 404）永远不会触发，且所有` +
    `不存在路径都会被误显示成首页。请先确认构建会生成 404.html（多数 astro 站加一个` +
    `src/pages/404.astro 即可）再重跑本次改造，不要跳过这一步硬发。`
  );
}

// 5. Pages 专属：拼装 dist/_worker.js + dist/_routes.json
if (!verifyOnly) {
  const tplPath = "worker/template.ts";
  if (!existsSync(tplPath)) die(`${tplPath} 缺失——请先跑 node scripts/gen-article-template.mjs`);
  const tplSrc = readFileSync(tplPath, "utf8");
  const headMatch = /^export const HEAD = (.+);$/m.exec(tplSrc);
  const tailMatch = /^export const TAIL = (.+);$/m.exec(tplSrc);
  if (!headMatch || !tailMatch) die(`${tplPath} 里找不到 HEAD/TAIL 常量声明，格式是否被手改过？`);
  let headStr, tailStr;
  try {
    headStr = JSON.parse(headMatch[1]);
    tailStr = JSON.parse(tailMatch[1]);
  } catch (e) {
    die(`${tplPath} 的 HEAD/TAIL 常量不是合法字符串字面量，解析失败: ${e.message}`);
  }

  const bodyPath = "worker/pages-worker.body.js";
  if (!existsSync(bodyPath)) die(`${bodyPath} 缺失——generate_site_kit 应已生成，需人工核对`);
  const bodySrc = readFileSync(bodyPath, "utf8");

  const banner =
    "// dist/_worker.js —— 由 scripts/postbuild-d1-runtime-pages.mjs 在构建收尾时自动拼装，勿手改。\n" +
    "// 源头：worker/pages-worker.body.js（逻辑） + worker/template.ts（HEAD/TAIL，由\n" +
    "// scripts/gen-article-template.mjs 从真实构建产物切出）。Cloudflare Pages 不读\n" +
    "// TypeScript、也不对 _worker.js 做打包，因此这里手动拼成单个纯 JS 文件。\n\n";
  const assembled =
    banner +
    `const HEAD = ${JSON.stringify(headStr)};\n` +
    `const TAIL = ${JSON.stringify(tailStr)};\n\n` +
    bodySrc;
  writeFileSync(join(DIST, "_worker.js"), assembled, "utf8");
  console.log(`[postbuild-d1-runtime-pages] dist/_worker.js 已拼装（${assembled.length}B）`);

  const routesPath = "worker/pages-routes.json";
  if (!existsSync(routesPath)) die(`${routesPath} 缺失——generate_site_kit 应已生成，需人工核对`);
  copyFileSync(routesPath, join(DIST, "_routes.json"));
  console.log("[postbuild-d1-runtime-pages] dist/_routes.json 已写入");
} else {
  // --verify：只核验产物已经拼装过，不重新生成（云构建终验场景，此时 postbuild
  // 的非 verify 阶段应已在同一条 build_command 链路里跑过一次）。
  if (!existsSync(join(DIST, "_worker.js"))) die(`${DIST}/_worker.js 缺失——Pages Functions 不会被加载`);
  if (!existsSync(join(DIST, "_routes.json"))) die(`${DIST}/_routes.json 缺失`);
}

console.log(`[postbuild-d1-runtime-pages] ok (${verifyOnly ? "verify" : "apply"})`);
