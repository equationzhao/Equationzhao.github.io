import rss from '@astrojs/rss';
import { getPublishedBlogPosts, getBlogPostDescription, getBlogPostUrl } from '../lib/blog';
import { SITE_TITLE, SITE_DESCRIPTION } from '../consts';

export async function GET(context) {
	const posts = await getPublishedBlogPosts();
	const items = posts.map((post) => ({
		title: post.data.title,
		description: getBlogPostDescription(post),
		pubDate: post.data.pubDate,
		categories: post.data.tags,
		link: getBlogPostUrl(post.id, context.site),
	}));
	const lastBuildDate = posts
		.map((post) => post.data.updatedDate ?? post.data.pubDate)
		.reduce((latest, date) => (date > latest ? date : latest), new Date(0))
		.toUTCString();
	const feedUrl = new URL('/rss.xml', context.site).href;

	return rss({
		title: SITE_TITLE,
		description: SITE_DESCRIPTION,
		site: context.site,
		xmlns: { atom: 'http://www.w3.org/2005/Atom' },
		customData: [
			'<language>zh-CN</language>',
			`<lastBuildDate>${lastBuildDate}</lastBuildDate>`,
			`<atom:link href="${feedUrl}" rel="self" type="application/rss+xml" />`,
		].join(''),
		items,
	});
}
