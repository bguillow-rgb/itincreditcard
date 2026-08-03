import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';
import fs from 'node:fs';
import nodePath from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import rehypeAffiliateLinks, { buildAffiliateRules } from './src/lib/affiliate-autolink.mjs';

// Sitemap lastmod, done right. A global `lastmod: new Date()` stamps every URL
// with the build time, so all 114 URLs "change" on every daily-content deploy.
// Google learns to distrust that and stops reading the sitemap. Instead we give
// each article a STABLE lastmod from its committed frontmatter date (updatedAt,
// else publishedAt) — the only date that survives a rebuild unchanged.
//
// Static pages have no frontmatter, so they originally got no lastmod at all.
// That turned out to be its own bug (found in the 2026-08-03 audit): with no
// freshness signal, Google parked them at the back of the crawl queue and left
// the entire commercial surface — /credit-cards-that-accept-itin, the pillar,
// /secured-credit-cards — uncrawled from Jun 6 to Aug 3, so a month of shipped
// changes was never seen. They now take the commit date of their own source
// file, which is stable across rebuilds and moves only on a real edit.
//
// This needs full git history, and the shallow-checkout failure mode is worse
// than it looks. `actions/checkout` defaults to fetch-depth 1; that single
// commit has no parent, so `git log --name-only` reports EVERY file as added
// in it and all ~38 pages would get the same deploy-day date — the exact
// all-URLs-changed-at-once signal this whole mechanism exists to kill. So the
// two workflows that build the site (daily-content, seed-content)
// pin `fetch-depth: 0`, AND we re-check at build time — belt and braces, so a
// new workflow that forgets the flag degrades to "no lastmod" (the previous
// behaviour) instead of poisoning every URL.
const __dirname = nodePath.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = nodePath.join(__dirname, '..');

// web/src/pages/foo.astro -> /foo, index.astro -> /, es/index.astro -> /es.
// Dynamic routes ([...slug]) are article pages; those come from frontmatter.
function pageUrlPath(file) {
  const m = file.match(/^web\/src\/pages\/(.+)\.astro$/);
  if (!m || m[1].includes('[')) return null;
  const p = m[1].replace(/(^|\/)index$/, '');
  return '/' + p.replace(/\/$/, '');
}

function buildStaticLastmodMap() {
  const map = {};
  // Refuse to date anything from a shallow clone — see above. Verified: a
  // `git clone --depth 1` of this repo yields all 38 pages on one date.
  try {
    const shallow = execFileSync('git', ['rev-parse', '--is-shallow-repository'], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
    }).trim();
    if (shallow !== 'false') return map;
  } catch {
    return map;
  }
  let log = '';
  try {
    // One pass over history, newest first: NUL + commit date, then its files.
    log = execFileSync(
      'git',
      ['log', '--format=%x00%cI', '--name-only', '--', 'web/src/pages'],
      { cwd: REPO_ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
    );
  } catch {
    return map; // no git, not a repo, or nothing tracked yet
  }
  for (const commit of log.split('\0').slice(1)) {
    const lines = commit.split('\n');
    const date = (lines.shift() || '').trim().slice(0, 10);
    if (!date) continue;
    for (const line of lines) {
      const file = line.trim();
      if (!file) continue;
      const url = pageUrlPath(file);
      // Newest commit wins: git log is reverse-chronological, so the first
      // time a path appears is the last time it actually changed.
      if (url && !map[url]) map[url] = date;
    }
  }
  return map;
}
function buildArticleLastmodMap() {
  const map = {};
  const collections = [
    ['articles', '/articles'],
    ['articles-es', '/es/articles'],
  ];
  for (const [dir, prefix] of collections) {
    const abs = nodePath.join(__dirname, 'src/content', dir);
    let files = [];
    try { files = fs.readdirSync(abs); } catch { continue; }
    for (const file of files) {
      if (!/\.(md|mdx)$/.test(file)) continue;
      const slug = file.replace(/\.(md|mdx)$/, '');
      let fm = '';
      try { fm = fs.readFileSync(nodePath.join(abs, file), 'utf8').slice(0, 4000); } catch { continue; }
      const pub = (fm.match(/^publishedAt:\s*["']?(\d{4}-\d{2}-\d{2})/m) || [])[1];
      const upd = (fm.match(/^updatedAt:\s*["']?(\d{4}-\d{2}-\d{2})/m) || [])[1];
      const date = upd || pub;
      if (date) map[`${prefix}/${slug}`] = date;
    }
  }
  return map;
}
const ARTICLE_LASTMOD = buildArticleLastmodMap();
const STATIC_LASTMOD = buildStaticLastmodMap();

// In-content affiliate auto-linking runs in production builds only (mirrors the
// PROD gate on the display ads), so `astro dev` shows clean editorial copy.
const mode = process.env.NODE_ENV ?? 'development';
const isProd = mode === 'production';
const env = loadEnv(mode, process.cwd(), 'PUBLIC_');
const affiliateRehype = isProd
  ? [[rehypeAffiliateLinks, { max: 3, rules: buildAffiliateRules(env) }]]
  : [];

export default defineConfig({
  site: 'https://itincreditcard.com',
  trailingSlash: 'never',
  build: { format: 'file' }, // Generates /about.html, /apply.html, etc.
  markdown: { rehypePlugins: affiliateRehype },
  integrations: [
    sitemap({
      changefreq: 'weekly',
      priority: 0.7,
      // Keep this list in sync with the pages that pass `noindex` to BaseLayout.
      // A noindexed URL in the sitemap is a self-contradiction: the sitemap asks
      // Google to index it, the page header refuses. GSC reports the result as
      // "Excluded by 'noindex' tag" and it inflates the not-indexed count, which
      // buries the pages that are genuinely stuck. (Caught 2026-07-29: /contact
      // and /es/contact were noindexed on all three sites but still shipped in
      // every sitemap.)
      filter: (page) => !/\/(404|thank-you|apply|contact)(\/|$)/.test(page),
      // Emit reciprocal hreflang alternates (en / es / x-default) on every URL.
      // Our EN pages are un-prefixed (/foo) and ES live at /es/foo, which doesn't
      // fit @astrojs/sitemap's i18n option (it assumes every locale is path-
      // prefixed), so we set `links` manually per entry. This belt-and-suspenders
      // the in-<head> hreflang already on each page.
      serialize(item) {
        const { origin, pathname } = new URL(item.url);
        const path = pathname.replace(/\/$/, '') || '/';
        const enPath =
          path === '/es' ? '/' : path.startsWith('/es/') ? path.slice(3) : path;
        const enUrl = origin + (enPath === '/' ? '' : enPath);
        const esUrl = origin + (enPath === '/' ? '/es' : `/es${enPath}`);
        item.links = [
          { lang: 'en', url: enUrl },
          { lang: 'es', url: esUrl },
          { lang: 'x-default', url: enUrl },
        ];
        // Articles from frontmatter, static pages from their source file's
        // commit date. Anything we can't date ships without a lastmod rather
        // than with a made-up one.
        const lm = ARTICLE_LASTMOD[path] || STATIC_LASTMOD[path];
        if (lm) item.lastmod = lm;
        else delete item.lastmod;
        return item;
      },
    }),
    mdx(),
  ],
});
