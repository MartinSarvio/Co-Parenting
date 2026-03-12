import { CapacitorHttp } from '@capacitor/core';

export interface ScrapedNews {
  title: string;
  description: string;
  fullText: string;
  image: string;
  source: string;
}

/** Extract content from an HTML meta tag */
function getMeta(html: string, property: string): string {
  // Try property="..." (OpenGraph)
  const ogMatch = html.match(
    new RegExp(`<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']*?)["']`, 'i')
  );
  if (ogMatch) return ogMatch[1].trim();

  // Try name="..." (standard)
  const nameMatch = html.match(
    new RegExp(`<meta[^>]*name=["']${property}["'][^>]*content=["']([^"']*?)["']`, 'i')
  );
  if (nameMatch) return nameMatch[1].trim();

  // Try reversed attribute order: content before property/name
  const revMatch = html.match(
    new RegExp(`<meta[^>]*content=["']([^"']*?)["'][^>]*(?:property|name)=["']${property}["']`, 'i')
  );
  if (revMatch) return revMatch[1].trim();

  return '';
}

/** Try to extract a NewsArticle or Article from JSON-LD */
function extractJsonLdArticle(html: string): Partial<ScrapedNews> | null {
  const scriptRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;

  while ((match = scriptRegex.exec(html)) !== null) {
    try {
      let data = JSON.parse(match[1]);

      // Handle @graph arrays
      if (data['@graph']) {
        data = data['@graph'].find((item: Record<string, unknown>) => {
          const t = item['@type'];
          return t === 'NewsArticle' || t === 'Article' || t === 'WebPage'
            || (Array.isArray(t) && (t.includes('NewsArticle') || t.includes('Article')));
        });
        if (!data) continue;
      }

      const type = data['@type'];
      const isArticle = type === 'NewsArticle' || type === 'Article' || type === 'WebPage'
        || (Array.isArray(type) && (type.includes('NewsArticle') || type.includes('Article')));
      if (!isArticle) continue;

      const image = typeof data.image === 'string'
        ? data.image
        : Array.isArray(data.image)
          ? (typeof data.image[0] === 'string' ? data.image[0] : data.image[0]?.url ?? '')
          : data.image?.url ?? '';

      return {
        title: data.headline || data.name || '',
        description: data.description || '',
        fullText: data.articleBody || '',
        image,
        source: data.publisher?.name || data.author?.name || '',
      };
    } catch {
      continue;
    }
  }

  return null;
}

/** Extract article body text from <article> or <p> tags */
function extractBodyText(html: string): string {
  // Try <article> tag first
  const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  const source = articleMatch ? articleMatch[1] : html;

  // Get all <p> content
  const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  const paragraphs: string[] = [];
  let pMatch;
  while ((pMatch = pRegex.exec(source)) !== null) {
    const text = pMatch[1]
      .replace(/<[^>]+>/g, '') // strip tags
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#\d+;/g, '')
      .trim();
    if (text.length > 40) paragraphs.push(text);
  }

  return paragraphs.slice(0, 10).join('\n\n');
}

/**
 * Scrape a news article from a URL.
 * Extracts title, description, body text, image, and source name.
 */
export async function scrapeNews(url: string): Promise<ScrapedNews | null> {
  try {
    const response = await CapacitorHttp.get({
      url,
      headers: { 'User-Agent': 'HverdagApp/1.0' },
    });

    const html = response.data as string;
    if (!html || typeof html !== 'string') return null;

    // 1. Try JSON-LD structured data
    const jsonLd = extractJsonLdArticle(html);

    // 2. OpenGraph + meta tags
    const ogTitle = getMeta(html, 'og:title');
    const ogDesc = getMeta(html, 'og:description');
    const ogImage = getMeta(html, 'og:image');
    const ogSiteName = getMeta(html, 'og:site_name');
    const metaDesc = getMeta(html, 'description');

    // 3. Fallback title from <title>
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const pageTitle = titleMatch ? titleMatch[1].replace(/\s*[-|–—].*$/, '').trim() : '';

    // 4. Body text
    const bodyText = extractBodyText(html);

    // Combine: JSON-LD takes priority, then OG, then fallback
    const title = jsonLd?.title || ogTitle || pageTitle;
    const description = jsonLd?.description || ogDesc || metaDesc;
    const fullText = jsonLd?.fullText || bodyText;
    const image = jsonLd?.image || ogImage;
    const source = jsonLd?.source || ogSiteName || new URL(url).hostname.replace('www.', '');

    if (!title) return null;

    return { title, description, fullText, image, source };
  } catch {
    return null;
  }
}
