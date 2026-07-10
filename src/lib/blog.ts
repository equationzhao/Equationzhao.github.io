import { getCollection, type CollectionEntry } from 'astro:content';

export type BlogPost = CollectionEntry<'blog'>;

function compareBlogPosts(a: BlogPost, b: BlogPost) {
	const dateDifference = b.data.pubDate.valueOf() - a.data.pubDate.valueOf();
	return dateDifference || a.id.localeCompare(b.id);
}

export async function getPublishedBlogPosts(): Promise<BlogPost[]> {
	return (await getCollection('blog', ({ data }) => !data.draft)).sort(compareBlogPosts);
}

export function getBlogPostSlug(id: string) {
	return id.replace(/\.md$/, '');
}

export function getBlogPostPath(id: string) {
	return `/blog/${getBlogPostSlug(id)}/`;
}

export function getBlogPostUrl(id: string, site?: URL | string) {
	const path = getBlogPostPath(id);
	return site ? new URL(path, site).href : path;
}

export function getBlogPostDescription(post: BlogPost) {
	return post.data.rssDescription?.trim() || post.data.description.trim() || post.data.title;
}
