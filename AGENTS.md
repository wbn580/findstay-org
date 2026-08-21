# findstay-org — 本站 agent 须知

## D1 运行时文章层（R254）

本站已由 d1_runtime_scaffold 接入 D1 运行时渲染（参照 course-org-cn，
完整设计与三条硬约束见 site-builds/course-org-cn/AGENTS.md，此处不复述正文）。
运行时形态：Cloudflare Pages Functions Advanced Mode（dist/_worker.js，纯 JS，不读 TypeScript）。

- 发文走 `node scripts/publish-article.mjs <article.json>`，写进 D1
  `findstay-org-content` 即刻上线（/property/<slug>/），不需要构建部署。
- **Worker 绝不改写任何构建产物路径**（云构建等价闸按 dist manifest 核 sha256）。
- 对外 /sitemap.xml 与 /llms.txt 由 Worker 用静态正本（sitemap-0.xml /
  llms-base.txt）+ D1 现合成；往索引文件追加内容的脚本必须写 *-base 正本，
  写回旧名会被构建闸当场拦下。
- Worker 逻辑源码：`worker/pages-worker.body.js`（逻辑）+ `worker/template.ts`（HEAD/TAIL），由 `scripts/postbuild-d1-runtime-pages.mjs` 在构建收尾拼成单文件 `dist/_worker.js`——Cloudflare 不读 `_worker.ts`、也不对它打包，改逻辑请改 `pages-worker.body.js` 不要直接手改 `dist/_worker.js`。
- 站点外壳改版后重跑 `node scripts/gen-article-template.mjs` 再手动
  `wrangler_pages_deploy.py --project <CF Pages 项目名> --dist site-builds/findstay-org/dist`（先手动跑一遍构建，此脚本只管上传）。
