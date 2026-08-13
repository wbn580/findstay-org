import type { CollectionEntry } from "astro:content";
import postFilter from "./postFilter";

const getSortedPosts = (posts: CollectionEntry<"blog">[]) => {
  return posts
    .filter(postFilter)
    // 时间戳并列时再按 id 定序：并列文章的先后本来完全取决于 content
    // collection 的入库顺序（Astro 内部实现细节，跨大版本会变）。
    .sort(
      (a, b) =>
        Math.floor(
          new Date(b.data.modDatetime ?? b.data.pubDatetime).getTime() / 1000
        ) -
        Math.floor(
          new Date(a.data.modDatetime ?? a.data.pubDatetime).getTime() / 1000
        ) || a.id.localeCompare(b.id)
    );
};

export default getSortedPosts;
