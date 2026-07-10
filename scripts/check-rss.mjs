import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const feedPath = resolve(root, 'dist/rss.xml');
const feed = readFileSync(feedPath, 'utf8');

execFileSync('xmllint', ['--noout', feedPath], { stdio: 'inherit' });

const itemMatches = [...feed.matchAll(/<item>([\s\S]*?)<\/item>/g)];
const items = itemMatches.map((match) => match[1]);
const getTag = (item, tag) => item.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`))?.[1] ?? '';
const getAttribute = (xml, tag, attribute) =>
	xml.match(new RegExp(`<${tag}[^>]*\\b${attribute}="([^"]+)"`))?.[1] ?? '';

const sourcePosts = readdirSync(resolve(root, 'src/content/blog'))
	.filter((file) => file.endsWith('.md'))
	.map((file) => {
		const source = readFileSync(resolve(root, 'src/content/blog', file), 'utf8');
		const pubDate = source.match(/^pubDate:\s*(.+)$/m)?.[1]?.trim();
		const updatedDate = source.match(/^updatedDate:\s*(.+)$/m)?.[1]?.trim();
		const draft = source.match(/^draft:\s*true\s*$/m);
		return {
			file,
			pubDate: new Date(pubDate),
			buildDate: new Date(updatedDate ?? pubDate),
			draft: Boolean(draft),
		};
	})
	.filter((post) => !post.draft)
	.sort((a, b) => b.pubDate - a.pubDate || a.file.localeCompare(b.file));

if (items.length !== sourcePosts.length) {
	throw new Error(`RSS item count mismatch: expected ${sourcePosts.length}, got ${items.length}`);
}

if (items.length === 0) {
	throw new Error('RSS feed must contain at least one item');
}

const links = items.map((item) => getTag(item, 'link'));
const guids = items.map((item) => getTag(item, 'guid'));
const dates = items.map((item) => new Date(getTag(item, 'pubDate')));
const feedUrl = getAttribute(feed, 'atom:link', 'href');

if (new Set(guids).size !== guids.length) {
	throw new Error('RSS GUIDs must be unique');
}

if (guids.some((guid, index) => guid !== links[index])) {
	throw new Error('RSS GUIDs must match their canonical links');
}

for (const link of links) {
	if (!/^https?:\/\//.test(link)) throw new Error(`RSS link is not absolute: ${link}`);
}

for (const date of dates) {
	if (Number.isNaN(date.valueOf())) throw new Error('RSS contains an invalid pubDate');
	if (date > new Date()) throw new Error(`RSS contains a future pubDate: ${date.toISOString()}`);
}

const expectedNewestLink = new URL(
	`/blog/${sourcePosts[0].file.replace(/\.md$/, '')}/`,
	'https://equationzhao.github.io',
).href;
if (links[0] !== expectedNewestLink) {
	throw new Error(`RSS is not sorted by publication date: ${links[0]}`);
}

if (!feed.includes('<language>zh-CN</language>')) throw new Error('RSS language is missing');
if (feedUrl !== 'https://equationzhao.github.io/rss.xml') throw new Error('RSS Atom self link is missing or incorrect');
const expectedLastBuildDate = sourcePosts.reduce(
	(latest, post) => (post.buildDate > latest ? post.buildDate : latest),
	new Date(0),
);
if (new Date(getTag(feed, 'lastBuildDate')).valueOf() !== expectedLastBuildDate.valueOf()) {
	throw new Error('RSS lastBuildDate is incorrect');
}
if (/<script\b/i.test(feed) || /<style\b/i.test(feed) || /<content:encoded\b/i.test(feed)) {
	throw new Error('RSS must not contain page scripts, styles, or full-page content');
}

console.log(`RSS check passed: ${items.length} items, newest=${links[0]}`);
