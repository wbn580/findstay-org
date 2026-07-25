import { defineConfig, envField } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";
import remarkToc from "remark-toc";
import remarkCollapse from "remark-collapse";
import {
  transformerNotationDiff,
  transformerNotationHighlight,
  transformerNotationWordHighlight,
} from "@shikijs/transformers";
import { transformerFileName } from "./src/utils/transformers/fileName";
import { SITE } from "./src/config";

// https://astro.build/config
export default defineConfig({
  site: "https://unistay.net",
  integrations: [
    sitemap({
      // 只保留"有独立索引价值"的页面，排除搜索、标签/归档分页、404 等
      filter: page => {
        // 如果关闭了归档页，排除之
        if (!SITE.showArchives && page.includes("/archives")) return false;
        // 排除搜索页（无内容）
        if (page.includes("/search")) return false;
        // 排除标签和归档的翻页页面（/page/N），只保留首页
        if (/\/(tags\/[^/]+\/\d+|posts\/\d+)\/?$/.test(page)) return false;
        // 排除 404
        if (page.endsWith("/404") || page.endsWith("/404/")) return false;
        return true;
      },
      changefreq: "weekly",
      priority: 0.7,
    }),
  ],
  markdown: {
    remarkPlugins: [remarkToc, [remarkCollapse, { test: "Table of contents" }]],
    shikiConfig: {
      // For more themes, visit https://shiki.style/themes
      themes: { light: "min-light", dark: "night-owl" },
      defaultColor: false,
      wrap: false,
      transformers: [
        transformerFileName({ style: "v2", hideDot: false }),
        transformerNotationHighlight(),
        transformerNotationWordHighlight(),
        transformerNotationDiff({ matchAlgorithm: "v3" }),
      ],
    },
  },
  vite: {
    // eslint-disable-next-line
    // @ts-ignore
    // This will be fixed in Astro 6 with Vite 7 support
    // See: https://github.com/withastro/astro/issues/14030
    plugins: [tailwindcss()],
    optimizeDeps: {
      exclude: ["@resvg/resvg-js"],
    },
  },
  image: {
    responsiveStyles: true,
    layout: "constrained",
  },
  env: {
    schema: {
      PUBLIC_GOOGLE_SITE_VERIFICATION: envField.string({
        access: "public",
        context: "client",
        optional: true,
      }),
      PUBLIC_BING_VERIFICATION: envField.string({
        access: "public",
        context: "client",
        optional: true,
      }),
      // 百度站长平台 <meta name="baidu-site-verification" content="codeva-XXX" />
      PUBLIC_BAIDU_VERIFICATION: envField.string({
        access: "public",
        context: "client",
        optional: true,
      }),
      // 搜狗站长平台
      PUBLIC_SOGOU_VERIFICATION: envField.string({
        access: "public",
        context: "client",
        optional: true,
      }),
      // 360 搜索站长平台
      PUBLIC_360_VERIFICATION: envField.string({
        access: "public",
        context: "client",
        optional: true,
      }),
      // 神马搜索（UC / 夸克）站长平台
      PUBLIC_SHENMA_VERIFICATION: envField.string({
        access: "public",
        context: "client",
        optional: true,
      }),
      // 头条搜索（字节跳动 / 抖音搜索生态）站长平台
      // <meta name="bytedance-verification-code" content="XXX" />
      PUBLIC_TOUTIAO_VERIFICATION: envField.string({
        access: "public",
        context: "client",
        optional: true,
      }),
    },
  },
  experimental: {
    preserveScriptOrder: true,
  },
});
