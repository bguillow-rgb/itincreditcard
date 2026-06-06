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
  supportEmail: 'hello@itincreditcard.com',

  // Publisher (legal operating entity) — drives Organization + Article
  // publisher schema and the footer copyright. The /about page is the
  // canonical entity anchor.
  publisher: {
    name: 'Timberline Ventures LLC',
    sameAs: [] as string[],
    // Add LinkedIn / Crunchbase when ready. Empty entries filtered on render.
  },

  // Byline used on articles and the About page. An editorial-team author is a
  // legitimate E-E-A-T anchor when there is no single named author.
  editorial: {
    name: 'ITIN Credit Card Editorial Team',
    role: 'Editorial Team',
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

export const NAV = [
  { label: 'Home', labelEs: 'Inicio', href: '/' },
  { label: 'Credit Card Guide', labelEs: 'Guía de Tarjetas', href: '/itin-credit-cards-guide' },
  { label: 'Build Credit', labelEs: 'Construir Crédito', href: '/build-credit-with-itin' },
  { label: 'Guides', labelEs: 'Guías', href: '/articles' },
  { label: 'About', labelEs: 'Nosotros', href: '/about' },
];

export const NAV_CTA = { label: 'Find your card', labelEs: 'Encuentra tu tarjeta', href: '/apply' };

// Resolve the off-site affiliate URL for a given money-page slug. Falls back to
// the global affiliateApplyUrl, then to '' (callers route to /apply on empty).
// Pass a path like '/secured-credit-cards' or '/es/secured-credit-cards' — the
// locale prefix and leading slash are stripped before lookup.
export function affiliateUrlFor(pathOrSlug?: string): string {
  const slug = (pathOrSlug ?? '').replace(/^\/(es\/)?/, '').replace(/^\//, '');
  return SITE.monetize.affiliateUrls[slug] || SITE.monetize.affiliateApplyUrl || '';
}
