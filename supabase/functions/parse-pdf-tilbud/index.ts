import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Auth — hent bruger fra JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Manglende authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Ikke logget ind' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { batchId } = await req.json();
    if (!batchId) {
      return new Response(JSON.stringify({ error: 'Manglende batchId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Service role client for full access
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // 1. Get batch info
    const { data: batch, error: batchErr } = await supabaseAdmin
      .from('pdf_import_batches')
      .select('*')
      .eq('id', batchId)
      .single();

    if (batchErr || !batch) {
      return new Response(JSON.stringify({ error: 'Batch ikke fundet' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update status to processing
    await supabaseAdmin
      .from('pdf_import_batches')
      .update({ status: 'processing' })
      .eq('id', batchId);

    // 2. Download PDF from storage
    const { data: fileData, error: dlErr } = await supabaseAdmin.storage
      .from('tilbudsaviser')
      .download(batch.file_url);

    if (dlErr || !fileData) {
      await supabaseAdmin
        .from('pdf_import_batches')
        .update({ status: 'failed', error_message: 'Kunne ikke downloade PDF' })
        .eq('id', batchId);
      return new Response(JSON.stringify({ error: 'Kunne ikke downloade PDF' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Convert to base64
    const arrayBuffer = await fileData.arrayBuffer();
    const uint8 = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < uint8.length; i++) {
      binary += String.fromCharCode(uint8[i]);
    }
    const base64 = btoa(binary);

    // 4. Call Claude Vision API
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicKey) {
      await supabaseAdmin
        .from('pdf_import_batches')
        .update({ status: 'failed', error_message: 'ANTHROPIC_API_KEY ikke konfigureret' })
        .eq('id', batchId);
      return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY mangler' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const storeHint = batch.store ? `Denne tilbudsavis er fra butikken: ${batch.store}. ` : '';

    const aiResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
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
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: base64,
              },
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

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      await supabaseAdmin
        .from('pdf_import_batches')
        .update({ status: 'failed', error_message: `AI-parsing fejlede: ${aiResponse.status}` })
        .eq('id', batchId);
      console.error('Claude API error:', errText);
      return new Response(JSON.stringify({ error: 'AI-parsing fejlede' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiResult = await aiResponse.json();
    const aiText = aiResult.content?.[0]?.text ?? '';

    // 5. Parse AI response — extract JSON array
    let products: Array<{
      title: string;
      price: string | null;
      original_price: string | null;
      discount: string | null;
      category: string | null;
      unit: string | null;
      confidence: number;
    }> = [];

    try {
      // Try direct parse first
      products = JSON.parse(aiText);
    } catch {
      // Try extracting JSON from markdown code block
      const jsonMatch = aiText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        products = JSON.parse(jsonMatch[0]);
      }
    }

    if (!Array.isArray(products) || products.length === 0) {
      await supabaseAdmin
        .from('pdf_import_batches')
        .update({ status: 'failed', error_message: 'Ingen produkter kunne ekstraheres fra PDF' })
        .eq('id', batchId);
      return new Response(JSON.stringify({ error: 'Ingen produkter fundet' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 6. Insert extracted items
    const items = products.map(p => ({
      batch_id: batchId,
      title: p.title ?? 'Ukendt produkt',
      price: p.price ?? null,
      original_price: p.original_price ?? null,
      discount: p.discount ?? null,
      category: p.category ?? null,
      unit: p.unit ?? null,
      confidence: Math.min(1, Math.max(0, p.confidence ?? 0.5)),
      raw_extraction: p,
    }));

    await supabaseAdmin.from('pdf_import_items').insert(items);

    // 7. Update batch with results
    const lowConfidenceCount = items.filter(it => (it.confidence ?? 0) < 0.7).length;
    await supabaseAdmin
      .from('pdf_import_batches')
      .update({
        status: 'preview',
        total_products: items.length,
        low_confidence_count: lowConfidenceCount,
        processed_at: new Date().toISOString(),
      })
      .eq('id', batchId);

    return new Response(JSON.stringify({
      success: true,
      totalProducts: items.length,
      lowConfidenceCount,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('parse-pdf-tilbud error:', err);
    const detail = err instanceof Error ? err.message : 'Ukendt fejl';
    return new Response(JSON.stringify({ error: `Parsing fejlede: ${detail}` }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
