/**
 * Tilbud integration — Salling Group API + fallback
 *
 * Salling Group API: developer.sallinggroup.com
 * - Ejer: Netto, Føtex, Bilka
 * - Gratis developer-konto
 * - ENV: VITE_SALLING_API_KEY
 *
 * Når API-nøgle er sat, hentes live tilbud.
 * Ellers bruges realistiske fallback-data med rigtige produktnavne.
 */

export interface OfferCropImage {
  pageImageUrl: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Offer {
  id: string;
  title: string;
  store: string;
  storeColor: string;
  price: number;
  originalPrice: number;
  discount: string;
  imageUrl?: string;
  cropImage?: OfferCropImage;
  category: string;
  validUntil: string;
  unit?: string;
  description?: string;
  webUrl?: string;
}

// Realistiske tilbud med rigtige produktnavne og priser fra danske butikker
const FALLBACK_OFFERS: Offer[] = [
  // Netto
  { id: '1', title: 'Matilde kakaoskummetmælk', store: 'Netto', storeColor: '#FFD950', price: 8, originalPrice: 13, discount: '-38%', category: 'Mejeri', validUntil: '6. mar', unit: '1L' },
  { id: '2', title: 'Kyllingeoverlår', store: 'Netto', storeColor: '#FFD950', price: 10, originalPrice: 18, discount: '-44%', category: 'Kød', validUntil: '6. mar', unit: '300g' },
  { id: '6', title: 'Taffel chips', store: 'Netto', storeColor: '#FFD950', price: 10, originalPrice: 18, discount: '-44%', category: 'Snacks', validUntil: '6. mar', unit: '110g' },
  { id: '11', title: 'Mutti tomater', store: 'Netto', storeColor: '#FFD950', price: 8, originalPrice: 14, discount: '-43%', category: 'Kolonial', validUntil: '6. mar', unit: '400g' },
  { id: 'n5', title: 'Netto spaghetti', store: 'Netto', storeColor: '#FFD950', price: 5, originalPrice: 9, discount: '-44%', category: 'Kolonial', validUntil: '6. mar', unit: '500g' },
  { id: 'n6', title: 'Netto fløde 38%', store: 'Netto', storeColor: '#FFD950', price: 12, originalPrice: 20, discount: '-40%', category: 'Mejeri', validUntil: '6. mar', unit: '500ml' },
  // Bilka
  { id: '3', title: 'Coca-Cola 24 stk.', store: 'Bilka', storeColor: '#00AEEF', price: 69, originalPrice: 96, discount: '-28%', category: 'Drikkevarer', validUntil: '5. mar', unit: '24x33cl' },
  { id: '5', title: 'Ben & Jerry\'s isbæger', store: 'Bilka', storeColor: '#00AEEF', price: 42, originalPrice: 55, discount: '-24%', category: 'Is', validUntil: '5. mar', unit: '465ml' },
  { id: '10', title: 'Lavazza / Löfbergs helbønner', store: 'Bilka', storeColor: '#00AEEF', price: 165, originalPrice: 219, discount: '-25%', category: 'Kaffe', validUntil: '5. mar', unit: '1kg' },
  { id: 'b4', title: 'Salling grøntsager', store: 'Bilka', storeColor: '#00AEEF', price: 12, originalPrice: 20, discount: '-40%', category: 'Frugt & Grønt', validUntil: '5. mar', unit: 'stk' },
  { id: 'b5', title: 'Riberhus ost 45+', store: 'Bilka', storeColor: '#00AEEF', price: 25, originalPrice: 42, discount: '-40%', category: 'Mejeri', validUntil: '5. mar', unit: '400g' },
  // Føtex
  { id: '13', title: 'Arla Øko letmælk', store: 'Føtex', storeColor: '#1D2F54', price: 10, originalPrice: 15, discount: '-33%', category: 'Mejeri', validUntil: '12. mar', unit: '1L' },
  { id: '14', title: 'Dansk svinekotelet', store: 'Føtex', storeColor: '#1D2F54', price: 35, originalPrice: 55, discount: '-36%', category: 'Kød', validUntil: '12. mar', unit: '500g' },
  { id: 'f3', title: 'Vidal Fleury Ventoux rødvin', store: 'Føtex', storeColor: '#1D2F54', price: 299, originalPrice: 549, discount: '-46%', category: 'Vin', validUntil: '19. mar', unit: '6 flasker' },
  { id: 'f4', title: 'Lurpak smør', store: 'Føtex', storeColor: '#1D2F54', price: 22, originalPrice: 34, discount: '-35%', category: 'Mejeri', validUntil: '12. mar', unit: '200g' },
  { id: 'f5', title: 'Steff Houlberg pølser', store: 'Føtex', storeColor: '#1D2F54', price: 15, originalPrice: 25, discount: '-40%', category: 'Kød', validUntil: '12. mar', unit: '375g' },
  // REMA 1000
  { id: '15', title: 'Schulstad rugbrød', store: 'REMA 1000', storeColor: '#014693', price: 15, originalPrice: 24, discount: '-38%', category: 'Brød', validUntil: '7. mar', unit: 'stk' },
  { id: '16', title: 'Dansk kyllingebryst', store: 'REMA 1000', storeColor: '#014693', price: 45, originalPrice: 65, discount: '-31%', category: 'Kød', validUntil: '7. mar', unit: '500g' },
  { id: 'r3', title: 'Naturmælk yoghurt', store: 'REMA 1000', storeColor: '#014693', price: 12, originalPrice: 18, discount: '-33%', category: 'Mejeri', validUntil: '7. mar', unit: '500g' },
  { id: 'r4', title: 'Grønne æbler', store: 'REMA 1000', storeColor: '#014693', price: 10, originalPrice: 16, discount: '-38%', category: 'Frugt & Grønt', validUntil: '7. mar', unit: '1kg' },
  { id: 'r5', title: 'Haribo mix', store: 'REMA 1000', storeColor: '#014693', price: 15, originalPrice: 25, discount: '-40%', category: 'Snacks', validUntil: '7. mar', unit: '375g' },
  // Lidl
  { id: '17', title: 'Milbona mozzarella', store: 'Lidl', storeColor: '#0050AA', price: 10, originalPrice: 16, discount: '-38%', category: 'Mejeri', validUntil: '7. mar', unit: '250g' },
  { id: '18', title: 'Freeway cola', store: 'Lidl', storeColor: '#0050AA', price: 6, originalPrice: 10, discount: '-40%', category: 'Drikkevarer', validUntil: '7. mar', unit: '1.5L' },
  { id: 'l3', title: 'Påskeæg til ophæng', store: 'Lidl', storeColor: '#0050AA', price: 20, originalPrice: 35, discount: '-43%', category: 'NonFood', validUntil: '7. mar', unit: 'pk' },
  { id: 'l4', title: 'Parkside excentersliber', store: 'Lidl', storeColor: '#0050AA', price: 149, originalPrice: 199, discount: '-25%', category: 'NonFood', validUntil: '7. mar', unit: 'stk' },
  { id: 'l5', title: 'Cien shampoo', store: 'Lidl', storeColor: '#0050AA', price: 15, originalPrice: 25, discount: '-40%', category: 'Pleje', validUntil: '7. mar', unit: '300ml' },
  // MENY
  { id: '19', title: 'Irma kaffe', store: 'MENY', storeColor: '#D4001C', price: 45, originalPrice: 65, discount: '-31%', category: 'Kaffe', validUntil: '5. mar', unit: '400g' },
  { id: '20', title: 'Øgo øko æg', store: 'MENY', storeColor: '#D4001C', price: 28, originalPrice: 42, discount: '-33%', category: 'Mejeri', validUntil: '5. mar', unit: '10 stk' },
  { id: 'm3', title: 'Dansk entrecote', store: 'MENY', storeColor: '#D4001C', price: 89, originalPrice: 139, discount: '-36%', category: 'Kød', validUntil: '5. mar', unit: '300g' },
  { id: 'm4', title: 'San Pellegrino', store: 'MENY', storeColor: '#D4001C', price: 18, originalPrice: 28, discount: '-36%', category: 'Drikkevarer', validUntil: '5. mar', unit: '750ml' },
  { id: 'm5', title: 'Castello blåskimmel', store: 'MENY', storeColor: '#D4001C', price: 30, originalPrice: 48, discount: '-38%', category: 'Mejeri', validUntil: '5. mar', unit: '150g' },
  // Løvbjerg
  { id: '21', title: 'Kims snackchips', store: 'Løvbjerg', storeColor: '#E31937', price: 15, originalPrice: 25, discount: '-40%', category: 'Snacks', validUntil: '5. mar', unit: '175g' },
  { id: '22', title: 'Riberhus ost', store: 'Løvbjerg', storeColor: '#E31937', price: 25, originalPrice: 40, discount: '-38%', category: 'Mejeri', validUntil: '5. mar', unit: '300g' },
  { id: 'lv3', title: 'Grøn pesto', store: 'Løvbjerg', storeColor: '#E31937', price: 18, originalPrice: 30, discount: '-40%', category: 'Kolonial', validUntil: '5. mar', unit: '190g' },
  { id: 'lv4', title: 'Øko bananer', store: 'Løvbjerg', storeColor: '#E31937', price: 15, originalPrice: 22, discount: '-32%', category: 'Frugt & Grønt', validUntil: '5. mar', unit: '1kg' },
  // Coop 365
  { id: '23', title: 'X-tra havregryn', store: 'Coop 365', storeColor: '#00A651', price: 8, originalPrice: 14, discount: '-43%', category: 'Morgenmad', validUntil: '4. mar', unit: '1kg' },
  { id: '24', title: 'X-tra hakket oksekød', store: 'Coop 365', storeColor: '#00A651', price: 30, originalPrice: 45, discount: '-33%', category: 'Kød', validUntil: '4. mar', unit: '400g' },
  { id: 'c3', title: 'X-tra appelsinjuice', store: 'Coop 365', storeColor: '#00A651', price: 8, originalPrice: 14, discount: '-43%', category: 'Drikkevarer', validUntil: '4. mar', unit: '1L' },
  { id: 'c4', title: 'X-tra smør', store: 'Coop 365', storeColor: '#00A651', price: 15, originalPrice: 24, discount: '-38%', category: 'Mejeri', validUntil: '4. mar', unit: '200g' },
  { id: 'c5', title: 'Lambi toiletpapir', store: 'Coop 365', storeColor: '#00A651', price: 32, originalPrice: 50, discount: '-36%', category: 'Husholdning', validUntil: '4. mar', unit: '12 ruller' },
];

// Gave- og ønskeliste-tilbud (legetøj, tøj, elektronik etc.)
const GIFT_OFFERS: Offer[] = [
  { id: 'g1', title: 'iRobot Roomba Combo 2 Essential', store: 'Bilka', storeColor: '#00AEEF', price: 1499, originalPrice: 2999, discount: '-50%', category: 'Elektronik', validUntil: '5. mar', unit: 'stk', description: 'Robotstøvsuger med 4-trins rengøringssystem' },
  { id: 'g2', title: 'Samsung Galaxy S25 Plus 256GB', store: 'Bilka', storeColor: '#00AEEF', price: 5333, originalPrice: 5499, discount: '-3%', category: 'Elektronik', validUntil: '12. mar', unit: 'stk', description: '6,7" QHD+ Dynamic AMOLED, 12MP forsidekamera' },
  { id: 'g3', title: 'iPhone Air 256GB', store: 'Bilka', storeColor: '#00AEEF', price: 7799, originalPrice: 8299, discount: '-6%', category: 'Elektronik', validUntil: '12. mar', unit: 'stk', description: 'Den tyndeste iPhone. 6,5" skærm, A19 Pro-chip' },
  { id: 'g4', title: 'Krups Nespresso XN8908 Atelier', store: 'Bilka', storeColor: '#00AEEF', price: 1199, originalPrice: 1399, discount: '-14%', category: 'Elektronik', validUntil: '5. mar', unit: 'stk', description: '1500 watt, 9 kaffespecialiteter, indbygget steamer' },
  { id: 'g5', title: 'Samsung Neo QLED 55" Smart TV', store: 'Bilka', storeColor: '#00AEEF', price: 5555, originalPrice: 11999, discount: '-54%', category: 'Elektronik', validUntil: '5. mar', unit: 'stk', description: '4K AI Upscaling, 144Hz, AirSlim design' },
  { id: 'g6', title: 'dan-pen Skoletaske', store: 'Bilka', storeColor: '#00AEEF', price: 499, originalPrice: 699, discount: '-29%', category: 'Skole', validUntil: '5. mar', unit: 'stk', description: 'Med gymnastiktaske, kølerum, reflekser og nøgleholder' },
];

export async function fetchGiftOffers(): Promise<Offer[]> {
  return GIFT_OFFERS;
}

export async function fetchOffers(): Promise<Offer[]> {
  const apiKey = import.meta.env.VITE_SALLING_API_KEY as string | undefined;

  if (!apiKey) {
    return FALLBACK_OFFERS;
  }

  try {
    // Salling Group food-waste endpoint (nærmeste tilbuds-API)
    // Se developer.sallinggroup.com for fuld dokumentation
    const res = await fetch('https://api.sallinggroup.com/v1/food-waste/', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      console.warn('Salling API fejl:', res.status);
      return FALLBACK_OFFERS;
    }

    const data = await res.json();

    // Map Salling API response til vores Offer interface
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data.clearances || data).slice(0, 12).map((item: any, i: number) => ({
      id: `salling-${i}`,
      title: item.product?.description || item.offer?.heading || `Produkt ${i + 1}`,
      store: item.store?.name || 'Salling',
      storeColor: '#3b82f6',
      price: item.offer?.newPrice || item.product?.price || 0,
      originalPrice: item.offer?.originalPrice || item.product?.originalPrice || 0,
      discount: item.offer?.percentDiscount ? `-${item.offer.percentDiscount}%` : '-30%',
      category: item.product?.categories?.da || 'Diverse',
      validUntil: item.offer?.endTime ? new Date(item.offer.endTime).toLocaleDateString('da-DK', { day: 'numeric', month: 'short' }) : '2. mar',
    }));
  } catch (err) {
    console.warn('Kunne ikke hente tilbud:', err);
    return FALLBACK_OFFERS;
  }
}
