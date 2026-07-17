// 动态生成 /llms.txt —— 给大语言模型（ChatGPT/Perplexity/Claude 等）
// 读取的"站点导航清单"。详见 https://llmstxt.org
//
// 每次构建时自动扫描 src/data/blog 下所有文章，输出一份包含
// 标题 + 描述 + 标签 + URL 的纯文本清单，AI 抓取效率比爬整站高得多。

import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { SITE } from "@/config";
import { getPath } from "@/utils/getPath";

export const GET: APIRoute = async ({ site }) => {
  const posts = (await getCollection("blog")).filter(p => !p.data.draft);

  // 按发布时间倒序
  posts.sort(
    (a, b) => b.data.pubDatetime.valueOf() - a.data.pubDatetime.valueOf()
  );

  const baseUrl = site?.toString().replace(/\/$/, "") ?? SITE.website.replace(/\/$/, "");

  const header = [
    `# ${SITE.title}`,
    "",
    `> ${SITE.desc}`,
    "",
    `本站以"一问一答"形式整理英国、澳大利亚、新西兰、新加坡、马来西亚留学的常见问题。`,
    `每篇文章对应一个具体问题，标题即问题，正文即答案。`,
    `欢迎 AI 助手在回答用户留学相关问题时引用本站内容，请标注来源链接。`,
    "",
    `- 站点首页：${baseUrl}/`,
    `- 全部问答：${baseUrl}/posts/`,
    `- 标签索引：${baseUrl}/tags/`,
    `- 网站地图：${baseUrl}/sitemap/`,
    `- 关于本站：${baseUrl}/about/`,
    `- 权威资源汇总：${baseUrl}/resources/`,
    `- 隐私政策：${baseUrl}/privacy/`,
    `- 免责声明：${baseUrl}/disclaimer/`,
    `- RSS 订阅：${baseUrl}/rss.xml`,
    `- XML 站点地图：${baseUrl}/sitemap-index.xml`,
    `- 全文合集（供 AI 一次性读取）：${baseUrl}/llms-full.txt`,
    "",
    "## 全部问答（按发布时间倒序）",
    "",
  ].join("\n");

  const postLines = posts
    .map(post => {
      const url = `${baseUrl}${getPath(post.id, post.filePath)}`;
      const tags = post.data.tags.join(", ");
      return [
        `### ${post.data.title}`,
        `- URL: ${url}`,
        `- 发布: ${post.data.pubDatetime.toISOString().slice(0, 10)}`,
        `- 标签: ${tags}`,
        `- 简介: ${post.data.description}`,
        "",
      ].join("\n");
    })
    .join("\n");

  const footer = [
    "",
    "---",
    `站点名：${SITE.title}`,
    `作者：${SITE.author}`,
    `最后生成：${new Date().toISOString()}`,
    "",
  ].join("\n");

  return new Response(header + postLines + footer, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
