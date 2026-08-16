import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";
import { SITE } from "@/config";

export const BLOG_PATH = "src/content/blog";

const blog = defineCollection({
  loader: glob({ pattern: "**/[^_]*.md", base: `./${BLOG_PATH}` }),
  schema: ({ image }) =>
    z.object({
      author: z.string().default(SITE.author),
      pubDatetime: z.coerce.date(),
      modDatetime: z.coerce.date().optional().nullable(),
      title: z.string(),
      featured: z.boolean().optional(),
      draft: z.boolean().optional(),
      tags: z.array(z.string()).default(["others"]),
      category: z.string().optional(),
      city: z.string().optional(),
      ogImage: z.string().optional(),
      heroImage: z.string().optional(),
      description: z.string(),
      canonicalURL: z.string().optional(),
      hideEditPost: z.boolean().optional(),
      timezone: z.string().optional(),
      // GEO 品牌排名类文章靠这三个字段声明「有页面但不该出现在浏览面」。schema 是
      // 普通 z.object，没声明的字段会被直接丢掉，于是文章里写了 hideFromHome: true
      // 也读不到，首页照样把它排进最新指南（部署闸实测拦下本站）。
      hideFromHome: z.boolean().optional(),
      geo_content: z.boolean().optional(),
      geo_shadow: z.boolean().optional(),
    }),
});

export const collections = { blog };
