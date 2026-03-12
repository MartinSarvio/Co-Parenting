/**
 * Tilbudsaviser — nativ viewer med iPaper side-billeder.
 *
 * Henter dynamisk side-URLs og hotspot-data fra iPaper's embedUrl.
 * CapacitorHttp omgår CORS på native platforms.
 */

/* ─── Metadata ─── */

/** When the catalog data was last manually updated */
export const CATALOG_LAST_UPDATED = '2026-02-28';

/** Store flyer URLs for easy reference / future automation */
export const STORE_FLYER_URLS: Record<string, string> = {
  bilka: 'https://avis.bilka.dk/bilka/aviser/bilka-2026/uge-10-food/',
  netto: 'https://netto.dk/tilbudsavis',
  foetex: 'https://foetex.dk/tilbudsavis',
  rema1000: 'https://rema1000.dk/tilbudsavis',
  lidl: 'https://www.lidl.dk/tilbudsavis',
  meny: 'https://meny.dk/tilbudsavis',
  lovbjerg: 'https://www.loevbjerg.dk/tilbudsavis',
  coop365: 'https://coop.dk/365discount/tilbudsavis',
};

/* ─── Types ─── */

export interface Flyer {
  id: string;
  /** Store slug for badge/catalog lookups when id differs (e.g. 'bilka' for 'bilka-nonfood') */
  storeSlug?: string;
  /** Optional label shown below store name (e.g. 'NonFood') */
  label?: string;
  store: string;
  storeColor: string;
  storeInitial: string;
  validFrom: string;
  validUntil: string;
  pages: number;
  webUrl: string;
  embedUrl: string;
  coverImage?: string;
  /** True if this store has a valid iPaper flyer embed */
  hasFlyer?: boolean;
  /** Hardcoded products per page (product name + price mapped to hotspot positions) */
  productMap?: Record<number, FlyerProduct[]>;
}

/** Get the store slug for a flyer (for StoreBadge + catalog lookups) */
export function getFlyerStoreSlug(flyer: Flyer): string {
  return flyer.storeSlug || flyer.id;
}

/** A tappable product on a flyer page — coordinates are 0-1 fractions of page dimensions */
export interface FlyerProduct {
  id: string;
  name: string;
  price: string;
  category?: string;
  /** Hotspot rect as fractions (0–1) of the page image */
  x: number;
  y: number;
  width: number;
  height: number;
  /** Links to CatalogProduct.id for auto-enrichment with crop images */
  catalogId?: string;
}

/** Data returned by fetchFlyerPageData() */
export interface FlyerPageData {
  pageCount: number;
  /** Construct page URL: `${cdnBase}Pages/${n}/Normal.jpg?${policy}` (n = 1-based) */
  cdnBase: string;
  policy: string;
  /** iPaper enrichment hotspots (positions only — no product names) */
  enrichments: iPaperEnrichment[];
}

/** Raw iPaper enrichment entry */
export interface iPaperEnrichment {
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  url: string;
}

/* ─── Hardcoded flyer data ─── */

/**
 * Bilka uge 10 — produkt-hotspots for de første sider.
 * Koordinater er fraktioner (0–1) af sidebilledets dimensioner.
 * Tilføj flere sider over tid.
 */
const BILKA_PRODUCTS: Record<number, FlyerProduct[]> = {
  // Page 1 (cover) — Boss/Van Gils deodorant, Merbrad, etc.
  // Page 1 (cover) — Personlig pleje, kød, morgenmad, kaffe
  1: [
    { id: 'b1-1', name: 'Van Gils, Hugo Boss eller Lacoste deodorant', price: '79.-', category: 'Personlig pleje', x: 0.02, y: 0.35, width: 0.48, height: 0.55, catalogId: 'bp-1' },
    { id: 'b1-2', name: 'Merbrad af dansk gris 5 kg', price: '259.-', category: 'Kød', x: 0.62, y: 0.02, width: 0.36, height: 0.18 },
    { id: 'b1-3', name: 'Tulip Salami-hapser 4 pakker', price: '39.-', category: 'Kød', x: 0.50, y: 0.21, width: 0.48, height: 0.22, catalogId: 'bk-8' },
    { id: 'b1-4', name: 'Udvalgte spiritus 25% rabat', price: 'Spar 25%', category: 'Drikkevarer', x: 0.50, y: 0.55, width: 0.48, height: 0.18 },
    { id: 'b1-5', name: 'Fras morgenmad eller Pauluns super granola', price: '45.-', category: 'Morgenmad', x: 0.50, y: 0.74, width: 0.25, height: 0.15, catalogId: 'bb-1' },
    { id: 'b1-6', name: 'BKI kaffe', price: '38.-', category: 'Drikkevarer', x: 0.75, y: 0.74, width: 0.23, height: 0.15, catalogId: 'bc-3' },
  ],
  // Page 2 — Kød & fisk
  2: [
    { id: 'b2-1', name: 'Entrecotes / rib eyes', price: '149,-', category: 'Kød', x: 0.02, y: 0.04, width: 0.48, height: 0.44, catalogId: 'bk-2' },
    { id: 'b2-2', name: 'Oksecuvette', price: '175,-', category: 'Kød', x: 0.52, y: 0.04, width: 0.46, height: 0.44, catalogId: 'bk-3' },
    { id: 'b2-3', name: 'Kyllingeoverlår', price: '99,-', category: 'Kød', x: 0.02, y: 0.50, width: 0.48, height: 0.22, catalogId: 'bk-4' },
    { id: 'b2-4', name: 'Kyllingebrystfilet', price: '125,-', category: 'Kød', x: 0.52, y: 0.50, width: 0.46, height: 0.22, catalogId: 'bk-5' },
    { id: 'b2-5', name: 'Hel dansk kylling', price: '45,-', category: 'Kød', x: 0.02, y: 0.74, width: 0.32, height: 0.22, catalogId: 'bk-6' },
    { id: 'b2-6', name: 'Kæmpeposen kylling', price: '65,-', category: 'Kød', x: 0.35, y: 0.74, width: 0.32, height: 0.22, catalogId: 'bk-7' },
    { id: 'b2-7', name: 'Ribbenssteg / røget bacon', price: '89,-', category: 'Kød', x: 0.68, y: 0.74, width: 0.30, height: 0.22, catalogId: 'bk-10' },
  ],
  // Page 3 — Kød & fisk + pålæg
  3: [
    { id: 'b3-1', name: 'Gøl megakøbspølser', price: '80,-', category: 'Kød', x: 0.02, y: 0.04, width: 0.48, height: 0.30, catalogId: 'bk-9' },
    { id: 'b3-2', name: 'Launis ishavsrejer / røget laks', price: '35,-', category: 'Kød', x: 0.52, y: 0.04, width: 0.46, height: 0.30, catalogId: 'bk-11' },
    { id: 'b3-3', name: 'K-Salat pålægssalat', price: '12,-', category: 'Mejeri', x: 0.02, y: 0.36, width: 0.32, height: 0.28, catalogId: 'bm-4' },
    { id: 'b3-4', name: 'Mammen skæreost', price: '99,-', category: 'Mejeri', x: 0.35, y: 0.36, width: 0.32, height: 0.28, catalogId: 'bm-2' },
    { id: 'b3-5', name: 'Cheasy skyr', price: '20,-', category: 'Mejeri', x: 0.68, y: 0.36, width: 0.30, height: 0.28, catalogId: 'bm-1' },
    { id: 'b3-6', name: 'Cremefine', price: '10,-', category: 'Mejeri', x: 0.02, y: 0.66, width: 0.48, height: 0.30, catalogId: 'bm-3' },
  ],
  // Page 4 — Drikkevarer
  4: [
    { id: 'b4-1', name: 'Coca-Cola 24 stk.', price: '69,-', category: 'Drikkevarer', x: 0.02, y: 0.04, width: 0.48, height: 0.44, catalogId: 'bd-1' },
    { id: 'b4-2', name: 'Royal øl / Pepsi / Faxe Kondi', price: '89,-', category: 'Drikkevarer', x: 0.52, y: 0.04, width: 0.46, height: 0.44, catalogId: 'bd-3' },
    { id: 'b4-3', name: 'Faxe Kondi / Pepsi Max', price: '14,-', category: 'Drikkevarer', x: 0.02, y: 0.50, width: 0.32, height: 0.22, catalogId: 'bd-2' },
    { id: 'b4-4', name: 'God Morgen juice', price: '16,-', category: 'Drikkevarer', x: 0.35, y: 0.50, width: 0.32, height: 0.22, catalogId: 'bd-4' },
    { id: 'b4-5', name: 'Deconti Appassimento', price: '50,-', category: 'Drikkevarer', x: 0.68, y: 0.50, width: 0.30, height: 0.22, catalogId: 'bd-5' },
    { id: 'b4-6', name: 'Lavazza / Löfbergs helbønner', price: '165,-', category: 'Kaffe', x: 0.02, y: 0.74, width: 0.48, height: 0.22, catalogId: 'bc-1' },
    { id: 'b4-7', name: 'Black Coffee / Gevalia / BKI helbønner', price: '129,-', category: 'Kaffe', x: 0.52, y: 0.74, width: 0.46, height: 0.22, catalogId: 'bc-2' },
  ],
  // Page 5 — Snacks, slik, is
  5: [
    { id: 'b5-1', name: 'KiMs chips', price: '10,-', category: 'Snacks', x: 0.02, y: 0.04, width: 0.32, height: 0.30, catalogId: 'bs-1' },
    { id: 'b5-2', name: 'LU / Oreo kiks', price: '13,-', category: 'Snacks', x: 0.35, y: 0.04, width: 0.32, height: 0.30, catalogId: 'bs-2' },
    { id: 'b5-3', name: 'M&M\'s / Mars', price: '30,-', category: 'Snacks', x: 0.68, y: 0.04, width: 0.30, height: 0.30, catalogId: 'bs-3' },
    { id: 'b5-4', name: 'Twist / Marabou', price: '20,-', category: 'Snacks', x: 0.02, y: 0.36, width: 0.48, height: 0.28, catalogId: 'bs-4' },
    { id: 'b5-5', name: 'Ben & Jerry\'s isbæger', price: '42,-', category: 'Is', x: 0.52, y: 0.36, width: 0.46, height: 0.28, catalogId: 'bi-1' },
    { id: 'b5-6', name: 'M&M\'s poser / Kinder maxi', price: '22,-', category: 'Snacks', x: 0.02, y: 0.66, width: 0.48, height: 0.30, catalogId: 'bs-5' },
  ],
  // Page 6 — Vin & spiritus, husholdning
  6: [
    { id: 'b6-1', name: 'Casa Nostra / Diamond Hill BiB', price: '99,-', category: 'Vin', x: 0.02, y: 0.04, width: 0.32, height: 0.44, catalogId: 'bv-1' },
    { id: 'b6-2', name: 'Il Capolavoro Bag-in-Box', price: '98,-', category: 'Vin', x: 0.35, y: 0.04, width: 0.32, height: 0.44, catalogId: 'bv-2' },
    { id: 'b6-3', name: 'Baileys / Captain Morgan', price: '99,-', category: 'Spiritus', x: 0.68, y: 0.04, width: 0.30, height: 0.44, catalogId: 'bv-3' },
    { id: 'b6-4', name: 'Lotus toiletpapir', price: '39,-', category: 'Husholdning', x: 0.02, y: 0.50, width: 0.32, height: 0.22, catalogId: 'bh-1' },
    { id: 'b6-5', name: 'A+ vaskemiddel', price: '80,-', category: 'Husholdning', x: 0.35, y: 0.50, width: 0.32, height: 0.22, catalogId: 'bh-2' },
    { id: 'b6-6', name: 'Omo vaskemiddel', price: '79,-', category: 'Husholdning', x: 0.68, y: 0.50, width: 0.30, height: 0.22, catalogId: 'bh-3' },
    { id: 'b6-7', name: 'Colgate mundpleje 2 stk.', price: '45,-', category: 'Husholdning', x: 0.02, y: 0.74, width: 0.48, height: 0.22, catalogId: 'bh-4' },
  ],
  // Page 7 — Personlig pleje, morgenmad
  7: [
    { id: 'b7-1', name: 'Palmolive', price: '12,-', category: 'Personlig pleje', x: 0.02, y: 0.04, width: 0.32, height: 0.30, catalogId: 'bp-2' },
    { id: 'b7-2', name: 'Dove / Head & Shoulders', price: '20,-', category: 'Personlig pleje', x: 0.35, y: 0.04, width: 0.32, height: 0.30, catalogId: 'bp-3' },
    { id: 'b7-3', name: 'Valsemøllen mel / bageblanding', price: '15,-', category: 'Morgenmad', x: 0.68, y: 0.04, width: 0.30, height: 0.30, catalogId: 'bb-2' },
    { id: 'b7-4', name: 'Salling grøntsager/brød', price: '12,-', category: 'Morgenmad', x: 0.02, y: 0.36, width: 0.48, height: 0.28, catalogId: 'bb-3' },
    { id: 'b7-5', name: 'Håndskåret entrecote/ribeye', price: '39,-', category: 'Kød', x: 0.52, y: 0.36, width: 0.46, height: 0.28, catalogId: 'bk-1' },
  ]
};

export const FLYERS: Flyer[] = [
  {
    id: 'bilka',
    store: 'Bilka',
    storeColor: '#00AEEF',
    storeInitial: 'B',
    validFrom: '27. feb',
    validUntil: '5. mar',
    pages: 44,
    webUrl: 'https://avis.bilka.dk/bilka/aviser/bilka-2026/uge-10-food/',
    embedUrl: 'https://avis.bilka.dk/bilka/aviser/bilka-2026/uge-10-food/',
    coverImage: 'https://b-cdn.ipaper.io/iPaper/Papers/7affda58-3738-4497-ba57-89e0feb59a70/Pages/1/Normal.jpg',
    hasFlyer: true,
    productMap: BILKA_PRODUCTS,
  },
  {
    id: 'netto',
    store: 'Netto',
    storeColor: '#FFD950',
    storeInitial: 'N',
    validFrom: '28. feb',
    validUntil: '6. mar',
    pages: 24,
    webUrl: 'https://netto.dk',
    embedUrl: 'https://netto.dk',
    coverImage: 'https://image-transformer-api.tjek.com/?u=s3%3A%2F%2Fsgn-prd-assets%2Fuploads%2Fhimfol3K%2Fp-1.webp&w=700&s=45b94bcebfbca43345458ab701cc375d',
  },
  {
    id: 'foetex',
    store: 'Føtex',
    storeColor: '#1D2F54',
    storeInitial: 'F',
    validFrom: '27. feb',
    validUntil: '12. mar',
    pages: 20,
    webUrl: 'https://foetex.dk',
    embedUrl: 'https://avis.foetex.dk/naeste-uges-avis/uge-1011/',
    coverImage: 'https://b-cdn.ipaper.io/iPaper/Papers/26293673-c338-427a-ba0c-e12a3a6b97f3/Pages/1/Normal.jpg',
  },
  {
    id: 'rema1000',
    store: 'REMA 1000',
    storeColor: '#014693',
    storeInitial: 'R',
    validFrom: '1. mar',
    validUntil: '7. mar',
    pages: 24,
    webUrl: 'https://rema1000.dk',
    embedUrl: 'https://rema1000.dk',
    coverImage: 'https://image-transformer-api.tjek.com/?u=s3%3A%2F%2Fsgn-prd-assets%2Fuploads%2F-1dui_Ui%2Fp-1.webp&w=700&s=792af9569904c03a5224539cea2818e1',
  },
  {
    id: 'lidl',
    store: 'Lidl',
    storeColor: '#0050AA',
    storeInitial: 'L',
    validFrom: '1. mar',
    validUntil: '7. mar',
    pages: 15,
    webUrl: 'https://lidl.dk',
    embedUrl: 'https://lidl.dk',
    coverImage: 'https://image-transformer-api.tjek.com/?u=s3%3A%2F%2Fsgn-prd-assets%2Fuploads%2FVXJbxfrU%2Fp-1.webp&w=700&s=f6cf84b0382d41d782639182edae2d2d',
  },
  {
    id: 'meny',
    store: 'MENY',
    storeColor: '#D4001C',
    storeInitial: 'M',
    validFrom: '27. feb',
    validUntil: '5. mar',
    pages: 51,
    webUrl: 'https://meny.dk',
    embedUrl: 'https://meny.dk',
    coverImage: 'https://image-transformer-api.tjek.com/?u=s3%3A%2F%2Fsgn-prd-assets%2Fuploads%2FVkM-1HHZ%2Fp-1.webp&w=700&s=3d5f3b09bf0de79cef1966baaf5606b1',
  },
  {
    id: 'lovbjerg',
    store: 'Løvbjerg',
    storeColor: '#E31937',
    storeInitial: 'Lø',
    validFrom: '27. feb',
    validUntil: '5. mar',
    pages: 32,
    webUrl: 'https://www.loevbjerg.dk',
    embedUrl: 'https://www.loevbjerg.dk',
    coverImage: 'https://eu.leafletscdns.com/thumbor/mtAavzUoXrUtTk4Z4dba4ttghrI=/260x260/center/top/filters:format(webp):quality(65)/dk/data/62/42359/0.jpg',
  },
  {
    id: 'coop365',
    store: 'Coop 365',
    storeColor: '#004D2B',
    storeInitial: '365',
    validFrom: '26. feb',
    validUntil: '4. mar',
    pages: 24,
    webUrl: 'https://coop.dk/365discount/tilbudsavis',
    embedUrl: 'https://coop.dk/365discount/tilbudsavis',
    coverImage: '/covers/coop365.jpg',
  },
  {
    id: 'foetex-flasker',
    storeSlug: 'foetex',
    label: 'Vin & flasker',
    store: 'Føtex',
    storeColor: '#1D2F54',
    storeInitial: 'F',
    validFrom: '27. feb',
    validUntil: '19. mar',
    pages: 6,
    webUrl: 'https://foetex.dk/tilbudsavis',
    embedUrl: 'https://foetex.dk/tilbudsavis',
    coverImage: '/covers/foetex-flasker.jpg',
  },
  {
    id: 'lidl-nonfood',
    storeSlug: 'lidl',
    label: 'NonFood',
    store: 'Lidl',
    storeColor: '#0050AA',
    storeInitial: 'L',
    validFrom: '1. mar',
    validUntil: '7. mar',
    pages: 13,
    webUrl: 'https://www.lidl.dk/tilbudsavis',
    embedUrl: 'https://www.lidl.dk/tilbudsavis',
    coverImage: '/covers/lidl-nonfood.jpg',
  },
  {
    id: 'netto-nonfood',
    storeSlug: 'netto',
    label: 'Inspiration',
    store: 'Netto',
    storeColor: '#FFD950',
    storeInitial: 'N',
    validFrom: '28. feb',
    validUntil: '6. mar',
    pages: 17,
    webUrl: 'https://netto.dk/tilbudsavis',
    embedUrl: 'https://netto.dk/tilbudsavis',
    coverImage: '/covers/netto-nonfood.jpg',
  },
];

/* ─── Dynamic page data fetching ─── */

/**
 * Fetches iPaper page data (CDN base, signed policy, enrichments).
 * Uses CapacitorHttp on native (bypasses CORS), falls back to fetch on web.
 */
export async function fetchFlyerPageData(embedUrl: string): Promise<FlyerPageData | null> {
  try {
    // Fetch the iPaper HTML to extract AWS policy and paper GUID
    const res = await fetch(embedUrl);
    if (!res.ok) return null;
    const html = await res.text();

    // Extract paper GUID from aws.url
    const guidMatch = html.match(/iPaper\/Papers\/([a-f0-9-]{36})\//);
    if (!guidMatch) return null;
    const paperGuid = guidMatch[1];

    // Extract AWS signed URL policy
    const policyMatch = html.match(/"policy":"(Policy=[^"]+)"/);
    if (!policyMatch) return null;
    // Decode unicode escapes (\u0026 → &)
    const policy = policyMatch[1].replace(/\\u0026/g, '&');

    // Extract page count
    const pagesMatch = html.match(/"pages":\[([^\]]+)\]/);
    const pageCount = pagesMatch
      ? pagesMatch[1].split(',').length
      : 44;

    const cdnBase = `https://cdn.ipaper.io/iPaper/Papers/${paperGuid}/`;

    // Try to fetch enrichment data (hotspot positions)
    let enrichments: iPaperEnrichment[] = [];
    const enrichMatch = html.match(/Enrichments\/v1\/[^"]+Page\d+-\d+\.json/);
    if (enrichMatch) {
      try {
        const enrichUrl = `https://b-cdn.ipaper.io/iPaper/Papers/${paperGuid}/${enrichMatch[0]}`;
        const enrichRes = await fetch(enrichUrl);
        if (enrichRes.ok) {
          const data = await enrichRes.json();
          enrichments = (data.enrichments || [])
            .filter((e: { type?: number }) => e.type === 1)
            .map((e: { pageIndex: number; x: number; y: number; width: number; height: number; url: string }) => ({
              pageIndex: e.pageIndex,
              x: e.x,
              y: e.y,
              width: e.width,
              height: e.height,
              url: e.url || '',
            }));
        }
      } catch {
        // Enrichments are optional — continue without them
      }
    }

    return { pageCount, cdnBase, policy, enrichments };
  } catch {
    return null;
  }
}

/** Construct a page image URL from FlyerPageData */
export function getPageImageUrl(data: FlyerPageData, pageNumber: number): string {
  return `${data.cdnBase}Pages/${pageNumber}/Normal.jpg?${data.policy}`;
}

/** Derive public page URL from flyer coverImage (b-cdn.ipaper.io pattern — no SAS token needed) */
export function getPublicPageUrl(coverImage: string | undefined, pageNumber: number): string | null {
  if (!coverImage) return null;
  const match = coverImage.match(/^(https:\/\/b-cdn\.ipaper\.io\/iPaper\/Papers\/[a-f0-9-]+\/)Pages\/\d+\/Normal\.jpg/);
  if (!match) return null;
  return `${match[1]}Pages/${pageNumber}/Normal.jpg`;
}

/** Auto-enrich catalog products with cropImage data from flyer productMap */
function enrichCatalogWithCropImages(catalog: CatalogProduct[], flyer: Flyer): CatalogProduct[] {
  if (!flyer.productMap || !flyer.coverImage) return catalog;

  // Build map: catalogId → cropImage data
  const cropMap = new Map<string, CatalogProduct['cropImage']>();
  for (const [pageNumStr, products] of Object.entries(flyer.productMap)) {
    const pageUrl = getPublicPageUrl(flyer.coverImage, Number(pageNumStr));
    if (!pageUrl) continue;
    for (const fp of products) {
      if (fp.catalogId) {
        cropMap.set(fp.catalogId, {
          pageImageUrl: pageUrl,
          x: fp.x,
          y: fp.y,
          width: fp.width,
          height: fp.height,
        });
      }
    }
  }

  if (cropMap.size === 0) return catalog;

  return catalog.map(p => {
    const crop = cropMap.get(p.id);
    return crop ? { ...p, cropImage: crop } : p;
  });
}

/* ─── Bilka produktkatalog — interaktive tilbudskort ─── */

export interface CatalogProduct {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  discount: string;
  category: string;
  unit?: string;
  /** Cropped product image from flyer page */
  cropImage?: {
    pageImageUrl: string;
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/** Format price: integers → "29,-" / decimals → "17,95" */
export function formatDKK(price: number): string {
  return Number.isInteger(price)
    ? `${price},-`
    : price.toFixed(2).replace('.', ',');
}

export const BILKA_CATALOG: CatalogProduct[] = [
  // ── Kød & Fisk ──
  { id: 'bk-1', name: 'Håndskåret entrecote/ribeye', price: 39, category: 'Kød & Fisk', discount: 'Stk. pris', unit: 'stk' },
  { id: 'bk-2', name: 'Entrecotes / rib eyes', price: 149, originalPrice: 199, discount: '-25%', category: 'Kød & Fisk', unit: '900g' },
  { id: 'bk-3', name: 'Oksecuvette', price: 175, originalPrice: 229, discount: '-24%', category: 'Kød & Fisk', unit: '1200g' },
  { id: 'bk-4', name: 'Kyllingeoverlår', price: 99, originalPrice: 129, discount: '-23%', category: 'Kød & Fisk', unit: '1400g' },
  { id: 'bk-5', name: 'Kyllingebrystfilet', price: 125, originalPrice: 169, discount: '-26%', category: 'Kød & Fisk', unit: '2kg' },
  { id: 'bk-6', name: 'Hel dansk kylling', price: 45, originalPrice: 59, discount: '-24%', category: 'Kød & Fisk', unit: '1200g' },
  { id: 'bk-7', name: 'Kæmpeposen kylling', price: 65, originalPrice: 89, discount: '-27%', category: 'Kød & Fisk', unit: '900g' },
  { id: 'bk-8', name: 'Tulip Salami-hapser', price: 39, originalPrice: 59, discount: '-34%', category: 'Kød & Fisk', unit: '4 pk' },
  { id: 'bk-9', name: 'Gøl megakøbspølser', price: 80, originalPrice: 109, discount: '-27%', category: 'Kød & Fisk', unit: '1kg' },
  { id: 'bk-10', name: 'Ribbenssteg / røget bacon', price: 89, originalPrice: 119, discount: '-25%', category: 'Kød & Fisk', unit: '1200g' },
  { id: 'bk-11', name: 'Launis ishavsrejer / røget laks', price: 35, originalPrice: 49, discount: '-29%', category: 'Kød & Fisk', unit: '180g' },
  // ── Mejeri ──
  { id: 'bm-1', name: 'Cheasy skyr', price: 20, originalPrice: 30, discount: '-33%', category: 'Mejeri', unit: '1kg' },
  { id: 'bm-2', name: 'Mammen skæreost', price: 99, originalPrice: 139, discount: '-29%', category: 'Mejeri', unit: '1080g' },
  { id: 'bm-3', name: 'Cremefine', price: 10, originalPrice: 15, discount: '-33%', category: 'Mejeri', unit: 'stk' },
  { id: 'bm-4', name: 'K-Salat pålægssalat', price: 12, originalPrice: 18, discount: '-33%', category: 'Mejeri', unit: 'stk' },
  // ── Brød & Morgenmad ──
  { id: 'bb-1', name: 'Fras / Pauluns super granola', price: 45, originalPrice: 65, discount: '-31%', category: 'Brød & Morgenmad', unit: '2 pk' },
  { id: 'bb-2', name: 'Valsemøllen mel / bageblanding', price: 15, originalPrice: 22, discount: '-32%', category: 'Brød & Morgenmad', unit: '90g' },
  { id: 'bb-3', name: 'Salling grøntsager/brød', price: 12, originalPrice: 18, discount: '-33%', category: 'Brød & Morgenmad', unit: 'stk' },
  // ── Drikkevarer ──
  { id: 'bd-1', name: 'Coca-Cola 24 stk.', price: 69, originalPrice: 96, discount: '-28%', category: 'Drikkevarer', unit: '24x33cl' },
  { id: 'bd-2', name: 'Faxe Kondi / Pepsi Max', price: 14, originalPrice: 20, discount: '-30%', category: 'Drikkevarer', unit: '2L' },
  { id: 'bd-3', name: 'Royal øl / Pepsi / Faxe Kondi', price: 89, originalPrice: 119, discount: '-25%', category: 'Drikkevarer', unit: '24x33cl' },
  { id: 'bd-4', name: 'God Morgen juice', price: 16, originalPrice: 22, discount: '-27%', category: 'Drikkevarer', unit: '850ml' },
  { id: 'bd-5', name: 'Deconti Appassimento', price: 50, originalPrice: 69, discount: '-28%', category: 'Drikkevarer', unit: '75cl' },
  // ── Kaffe ──
  { id: 'bc-1', name: 'Lavazza / Löfbergs helbønner', price: 165, originalPrice: 219, discount: '-25%', category: 'Kaffe', unit: '1kg' },
  { id: 'bc-2', name: 'Black Coffee / Gevalia / BKI helbønner', price: 129, originalPrice: 169, discount: '-24%', category: 'Kaffe', unit: '900g' },
  { id: 'bc-3', name: 'BKI kaffe', price: 38, originalPrice: 55, discount: '-31%', category: 'Kaffe', unit: '500g' },
  // ── Snacks & Slik ──
  { id: 'bs-1', name: 'KiMs chips', price: 10, originalPrice: 18, discount: '-44%', category: 'Snacks & Slik', unit: 'stk' },
  { id: 'bs-2', name: 'LU / Oreo kiks', price: 13, originalPrice: 20, discount: '-35%', category: 'Snacks & Slik', unit: 'stk' },
  { id: 'bs-3', name: 'M&M\'s / Mars', price: 30, originalPrice: 42, discount: '-29%', category: 'Snacks & Slik', unit: 'stk' },
  { id: 'bs-4', name: 'Twist / Marabou', price: 20, originalPrice: 30, discount: '-33%', category: 'Snacks & Slik', unit: 'stk' },
  { id: 'bs-5', name: 'M&M\'s poser / Kinder maxi', price: 22, originalPrice: 30, discount: '-27%', category: 'Snacks & Slik', unit: '90g' },
  // ── Vin & Spiritus ──
  { id: 'bv-1', name: 'Casa Nostra / Diamond Hill BiB', price: 99, originalPrice: 129, discount: '-23%', category: 'Vin & Spiritus', unit: '3L' },
  { id: 'bv-2', name: 'Il Capolavoro Bag-in-Box', price: 98, originalPrice: 125, discount: '-22%', category: 'Vin & Spiritus', unit: '2.25L' },
  { id: 'bv-3', name: 'Baileys / Captain Morgan / spiritus', price: 99, originalPrice: 139, discount: '-29%', category: 'Vin & Spiritus', unit: '50cl' },
  // ── Husholdning ──
  { id: 'bh-1', name: 'Lotus toiletpapir', price: 39, originalPrice: 55, discount: '-29%', category: 'Husholdning', unit: 'stk' },
  { id: 'bh-2', name: 'A+ vaskemiddel', price: 80, originalPrice: 109, discount: '-27%', category: 'Husholdning', unit: 'stk' },
  { id: 'bh-3', name: 'Omo vaskemiddel', price: 79, originalPrice: 109, discount: '-28%', category: 'Husholdning', unit: '2.5L' },
  { id: 'bh-4', name: 'Colgate mundpleje 2 stk.', price: 45, originalPrice: 60, discount: '-25%', category: 'Husholdning', unit: '2 stk' },
  // ── Is & Frost ──
  { id: 'bi-1', name: 'Ben & Jerry\'s isbæger', price: 42, originalPrice: 55, discount: '-24%', category: 'Is & Frost', unit: '465ml' },
  // ── Personlig pleje ──
  { id: 'bp-1', name: 'Van Gils / Hugo Boss / Lacoste deo', price: 79, originalPrice: 119, discount: '-34%', category: 'Personlig pleje', unit: 'stk' },
  { id: 'bp-2', name: 'Palmolive', price: 12, originalPrice: 18, discount: '-33%', category: 'Personlig pleje', unit: 'stk' },
  { id: 'bp-3', name: 'Dove / Head & Shoulders', price: 20, originalPrice: 30, discount: '-33%', category: 'Personlig pleje', unit: 'stk' },
  // ── Påske ──
  { id: 'bpa-1', name: 'Stor påskefrokost', price: 155, category: 'Påske', discount: 'Pr. kuvert', unit: 'stk' },
  { id: 'bpa-2', name: 'Klassisk påskefrokost', price: 115, category: 'Påske', discount: 'Pr. kuvert', unit: 'stk' },
  { id: 'bpa-3', name: 'Luksussmørrebrød', price: 38, category: 'Påske', discount: 'Pr. stk.', unit: 'stk' },
  { id: 'bpa-4', name: 'Fyldt lammekølle', price: 279, originalPrice: 349, discount: '-20%', category: 'Påske', unit: '1800g' },
];

export const BILKA_CATEGORIES = [...new Set(BILKA_CATALOG.map(p => p.category))];

/* ─── Netto produktkatalog ─── */

export const NETTO_CATALOG: CatalogProduct[] = [
  // ── Mejeri ──
  { id: 'nm-1', name: 'Matilde kakaoskummetmælk', price: 8, originalPrice: 13, discount: '-38%', category: 'Mejeri', unit: '1L' },
  { id: 'nm-2', name: 'Yoggi yoghurt', price: 10, originalPrice: 16, discount: '-38%', category: 'Mejeri', unit: '1L' },
  { id: 'nm-3', name: 'Løgismose øko skyr', price: 20, originalPrice: 30, discount: '-33%', category: 'Mejeri', unit: '800g' },
  { id: 'nm-4', name: 'Klovborg skiveost', price: 15, originalPrice: 22, discount: '-32%', category: 'Mejeri', unit: '150g' },
  { id: 'nm-5', name: 'Athena græsk yoghurt', price: 25, originalPrice: 35, discount: '-29%', category: 'Mejeri', unit: '1kg' },
  { id: 'nm-6', name: 'Riberhus / Mammen skæreost', price: 39, originalPrice: 55, discount: '-29%', category: 'Mejeri', unit: '400g' },
  { id: 'nm-7', name: 'AMA madlavning', price: 8, originalPrice: 12, discount: '-33%', category: 'Mejeri', unit: '330ml' },
  { id: 'nm-8', name: 'Philadelphia', price: 12, originalPrice: 18, discount: '-33%', category: 'Mejeri', unit: '175g' },
  { id: 'nm-9', name: 'Grana Padano', price: 30, originalPrice: 42, discount: '-29%', category: 'Mejeri', unit: '200g' },
  // ── Kød & Fisk ──
  { id: 'nk-1', name: 'Kyllingeoverlår', price: 10, originalPrice: 18, discount: '-44%', category: 'Kød & Fisk', unit: '300g' },
  { id: 'nk-2', name: 'Hakket kyllingekød', price: 45, originalPrice: 65, discount: '-31%', category: 'Kød & Fisk', unit: '1000g' },
  { id: 'nk-3', name: 'Kyllingefilet', price: 69, originalPrice: 89, discount: '-22%', category: 'Kød & Fisk', unit: '1000g' },
  { id: 'nk-4', name: 'Velsmag flæsk / koteletter', price: 39, originalPrice: 55, discount: '-29%', category: 'Kød & Fisk', unit: '700g' },
  { id: 'nk-5', name: 'Hakket oksekød', price: 69, originalPrice: 89, discount: '-22%', category: 'Kød & Fisk', unit: '650g' },
  { id: 'nk-6', name: 'Velsmag entrecotes', price: 139, originalPrice: 179, discount: '-22%', category: 'Kød & Fisk', unit: '900g' },
  { id: 'nk-7', name: 'Velsmag lakseside', price: 85, originalPrice: 115, discount: '-26%', category: 'Kød & Fisk', unit: '600g' },
  { id: 'nk-8', name: 'Bådsmand røget laks', price: 35, originalPrice: 49, discount: '-29%', category: 'Kød & Fisk', unit: '125g' },
  { id: 'nk-9', name: 'Fiskefrikadeller', price: 25, originalPrice: 35, discount: '-29%', category: 'Kød & Fisk', unit: 'stk' },
  { id: 'nk-10', name: 'Velsmag hel kylling', price: 65, originalPrice: 85, discount: '-24%', category: 'Kød & Fisk', unit: '1350g' },
  // ── Brød & Morgenmad ──
  { id: 'nb-1', name: 'Kohberg brød', price: 10, originalPrice: 16, discount: '-38%', category: 'Brød & Morgenmad', unit: 'stk' },
  { id: 'nb-2', name: 'Schulstad Soft Toast', price: 15, originalPrice: 22, discount: '-32%', category: 'Brød & Morgenmad', unit: 'stk' },
  { id: 'nb-3', name: 'Hatting brioche / Athena fladbrød', price: 16, originalPrice: 22, discount: '-27%', category: 'Brød & Morgenmad', unit: 'stk' },
  { id: 'nb-4', name: 'Fras / Paulun\'s granola', price: 22, originalPrice: 32, discount: '-31%', category: 'Brød & Morgenmad', unit: '350g' },
  { id: 'nb-5', name: 'Pågen gifflar', price: 12, originalPrice: 18, discount: '-33%', category: 'Brød & Morgenmad', unit: 'stk' },
  { id: 'nb-6', name: 'ØGO øko havregryn', price: 11, originalPrice: 16, discount: '-31%', category: 'Brød & Morgenmad', unit: '1kg' },
  // ── Frugt & Grønt ──
  { id: 'nf-1', name: 'Danske gulerødder', price: 6, originalPrice: 10, discount: '-40%', category: 'Frugt & Grønt', unit: '200g' },
  { id: 'nf-2', name: 'ØGO øko æbler', price: 18, originalPrice: 25, discount: '-28%', category: 'Frugt & Grønt', unit: '1kg' },
  { id: 'nf-3', name: 'Blåbær', price: 20, originalPrice: 30, discount: '-33%', category: 'Frugt & Grønt', unit: '300g' },
  { id: 'nf-4', name: 'Avocadoer', price: 22, originalPrice: 30, discount: '-27%', category: 'Frugt & Grønt', unit: '3 stk' },
  { id: 'nf-5', name: 'Vandmelon', price: 30, originalPrice: 45, discount: '-33%', category: 'Frugt & Grønt', unit: 'stk' },
  { id: 'nf-6', name: 'Power kartofler', price: 15, originalPrice: 22, discount: '-32%', category: 'Frugt & Grønt', unit: '900g' },
  { id: 'nf-7', name: 'Dadler', price: 20, originalPrice: 30, discount: '-33%', category: 'Frugt & Grønt', unit: '400g' },
  // ── Drikkevarer ──
  { id: 'nd-1', name: 'Faxe Kondi / Pepsi Max', price: 9, originalPrice: 15, discount: '-40%', category: 'Drikkevarer', unit: '1.5L' },
  { id: 'nd-2', name: 'Coca-Cola / Tuborg ramme', price: 59, originalPrice: 79, discount: '-25%', category: 'Drikkevarer', unit: 'ramme' },
  { id: 'nd-3', name: 'Cocio / Rynkeby frugtbrus', price: 6, originalPrice: 10, discount: '-40%', category: 'Drikkevarer', unit: 'stk' },
  { id: 'nd-4', name: 'Starbucks tripleshot', price: 10, originalPrice: 16, discount: '-38%', category: 'Drikkevarer', unit: '300ml' },
  { id: 'nd-5', name: 'Red Bull', price: 10, originalPrice: 15, discount: '-33%', category: 'Drikkevarer', unit: 'stk' },
  { id: 'nd-6', name: 'Rynkeby juice', price: 16, originalPrice: 22, discount: '-27%', category: 'Drikkevarer', unit: '1L' },
  // ── Kolonial ──
  { id: 'nc-1', name: 'Mutti tomater', price: 8, originalPrice: 14, discount: '-43%', category: 'Kolonial', unit: '400g' },
  { id: 'nc-2', name: 'Hellmann\'s mayo / Maille sennep', price: 18, originalPrice: 28, discount: '-36%', category: 'Kolonial', unit: 'stk' },
  { id: 'nc-3', name: 'Karolines Køkken sauce', price: 10, originalPrice: 16, discount: '-38%', category: 'Kolonial', unit: '500ml' },
  { id: 'nc-4', name: 'Wasa knækbrød', price: 14, originalPrice: 20, discount: '-30%', category: 'Kolonial', unit: 'stk' },
  { id: 'nc-5', name: 'Bakersfield hvidløgsbrød', price: 10, originalPrice: 16, discount: '-38%', category: 'Kolonial', unit: '350g' },
  // ── Snacks & Slik ──
  { id: 'ns-1', name: 'Taffel chips', price: 10, originalPrice: 18, discount: '-44%', category: 'Snacks & Slik', unit: '110g' },
  { id: 'ns-2', name: 'Haribo / Maoam', price: 10, originalPrice: 16, discount: '-38%', category: 'Snacks & Slik', unit: '110g' },
  { id: 'ns-3', name: 'Toffifee', price: 25, originalPrice: 35, discount: '-29%', category: 'Snacks & Slik', unit: '200g' },
  { id: 'ns-4', name: 'Katjes slikpose', price: 30, originalPrice: 42, discount: '-29%', category: 'Snacks & Slik', unit: '250g' },
  { id: 'ns-5', name: 'Kit Kat / Lion bar', price: 12, originalPrice: 18, discount: '-33%', category: 'Snacks & Slik', unit: 'stk' },
  // ── Kaffe ──
  { id: 'nca-1', name: 'Karat / Merrild kaffe', price: 39, originalPrice: 55, discount: '-29%', category: 'Kaffe', unit: '400g' },
  { id: 'nca-2', name: 'Lavazza', price: 45, originalPrice: 65, discount: '-31%', category: 'Kaffe', unit: 'stk' },
  { id: 'nca-3', name: 'Copenhagen Roaster helbønner', price: 115, originalPrice: 149, discount: '-23%', category: 'Kaffe', unit: '750g' },
  { id: 'nca-4', name: 'L\'OR / Lavazza kaffekapsler', price: 25, originalPrice: 35, discount: '-29%', category: 'Kaffe', unit: '10 stk' },
  // ── Baby & Pleje ──
  { id: 'np-1', name: 'Libero bleer', price: 49, originalPrice: 79, discount: '-38%', category: 'Baby & Pleje', unit: 'stk' },
  { id: 'np-2', name: 'Zendium mundpleje', price: 20, originalPrice: 30, discount: '-33%', category: 'Baby & Pleje', unit: 'stk' },
  { id: 'np-3', name: 'Palmolive shower', price: 20, originalPrice: 30, discount: '-33%', category: 'Baby & Pleje', unit: 'stk' },
  // ── Husholdning ──
  { id: 'nh-1', name: 'Vanish / Biotex / Neutral', price: 55, originalPrice: 75, discount: '-27%', category: 'Husholdning', unit: 'stk' },
  { id: 'nh-2', name: 'Fairy opvasketabs', price: 69, originalPrice: 95, discount: '-27%', category: 'Husholdning', unit: 'stk' },
  { id: 'nh-3', name: 'Cilit Bang / Klorin', price: 18, originalPrice: 28, discount: '-36%', category: 'Husholdning', unit: 'stk' },
  // ── Øko (ØGO) ──
  { id: 'no-1', name: 'ØGO øko æg', price: 28, originalPrice: 38, discount: '-26%', category: 'Øko (ØGO)', unit: '10 stk' },
  { id: 'no-2', name: 'ØGO øko bønner', price: 5, originalPrice: 8, discount: '-38%', category: 'Øko (ØGO)', unit: 'stk' },
  { id: 'no-3', name: 'ØGO øko grøntsager', price: 10, originalPrice: 15, discount: '-33%', category: 'Øko (ØGO)', unit: 'stk' },
  { id: 'no-4', name: 'ØGO øko hummus', price: 10, originalPrice: 15, discount: '-33%', category: 'Øko (ØGO)', unit: 'stk' },
  // ── Færdigretter ──
  { id: 'nfr-1', name: 'Premieur pizza', price: 39, originalPrice: 55, discount: '-29%', category: 'Færdigretter', unit: 'stk' },
  { id: 'nfr-2', name: 'Næmt kyllingetern', price: 15, originalPrice: 22, discount: '-32%', category: 'Færdigretter', unit: 'stk' },
  { id: 'nfr-3', name: 'Steff Houlberg boller i karry', price: 29, originalPrice: 42, discount: '-31%', category: 'Færdigretter', unit: 'stk' },
  { id: 'nfr-4', name: 'Premier Is', price: 27, originalPrice: 39, discount: '-31%', category: 'Færdigretter', unit: 'stk' },
  { id: 'nfr-5', name: 'Vici gyoza', price: 18, originalPrice: 25, discount: '-28%', category: 'Færdigretter', unit: 'stk' },
  // ── Pålæg ──
  { id: 'npl-1', name: 'Pålækker pålæg / salami-hapser', price: 10, originalPrice: 16, discount: '-38%', category: 'Pålæg', unit: 'stk' },
  { id: 'npl-2', name: 'Bornholmerslagteren postej', price: 15, originalPrice: 22, discount: '-32%', category: 'Pålæg', unit: '300g' },
  { id: 'npl-3', name: 'XXL serrano / chorizo', price: 39, originalPrice: 55, discount: '-29%', category: 'Pålæg', unit: '250g' },
  { id: 'npl-4', name: 'Graasten pålægssalat', price: 10, originalPrice: 15, discount: '-33%', category: 'Pålæg', unit: '120g' },
];

/* ─── Føtex produktkatalog ─── */

export const FOETEX_CATALOG: CatalogProduct[] = [
  // ── Kød & Fisk ──
  { id: 'fk-1', name: 'Flæsk i skiver / koteletter / spareribs', price: 49, originalPrice: 69, discount: '-29%', category: 'Kød & Fisk', unit: '800-900g' },
  { id: 'fk-2', name: 'Ovnklar flæskesteg', price: 17.95, originalPrice: 29, discount: 'Skarp pris', category: 'Kød & Fisk', unit: '½ kg' },
  { id: 'fk-3', name: 'Salling kyllingemarked', price: 29, originalPrice: 45, discount: 'Plus pris', category: 'Kød & Fisk', unit: '250-800g' },
  { id: 'fk-4', name: 'Hakket okse-/grise-/kalvekød', price: 75, originalPrice: 99, discount: '-24%', category: 'Kød & Fisk', unit: '600-1100g' },
  { id: 'fk-5', name: 'Okseculotte', price: 89.95, originalPrice: 119, discount: '-24%', category: 'Kød & Fisk', unit: '½ kg' },
  { id: 'fk-6', name: 'Entrecotes / ribeyes', price: 129, originalPrice: 169, discount: '-24%', category: 'Kød & Fisk', unit: '600-650g' },
  { id: 'fk-7', name: 'Røget hamburgerryg / ribbenssteg', price: 129, originalPrice: 169, discount: '-24%', category: 'Kød & Fisk', unit: '1.65-3kg' },
  { id: 'fk-8', name: 'Grønlandske rejer / røget laks', price: 59, originalPrice: 79, discount: '-25%', category: 'Kød & Fisk', unit: '100-280g' },
  { id: 'fk-9', name: 'Fransk majskylling', price: 65, originalPrice: 89, discount: '-27%', category: 'Kød & Fisk', unit: '1.1kg' },
  { id: 'fk-10', name: 'Oksebov', price: 199, originalPrice: 279, discount: 'Månedens specialitet', category: 'Kød & Fisk', unit: '1.2-1.6kg' },
  { id: 'fk-11', name: 'Stjerneskud smørrebrød', price: 25, category: 'Kød & Fisk', discount: 'Pr. stk', unit: 'stk' },
  // ── Mejeri & Pålæg ──
  { id: 'fm-1', name: 'Dava danske frilandsæg', price: 22, originalPrice: 32, discount: '-31%', category: 'Mejeri & Pålæg', unit: '10 stk' },
  { id: 'fm-2', name: 'Cheasy yoghurt', price: 12, originalPrice: 18, discount: '-33%', category: 'Mejeri & Pålæg', unit: '1L' },
  { id: 'fm-3', name: 'Salling pålæg', price: 12, originalPrice: 18, discount: '-33%', category: 'Mejeri & Pålæg', unit: '60-200g' },
  { id: 'fm-4', name: '3-Stjernet pålæg', price: 12, originalPrice: 18, discount: '-33%', category: 'Mejeri & Pålæg', unit: '40-125g' },
  { id: 'fm-5', name: 'Familien Jacobsen pålæg', price: 9, originalPrice: 15, discount: '-40%', category: 'Mejeri & Pålæg', unit: '100g' },
  { id: 'fm-6', name: 'Nora laktosefri mascarpone', price: 18, originalPrice: 28, discount: '-36%', category: 'Mejeri & Pålæg', unit: '200g' },
  { id: 'fm-7', name: 'Salling revet mozzarella', price: 18, originalPrice: 25, discount: '-28%', category: 'Mejeri & Pålæg', unit: '200g' },
  // ── Brød & Morgenmad ──
  { id: 'fb-1', name: 'Salling brød / baguettes', price: 12, originalPrice: 18, discount: '-33%', category: 'Brød & Morgenmad', unit: '350-750g' },
  { id: 'fb-2', name: 'Kohberg Viking rugbrød', price: 10, originalPrice: 16, discount: '-38%', category: 'Brød & Morgenmad', unit: '1kg' },
  { id: 'fb-3', name: 'Salling Mysli / granola', price: 22, originalPrice: 32, discount: '-31%', category: 'Brød & Morgenmad', unit: '300-750g' },
  { id: 'fb-4', name: 'Fuldkornspizzabunde', price: 30, originalPrice: 42, discount: '-29%', category: 'Brød & Morgenmad', unit: '480g' },
  { id: 'fb-5', name: 'Salling tortilla wraps', price: 10, originalPrice: 16, discount: '-38%', category: 'Brød & Morgenmad', unit: '370g' },
  // ── Frugt & Grønt ──
  { id: 'ff-1', name: 'Blommer', price: 1, category: 'Frugt & Grønt', discount: '1 kr/stk', unit: 'stk' },
  { id: 'ff-2', name: 'Søndagspris frugt (banan/kiwi/æble/pære)', price: 2, category: 'Frugt & Grønt', discount: '2 kr/stk', unit: 'stk' },
  { id: 'ff-3', name: 'Salling ØKO bær / frugt', price: 16, originalPrice: 25, discount: '-36%', category: 'Frugt & Grønt', unit: '200-250g' },
  { id: 'ff-4', name: 'Løse druer', price: 3.95, originalPrice: 5.95, discount: '-34%', category: 'Frugt & Grønt', unit: '100g' },
  { id: 'ff-5', name: 'Cocktailtomater', price: 18, originalPrice: 28, discount: '-36%', category: 'Frugt & Grønt', unit: '500g' },
  { id: 'ff-6', name: 'Clementiner', price: 22, originalPrice: 32, discount: 'Plus pris', category: 'Frugt & Grønt', unit: '900g' },
  { id: 'ff-7', name: 'Salling ØKO søde kartofler', price: 20, originalPrice: 30, discount: '-33%', category: 'Frugt & Grønt', unit: '500g' },
  { id: 'ff-8', name: 'Danske rødløg', price: 8, originalPrice: 14, discount: '-43%', category: 'Frugt & Grønt', unit: '500g' },
  // ── Drikkevarer ──
  { id: 'fd-1', name: 'Fun / Scoop sodavand', price: 8, originalPrice: 14, discount: '-43%', category: 'Drikkevarer', unit: '50cl' },
  { id: 'fd-2', name: 'Peter Larsen Kaffe formalet', price: 59, originalPrice: 79, discount: '-25%', category: 'Drikkevarer', unit: '400-500g' },
  { id: 'fd-3', name: 'Café Noir / Gevalia helbønner', price: 65, originalPrice: 89, discount: '-27%', category: 'Drikkevarer', unit: 'stk' },
  // ── Kolonial ──
  { id: 'fc-1', name: 'Mou suppe', price: 18, originalPrice: 28, discount: '-36%', category: 'Kolonial', unit: '1kg' },
  { id: 'fc-2', name: 'Salling nudler', price: 7, originalPrice: 12, discount: '-42%', category: 'Kolonial', unit: '250g' },
  { id: 'fc-3', name: 'Øko frugtstænger', price: 10, originalPrice: 16, discount: '-38%', category: 'Kolonial', unit: '100g' },
  // ── Husholdning ──
  { id: 'fh-1', name: 'Lambi Premium / Classic papir', price: 20, originalPrice: 32, discount: '-38%', category: 'Husholdning', unit: 'stk' },
  // ── Vin & Øl ──
  { id: 'fv-1', name: 'Il Capolavoro / Bio Logico BiB', price: 99, originalPrice: 139, discount: '-29%', category: 'Vin & Øl', unit: '2.25-3L' },
  { id: 'fv-2', name: 'Antonin Rodet Bourgogne', price: 99, originalPrice: 139, discount: 'Plus pris', category: 'Vin & Øl', unit: '75cl' },
  { id: 'fv-3', name: 'Hoegaarden / Leffe / Grimbergen', price: 24, originalPrice: 35, discount: '-31%', category: 'Vin & Øl', unit: '75cl' },
  { id: 'fv-4', name: 'Le Havre de Paix / Casa Ponte', price: 35, originalPrice: 55, discount: '-36%', category: 'Vin & Øl', unit: '75cl' },
  { id: 'fv-5', name: 'Calvet Chablis / Gemma Barolo', price: 99, originalPrice: 139, discount: '-29%', category: 'Vin & Øl', unit: '75cl' },
  { id: 'fv-6', name: 'Vidal Fleury / Casa Ponte 6 fl.', price: 299, originalPrice: 399, discount: '-25%', category: 'Vin & Øl', unit: '6 flasker' },
  { id: 'fv-7', name: 'Carlsberg / Grøn Tuborg / Classic', price: 129, originalPrice: 169, discount: '-24%', category: 'Vin & Øl', unit: '30x33cl' },
  { id: 'fv-8', name: 'Skovlyst øl frit valg', price: 10, category: 'Vin & Øl', discount: 'Pr. stk', unit: 'stk' },
  { id: 'fv-9', name: 'To Øl Implosion Lager 0.3%', price: 50, originalPrice: 72, discount: '-31%', category: 'Vin & Øl', unit: '6-pak' },
];

/* ─── REMA 1000 produktkatalog ─── */

export const REMA_CATALOG: CatalogProduct[] = [
  // ── Kød & Fisk ──
  { id: 'rk-1', name: 'Hakket oksekød 8-12%', price: 29, originalPrice: 45, discount: '-36%', category: 'Kød & Fisk', unit: '400g' },
  { id: 'rk-2', name: 'Kyllingelår', price: 20, originalPrice: 32, discount: '-38%', category: 'Kød & Fisk', unit: '500g' },
  { id: 'rk-3', name: 'Flæskesteg / nakkefilet', price: 35, originalPrice: 49, discount: '-29%', category: 'Kød & Fisk', unit: '800g' },
  { id: 'rk-4', name: 'Pålægsskinke / kalkun', price: 10, originalPrice: 16, discount: '-38%', category: 'Kød & Fisk', unit: '100g' },
  // ── Mejeri ──
  { id: 'rm-1', name: 'Yoghurt', price: 10, originalPrice: 16, discount: '-38%', category: 'Mejeri', unit: '1000g' },
  { id: 'rm-2', name: 'Skrabeæg', price: 12, originalPrice: 22, discount: '-45%', category: 'Mejeri', unit: '10 stk' },
  { id: 'rm-3', name: 'Smør', price: 15, originalPrice: 22, discount: '-32%', category: 'Mejeri', unit: '200g' },
  { id: 'rm-4', name: 'Cheddar / Gouda skiver', price: 12, originalPrice: 18, discount: '-33%', category: 'Mejeri', unit: '150g' },
  // ── Frugt & Grønt ──
  { id: 'rf-1', name: 'Bananer', price: 7, originalPrice: 12, discount: '-42%', category: 'Frugt & Grønt', unit: 'bundt' },
  { id: 'rf-2', name: 'Agurk', price: 5, originalPrice: 10, discount: '-50%', category: 'Frugt & Grønt', unit: 'stk' },
  { id: 'rf-3', name: 'Iceberg salat', price: 8, originalPrice: 13, discount: '-38%', category: 'Frugt & Grønt', unit: 'stk' },
  { id: 'rf-4', name: 'Tomater', price: 10, originalPrice: 16, discount: '-38%', category: 'Frugt & Grønt', unit: '500g' },
  // ── Drikkevarer ──
  { id: 'rd-1', name: 'Peter Larsen Kaffe', price: 59, originalPrice: 79, discount: '-25%', category: 'Drikkevarer', unit: '400g' },
  { id: 'rd-2', name: 'Juice appelsin / æble', price: 12, originalPrice: 18, discount: '-33%', category: 'Drikkevarer', unit: '1L' },
  { id: 'rd-3', name: 'Sodavand', price: 8, originalPrice: 14, discount: '-43%', category: 'Drikkevarer', unit: '1.5L' },
  // ── Snacks & Is ──
  { id: 'rs-1', name: 'Ben & Jerry\'s isbæger', price: 39, originalPrice: 55, discount: '-29%', category: 'Snacks & Is', unit: '465ml' },
  { id: 'rs-2', name: 'Chips', price: 15, originalPrice: 22, discount: '-32%', category: 'Snacks & Is', unit: '175g' },
  { id: 'rs-3', name: 'Chokolade / slik', price: 10, originalPrice: 16, discount: '-38%', category: 'Snacks & Is', unit: 'stk' },
  // ── Vin ──
  { id: 'rv-1', name: 'Silverboom vin', price: 40, originalPrice: 69, discount: '-42%', category: 'Vin', unit: '75cl' },
  { id: 'rv-2', name: 'Brise de France rosé', price: 35, originalPrice: 55, discount: '-36%', category: 'Vin', unit: '75cl' },
  { id: 'rv-3', name: 'Sol de Chile', price: 30, originalPrice: 49, discount: '-39%', category: 'Vin', unit: '75cl' },
  { id: 'rv-4', name: 'Rødvin kasse 6 fl.', price: 199, originalPrice: 299, discount: '-33%', category: 'Vin', unit: '6 flasker' },
  // ── Husholdning ──
  { id: 'rh-1', name: 'Vaskemiddel', price: 30, originalPrice: 45, discount: '-33%', category: 'Husholdning', unit: '1L' },
  { id: 'rh-2', name: 'Toiletpapir', price: 25, originalPrice: 40, discount: '-38%', category: 'Husholdning', unit: '8 ruller' },
];

/* ─── Lidl produktkatalog ─── */

export const LIDL_CATALOG: CatalogProduct[] = [
  // ── Kød & Fisk ──
  { id: 'lk-1', name: 'Hakket oksekød', price: 29, originalPrice: 39, discount: '-26%', category: 'Kød & Fisk', unit: '350g' },
  { id: 'lk-2', name: 'Kyllingebrystfilet', price: 139, originalPrice: 179, discount: 'Lidl Plus', category: 'Kød & Fisk', unit: '1800-2000g' },
  { id: 'lk-3', name: 'Hakket gris og kalv', price: 49, originalPrice: 65, discount: '-24%', category: 'Kød & Fisk', unit: '800g' },
  { id: 'lk-4', name: 'Hakket kyllingekød', price: 20, originalPrice: 28, discount: '-29%', category: 'Kød & Fisk', unit: '300g' },
  { id: 'lk-5', name: 'Kalkunoverlår', price: 45, originalPrice: 59, discount: '-24%', category: 'Kød & Fisk', unit: '1000g' },
  { id: 'lk-6', name: 'Oksesteak med peberkant', price: 39, originalPrice: 55, discount: '-29%', category: 'Kød & Fisk', unit: '250g' },
  { id: 'lk-7', name: 'Bacon i skiver', price: 8, originalPrice: 12, discount: '-33%', category: 'Kød & Fisk', unit: '100g' },
  { id: 'lk-8', name: 'Fiskefrikadeller', price: 18, originalPrice: 25, discount: '-28%', category: 'Kød & Fisk', unit: '200-340g' },
  { id: 'lk-9', name: 'Piri piri kyllingevinger', price: 39, originalPrice: 55, discount: '-29%', category: 'Kød & Fisk', unit: '750g' },
  // ── Mejeri & Pålæg ──
  { id: 'lm-1', name: 'Skrabeæg', price: 10, originalPrice: 16, discount: 'Lidl Plus', category: 'Mejeri & Pålæg', unit: '10 stk' },
  { id: 'lm-2', name: 'Flødehavarti', price: 29, originalPrice: 38, discount: '-23%', category: 'Mejeri & Pålæg', unit: '400g' },
  { id: 'lm-3', name: 'Pålækker pålæg', price: 10, originalPrice: 16, discount: '-38%', category: 'Mejeri & Pålæg', unit: '80-200g' },
  { id: 'lm-4', name: 'Hammel pålæg', price: 15, originalPrice: 22, discount: '-32%', category: 'Mejeri & Pålæg', unit: '100g' },
  { id: 'lm-5', name: 'Arla Cultura kefir', price: 15, originalPrice: 22, discount: '-32%', category: 'Mejeri & Pålæg', unit: '1L' },
  { id: 'lm-6', name: 'Bøffelburrata', price: 15, originalPrice: 22, discount: '-32%', category: 'Mejeri & Pålæg', unit: '125g' },
  { id: 'lm-7', name: 'Pecorino Romano DOP', price: 39, originalPrice: 55, discount: '-29%', category: 'Mejeri & Pålæg', unit: '200g' },
  // ── Frugt & Grønt ──
  { id: 'lf-1', name: 'Banan', price: 1.75, category: 'Frugt & Grønt', discount: 'Pr. stk', unit: 'stk' },
  { id: 'lf-2', name: 'Appelsiner', price: 18, originalPrice: 25, discount: '-28%', category: 'Frugt & Grønt', unit: '1.5kg' },
  { id: 'lf-3', name: 'Grønne vindruer', price: 15, originalPrice: 22, discount: '-32%', category: 'Frugt & Grønt', unit: '500g' },
  { id: 'lf-4', name: 'Danske løg', price: 12, originalPrice: 18, discount: '-33%', category: 'Frugt & Grønt', unit: '2kg' },
  { id: 'lf-5', name: 'Avocado', price: 7, originalPrice: 10, discount: '-30%', category: 'Frugt & Grønt', unit: 'stk' },
  // ── Brød & Bageri ──
  { id: 'lb-1', name: 'Pizzasnegl', price: 12, originalPrice: 18, discount: '-33%', category: 'Brød & Bageri', unit: '110g' },
  { id: 'lb-2', name: 'Focaccia', price: 22, originalPrice: 30, discount: 'Lidl Plus 2 for', category: 'Brød & Bageri', unit: '105-125g' },
  { id: 'lb-3', name: 'Pågen brød', price: 15, originalPrice: 25, discount: '-40%', category: 'Brød & Bageri', unit: '420-900g' },
  // ── Drikkevarer ──
  { id: 'ld-1', name: 'Peter Larsen Kaffe', price: 35, originalPrice: 45, discount: 'Lidl Plus', category: 'Drikkevarer', unit: '400g' },
  { id: 'ld-2', name: 'Solevita juice', price: 20, originalPrice: 28, discount: 'Lidl Plus', category: 'Drikkevarer', unit: '1L' },
  { id: 'ld-3', name: 'Kildelyk sodavand', price: 8, originalPrice: 12, discount: '-33%', category: 'Drikkevarer', unit: '1L' },
  // ── Snacks & Slik ──
  { id: 'ls-1', name: 'Anthon Berg marcipanbrød', price: 7, originalPrice: 10, discount: '-30%', category: 'Snacks & Slik', unit: '33-40g' },
  { id: 'ls-2', name: 'Carletti chokopålæg', price: 10, originalPrice: 14, discount: '-29%', category: 'Snacks & Slik', unit: '73.5g' },
  { id: 'ls-3', name: 'Anthon Berg chokolade', price: 25, originalPrice: 35, discount: '-29%', category: 'Snacks & Slik', unit: '110g' },
  { id: 'ls-4', name: 'Frugtstænger', price: 10, originalPrice: 15, discount: '-33%', category: 'Snacks & Slik', unit: '5x20g' },
  { id: 'ls-5', name: 'Crownfield morgenmad', price: 20, originalPrice: 28, discount: 'Lidl Plus', category: 'Snacks & Slik', unit: '500g' },
  // ── Spansk Uge ──
  { id: 'lsp-1', name: 'Sol&Mar Paella med skaldyr', price: 30, originalPrice: 42, discount: '-29%', category: 'Spansk Uge', unit: '454g' },
  { id: 'lsp-2', name: 'Paella', price: 35, originalPrice: 49, discount: '-29%', category: 'Spansk Uge', unit: '750g' },
  { id: 'lsp-3', name: 'Salchichón / chorizo / serrano', price: 20, originalPrice: 30, discount: '-33%', category: 'Spansk Uge', unit: '80-200g' },
  { id: 'lsp-4', name: 'Stenovnspizza', price: 25, originalPrice: 35, discount: '-29%', category: 'Spansk Uge', unit: '360g' },
  { id: 'lsp-5', name: 'Hård spansk ost / osteplatte', price: 35, originalPrice: 49, discount: '-29%', category: 'Spansk Uge', unit: '150-220g' },
  { id: 'lsp-6', name: 'Tortilla', price: 25, originalPrice: 35, discount: '-29%', category: 'Spansk Uge', unit: '500g' },
  { id: 'lsp-7', name: 'Ekstra jomfru-olivenolie', price: 59, originalPrice: 79, discount: '-25%', category: 'Spansk Uge', unit: '750ml' },
  { id: 'lsp-8', name: 'Gazpacho', price: 25, originalPrice: 35, discount: '-29%', category: 'Spansk Uge', unit: '1L' },
  // ── Italiensk Deluxe ──
  { id: 'li-1', name: 'Deluxe frisk pasta med fyld', price: 15, originalPrice: 22, discount: '-32%', category: 'Italiensk Deluxe', unit: '250g' },
  { id: 'li-2', name: 'Scampisauce', price: 25, originalPrice: 35, discount: '-29%', category: 'Italiensk Deluxe', unit: '300g' },
  { id: 'li-3', name: 'Parmaskinkestykke', price: 198, originalPrice: 249, discount: '-20%', category: 'Italiensk Deluxe', unit: '1kg' },
  // ── Husholdning ──
  { id: 'lh-1', name: 'Floralys toiletpapir', price: 69, originalPrice: 89, discount: 'Lidl Plus', category: 'Husholdning', unit: '20 ruller' },
  { id: 'lh-2', name: 'Vådservietter', price: 20, originalPrice: 30, discount: '3 for 20 kr', category: 'Husholdning', unit: '3 pk' },
  // ── Kæledyr ──
  { id: 'lp-1', name: 'Orlando tørfoder hunde', price: 59, originalPrice: 89, discount: 'Lidl Plus', category: 'Kæledyr', unit: '10kg' },
  { id: 'lp-2', name: 'Coshida kattetørfoder', price: 20, originalPrice: 30, discount: '-33%', category: 'Kæledyr', unit: '2kg' },
];

/* ─── MENY produktkatalog ─── */

export const MENY_CATALOG: CatalogProduct[] = [
  // ── Kød & Fisk ──
  { id: 'mk-1', name: 'Osseculotte', price: 79.95, originalPrice: 109, discount: '-27%', category: 'Kød & Fisk', unit: '½ kg' },
  { id: 'mk-2', name: 'Hakket grisekød', price: 25, originalPrice: 35, discount: 'Medlemspris', category: 'Kød & Fisk', unit: '500g' },
  { id: 'mk-3', name: 'Dansk kyllingebryst', price: 45, originalPrice: 65, discount: '-31%', category: 'Kød & Fisk', unit: '500g' },
  { id: 'mk-4', name: 'Hel flanksteak', price: 89.95, originalPrice: 119, discount: '-24%', category: 'Kød & Fisk', unit: '600-800g' },
  { id: 'mk-5', name: 'Kalveschnitzel', price: 69.95, originalPrice: 99, discount: '-29%', category: 'Kød & Fisk', unit: '400g' },
  { id: 'mk-6', name: 'Koteletter / kamsteg', price: 49.95, originalPrice: 69, discount: '-28%', category: 'Kød & Fisk', unit: '800-1000g' },
  { id: 'mk-7', name: 'Røget laks', price: 39.95, originalPrice: 55, discount: '-27%', category: 'Kød & Fisk', unit: '100g' },
  // ── Mejeri & Pålæg ──
  { id: 'mm-1', name: 'Lurpak smør', price: 15.95, originalPrice: 24, discount: '-34%', category: 'Mejeri & Pålæg', unit: '200g' },
  { id: 'mm-2', name: 'Arla skyr / yoghurt', price: 12, originalPrice: 18, discount: '-33%', category: 'Mejeri & Pålæg', unit: '1L' },
  { id: 'mm-3', name: 'Castello ost', price: 25, originalPrice: 35, discount: '-29%', category: 'Mejeri & Pålæg', unit: '200g' },
  { id: 'mm-4', name: 'Frilandsæg', price: 22, originalPrice: 32, discount: '-31%', category: 'Mejeri & Pålæg', unit: '10 stk' },
  { id: 'mm-5', name: 'Tulip skinke / pålæg', price: 15, originalPrice: 22, discount: '-32%', category: 'Mejeri & Pålæg', unit: '100-200g' },
  // ── Frugt & Grønt ──
  { id: 'mf-1', name: 'Jordbær', price: 25, originalPrice: 39, discount: '-36%', category: 'Frugt & Grønt', unit: '400g' },
  { id: 'mf-2', name: 'Avocado', price: 5, originalPrice: 8, discount: '-38%', category: 'Frugt & Grønt', unit: 'stk' },
  { id: 'mf-3', name: 'Blomkål / broccoli', price: 12, originalPrice: 18, discount: '-33%', category: 'Frugt & Grønt', unit: 'stk' },
  { id: 'mf-4', name: 'Nye kartofler', price: 15, originalPrice: 22, discount: '-32%', category: 'Frugt & Grønt', unit: '1kg' },
  { id: 'mf-5', name: 'Salat mix', price: 18, originalPrice: 25, discount: '-28%', category: 'Frugt & Grønt', unit: '250g' },
  // ── Drikkevarer ──
  { id: 'md-1', name: 'Coca-Cola', price: 69.95, originalPrice: 96, discount: '-27%', category: 'Drikkevarer', unit: '24x33cl' },
  { id: 'md-2', name: 'Faxe Kondi / Pepsi Max', price: 12, originalPrice: 18, discount: '-33%', category: 'Drikkevarer', unit: '1.5L' },
  { id: 'md-3', name: 'Ramlösa / kildevand', price: 8, originalPrice: 12, discount: '-33%', category: 'Drikkevarer', unit: '75cl' },
  { id: 'md-4', name: 'Kaffe helbønner', price: 49.95, originalPrice: 69, discount: '-28%', category: 'Drikkevarer', unit: '400g' },
  // ── Vin & Spiritus ──
  { id: 'mv-1', name: 'Valpolicella Classico', price: 49.95, originalPrice: 79, discount: '-37%', category: 'Vin & Spiritus', unit: '75cl' },
  { id: 'mv-2', name: 'Amarone della Valpolicella', price: 149.95, originalPrice: 199, discount: '-25%', category: 'Vin & Spiritus', unit: '75cl' },
  { id: 'mv-3', name: 'Prosecco / Cava', price: 59.95, originalPrice: 79, discount: '-24%', category: 'Vin & Spiritus', unit: '75cl' },
  { id: 'mv-4', name: 'Bourgogne rød / hvid', price: 79.95, originalPrice: 109, discount: '-27%', category: 'Vin & Spiritus', unit: '75cl' },
  { id: 'mv-5', name: 'Chianti Classico Riserva', price: 89.95, originalPrice: 129, discount: '-30%', category: 'Vin & Spiritus', unit: '75cl' },
  { id: 'mv-6', name: 'Champagne Moët & Chandon', price: 249.95, originalPrice: 329, discount: '-24%', category: 'Vin & Spiritus', unit: '75cl' },
  { id: 'mv-7', name: 'Gin & Tonic pakke', price: 129.95, originalPrice: 169, discount: '-23%', category: 'Vin & Spiritus', unit: 'sæt' },
  { id: 'mv-8', name: 'Whisky single malt', price: 199.95, originalPrice: 269, discount: '-26%', category: 'Vin & Spiritus', unit: '70cl' },
  // ── Kolonial ──
  { id: 'mc-1', name: 'Pasta frisk / tørret', price: 15, originalPrice: 22, discount: '-32%', category: 'Kolonial', unit: '500g' },
  { id: 'mc-2', name: 'Olivolja extra virgin', price: 39.95, originalPrice: 55, discount: '-27%', category: 'Kolonial', unit: '500ml' },
  { id: 'mc-3', name: 'San Marzano tomater', price: 18, originalPrice: 25, discount: '-28%', category: 'Kolonial', unit: '400g' },
  { id: 'mc-4', name: 'Pesto / pastasauce', price: 22, originalPrice: 32, discount: '-31%', category: 'Kolonial', unit: '190g' },
  // ── Bageri ──
  { id: 'mb-1', name: 'Croissanter', price: 22, originalPrice: 32, discount: '-31%', category: 'Bageri', unit: '4 stk' },
  { id: 'mb-2', name: 'Ciabatta / focaccia', price: 18, originalPrice: 25, discount: '-28%', category: 'Bageri', unit: 'stk' },
  { id: 'mb-3', name: 'Rugbrød / fuldkornsbrød', price: 25, originalPrice: 35, discount: '-29%', category: 'Bageri', unit: '750g' },
];

/* ─── Løvbjerg produktkatalog ─── */

export const LOVBJERG_CATALOG: CatalogProduct[] = [
  // ── Kød & Fisk ──
  { id: 'lok-1', name: 'Rose hot wings', price: 59.99, originalPrice: 89, discount: '-33%', category: 'Kød & Fisk', unit: '2kg' },
  { id: 'lok-2', name: 'Hakket oksekød 8-12%', price: 29.99, originalPrice: 45, discount: '-33%', category: 'Kød & Fisk', unit: '400g' },
  { id: 'lok-3', name: 'Kyllingebrystfilet', price: 39.99, originalPrice: 59, discount: '-32%', category: 'Kød & Fisk', unit: '500g' },
  { id: 'lok-4', name: 'Spareribs / nakkekoteletter', price: 49.99, originalPrice: 69, discount: '-28%', category: 'Kød & Fisk', unit: '800g-1kg' },
  { id: 'lok-5', name: 'Bacon skiver', price: 14.99, originalPrice: 22, discount: '-32%', category: 'Kød & Fisk', unit: '150g' },
  { id: 'lok-6', name: 'Pålægsskinke / salami', price: 12.99, originalPrice: 18, discount: '-28%', category: 'Kød & Fisk', unit: '100-200g' },
  { id: 'lok-7', name: 'Fiskefrikadeller / fiskefilet', price: 24.99, originalPrice: 35, discount: '-29%', category: 'Kød & Fisk', unit: '300g' },
  // ── Mejeri ──
  { id: 'lom-1', name: 'Lurpak smør', price: 15.99, originalPrice: 24, discount: '-33%', category: 'Mejeri', unit: '200g' },
  { id: 'lom-2', name: 'Arla yoghurt / skyr', price: 9.99, originalPrice: 16, discount: '-38%', category: 'Mejeri', unit: '1L' },
  { id: 'lom-3', name: 'Skrabeæg', price: 14.99, originalPrice: 22, discount: '-32%', category: 'Mejeri', unit: '10 stk' },
  { id: 'lom-4', name: 'Riberhus / Klovborg ost', price: 19.99, originalPrice: 29, discount: '-31%', category: 'Mejeri', unit: '300g' },
  { id: 'lom-5', name: 'Mælk', price: 8.99, originalPrice: 13, discount: '-31%', category: 'Mejeri', unit: '1L' },
  { id: 'lom-6', name: 'Smøreost / flødeost', price: 9.99, originalPrice: 15, discount: '-33%', category: 'Mejeri', unit: '200g' },
  // ── Frugt & Grønt ──
  { id: 'lof-1', name: 'Bananer', price: 6.99, originalPrice: 12, discount: '-42%', category: 'Frugt & Grønt', unit: 'bundt' },
  { id: 'lof-2', name: 'Agurk', price: 4.99, originalPrice: 9, discount: '-45%', category: 'Frugt & Grønt', unit: 'stk' },
  { id: 'lof-3', name: 'Tomater', price: 9.99, originalPrice: 16, discount: '-38%', category: 'Frugt & Grønt', unit: '500g' },
  { id: 'lof-4', name: 'Æbler / pærer', price: 12.99, originalPrice: 20, discount: '-35%', category: 'Frugt & Grønt', unit: '1kg' },
  { id: 'lof-5', name: 'Salat iceberg', price: 7.99, originalPrice: 12, discount: '-33%', category: 'Frugt & Grønt', unit: 'stk' },
  { id: 'lof-6', name: 'Kartofler', price: 9.99, originalPrice: 16, discount: '-38%', category: 'Frugt & Grønt', unit: '2kg' },
  // ── Kolonial ──
  { id: 'loc-1', name: 'Pasta', price: 6.99, originalPrice: 12, discount: '-42%', category: 'Kolonial', unit: '1kg' },
  { id: 'loc-2', name: 'Ris', price: 9.99, originalPrice: 16, discount: '-38%', category: 'Kolonial', unit: '1kg' },
  { id: 'loc-3', name: 'Flåede tomater', price: 5.99, originalPrice: 10, discount: '-40%', category: 'Kolonial', unit: '400g' },
  { id: 'loc-4', name: 'Kaffe formalet', price: 34.99, originalPrice: 49, discount: '-29%', category: 'Kolonial', unit: '400g' },
  { id: 'loc-5', name: 'Müsli / havrefras', price: 19.99, originalPrice: 30, discount: '-33%', category: 'Kolonial', unit: '500g' },
  { id: 'loc-6', name: 'Marmelade / honning', price: 14.99, originalPrice: 22, discount: '-32%', category: 'Kolonial', unit: '340g' },
  // ── Drikkevarer ──
  { id: 'lod-1', name: 'Coca-Cola / Faxe Kondi', price: 9.99, originalPrice: 16, discount: '-38%', category: 'Drikkevarer', unit: '1.5L' },
  { id: 'lod-2', name: 'Juice appelsin', price: 12.99, originalPrice: 20, discount: '-35%', category: 'Drikkevarer', unit: '1L' },
  { id: 'lod-3', name: 'Øl ramme', price: 59.99, originalPrice: 85, discount: '-29%', category: 'Drikkevarer', unit: '24x33cl' },
  { id: 'lod-4', name: 'Kildevand', price: 2.99, originalPrice: 5, discount: '-40%', category: 'Drikkevarer', unit: '50cl' },
  // ── Brød & Bageri ──
  { id: 'lob-1', name: 'Rugbrød', price: 12.99, originalPrice: 20, discount: '-35%', category: 'Brød & Bageri', unit: '1kg' },
  { id: 'lob-2', name: 'Franskbrød / boller', price: 9.99, originalPrice: 16, discount: '-38%', category: 'Brød & Bageri', unit: 'stk' },
  { id: 'lob-3', name: 'Wienerbrød / kanelsnurre', price: 14.99, originalPrice: 22, discount: '-32%', category: 'Brød & Bageri', unit: '2-4 stk' },
  // ── Husholdning ──
  { id: 'loh-1', name: 'Lambi toiletpapir', price: 19.99, originalPrice: 32, discount: '-38%', category: 'Husholdning', unit: '8 ruller' },
  { id: 'loh-2', name: 'Vaskemiddel', price: 29.99, originalPrice: 45, discount: '-33%', category: 'Husholdning', unit: '1L' },
  { id: 'loh-3', name: 'Opvaskemiddel / tabs', price: 24.99, originalPrice: 39, discount: '-36%', category: 'Husholdning', unit: 'stk' },
  // ── Snacks & Slik ──
  { id: 'los-1', name: 'Chips', price: 14.99, originalPrice: 22, discount: '-32%', category: 'Snacks & Slik', unit: '175g' },
  { id: 'los-2', name: 'Chokolade / slik', price: 9.99, originalPrice: 16, discount: '-38%', category: 'Snacks & Slik', unit: '100-200g' },
  { id: 'los-3', name: 'Is bæger', price: 29.99, originalPrice: 45, discount: '-33%', category: 'Snacks & Slik', unit: '500ml' },
];

/* ─── Coop 365 produktkatalog ─── */

export const COOP365_CATALOG: CatalogProduct[] = [
  // ── Kød & Fisk ──
  { id: 'ck-1', name: 'X-tra hakket oksekød', price: 28, originalPrice: 40, discount: '-30%', category: 'Kød & Fisk', unit: '500g' },
  { id: 'ck-2', name: 'Dansk kalkun pålæg', price: 15, originalPrice: 22, discount: '-32%', category: 'Kød & Fisk', unit: '150g' },
  { id: 'ck-3', name: 'Fiskefilet naturel', price: 30, originalPrice: 45, discount: '-33%', category: 'Kød & Fisk', unit: '400g' },
  // ── Mejeri ──
  { id: 'cm-1', name: 'X-tra Mælk', price: 7, originalPrice: 10, discount: '-30%', category: 'Mejeri', unit: '1L' },
  { id: 'cm-2', name: 'X-tra Smør', price: 15, originalPrice: 24, discount: '-38%', category: 'Mejeri', unit: '200g' },
  { id: 'cm-3', name: 'Arla A38 kefir', price: 10, originalPrice: 15, discount: '-33%', category: 'Mejeri', unit: '1L' },
  // ── Brød & Morgenmad ──
  { id: 'cb-1', name: 'X-tra Toastbrød', price: 10, originalPrice: 15, discount: '-33%', category: 'Brød & Morgenmad', unit: 'stk' },
  { id: 'cb-2', name: 'Coop havregryn', price: 12, originalPrice: 18, discount: '-33%', category: 'Brød & Morgenmad', unit: '1 kg' },
  // ── Drikkevarer ──
  { id: 'cd-1', name: 'X-tra Appelsinjuice', price: 8, originalPrice: 14, discount: '-43%', category: 'Drikkevarer', unit: '1L' },
  { id: 'cd-2', name: 'Tuborg Classic', price: 55, originalPrice: 85, discount: '-35%', category: 'Drikkevarer', unit: '12 stk' },
  // ── Frugt & Grønt ──
  { id: 'cf-1', name: 'Øko bananer', price: 15, originalPrice: 22, discount: '-32%', category: 'Frugt & Grønt', unit: '1 kg' },
  { id: 'cf-2', name: 'Peberfrugt mix', price: 12, originalPrice: 18, discount: '-33%', category: 'Frugt & Grønt', unit: '3 stk' },
  { id: 'cf-3', name: 'Broccoli', price: 8, originalPrice: 12, discount: '-33%', category: 'Frugt & Grønt', unit: 'stk' },
  // ── Husholdning ──
  { id: 'ch-1', name: 'X-tra opvaskemiddel', price: 12, originalPrice: 20, discount: '-40%', category: 'Husholdning', unit: '500ml' },
  { id: 'ch-2', name: 'Lambi toiletpapir', price: 32, originalPrice: 50, discount: '-36%', category: 'Husholdning', unit: '12 ruller' },
];

/* ─── Store catalogs lookup ─── */

const BILKA_FLYER = FLYERS.find(f => f.id === 'bilka')!;

export const STORE_CATALOGS: Record<string, CatalogProduct[]> = {
  bilka: enrichCatalogWithCropImages(BILKA_CATALOG, BILKA_FLYER),
  netto: NETTO_CATALOG,
  foetex: FOETEX_CATALOG,
  rema1000: REMA_CATALOG,
  lidl: LIDL_CATALOG,
  meny: MENY_CATALOG,
  lovbjerg: LOVBJERG_CATALOG,
  coop365: COOP365_CATALOG,
};

export function getCategoriesForStore(storeId: string): string[] {
  const catalog = STORE_CATALOGS[storeId] || [];
  return [...new Set(catalog.map(p => p.category))];
}
