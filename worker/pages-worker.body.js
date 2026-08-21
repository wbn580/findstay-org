// findstay-org — Cloudflare Pages Functions Advanced Mode（dist/_worker.js）：
// 静态资产 + D1 运行时文章层。
//
// 由 cowork-cloud-tools/scripts/d1_runtime_scaffold.py 从模板生成；
// 模板正本：cowork-cloud-tools/scripts/templates/d1-runtime-pages/worker-body.pages.js.tmpl
// Workers Static Assets 对照实现：site-builds/course-org-cn/worker/index.ts
//
// 与 Workers 版逻辑完全同构（同样的"只做加法"三条硬约束，详见站内
// AGENTS.md），唯一差异是运行时形态：Cloudflare Pages 只认纯 JavaScript 的
// dist/_worker.js，不读 TypeScript、也不对它做打包（Cloudflare 官方文档
// 原话："We do not read _worker.ts"）。因此本文件本身不含 import——
// HEAD / TAIL 两个 const 由 scripts/postbuild-d1-runtime-pages.mjs 在构建
// 收尾阶段，从 worker/template.ts（scripts/gen-article-template.mjs 从真实
// 构建产物切出）里提取字符串后，拼接在本文件内容**前面**写成 dist/_worker.js，
// 不依赖任何跨文件打包行为（未经证实 _worker.js 目录形态是否支持多文件打包，
// 不赌这个不确定行为）。
//
// 渲染走服务端：首屏 HTML 就是完整正文，不依赖前端 JS 二次拉取。

const ORIGIN = "https://unistay.net";
const SEG = "property"; // 文章 URL 段（sites.yaml render_url_segment）
const SITEMAP_BASE = "/sitemap-0.xml"; // 构建产物里的 sitemap 静态正本路径
const LLMS_BASE = "/llms-base.txt"; // 构建产物里的 llms 静态正本路径
const SITEMAP_TRAILING = true; // 合成 sitemap loc 是否带尾斜杠
const DATE_STYLE = "iso"; // "zh" | "iso"

// R254 Phase 1（root 布局，无前缀根级文章）：SEG="" 时不能再照旧拼出
// "^/" + "" + "/(...)" = "^//(...)" 这种永远匹配不到任何 URL 的双斜杠正则
// （2026-08-21 本地脚本实测确认过，不是理论风险）。SEG_SEGMENTS 为空数组时
// 前缀直接是空串；与 articlePath() 共用同一份 SEG_SEGMENTS/SEG_PREFIX，
// 两处判空逻辑必须一致，不能各写一套自己算。与 worker-index.ts.tmpl
// （Workers Static Assets 对照实现）逐字同构，改一处务必改另一处。
const SEG_SEGMENTS = SEG.split("/").filter(Boolean); // [] = root 布局
const SEG_PREFIX = SEG_SEGMENTS.length ? "/" + SEG_SEGMENTS.join("/") : ""; // URL 拼接用，不转义
function escapeReSegment(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
const ARTICLE_RE = new RegExp(
  "^" +
    (SEG_SEGMENTS.length ? "/" + SEG_SEGMENTS.map(escapeReSegment).join("/") : "") +
    "/([A-Za-z0-9][A-Za-z0-9._-]*)/?$",
);
function articlePath(slug) {
  return `${SEG_PREFIX}/${slug}`;
}
// root 布局下 ARTICLE_RE 会匹配任意根级单段路径；已构建的静态页面在
// assetRes 阶段就直接返回（见文件头三条硬约束），不会走到这里，唯一新增
// 行为是对更多路径多做一次 D1 查询尝试。RESERVED_ROOT_SLUGS 是双重防呆：
// 即使发布脚本手滑用了保留字当 slug，这里也直接拒绝当文章处理，不查 D1。
// 只在 root 布局（!SEG）下生效——flat 布局天然带 seg 前缀命名空间隔离，
// 不需要这层校验。
const RESERVED_ROOT_SLUGS = new Set(["404", "_astro", "about", "assets", "categories", "category", "contact", "css", "disclaimer", "en", "favicon", "favicon.ico", "fonts", "images", "img", "js", "llms.txt", "offline", "page", "pages", "privacy", "robots", "robots.txt", "search", "sitemap", "sitemap.xml", "static", "tag", "tags", "tw", "zh", "zh-cn", "zh-tw"]);

function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// "2026-07-08" -> "2026年7月8日"（zh 站与静态文章页的日期写法保持一致）
function cnDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  return `${m[1]}年${Number(m[2])}月${Number(m[3])}日`;
}

function renderArticle(a) {
  // 模板里 canonical 一律存成不带尾斜杠的 {{CANONICAL}}（带尾斜杠的位置
  // 在切模板时自然保留成 "{{CANONICAL}}/"），这里只填 base 形式即可。
  const canonicalBase = `${ORIGIN}${articlePath(a.slug)}`;
  const dateIso = (a.published_at || "").slice(0, 10);
  const dateDisplay = DATE_STYLE === "zh" ? cnDate(dateIso) : dateIso;
  const head = HEAD
    .split("{{CANONICAL}}").join(escapeHtml(canonicalBase))
    // 分享按钮把 canonical 做了 URL 百分号编码（微博/QQ/X/邮件分享链接），
    // gen-article-template.mjs 切模板时已整体换成这个占位符，见该文件
    // 2026-08-21 事故防复发注释。
    .split("{{CANONICAL_ENC}}").join(encodeURIComponent(`${canonicalBase}/`))
    .split("{{DESC}}").join(escapeHtml(a.description))
    .split("{{TITLE}}").join(escapeHtml(a.title))
    .split("{{DATE_ISO_FULL}}").join(escapeHtml(`${dateIso}T00:00:00Z`))
    .split("{{DATE_ISO}}").join(escapeHtml(dateIso))
    .split("{{DATE}}").join(escapeHtml(dateDisplay))
    .split("{{CATEGORY_SUFFIX}}").join(
      a.category ? `<span> · ${escapeHtml(a.category)}</span>` : "",
    );
  return head + a.body_html + TAIL;
}

const HTML_HEADERS = {
  "content-type": "text/html; charset=utf-8",
  // 暂不加边缘缓存：先保证"发布即可见"可被无歧义验证（同 course-org-cn）。
  "cache-control": "public, max-age=0, must-revalidate",
};

function escapeXml(s) {
  return escapeHtml(s).replace(/'/g, "&apos;");
}

// 取构建产物里的静态正本
async function fetchBase(env, url, path) {
  const res = await env.ASSETS.fetch(new Request(new URL(path, url.origin).toString()));
  return res.ok ? await res.text() : null;
}

async function listArticles(env) {
  const res = await env.DB.prepare(
    `SELECT slug, title, published_at, updated_at
       FROM articles WHERE status = 'published' ORDER BY published_at DESC`,
  ).all();
  return res.results ?? [];
}

// 正本 + D1 新文章合成 sitemap。正本里已有的 slug 不重复登记（静态优先）。
function composeSitemap(base, rows) {
  const extra = rows
    .filter((r) => !base.includes(articlePath(r.slug)))
    .map((r) => {
      const loc = `${ORIGIN}${articlePath(r.slug)}${SITEMAP_TRAILING ? "/" : ""}`;
      return (
        `<url><loc>${escapeXml(loc)}</loc>` +
        `<lastmod>${escapeXml((r.updated_at || r.published_at).slice(0, 10))}</lastmod></url>`
      );
    });
  if (!extra.length) return base;
  const close = base.lastIndexOf("</urlset>");
  if (close < 0) return base;
  return base.slice(0, close) + extra.join("\n") + "\n" + base.slice(close);
}

// 保留正本里的条目，把 D1 新文章追加在后面。
function composeLlms(base, rows) {
  const extra = rows
    .filter((r) => !base.includes(articlePath(r.slug)))
    .map((r) => `- [${r.title}](${ORIGIN}${articlePath(r.slug)}${SITEMAP_TRAILING ? "/" : ""})`);
  if (!extra.length) return base;
  return base.replace(/\s+$/, "") + "\n" + extra.join("\n") + "\n";
}

async function lookupArticle(env, slug) {
  const row = await env.DB.prepare(
    `SELECT slug, title, description, category, body_html, published_at, updated_at
       FROM articles WHERE slug = ? AND status = 'published'`,
  ).bind(slug).first();
  return row ?? null;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const assetRes = await env.ASSETS.fetch(request);

    if (request.method !== "GET" && request.method !== "HEAD") return assetRes;

    // 静态资产命中就直接返回；只有 404 才回落 D1。
    // Pages 对未匹配路径默认 SPA 兜底（200+首页内容）而非真 404，除非
    // dist/404.html 存在——d1_runtime_scaffold 的 detect_layout 与
    // postbuild-d1-runtime-pages.mjs 都在改造前后各验一次这个文件存在，
    // 缺失会 fail closed，不会静默假设。
    if (assetRes.status !== 404) return assetRes;

    // /sitemap.xml 与 /llms.txt 刻意不在构建产物里，永远走到这里现合成
    const feed =
      url.pathname === "/sitemap.xml"
        ? { base: SITEMAP_BASE, type: "application/xml; charset=utf-8", compose: composeSitemap }
        : url.pathname === "/llms.txt"
          ? { base: LLMS_BASE, type: "text/plain; charset=utf-8", compose: composeLlms }
          : null;

    if (feed) {
      const base = await fetchBase(env, url, feed.base);
      if (base === null) return assetRes;
      let body = base;
      // D1 出问题时退回静态正本，不要让索引文件跟着挂
      try {
        body = feed.compose(base, await listArticles(env));
      } catch {}
      return new Response(body, {
        headers: { "content-type": feed.type, "cache-control": "public, max-age=0, must-revalidate" },
      });
    }

    const m = ARTICLE_RE.exec(url.pathname);
    if (!m) return assetRes;
    // root 布局保留字双重防呆（见 ARTICLE_RE 上方注释）；flat 布局有 seg
    // 前缀天然隔离，不需要这层校验。
    if (!SEG && RESERVED_ROOT_SLUGS.has(m[1])) return assetRes;

    try {
      const article = await lookupArticle(env, m[1]);
      if (!article) return assetRes;
      return new Response(renderArticle(article), { headers: HTML_HEADERS });
    } catch {
      return assetRes;
    }
  },
};
