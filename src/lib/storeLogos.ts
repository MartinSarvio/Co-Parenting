/**
 * Butik-metadata: logoer, farver, initialer
 */

export const STORE_LOGOS: Record<string, string> = {
  bilka:    'https://logo.clearbit.com/bilka.dk',
  netto:    'https://www.google.com/s2/favicons?domain=netto.dk&sz=128',
  foetex:   'https://logo.clearbit.com/foetex.dk',
  rema1000: 'https://static-assets.digital.rema1000.dk/rema1000.dk/REMA1000_schema_organization_logo.png',
  lidl:     'https://logo.clearbit.com/lidl.dk',
  meny:     'https://logo.clearbit.com/meny.dk',
  lovbjerg: '/logos/lovbjerg.webp',
  coop365:  'https://365discount.coop.dk/media/poklygxe/365_logo_cmyk-1.png?height=128',
  brugsen:      'https://www.google.com/s2/favicons?domain=brugsen.dk&sz=128',
  kvickly:      'https://www.google.com/s2/favicons?domain=kvickly.coop.dk&sz=128',
  superbrugsen: 'https://www.google.com/s2/favicons?domain=superbrugsen.coop.dk&sz=128',
  br:       'https://logo.clearbit.com/br.dk',
  zalando:  'https://logo.clearbit.com/zalando.dk',
  elgiganten: 'https://logo.clearbit.com/elgiganten.dk',
};

/** Google Favicon fallback URLs */
const FAVICON_FALLBACK: Record<string, string> = {
  bilka:    'https://www.google.com/s2/favicons?domain=bilka.dk&sz=128',
  netto:    'https://www.google.com/s2/favicons?domain=netto.dk&sz=128',
  foetex:   'https://www.google.com/s2/favicons?domain=foetex.dk&sz=128',
  rema1000: 'https://www.google.com/s2/favicons?domain=rema1000.dk&sz=128',
  lidl:     'https://www.google.com/s2/favicons?domain=lidl.dk&sz=128',
  meny:     'https://www.google.com/s2/favicons?domain=meny.dk&sz=128',
  lovbjerg: '/logos/lovbjerg.webp',
  coop365:      'https://www.google.com/s2/favicons?domain=365discount.coop.dk&sz=128',
  brugsen:      'https://www.google.com/s2/favicons?domain=brugsen.dk&sz=128',
  kvickly:      'https://www.google.com/s2/favicons?domain=kvickly.coop.dk&sz=128',
  superbrugsen: 'https://www.google.com/s2/favicons?domain=superbrugsen.coop.dk&sz=128',
};

export function getFaviconFallback(storeId: string): string | undefined {
  return FAVICON_FALLBACK[storeId];
}

export interface StoreInfo {
  id: string;
  name: string;
  color: string;
  initial: string;
  logoUrl: string;
}

export const ALL_STORES: StoreInfo[] = [
  { id: 'bilka',    name: 'Bilka',      color: '#00AEEF', initial: 'B', logoUrl: STORE_LOGOS.bilka },
  { id: 'netto',    name: 'Netto',      color: '#FFD950', initial: 'N', logoUrl: STORE_LOGOS.netto },
  { id: 'foetex',   name: 'Føtex',      color: '#1D2F54', initial: 'F', logoUrl: STORE_LOGOS.foetex },
  { id: 'rema1000', name: 'REMA 1000',  color: '#014693', initial: 'R', logoUrl: STORE_LOGOS.rema1000 },
  { id: 'lidl',     name: 'Lidl',       color: '#0050AA', initial: 'L', logoUrl: STORE_LOGOS.lidl },
  { id: 'meny',     name: 'MENY',       color: '#D4001C', initial: 'M', logoUrl: STORE_LOGOS.meny },
  { id: 'lovbjerg', name: 'Løvbjerg',   color: '#E31937', initial: 'Lø', logoUrl: STORE_LOGOS.lovbjerg },
  { id: 'coop365',      name: 'Coop 365',      color: '#00A651', initial: 'C',  logoUrl: STORE_LOGOS.coop365 },
  { id: 'brugsen',      name: 'Brugsen',       color: '#E1251B', initial: 'B',  logoUrl: STORE_LOGOS.brugsen },
  { id: 'kvickly',      name: 'Kvickly',       color: '#E1251B', initial: 'K',  logoUrl: STORE_LOGOS.kvickly },
  { id: 'superbrugsen', name: 'SuperBrugsen',  color: '#E1251B', initial: 'SB', logoUrl: STORE_LOGOS.superbrugsen },
];

const storeMap = new Map(ALL_STORES.map(s => [s.id, s]));

export function getStoreInfo(storeId: string): StoreInfo | undefined {
  return storeMap.get(storeId);
}

/** Lookup store info by store name (for offers that use name instead of id) */
export function getStoreInfoByName(storeName: string): StoreInfo | undefined {
  const lower = storeName.toLowerCase();
  return ALL_STORES.find(s => s.name.toLowerCase() === lower);
}

/** Returns true if a color is light enough to need dark text on top */
export function needsDarkText(hex: string): boolean {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  // Relative luminance threshold
  return (r * 299 + g * 587 + b * 114) / 1000 > 160;
}
