# ITIN Credit Card (itincreditcard.com) — Project Instructions

This repo (`~/ITINCreditCard`) is **site 2 of the Itin family of three ITIN content
sites**, all built on the same Astro pattern, bilingual (EN + `/es`), operated by
Timberline Ventures LLC, sharing one AdSense account:

1. ITIN Lending — `itinlending.net` — `~/Itin`
2. **ITIN Credit Card — `itincreditcard.com` — `~/ITINCreditCard` (this repo)**
3. ITIN Credit Score — `itincreditscore.com` — `~/ITINCreditScore`

## Documentation hub + rule

The **central docs for all three sites live in `~/Itin/project-docs/`** — start at
`~/Itin/project-docs/README.md` (and `SITES.md` for the per-site breakdown). The
shared architecture, monetization, SEO, content-pipeline, and ops docs apply here.

**THE DOCUMENTATION RULE (non-negotiable):** whenever any agent does work in this
repo, before finishing it must (1) update the relevant doc in
`~/Itin/project-docs/`, and (2) append a dated entry to
`~/Itin/project-docs/CHANGELOG.md` noting the change, which site(s) it affects, and
whether the other two repos need the same change. If it isn't documented, it isn't
done.

## This site at a glance

- Vertical: ITIN credit cards & credit building. Pillar `/itin-credit-cards-guide`;
  pages include credit-cards-that-accept-itin, secured-credit-cards,
  unsecured-credit-cards, business-credit-cards, build-credit-with-itin,
  how-to-get-an-itin.
- `web/src/consts.ts` is the single source of truth for site identity, products,
  nav, monetization, theme.
- `/docs` is the **generated** GitHub Pages build (wiped by
  `web/scripts/deploy-to-docs.sh`) — never hand-edit or store docs/source there.
- Monetization, SEO/AEO, and content rules are identical to site 1 — read them in
  the hub rather than duplicating here.
