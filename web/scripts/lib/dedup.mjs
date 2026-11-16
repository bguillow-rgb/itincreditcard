// Topic dedup for the content pipeline (daily-post.mjs, seed-content.mjs).
//
// Why this exists (2026-11-16): the only dedup the generator had was (a) an
// exact-slug match after generation and (b) a "do not duplicate these" line in
// the prompt. Neither stops a near-duplicate. The Monday flagship made it
// worse: its topic hint was picked by `weekIdx % 4` with NO coverage check, so
// every fourth Monday the model was explicitly told "build this flagship
// around: best starter credit cards from zero" while several articles on
// exactly that already existed. It obeyed, picked a fresh slug, and the
// exact-slug check waved it through. By 11/09 the site had 4 starter, 5
// issuer-list, 5 secured-vs-unsecured, 5 "what is the ITIN number" and 6
// banks/credit-union articles, most with identical targetQuery strings.
//
// This module answers one question: is a topic (a backlog hint, or a freshly
// generated article's slug/title/targetQuery) a near-duplicate of something we
// already publish? It compares normalized token sets, so word order, years,
// filler ("verified", "complete", "guide", "2026") and singular/plural do not
// hide a repeat. Tuned against the 86-article corpus on 2026-11-16 (see
// scripts/dedup-check.mjs --selftest): every flagship duplicate is caught, and
// distinct siblings (F-1 vs J-1 visa, student vs international student,
// secured card vs secured deposit, secured-vs-unsecured vs upgrading a secured
// card) are not.

// Words that carry no topical signal on this site. Every article is about ITIN
// holders applying for credit cards that accept an ITIN, and the generator
// decorates titles with freshness/authority filler that changes week to week.
const STOP = new Set([
  // grammar
  'a', 'an', 'the', 'and', 'or', 'to', 'of', 'in', 'on', 'for', 'with', 'by',
  'at', 'from', 'as', 'is', 'are', 'be', 'do', 'does', 'can', 'could', 'i',
  'you', 'your', 'my', 'me', 'we', 'it', 'its', 'if', 'that', 'this', 'which',
  'what', 'who', 'how', 'when', 'where', 'why', 'will', 'should', 'actually',
  'really', 'let', 'lets', 'each', 'one', 'into', 'than', 'vs', 'versus',
  'get', 'getting', 'got', 'have', 'has',
  // site constants (the thesis of every page)
  'itin', 'itins', 'number', 'credit', 'card', 'cards', 'holder', 'holders',
  'us', 'usa', 'accept', 'application',
  // generator filler
  '2025', '2026', '2027', 'guide', 'complete', 'verified', 'list', 'ranked',
  'ranking', 'rankings', 'tested', 'updated', 'explained', 'real', 'data',
  'details', 'detail', 'compared', 'comparison', 'compare', 'review',
  'reviews', 'overview', 'everything', 'know', 'need', 'full', 'ultimate',
  'definitive', 'top', 'new',
]);

// Collapse spellings that mean the same thing so "banks", "bank" and
// "bank-by-bank" land on one token, and synonyms the generator rotates through
// ("starter" / "first", "zero" / "no history") compare equal.
const CANON = new Map([
  ['banks', 'bank'],
  ['unions', 'union'],
  ['cu', 'union'],
  ['issuers', 'issuer'],
  ['lenders', 'issuer'],
  ['lender', 'issuer'],
  ['accepts', 'accept'],
  ['accepting', 'accept'],
  ['approval', 'approve'],
  ['approved', 'approve'],
  ['approvals', 'approve'],
  ['applications', 'application'],
  ['apply', 'application'],
  ['applying', 'application'],
  ['apps', 'application'],
  ['starter', 'first'],
  ['start', 'first'],
  ['beginner', 'first'],
  ['beginners', 'first'],
  ['zero', 'nohistory'],
  ['history', 'nohistory'],
  ['scratch', 'nohistory'],
  ['deposits', 'deposit'],
  ['aprs', 'apr'],
  ['students', 'student'],
  ['immigrants', 'immigrant'],
  ['recipients', 'recipient'],
  ['residents', 'resident'],
  ['works', 'work'],
  ['looks', 'look'],
]);

export function topicTokens(text) {
  const s = String(text || '')
    .toLowerCase()
    // keep visa classes like F-1 / J-1 / H-1B as single tokens
    .replace(/\b([a-z])-(\d[a-z]?)\b/g, '$1$2');
  const out = new Set();
  for (const raw of s.match(/[a-z0-9]+/g) || []) {
    const w = CANON.get(raw) || raw;
    if (STOP.has(w) || STOP.has(raw)) continue;
    if (w.length < 2) continue;
    out.add(w);
  }
  return out;
}

function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const w of a) if (b.has(w)) inter++;
  return inter / (a.size + b.size - inter);
}

// Fraction of `a` found in `b`.
function containment(a, b) {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const w of a) if (b.has(w)) inter++;
  return inter / a.size;
}

function profile(a) {
  const q = topicTokens(a.targetQuery);
  const t = topicTokens(a.title);
  const s = topicTokens(String(a.slug || '').replace(/-/g, ' '));
  const all = new Set([...q, ...t, ...s]);
  // `wide` adds the article's relatedQueries: used only to decide whether a
  // long, descriptive backlog hint is already served by an existing page.
  const wide = new Set([...all, ...(a.relatedQueries || []).flatMap((r) => [...topicTokens(r)])]);
  return { slug: a.slug, q, t, s, all, wide };
}

// Strongest single similarity signal between candidate `c` and existing `e`.
function score(c, e, isHint) {
  if (isHint) {
    return Math.max(
      // the hint matches an existing targetQuery or slug
      jaccard(c.q, e.q),
      jaccard(c.q, e.s),
      // a longer hint whose words mostly sit inside one existing article
      // (its title, slug, targetQuery and relatedQueries)
      c.q.size >= 3 ? containment(c.q, e.wide) : 0,
    );
  }
  return Math.max(
    jaccard(c.q, e.q), // targetQuery vs targetQuery: the main signal
    c.s.size >= 2 && e.s.size >= 2 ? jaccard(c.s, e.s) : 0, // slug vs slug
    c.all.size >= 2 && e.all.size >= 2 ? jaccard(c.all, e.all) : 0, // everything vs everything
  );
}

export const DUP_THRESHOLD = 0.6;

// Return [{slug, score}] of existing pages that `cand` near-duplicates,
// strongest first. `cand` is a backlog hint (string) or an article-ish object
// ({slug, title, targetQuery}). `existing` is article metadata (readArticleMeta)
// optionally plus static pages as {slug, title, targetQuery}. Empty = novel.
export function findNearDuplicates(cand, existing, threshold = DUP_THRESHOLD) {
  const isHint = typeof cand === 'string';
  const c = isHint
    ? (() => {
        const q = topicTokens(cand.split('(')[0]);
        return { q, t: new Set(), s: new Set(), all: q };
      })()
    : profile(cand);
  if (!c.all.size) return [];
  return existing
    .filter((e) => isHint || e.slug !== cand.slug)
    .map((e) => ({ slug: e.slug, score: Math.round(score(c, profile(e), isHint) * 100) / 100 }))
    .filter((r) => r.score >= threshold)
    .sort((x, y) => y.score - x.score || x.slug.localeCompare(y.slug));
}

// A backlog hint is "covered" when an existing page already near-duplicates
// it. Hints with no significant words left after stopwords ("credit card with
// itin", "what is the ITIN number on a credit card") are too generic to steer
// anything, so they count as covered: passing one just invites a rewrite of
// the pillar or of a page we already have.
export function hintIsCovered(hint, existing) {
  if (!topicTokens(String(hint).split('(')[0]).size) return true;
  return findNearDuplicates(hint, existing).length > 0;
}

// Gate for a freshly generated article. Returns null when it is safe to
// publish, else a human-readable reason naming the page(s) it repeats.
export function duplicateReason(article, existing, threshold = DUP_THRESHOLD) {
  const q = topicTokens(article.targetQuery);
  if (!q.size) {
    return `targetQuery "${article.targetQuery}" has no specific words left after removing the site's generic terms, so it restates a head topic the pillar and existing pages already own`;
  }
  const dups = findNearDuplicates(article, existing, threshold);
  if (!dups.length) return null;
  return `too similar to ${dups
    .slice(0, 3)
    .map((d) => `${d.slug} (${d.score})`)
    .join(', ')}`;
}

// Static (non-article) routes as dedup targets, so a hint or article that
// restates a money page (/secured-credit-cards, /business-credit-cards,
// /best-itin-credit-cards) counts as covered. Utility and legal pages are
// excluded: their slugs are not topics.
const UTILITY = new Set([
  '/', '/about', '/apply', '/contact', '/disclosure', '/editorial-policy',
  '/privacy', '/terms', '/thank-you', '/404', '/mcp', '/articles',
]);
export function staticPageTargets(routes) {
  return [...routes]
    .filter((p) => !p.startsWith('/articles/') && !p.startsWith('/es') && !UTILITY.has(p))
    .map((p) => {
      const slug = p.replace(/^\//, '');
      const words = slug.replace(/-/g, ' ');
      return { slug: p, title: words, targetQuery: words };
    });
}
