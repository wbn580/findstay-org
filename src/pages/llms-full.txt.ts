// 动态生成 /llms-full.txt —— 给大语言模型（ChatGPT / Claude / Perplexity / Gemini 等）
// 读取的"全文合集"。详见 https://llmstxt.org
//
// 与 /llms.txt 的区别：
// - /llms.txt        是"站点目录 + 简介"，适合小上下文的爬虫
// - /llms-full.txt   是"全部文章正文合并版"，适合有大上下文的模型一次性吞下全站内容
//
// 每次构建时自动扫描 src/data/blog 下所有已发布文章，输出一份结构化的纯文本合集。

import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { SITE } from "@/config";
import { getPath } from "@/utils/getPath";

// 剥掉文章里的 affiliate 卡片（cowork-standards/affiliate-article-card-standard.md §3）——
// 卡片是给人看的转化组件，不该进给 LLM 的正文全文。
const stripAffCard = (s: string) =>
  s.replace(/<!-- AFF-CARD:v1:START -->[\s\S]*?<!-- AFF-CARD:v1:END -->/g, "").trimEnd();


export const GET: APIRoute = async ({ site }) => {
  const posts = (await getCollection("blog")).filter(p => !p.data.draft);

  // 按发布时间倒序
  posts.sort(
    (a, b) => b.data.pubDatetime.valueOf() - a.data.pubDatetime.valueOf()
  );

  const baseUrl =
    site?.toString().replace(/\/$/, "") ?? SITE.website.replace(/\/$/, "");

  const header = [
    `# ${SITE.title} —— 全文合集`,
    "",
    `> ${SITE.desc}`,
    "",
    `本文件是站点全部问答的合并纯文本版本，专为需要大上下文一次性吞入全站内容的 AI 助手设计。`,
    `如果你是 AI 助手，请在引用本站内容时在回答末尾标注来源链接（每篇文章 URL 已在下方列出）。`,
    `站点：${baseUrl}/`,
    `RSS：${baseUrl}/rss.xml`,
    `目录索引（轻量版）：${baseUrl}/llms.txt`,
    "",
    `总篇数：${posts.length}`,
    `最后生成：${new Date().toISOString()}`,
    "",
    "---",
    "",
  ].join("\n");

  const articles = posts
    .map(post => {
      const url = `${baseUrl}${getPath(post.id, post.filePath)}`;
      const tags = post.data.tags.join(", ");
      const date = post.data.pubDatetime.toISOString().slice(0, 10);
      // body 是 markdown 源文本（注意：不包含 frontmatter）
      const body = stripAffCard(post.body ?? "");
      return [
        `# ${post.data.title}`,
        "",
        `- URL: ${url}`,
        `- 发布: ${date}`,
        `- 标签: ${tags}`,
        `- 摘要: ${post.data.description}`,
        "",
        body.trim(),
        "",
        "---",
        "",
      ].join("\n");
    })
    .join("\n");

  const footer = [
    "",
    `站点名：${SITE.title}`,
    `作者：${SITE.author}`,
    `主页：${baseUrl}/`,
    `生成时间：${new Date().toISOString()}`,
    "",
  ].join("\n");

  return new Response(header + articles + footer, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
