import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';
import fs from 'node:fs';
import nodePath from 'node:path';
import { fileURLToPath } from 'node:url';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import rehypeAffiliateLinks, { buildAffiliateRules } from './src/lib/affiliate-autolink.mjs';

// Sitemap lastmod, done right. A global `lastmod: new Date()` stamps every URL
// with the build time, so all 114 URLs "change" on every daily-content deploy.
// Google learns to distrust that and stops reading the sitemap. Instead we give
// each article a STABLE lastmod from its committed frontmatter date (updatedAt,
// else publishedAt). File mtime and `git log` both churn under CI's shallow
// checkout, so frontmatter is the only date that survives a rebuild unchanged.
// Static pages get no lastmod (Google recrawls them on its own cadence).
const __dirname = nodePath.dirname(fileURLToPath(import.meta.url));
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
      filter: (page) => !/\/(404|thank-you|apply)(\/|$)/.test(page),
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
        // Stable per-article lastmod from frontmatter; unset for static pages.
        const lm = ARTICLE_LASTMOD[path];
        if (lm) item.lastmod = lm;
        else delete item.lastmod;
        return item;
      },
    }),
    mdx(),
  ],
});
