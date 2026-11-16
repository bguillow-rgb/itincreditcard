#!/usr/bin/env node
// Check a candidate topic against the dedup gate the generator uses, without
// calling the API. Two modes:
//
//   node scripts/dedup-check.mjs --selftest
//     Asserts the gate rejects every known duplicate shape (the five clusters
//     merged 2026-11-16, re-slugged) and accepts genuinely new topics. Exits 1
//     on any failure. Run it after touching scripts/lib/dedup.mjs.
//
//   node scripts/dedup-check.mjs --query "..." [--title "..."] [--slug "..."]
//     Prints whether that article would be published or rejected, and why.
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { readArticleMeta } from './lib/articles.mjs';
import { loadRoutes } from './lib/links.mjs';
import { duplicateReason, hintIsCovered, staticPageTargets } from './lib/dedup.mjs';

const WEB_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const retiredPath = join(WEB_DIR, 'src/data/retired-articles.json');
const retired = existsSync(retiredPath) ? JSON.parse(readFileSync(retiredPath, 'utf8')).articles || [] : [];
const live = readArticleMeta(join(WEB_DIR, 'src/content/articles'));
const corpus = [...live, ...retired, ...staticPageTargets(loadRoutes(WEB_DIR))];

const arg = (k) => {
  const i = process.argv.indexOf(k);
  return i >= 0 ? process.argv[i + 1] : undefined;
};

if (!process.argv.includes('--selftest')) {
  const cand = { slug: arg('--slug') || 'candidate', title: arg('--title') || '', targetQuery: arg('--query') || '' };
  const why = duplicateReason(cand, corpus);
  console.log(why ? `REJECT: ${why}` : 'PUBLISH: no near-duplicate found');
  process.exit(0);
}

let fail = 0;
const expect = (label, cond, detail = '') => {
  console.log(`${cond ? 'pass' : 'FAIL'}  ${label}${detail ? `  [${detail}]` : ''}`);
  if (!cond) fail++;
};

// 1. Every retired article, re-generated under a fresh slug, is rejected.
for (const r of retired) {
  const why = duplicateReason({ ...r, slug: `${r.slug}-v2` }, corpus);
  expect(`rejects re-slugged ${r.slug}`, !!why, why || 'not caught');
}

// 2. The shapes the Monday flagship actually produced, reworded.
const dupes = [
  { slug: 'best-starter-credit-cards-itin-2027', title: 'Best Starter Credit Cards for ITIN Holders (2027)', targetQuery: 'best starter credit cards for building credit with an ITIN from zero' },
  { slug: 'itin-starter-cards-ranked-tested', title: 'ITIN Starter Credit Cards: Ranked and Tested', targetQuery: 'best starter credit cards ITIN zero credit history ranked' },
  { slug: 'itin-credit-cards-every-issuer-verified-2027', title: 'Every Issuer That Accepts an ITIN, Verified', targetQuery: 'which credit cards accept an ITIN number complete issuer list' },
  { slug: 'secured-or-unsecured-itin-card-2027', title: 'Secured or Unsecured ITIN Card? Real Issuer Data', targetQuery: 'secured vs unsecured credit card with ITIN deposits APR graduation' },
  { slug: 'banks-credit-unions-itin-credit-card-2027', title: 'Banks and Credit Unions That Take an ITIN', targetQuery: 'which banks and credit unions accept ITIN for a credit card application' },
  { slug: 'what-is-the-itin-on-my-credit-card', title: 'What Is the ITIN Number on a Credit Card?', targetQuery: 'what is the ITIN number on a credit card' },
];
for (const d of dupes) {
  const why = duplicateReason(d, corpus);
  expect(`rejects ${d.slug}`, !!why, why || 'not caught');
}

// 3. Genuinely new topics must still pass.
const novel = [
  { slug: 'bank-of-america-credit-card-itin', title: 'Bank of America Credit Card With an ITIN', targetQuery: 'bank of america credit card with itin' },
  { slug: 'gas-station-credit-card-itin', title: 'Gas Station Credit Cards for ITIN Holders', targetQuery: 'gas station credit card with ITIN' },
  { slug: 'credit-card-asylum-seekers-itin', title: 'Credit Cards for Asylum Seekers With an ITIN', targetQuery: 'credit card for asylum seekers with ITIN' },
  { slug: 'credit-card-e2-visa-itin', title: 'Credit Card for E-2 Visa Holders With an ITIN', targetQuery: 'credit card for E-2 visa holders with ITIN' },
  { slug: 'credit-card-fraud-protection-itin', title: 'Credit Card Fraud Protection for ITIN Holders', targetQuery: 'credit card fraud protection for ITIN holders' },
];
for (const n of novel) {
  const why = duplicateReason(n, corpus);
  expect(`accepts ${n.slug}`, !why, why || '');
}

// 4. Backlog: every flagship hint is covered now (that is the bug that shipped
// the duplicates); the Bank of America detail hint is still open.
const backlog = JSON.parse(readFileSync(join(WEB_DIR, 'scripts/topic-backlog.json'), 'utf8'));
for (const h of backlog.flagship || []) expect(`flagship hint covered: ${h.slice(0, 60)}`, hintIsCovered(h, corpus));
const boa = (backlog.detail || []).find((h) => /bank of america/i.test(h));
if (boa) expect('detail hint "bank of america" still open', !hintIsCovered(boa, corpus));

console.log(fail ? `\n${fail} FAILED` : '\nall passed');
process.exit(fail ? 1 : 0);
