# UniStay 平台化重做 · BUILD NOTES（2026-07-07）

## 本次改动（v2 平台化 · 覆盖旧 G11 博客皮）
- **品牌**：deep teal #0E5E56 + coral #F2664B + Sora/Inter；SSOT `findstay-org-brand/`（favicon 五件套已入 public/）
- **global.css**：品牌 token 重写 + .fs-* 组件类 + @fontsource inter/sora（package.json 已加依赖 → **需 npm install**）
- **public/g11.css**：UniStay Campus·elevated 设计系统（nav/footer/首页/数据页）
- **Layout.astro**：nav/footer 重做（overlay→sticky、Ask Robin CTA=aiwOpen）、widget 三件套换品牌色（#0E5E56/#F2664B）、hreflang 组
- **首页 index.astro**：平台首页（hero 大图 R2 + 迷你城市跳转搜索 + 12 国 + 热门城市 + top 房源 + 真实评论 + 大学覆盖 + guides + FAQ JSON-LD）
- **新数据路由**（来自 src/data/*.json，3246 房源/228 城/12 国/703 大学）：
  - /housing/ · /housing/[country]/ ×12 · /housing/[country]/[city]/ ×228
  - /property/[slug]/ ×3246（LodgingBusiness+FAQ JSON-LD、真实评论、评分维度条）
  - /universities/ · /university/[slug]/ ×703（CollegeOrUniversity+FAQ JSON-LD）
  - 8 语种着陆 /zh-hant/ /es/ /id/ /ja/ /ko/ /pt/ /th/ /vi/（LocaleLanding 共享组件）
- **保留**：100 篇 blog（/posts/ 全 URL 不变）、tags/archives/search/rss/llms.txt、站长验证 meta
- **public/_headers**：HTML no-cache + assets immutable（§7.B）

## 待 Mac 侧执行
1. `npm install`（新增 @fontsource/inter @fontsource/sora）
2. 房源图转存：`python3 cowork-cloud-tools/scripts/housing_rehost_images.py`（中英文站统一引用 img.unistay.cn/housing/p/*.jpg）
3. `npm run build` → 首页 sanity gate → 盗链 grep gate → 截图（桌面 1280 + 手机 390：首页/城市页/房源页）
4. wrangler pages deploy（存量 Pages 项目 findstay-org · direct upload）

## 已知风险 / 后续
- 数据页 title 若超 60 字符可再精简（非阻塞）
- 多语种目前是着陆页层；全量数据页本地化留 Phase 2（Hermes 批量）
- about.md 仍是旧文案口径（提 OSHC/SafetyWing），建议下轮刷新为平台定位
