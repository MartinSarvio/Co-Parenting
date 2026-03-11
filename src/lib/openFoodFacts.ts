// Shared Open Food Facts API + barcode scanner utilities

export type OFFResult = {
  name: string;
  brand?: string;
  imageUrl?: string;
  quantity?: string;
  categories?: string;
  barcode?: string;
  kcalPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g?: number;
  sugarPer100g?: number;
  saltPer100g?: number;
  saturatedFatPer100g?: number;
  nutriscoreGrade?: string;
  novaGroup?: number;
  allergens?: string[];
};

export async function fetchFromOpenFoodFacts(barcode: string): Promise<OFFResult | null> {
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`,
      { headers: { 'User-Agent': 'SammenApp/1.0 (kontakt@sammenapp.dk)' } }
    );
    const data = await res.json() as {
      status: number;
      product?: {
        product_name?: string;
        product_name_da?: string;
        generic_name?: string;
        brands?: string;
        image_front_url?: string;
        quantity?: string;
        categories?: string;
        nutriscore_grade?: string;
        nova_groups?: string;
        allergens_tags?: string[];
        nutriments?: Record<string, number>;
      };
    };
    if (data.status !== 1 || !data.product) return null;
    const p = data.product;
    const n = p.nutriments ?? {};
    return {
      name: p.product_name || p.product_name_da || p.generic_name || `Stregkode ${barcode}`,
      brand: p.brands,
      imageUrl: p.image_front_url,
      quantity: p.quantity,
      categories: p.categories,
      barcode,
      kcalPer100g: n['energy-kcal_100g'] ?? n['energy-kcal'] ?? 0,
      proteinPer100g: n['proteins_100g'] ?? n['proteins'] ?? 0,
      carbsPer100g: n['carbohydrates_100g'] ?? n['carbohydrates'] ?? 0,
      fatPer100g: n['fat_100g'] ?? n['fat'] ?? 0,
      fiberPer100g: n['fiber_100g'] ?? n['fiber'],
      sugarPer100g: n['sugars_100g'] ?? n['sugars'],
      saltPer100g: n['salt_100g'] ?? n['salt'],
      saturatedFatPer100g: n['saturated-fat_100g'] ?? n['saturated_fat_100g'],
      nutriscoreGrade: p.nutriscore_grade || undefined,
      novaGroup: p.nova_groups ? parseInt(p.nova_groups, 10) || undefined : undefined,
      allergens: p.allergens_tags?.length ? p.allergens_tags : undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Search Open Food Facts by text query. Returns product results.
 */
export async function searchProducts(
  query: string,
  page = 1,
  pageSize = 8,
  signal?: AbortSignal
): Promise<{ products: OFFResult[]; count: number }> {
  if (!query.trim()) return { products: [], count: 0 };
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);
  try {
    const params = new URLSearchParams({
      search_terms: query,
      search_simple: '1',
      action: 'process',
      json: '1',
      page: String(page),
      page_size: String(pageSize),
      fields: 'code,product_name,product_name_da,generic_name,brands,quantity,categories,nutriments,nutriscore_grade,nova_groups,allergens_tags',
    });
    const mergedSignal = signal
      ? AbortSignal.any([signal, controller.signal])
      : controller.signal;
    const res = await fetch(
      `https://world.openfoodfacts.org/cgi/search.pl?${params}`,
      { headers: { 'User-Agent': 'SammenApp/1.0 (kontakt@sammenapp.dk)' }, signal: mergedSignal }
    );
    clearTimeout(timeoutId);
    const data = await res.json() as {
      count?: number;
      products?: Array<{
        code?: string;
        product_name?: string;
        product_name_da?: string;
        generic_name?: string;
        brands?: string;
        image_front_small_url?: string;
        image_front_url?: string;
        quantity?: string;
        categories?: string;
        nutriscore_grade?: string;
        nova_groups?: string;
        allergens_tags?: string[];
        nutriments?: Record<string, number>;
      }>;
    };
    const products: OFFResult[] = (data.products ?? [])
      .filter(p => p.product_name || p.product_name_da || p.generic_name)
      .map(p => {
        const n = p.nutriments ?? {};
        return {
          name: p.product_name || p.product_name_da || p.generic_name || 'Ukendt',
          brand: p.brands,
          imageUrl: p.image_front_small_url || p.image_front_url,
          quantity: p.quantity,
          categories: p.categories,
          barcode: p.code,
          kcalPer100g: n['energy-kcal_100g'] ?? n['energy-kcal'] ?? 0,
          proteinPer100g: n['proteins_100g'] ?? n['proteins'] ?? 0,
          carbsPer100g: n['carbohydrates_100g'] ?? n['carbohydrates'] ?? 0,
          fatPer100g: n['fat_100g'] ?? n['fat'] ?? 0,
          fiberPer100g: n['fiber_100g'] ?? n['fiber'],
          sugarPer100g: n['sugars_100g'] ?? n['sugars'],
          saltPer100g: n['salt_100g'] ?? n['salt'],
          saturatedFatPer100g: n['saturated-fat_100g'] ?? n['saturated_fat_100g'],
          nutriscoreGrade: p.nutriscore_grade || undefined,
          novaGroup: p.nova_groups ? parseInt(p.nova_groups, 10) || undefined : undefined,
          allergens: p.allergens_tags?.length ? p.allergens_tags : undefined,
        };
      });
    return { products, count: data.count ?? 0 };
  } catch {
    clearTimeout(timeoutId);
    return { products: [], count: 0 };
  }
}

/**
 * Launch a fullscreen barcode scanner using html5-qrcode.
 * Returns the decoded barcode string, or null if user closes the scanner.
 */
export function startBarcodeScanner(): Promise<string | null> {
  return new Promise(async (resolve) => {
    let resolved = false;
    const safeResolve = (val: string | null) => {
      if (resolved) return;
      resolved = true;
      resolve(val);
    };

    try {
      const { Html5Qrcode } = await import('html5-qrcode');

      const container = document.createElement('div');
      container.id = 'barcode-scanner-container';
      container.style.cssText = 'position:fixed;inset:0;z-index:9999;background:#000;display:flex;flex-direction:column;';

      // Close button (top-right)
      const closeBtn = document.createElement('button');
      closeBtn.textContent = '✕ Luk';
      closeBtn.style.cssText = `position:absolute;top:calc(env(safe-area-inset-top, 16px) + 16px);right:16px;z-index:10000;color:white;font-size:16px;font-weight:600;background:rgba(0,0,0,0.5);border:none;border-radius:12px;padding:8px 16px;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);`;
      container.appendChild(closeBtn);

      // Torch button (top-left)
      const torchBtn = document.createElement('button');
      torchBtn.textContent = '💡 Lys';
      torchBtn.style.cssText = `position:absolute;top:calc(env(safe-area-inset-top, 16px) + 16px);left:16px;z-index:10000;color:white;font-size:16px;font-weight:600;background:rgba(0,0,0,0.5);border:none;border-radius:12px;padding:8px 16px;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);display:none;`;
      container.appendChild(torchBtn);

      // Instruction label
      const label = document.createElement('div');
      label.textContent = 'Hold stregkoden inden for rammen';
      label.style.cssText = `position:absolute;bottom:calc(env(safe-area-inset-bottom, 24px) + 24px);left:50%;transform:translateX(-50%);z-index:10000;color:white;font-size:14px;font-weight:600;background:rgba(0,0,0,0.5);border:none;border-radius:12px;padding:10px 20px;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);white-space:nowrap;`;
      container.appendChild(label);

      const scannerEl = document.createElement('div');
      scannerEl.id = 'html5-qrcode-reader';
      scannerEl.style.cssText = 'width:100%;height:100%;overflow:hidden;';
      container.appendChild(scannerEl);
      document.body.appendChild(container);

      // Inject styles — hide html5-qrcode default UI + fix video display
      const style = document.createElement('style');
      style.textContent = `
        #html5-qrcode-reader { position: relative; }
        #html5-qrcode-reader > div:first-child { display: none !important; }
        #html5-qrcode-reader video {
          object-fit: cover !important;
          width: 100% !important;
          height: 100% !important;
        }
        #html5-qrcode-reader #qr-shaded-region {
          border-color: rgba(245, 138, 45, 0.7) !important;
          border-width: 3px !important;
          border-radius: 16px !important;
        }
      `;
      container.appendChild(style);

      const scanner = new Html5Qrcode('html5-qrcode-reader');

      const cleanup = async () => {
        try { await scanner.stop(); } catch {}
        scanner.clear();
        container.remove();
      };

      closeBtn.onclick = () => {
        void cleanup();
        safeResolve(null);
      };

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 30,
          qrbox: { width: 300, height: 200 },
          experimentalFeatures: { useBarCodeDetectorIfSupported: true },
        } as Parameters<typeof scanner.start>[1],
        (decodedText) => {
          void cleanup();
          safeResolve(decodedText);
        },
        () => {} // ignore intermediate scan errors
      );

      // After camera started — enable torch button if supported
      try {
        const caps = scanner.getRunningTrackCameraCapabilities();
        const torch = caps.torchFeature();
        if (torch.isSupported()) {
          let torchOn = false;
          torchBtn.style.display = 'block';
          torchBtn.onclick = async () => {
            try {
              torchOn = !torchOn;
              await torch.apply(torchOn);
              torchBtn.textContent = torchOn ? '💡 Sluk' : '💡 Lys';
            } catch {}
          };
        }
      } catch {}
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('NotAllowed') || msg.includes('Permission') || msg.includes('denied')) {
        const { toast } = await import('sonner');
        toast.error('Kameraadgang nægtet. Tillad kameraadgang i Indstillinger.');
      }
      safeResolve(null);
    }
  });
}
