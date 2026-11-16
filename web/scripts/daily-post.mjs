// Daily SEO post generator. Researches current high-intent keywords in this
// site's vertical via the Claude API + web search, picks ONE target query not
// already covered, writes a schema-compliant EN article to
// src/content/articles/<slug>.md, then generates its es-419 translation to
// src/content/articles-es/<slug>.md and refreshes the relatedSlugs internal-
// link mesh across all articles. It does NOT build, commit, or deploy — the
// GitHub Actions workflow does that after this script writes the files.
//
// Usage:  ANTHROPIC_API_KEY=... node scripts/daily-post.mjs
// Exit 0 + no file written means "nothing new to publish today" (not an error).
import { writeFileSync, existsSync, readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { loadSite, generateArticle } from './lib/generate.mjs';
import { readArticleMeta } from './lib/articles.mjs';
import { loadRoutes } from './lib/links.mjs';
import { publishArticle, relinkDir } from './lib/publish.mjs';
import { hintIsCovered, duplicateReason, staticPageTargets } from './lib/dedup.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WEB_DIR = resolve(__dirname, '..');
const ARTICLES_DIR = join(WEB_DIR, 'src/content/articles');
const ARTICLES_ES_DIR = join(WEB_DIR, 'src/content/articles-es');

const MODEL = process.env.DAILY_POST_MODEL || 'claude-sonnet-4-6';
const API_KEY = process.env.ANTHROPIC_API_KEY;
// --dry-run (or DAILY_POST_DRY_RUN=1): print the tier, the hint the run would
// use and every hint's coverage, then exit before any API call or file write.
// `--date YYYY-MM-DD` simulates the weekday/week rotation for that day.
const DRY_RUN = process.argv.includes('--dry-run') || process.env.DAILY_POST_DRY_RUN === '1';
const dateArg = process.argv.indexOf('--date');
const NOW = dateArg >= 0 ? new Date(`${process.argv[dateArg + 1]}T13:00:00Z`) : new Date();
if (!API_KEY && !DRY_RUN) {
  console.error('daily-post: ANTHROPIC_API_KEY is not set. Aborting.');
  process.exit(1);
}

const SITE = loadSite(join(WEB_DIR, 'src/consts.ts'));

// Existing articles: dedupe + give the model the current cluster map.
// The list leads with the REAL URL (/articles/<slug>), not the bare slug: the
// model links to whatever shape it sees here, and a bare slug is what produced
// the /<slug> 404s that failed the build and discarded two articles. See
// scripts/lib/links.mjs — that repairs what slips through, this prevents it.
const existing = readArticleMeta(ARTICLES_DIR);
const existingSlugs = new Set(existing.map((a) => a.slug));
const existingList =
  existing.map((a) => `- /articles/${a.slug} | "${a.title}" | target: ${a.targetQuery}`).join('\n') ||
  '(none yet)';

// The static (non-article) routes the model is allowed to link to, straight
// from src/pages so the list can never drift from what Astro actually builds.
const staticPages = [...loadRoutes(WEB_DIR)]
  .filter((p) => !p.startsWith('/articles/') && !p.startsWith('/es/'))
  .sort()
  .map((p) => `- ${p}`)
  .join('\n');

const today = NOW.toISOString().slice(0, 10);

// Topic dedup corpus (see scripts/lib/dedup.mjs for why). Live articles, plus
// articles retired into a canonical (src/data/retired-articles.json: their
// URLs now redirect, but the topic is still covered), plus the static money
// pages. Hints and generated articles are both checked against this.
const retiredPath = join(WEB_DIR, 'src/data/retired-articles.json');
const retired = existsSync(retiredPath) ? JSON.parse(readFileSync(retiredPath, 'utf8')).articles || [] : [];
const dedupCorpus = [...existing, ...retired, ...staticPageTargets(loadRoutes(WEB_DIR))];
// Retired topics are told to the model too, so it does not aim at them.
const retiredTopics = retired.map((r) => `${r.targetQuery} (covered by /articles/${r.redirectTo})`);
// A retired slug is a live redirect URL: never publish a new page on it.
for (const r of retired) existingSlugs.add(r.slug);

// Cadence: this workflow runs Mon/Wed/Fri (see .github/workflows/daily-content.yml).
// Monday = the weekly FLAGSHIP (deep, original-data, link-worthy cluster owner);
// Wed/Fri = cluster detail posts. Topic hints come from scripts/topic-backlog.json
// (seeded from GSC buried-but-real-demand queries), rotated weekly so hints vary
// without any "used" state; the existingList dedup prevents rewriting a covered topic.
const dow = NOW.getUTCDay(); // 0=Sun .. 6=Sat
// DAILY_POST_TIER (a workflow_dispatch input) forces a tier for manual/test runs;
// otherwise Monday = flagship, other scheduled days (Wed/Fri) = cluster detail.
const tier = process.env.DAILY_POST_TIER || (dow === 1 ? 'flagship' : 'detail');

let topicHint;
let pool = [];
const backlogPath = join(WEB_DIR, 'scripts/topic-backlog.json');
if (existsSync(backlogPath)) {
  try {
    const backlog = JSON.parse(readFileSync(backlogPath, 'utf8'));
    // 'cluster' is the legacy key for the detail tier; keep reading it.
    pool = backlog[tier] || (tier === 'detail' ? backlog.cluster : null) || [];
  } catch (e) {
    console.error(`daily-post: could not read topic-backlog.json: ${e.message}`);
  }
}
// Both tiers skip hints an existing (or retired) page already covers. Before
// 2026-11-16 the flagship rotated `weekIdx % pool.length` with no check at all
// and the detail tier used a slug-substring test; between them they produced
// 20+ near-duplicates. Detail = ordered queue (first uncovered hint wins);
// flagship = weekly rotation starting point, then the next uncovered hint. When
// every hint is covered there is NO hint: the model picks a new topic and the
// post-generation gate below still applies.
if (pool.length) {
  const start = tier === 'detail' ? 0 : Math.floor(NOW.getTime() / (7 * 864e5)) % pool.length;
  for (let i = 0; i < pool.length; i++) {
    const h = pool[(start + i) % pool.length];
    if (!hintIsCovered(h, dedupCorpus)) {
      topicHint = h;
      break;
    }
  }
}
console.log(`daily-post: tier=${tier}${topicHint ? ` hint="${topicHint}"` : ' hint=(none: every backlog hint is covered, model picks)'}`);

if (DRY_RUN) {
  for (const h of pool) console.log(`  ${hintIsCovered(h, dedupCorpus) ? 'covered' : 'OPEN   '}  ${h}`);
  console.log('daily-post: dry run, no API call, nothing written.');
  process.exit(0);
}

// Generate, then gate on near-duplicates. One retry with the rejected topic
// named and the hint dropped; a second duplicate means no article today
// (exit 0, nothing written) rather than a duplicate on the live site.
let article;
const rejected = [];
for (let attempt = 1; attempt <= 2; attempt++) {
  try {
    article = await generateArticle({
      apiKey: API_KEY,
      model: MODEL,
      site: SITE,
      tier,
      topicHint: attempt === 1 ? topicHint : undefined,
      existingList,
      staticPages,
      existingSlugs,
      today,
      avoidTopics: [...retiredTopics, ...rejected],
    });
  } catch (e) {
    console.error(`daily-post: generation failed: ${e.message}`);
    process.exit(1);
  }
  const why = duplicateReason(article, dedupCorpus);
  if (!why) break;
  console.log(`daily-post: REJECTED near-duplicate "${article.slug}" (target: ${article.targetQuery}): ${why}`);
  rejected.push(`${article.targetQuery} (rejected as a duplicate: ${why})`);
  article = null;
}
if (!article) {
  console.log('::warning::daily-post: both drafts were near-duplicates of existing pages; nothing published today.');
  process.exit(0);
}

if (existingSlugs.has(article.slug)) {
  console.log(`daily-post: slug "${article.slug}" already exists — nothing new to publish today.`);
  process.exit(0);
}
if (existsSync(join(ARTICLES_DIR, `${article.slug}.md`))) {
  console.log(`daily-post: ${article.slug}.md already exists — skipping.`);
  process.exit(0);
}

article.fallbackAuthor = SITE.author;
article.authorRoster = SITE.authors;
const { translated } = await publishArticle({
  article,
  articlesDir: ARTICLES_DIR,
  articlesEsDir: ARTICLES_ES_DIR,
  apiKey: API_KEY,
  today,
});
console.log(`daily-post: wrote ${article.slug}.md`);
console.log(`  title:   ${article.title}`);
console.log(`  target:  ${article.targetQuery}`);
console.log(`  related: ${article.relatedSlugs.join(', ') || '(none)'}`);
console.log(`  es-419:  ${translated ? 'translated' : 'FAILED (backfill will retry)'}`);

// New article changes the cluster, so older articles can now link to it.
relinkDir(ARTICLES_DIR);
relinkDir(ARTICLES_ES_DIR);
console.log('daily-post: refreshed relatedSlugs mesh');

// Emit the new slug for the workflow (GitHub Actions reads stdout / file).
if (process.env.GITHUB_OUTPUT) {
  writeFileSync(process.env.GITHUB_OUTPUT, `slug=${article.slug}\nwrote=true\n`, { flag: 'a' });
}
