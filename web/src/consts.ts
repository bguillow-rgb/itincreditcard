// Site-wide constants. Single source of truth for the Astro site.
// Update these as the project evolves; schema, footer, nav, llms.txt,
// analytics, and monetization all read from here.

export const SITE = {
  name: 'ITIN Credit Card',
  legalName: 'ITINCreditCard.com',
  tagline: 'Credit Cards & Credit Building for ITIN Holders',
  taglineEs: 'Tarjetas de Crédito y Construcción de Crédito para Personas con ITIN',
  description:
    'ITINCreditCard.com helps ITIN holders get approved for credit cards without an SSN and build U.S. credit history — secured cards, unsecured cards, which issuers accept an ITIN, and how to raise your score. Independent guides and card matching.',
  descriptionEs:
    'ITINCreditCard.com ayuda a personas con ITIN a ser aprobadas para tarjetas de crédito sin Seguro Social y a construir historial crediticio en EE. UU. — tarjetas con garantía, tarjetas sin garantía, qué emisores aceptan un ITIN y cómo subir tu puntaje. Guías independientes y conexión con tarjetas.',
  url: 'https://itincreditcard.com',
  locale: 'en-US',
  supportEmail: 'bguillow@gmail.com',

  // Publisher (legal operating entity) — drives Organization + Article
  // publisher schema and the footer copyright. The /about page is the
  // canonical entity anchor.
  publisher: {
    name: 'Timberline Ventures LLC',
    // Corporate entity site + its Wikidata item — the canonical publisher anchor.
    url: 'https://timberlineventuresllc.com',
    wikidata: 'https://www.wikidata.org/wiki/Q140082434',
    // Wikidata entities: this site (ITIN Credit Card) + the Timberline parent.
    // Closes the Knowledge-Graph sameAs chain on the Organization node.
    sameAs: [
      'https://www.wikidata.org/wiki/Q140083128',
      'https://www.wikidata.org/wiki/Q140082434',
    ] as string[],
    // Add LinkedIn / Crunchbase when ready. Empty entries filtered on render.
  },

  // Named editor persona — the byline + Person entity anchor for E-E-A-T. Used on
  // article bylines, Article schema (author), and the /about page. NOTE: this is a
  // pen name, not a real person; the bio describes the site's actual editorial
  // process and must never claim fabricated licenses/credentials (YMYL trust rule).
  // `name` must stay first in this block — the daily generator reads it by regex.
  editorial: {
    name: 'Mateo Herrera',
    role: 'Editor',
    bio: "Mateo Herrera is the editor of ITIN Credit Card. He writes and edits plain-English guides on credit cards and credit-building for ITIN holders and foreign nationals in the U.S., turning issuer requirements, FICO scoring rules, and IRS and CFPB guidance into clear, accurate steps. Every guide is researched against primary sources — the IRS, the Consumer Financial Protection Bureau, the major credit bureaus, and issuers' own published materials — and reviewed for accuracy before it is published. Mateo writes in both English and Spanish.",
    bioEs: "Mateo Herrera es el editor de ITIN Credit Card. Escribe y edita guías en lenguaje sencillo sobre tarjetas de crédito y la construcción de crédito para personas con ITIN y extranjeros en EE. UU., convirtiendo los requisitos de los emisores, las reglas del puntaje FICO y las guías del IRS y del CFPB en pasos claros y precisos. Cada guía se investiga con fuentes primarias — el IRS, la Oficina para la Protección Financiera del Consumidor (CFPB), los principales burós de crédito y los materiales publicados por los propios emisores — y se revisa para verificar su exactitud antes de publicarse. Mateo escribe en inglés y español.",
  },

  // Analytics + tracking. Values come from env vars at build time so local
  // builds and forks don't fire analytics or ads.
  analytics: {
    ga4Id: import.meta.env.PUBLIC_GA4_ID ?? '',
    gscVerification: import.meta.env.PUBLIC_GSC_VERIFICATION ?? '',
    indexNowKey: import.meta.env.PUBLIC_INDEXNOW_KEY ?? '',
  },

  // Monetization. All optional — features no-op until configured.
  monetize: {
    // Google AdSense publisher ID, e.g. 'ca-pub-0000000000000000'. Set via
    // PUBLIC_ADSENSE_ID at build time. Empty disables all ad slots.
    adsenseId: import.meta.env.PUBLIC_ADSENSE_ID ?? '',
    // AdSense ad-unit slot IDs by position. Create each unit in the AdSense
    // dashboard and paste its numeric slot ID here via env. Empty = that slot
    // renders nothing. Strategy: AdSense lives on research-intent ARTICLES
    // (top = above fold, end = after body); MONEY pages get a single unit
    // below the fold (after the FAQ) so it only catches non-converters and
    // never cannibalizes lead/affiliate revenue.
    adSlots: {
      articleTop: import.meta.env.PUBLIC_ADSENSE_SLOT_ARTICLE_TOP ?? '',
      articleEnd: import.meta.env.PUBLIC_ADSENSE_SLOT_ARTICLE_END ?? '',
      moneyFooter: import.meta.env.PUBLIC_ADSENSE_SLOT_MONEY_FOOTER ?? '',
      // Post-conversion thank-you page — pure ad real estate, no lead/affiliate
      // to cannibalize, so it runs display ads at full density.
      thankYou: import.meta.env.PUBLIC_ADSENSE_SLOT_THANKYOU ?? '',
    },
    // Lead form endpoint. Use a static-friendly handler (Formspree,
    // Web3Forms, Basin). The form POSTs here. Empty shows a mailto fallback.
    // e.g. 'https://formspree.io/f/xxxxxxx'
    leadFormEndpoint: import.meta.env.PUBLIC_LEAD_ENDPOINT ?? '',
    // Web3Forms access key (public by design). Injected as the hidden
    // access_key field; the form only POSTs leads when this is set.
    web3formsKey: import.meta.env.PUBLIC_WEB3FORMS_KEY ?? '',
    // Primary affiliate "apply / get matched" destination used by CTAs that
    // route off-site (Commission Junction deep link). Empty routes to /apply.
    affiliateApplyUrl: import.meta.env.PUBLIC_AFFILIATE_APPLY_URL ?? '',
    // Per-product CJ advertiser deep links, keyed by money-page slug. A page's
    // CTA routes to its product-specific advertiser for max relevance/EPC, and
    // falls back to affiliateApplyUrl (then /apply) when its slot is empty.
    affiliateUrls: {
      'secured-credit-cards': import.meta.env.PUBLIC_AFFILIATE_URL_SECURED ?? '',
      'credit-cards-that-accept-itin': import.meta.env.PUBLIC_AFFILIATE_URL_ACCEPT_ITIN ?? '',
      'unsecured-credit-cards': import.meta.env.PUBLIC_AFFILIATE_URL_UNSECURED ?? '',
      'build-credit-with-itin': import.meta.env.PUBLIC_AFFILIATE_URL_BUILD ?? '',
      'business-credit-cards': import.meta.env.PUBLIC_AFFILIATE_URL_BUSINESS ?? '',
      'itin-credit-cards-guide': import.meta.env.PUBLIC_AFFILIATE_URL_GUIDE ?? '',
    } as Record<string, string>,
    // Awin affiliate display creatives (Credit Karma). The hero ad unit on the
    // homepage renders an Awin banner via CreditKarmaAd.astro. The embed URL is
    // built as cread.php / cshow.php?s=<creativeId>&v=<advertiserId>&q=<campaignId>&r=<publisherId>.
    // publisherId (r) and the Credit Karma advertiser (v) + campaign (q) are
    // account-level constants shared across all three sites; only the per-site
    // creativeId changes. Set the creative IDs in each homepage's <CreditKarmaAd />.
    awin: {
      publisherId: '2931103',
      advertiserId: '66532',
      campaignId: '475588',
      // Default ad topic for pages with no topic-specific keyword in their path
      // (homepage, /about, utility). Per-site so a generic page shows the most
      // on-brand creative: this site leads with credit cards → 'cards'.
      defaultTopic: 'cards',
      // Credit Karma display creatives under the campaign (all 300×250, shared
      // across all 3 sites — creatives are campaign-level). Keyed by topic so each
      // page renders the most relevant banner. Add new IDs here as more creatives
      // are pulled from the Awin dashboard to widen relevance granularity.
      creatives: {
        finance: '3641184', // general "all things finance" — loans, mortgage, income
        cards: '3641203',   // credit cards
        score: '3597059',   // credit score & credit building
      } as Record<string, string>,
    },
  },

  // Brand — modern, trustworthy fintech. Purple = authority, amber = action.
  theme: {
    bg: '#FFFFFF',
    surface: '#F7F5FC',
    surfaceAlt: '#EDE7F9',
    text: '#1F1633',
    muted: '#5C5470',
    primary: '#5B21B6',
    primaryDark: '#4C1D95',
    accent: '#F59E0B',
    accentDark: '#D97706',
    border: '#E7E2F2',
  },
};

// Credit card product clusters — the money-page topology. Each links to a
// cluster hub. Used on the homepage grid and in nav/footer.
export const PRODUCTS = [
  {
    slug: 'secured-credit-cards',
    label: 'Secured Cards',
    labelEs: 'Tarjetas con Garantía',
    blurb: 'Start building credit with a refundable deposit.',
    blurbEs: 'Empieza a construir crédito con un depósito reembolsable.',
    icon: 'card',
  },
  {
    slug: 'credit-cards-that-accept-itin',
    label: 'Cards That Accept ITIN',
    labelEs: 'Tarjetas que Aceptan ITIN',
    blurb: 'Which issuers and banks take an ITIN.',
    blurbEs: 'Qué emisores y bancos aceptan un ITIN.',
    icon: 'search',
  },
  {
    slug: 'unsecured-credit-cards',
    label: 'Unsecured Cards',
    labelEs: 'Tarjetas sin Garantía',
    blurb: 'No-deposit cards as your credit grows.',
    blurbEs: 'Tarjetas sin depósito conforme crece tu crédito.',
    icon: 'star',
  },
  {
    slug: 'build-credit-with-itin',
    label: 'Build Credit',
    labelEs: 'Construir Crédito',
    blurb: 'Grow your U.S. credit score fast.',
    blurbEs: 'Aumenta tu puntaje de crédito en EE. UU. rápido.',
    icon: 'chart',
  },
  {
    slug: 'business-credit-cards',
    label: 'Business Cards',
    labelEs: 'Tarjetas de Negocio',
    blurb: 'Cards for ITIN business owners.',
    blurbEs: 'Tarjetas para dueños de negocio con ITIN.',
    icon: 'briefcase',
  },
  {
    slug: 'how-to-get-an-itin',
    label: 'How to Get an ITIN',
    labelEs: 'Cómo Obtener un ITIN',
    blurb: 'Apply for an ITIN with the IRS.',
    blurbEs: 'Solicita tu ITIN ante el IRS.',
    icon: 'doc',
  },
];

// Pillar guide — the top of the hub-and-spoke. RelatedLinks links every
// cluster + article back up to it.
export const PILLAR = {
  slug: 'itin-credit-cards-guide',
  label: 'ITIN Credit Cards Guide',
  labelEs: 'Guía de Tarjetas de Crédito ITIN',
};

export const NAV = [
  { label: 'Home', labelEs: 'Inicio', href: '/' },
  { label: 'Credit Card Guide', labelEs: 'Guía de Tarjetas', href: '/itin-credit-cards-guide' },
  { label: 'Build Credit', labelEs: 'Construir Crédito', href: '/build-credit-with-itin' },
  { label: 'Guides', labelEs: 'Guías', href: '/articles' },
  { label: 'About', labelEs: 'Nosotros', href: '/about' },
];

export const NAV_CTA = { label: 'Apply Here', labelEs: 'Aplica aquí', href: '/apply' };

// Affiliate fallback chains by money-page slug. When a slug has no dedicated
// affiliate link set, resolution walks this chain (then the global apply URL).
// Unsecured ITIN cards are the hardest to get approved for, so they fall back
// to broader "accepts ITIN" then secured-card offers.
export const AFFILIATE_FALLBACKS: Record<string, string[]> = {
  'unsecured-credit-cards': ['credit-cards-that-accept-itin', 'secured-credit-cards'],
  'credit-cards-that-accept-itin': ['secured-credit-cards'],
  'business-credit-cards': ['build-credit-with-itin'],
};

// Resolve the off-site affiliate URL for a given money-page slug: its own link,
// then its fallback chain, then the global affiliateApplyUrl, then '' (callers
// route to /apply on empty). Pass a path like '/secured-credit-cards' or
// '/es/secured-credit-cards' — the locale prefix and leading slash are stripped.
export function affiliateUrlFor(pathOrSlug?: string): string {
  const slug = (pathOrSlug ?? '').replace(/^\/(es\/)?/, '').replace(/^\//, '');
  const urls = SITE.monetize.affiliateUrls;
  if (urls[slug]) return urls[slug];
  for (const fb of AFFILIATE_FALLBACKS[slug] ?? []) {
    if (urls[fb]) return urls[fb];
  }
  return SITE.monetize.affiliateApplyUrl || '';
}

// --- Credit Karma (Awin) ad targeting -------------------------------------
// Display CTA + alt copy per ad topic, EN + ES. The creative IDs themselves live
// in SITE.monetize.awin.creatives; this is the human-facing copy that wraps them.
export type CkTopic = 'finance' | 'cards' | 'score';
export const CK_AD_COPY: Record<CkTopic, { en: { cta: string; alt: string }; es: { cta: string; alt: string } }> = {
  finance: {
    en: { cta: 'See how much you qualify for here', alt: 'Credit Karma — all things finance at your fingertips' },
    es: { cta: 'Mira cuánto puedes calificar aquí', alt: 'Credit Karma — todas tus finanzas al alcance' },
  },
  cards: {
    en: { cta: 'Compare top credit cards here', alt: 'Credit Karma — find a credit card' },
    es: { cta: 'Compara las mejores tarjetas aquí', alt: 'Credit Karma — encuentra una tarjeta de crédito' },
  },
  score: {
    en: { cta: 'Check your credit score free here', alt: 'Credit Karma — see your credit score free' },
    es: { cta: 'Revisa tu puntaje de crédito gratis aquí', alt: 'Credit Karma — mira tu puntaje de crédito gratis' },
  },
};

// Map a page path/slug to the most relevant Credit Karma ad topic. Keyword match
// wins; otherwise the page falls back to the site's defaultTopic so every page
// shows an on-brand creative. Pass a path like '/itin-mortgage' or '/es/itin-cards'.
export function ckTopicForPath(pathOrSlug?: string): CkTopic {
  const s = (pathOrSlug ?? '').toLowerCase();
  if (/card/.test(s)) return 'cards';
  if (/score|credit-report|credit-bureau|build-credit|credit-history|improve-credit|credit-builder|check-credit/.test(s)) return 'score';
  if (/loan|mortgage|auto|personal|business|finance|income/.test(s)) return 'finance';
  return (SITE.monetize.awin.defaultTopic as CkTopic) ?? 'finance';
}

// Resolve the relevant Credit Karma creative + display copy for a page. Returns
// the creative ID (falling back to the default topic's creative if a topic has
// none configured) plus the localized CTA + alt text.
export function creditKarmaAdFor(pathOrSlug: string | undefined, lang: 'en' | 'es') {
  const topic = ckTopicForPath(pathOrSlug);
  const creatives = SITE.monetize.awin.creatives;
  const creativeId = creatives[topic] ?? creatives[SITE.monetize.awin.defaultTopic] ?? '';
  const copy = CK_AD_COPY[topic][lang];
  return { creativeId, cta: copy.cta, alt: copy.alt, topic };
}
