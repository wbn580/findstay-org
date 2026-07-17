import type { CollectionEntry } from "astro:content";
import getSortedPosts from "./getSortedPosts";
import { slugifyTagAll } from "./tagSlug";

const getPostsByTag = (posts: CollectionEntry<"blog">[], tag: string) =>
  getSortedPosts(
    posts.filter(post => slugifyTagAll(post.data.tags).includes(tag))
  );

export default getPostsByTag;
