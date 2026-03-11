import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface ParseBatchInput {
  id: string;
  file_url: string | null;
  store: string | null;
}

export async function parsePdfBatch(batch: ParseBatchInput, onDone?: () => void) {
  const toastId = toast.loading('Parser PDF — henter nøgle...');
  try {
    // 1. Update status to processing
    await supabase.from('pdf_import_batches').update({ status: 'processing' }).eq('id', batch.id);

    // 2. Get API key from secure Edge Function
    let apiKey = '';
    try {
      const res = await supabase.functions.invoke('get-api-config');
      if (res.error) {
        console.error('get-api-config error:', res.error);
        toast.error('API-nøgle fejl: ' + (res.error.message || 'Edge Function fejl'), { id: toastId });
        await supabase.from('pdf_import_batches').update({ status: 'failed', error_message: 'get-api-config: ' + res.error.message }).eq('id', batch.id);
        return;
      }
      if (!res.data?.anthropicKey) {
        toast.error('ANTHROPIC_API_KEY ikke konfigureret på serveren', { id: toastId });
        await supabase.from('pdf_import_batches').update({ status: 'failed', error_message: 'API-nøgle mangler i secrets' }).eq('id', batch.id);
        return;
      }
      apiKey = res.data.anthropicKey;
    } catch (fnErr) {
      console.error('get-api-config exception:', fnErr);
      toast.error('Edge Function fejl: ' + (fnErr instanceof Error ? fnErr.message : String(fnErr)), { id: toastId });
      await supabase.from('pdf_import_batches').update({ status: 'failed', error_message: 'get-api-config exception' }).eq('id', batch.id);
      return;
    }

    // 3. Build public URL for the PDF — Claude downloads it server-side
    if (!batch.file_url) {
      toast.error('Ingen fil-URL fundet', { id: toastId });
      return;
    }
    const { data: urlData } = supabase.storage.from('tilbudsaviser').getPublicUrl(batch.file_url);
    const pdfUrl = urlData?.publicUrl;
    if (!pdfUrl) {
      toast.error('Kunne ikke generere public URL', { id: toastId });
      return;
    }
    console.log('PDF public URL:', pdfUrl);

    // 4. Call Claude API — PDF sent as URL (Claude downloads it, no mobile memory issues)
    toast.loading('AI analyserer tilbudsavis...', { id: toastId });
    const storeHint = batch.store ? `Denne tilbudsavis er fra butikken: ${batch.store}. ` : '';

    let aiResponse: Response;
    try {
      aiResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 8192,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'document',
                source: { type: 'url', url: pdfUrl },
              },
              {
                type: 'text',
                text: `Du er en ekspert i at læse danske tilbudsaviser. ${storeHint}Ekstraher ALLE produkter fra denne tilbudsavis.

For hvert produkt, returnér et JSON-objekt med:
- "title": Produktnavn (string)
- "price": Tilbudspris i kr (string, f.eks. "29,95")
- "original_price": Normalpris hvis tilgængelig (string eller null)
- "discount": Rabat-tekst hvis tilgængelig (string, f.eks. "-40%", "Spar 10 kr" eller null)
- "category": Produktkategori (string, f.eks. "Kød & Fisk", "Mejeri", "Frugt & Grønt", "Brød & Morgenmad", "Drikkevarer", "Snacks", "Husholdning", "Personlig pleje", "Andet")
- "unit": Enhed hvis tilgængelig (string, f.eks. "pr. kg", "pr. stk", "1 L" eller null)
- "confidence": Din sikkerhed i ekstraktionen fra 0.0 til 1.0 (number)

Returnér UDELUKKENDE et JSON-array med disse objekter. Ingen anden tekst.
Eksempel: [{"title":"Hakket oksekød","price":"39,95","original_price":"59,95","discount":"-33%","category":"Kød & Fisk","unit":"pr. 500g","confidence":0.95}]`,
              },
            ],
          }],
        }),
      });
    } catch (fetchErr) {
      console.error('Claude API fetch failed:', fetchErr);
      toast.error('Netværksfejl: ' + (fetchErr instanceof Error ? fetchErr.message : String(fetchErr)), { id: toastId });
      await supabase.from('pdf_import_batches').update({ status: 'failed', error_message: 'fetch fejl: ' + String(fetchErr) }).eq('id', batch.id);
      return;
    }

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error('Claude API error:', aiResponse.status, errText);
      toast.error(`AI fejl (${aiResponse.status}): ${errText.slice(0, 100)}`, { id: toastId });
      await supabase.from('pdf_import_batches').update({ status: 'failed', error_message: `AI ${aiResponse.status}: ${errText.slice(0, 300)}` }).eq('id', batch.id);
      return;
    }

    // 5. Parse response
    toast.loading('Behandler AI-svar...', { id: toastId });
    const aiResult = await aiResponse.json();
    const aiText = aiResult.content?.[0]?.text ?? '';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let products: any[] = [];
    try {
      products = JSON.parse(aiText);
    } catch {
      const jsonMatch = aiText.match(/\[[\s\S]*\]/);
      if (jsonMatch) products = JSON.parse(jsonMatch[0]);
    }

    if (!Array.isArray(products) || products.length === 0) {
      toast.error('Ingen produkter fundet i PDF', { id: toastId });
      await supabase.from('pdf_import_batches').update({ status: 'failed', error_message: 'AI fandt 0 produkter' }).eq('id', batch.id);
      return;
    }

    // 6. Insert products
    toast.loading(`Gemmer ${products.length} produkter...`, { id: toastId });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items = products.map((p: any) => ({
      batch_id: batch.id,
      title: p.title ?? 'Ukendt produkt',
      price: p.price ?? null,
      original_price: p.original_price ?? null,
      discount: p.discount ?? null,
      category: p.category ?? null,
      unit: p.unit ?? null,
      confidence: Math.min(1, Math.max(0, p.confidence ?? 0.5)),
      raw_extraction: p,
    }));

    await supabase.from('pdf_import_items').insert(items);

    // 7. Update batch
    const lowConfidence = items.filter((it: { confidence: number }) => it.confidence < 0.7).length;
    await supabase.from('pdf_import_batches').update({
      status: 'preview',
      total_products: items.length,
      low_confidence_count: lowConfidence,
      processed_at: new Date().toISOString(),
    }).eq('id', batch.id);

    toast.success(`${items.length} produkter fundet!`, { id: toastId });
    onDone?.();
  } catch (err) {
    console.error('parsePdfBatch error:', err);
    toast.error('PDF-parsing fejlede: ' + (err instanceof Error ? err.message : 'Ukendt fejl'), { id: toastId });
    try {
      await supabase.from('pdf_import_batches').update({ status: 'failed', error_message: String(err) }).eq('id', batch.id);
    } catch { /* ignore */ }
  }
}
