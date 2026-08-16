import type { CollectionEntry } from "astro:content";
import { slugifyTag } from "./tagSlug";
import postFilter from "./postFilter";

interface Tag {
  tag: string;
  tagName: string;
}

/**
 * 一个标签至少要被这么多篇文章使用，才值得单独出一个页面。
 *
 * 2026-08-16 全队体检：本站大量标签只被一篇文章带过，每个都生成一个「整页只列一
 * 篇文章」的页面并全部进 sitemap。不聚合任何东西的标签不构成导航，对搜索引擎只是
 * 薄页面。
 */
export const TAG_MIN_POSTS = 2;

/**
 * 站点导航里硬写、因此无论几篇文章都必须保留页面的标签 slug。
 *
 * 来源是构建产物 dist 的全站内链扫描（Header / 首页 / 404 等非文章页链到的标签），
 * 不是推理出来的。只按阈值过滤会把它们一起删掉，全站每页都会多一条死链。
 */
export const ALWAYS_PAGED_TAG_SLUGS: string[] = [
];

/** 真正有页面的标签 slug —— 所有标签链接都必须落在这个集合里。 */
export const getPagedTagSlugs = (posts: CollectionEntry<"blog">[]): Set<string> => {
  const counts = new Map<string, number>();
  for (const post of posts
    .filter(postFilter)) {
    // 同一篇文章里重复写的标签只算一次，免得它自己把自己顶过阈值
    for (const slug of new Set((post.data.tags ?? []).map(slugifyTag))) {
      counts.set(slug, (counts.get(slug) ?? 0) + 1);
    }
  }
  const always = new Set(ALWAYS_PAGED_TAG_SLUGS);
  return new Set(
    [...counts.entries()]
      .filter(([slug, n]) => n >= TAG_MIN_POSTS || always.has(slug))
      .map(([slug]) => slug)
  );
};

const getUniqueTags = (posts: CollectionEntry<"blog">[]) => {
  const paged = getPagedTagSlugs(posts);
  const tags: Tag[] = posts
    .filter(postFilter)
    .flatMap(post => post.data.tags)
    .map(tag => ({ tag: slugifyTag(tag), tagName: tag }))
    .filter(({ tag }) => paged.has(tag))
    .filter(
      (value, index, self) =>
        self.findIndex(tag => tag.tag === value.tag) === index
    )
    .sort((tagA, tagB) => tagA.tag.localeCompare(tagB.tag));
  return tags;
};

export default getUniqueTags;
