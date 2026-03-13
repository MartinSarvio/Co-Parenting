import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Pencil, Trash2, Search, ChevronLeft, X as XIcon,
  Globe, FileText, Loader2, ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { IOSSwitch } from '@/components/ui/ios-switch';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ConfirmCloseDialog } from '@/components/custom/ConfirmCloseDialog';
import { scrapeNews } from '@/lib/newsScraper';
import { DEMO_NEWS } from '@/sections/FeedView';

// ── Types ───────────────────────────────────────────────────────────────────

interface NewsArticle {
  id: string;
  title: string;
  description: string | null;
  full_text: string | null;
  source: string | null;
  date: string | null;
  image: string | null;
  url: string | null;
  is_published: boolean;
  is_scraped: boolean;
  is_demo?: boolean;
  created_at: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function NyhederAdminView() {
  const { nyhederAdminCreateOpen, setNyhederAdminCreateOpen } = useAppStore();
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editArticle, setEditArticle] = useState<NewsArticle | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<NewsArticle | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Map DEMO_NEWS to NewsArticle format
  const demoArticles: NewsArticle[] = useMemo(() =>
    DEMO_NEWS.map(n => ({
      id: `demo-${n.id}`,
      title: n.title,
      description: n.description,
      full_text: n.fullText,
      source: n.source,
      date: n.date,
      image: n.image,
      url: n.url,
      is_published: true,
      is_scraped: false,
      is_demo: false,
      created_at: new Date().toISOString(),
    })),
  []);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('news_articles')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setArticles(data as NewsArticle[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchArticles(); }, [fetchArticles]);

  // Combine: Supabase articles first, then demo articles
  const allArticles = useMemo(() => [...articles, ...demoArticles], [articles, demoArticles]);

  const filtered = allArticles.filter(a =>
    !search || a.title.toLowerCase().includes(search.toLowerCase())
    || (a.source ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const togglePublished = async (article: NewsArticle) => {
    const newVal = !article.is_published;
    await supabase.from('news_articles').update({ is_published: newVal, updated_at: new Date().toISOString() }).eq('id', article.id);
    setArticles(prev => prev.map(a => a.id === article.id ? { ...a, is_published: newVal } : a));
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await supabase.from('news_articles').delete().eq('id', deleteTarget.id);
    setArticles(prev => prev.filter(a => a.id !== deleteTarget.id));
    toast.success('Nyhed slettet');
    setDeleteTarget(null);
    setDeleting(false);
  };

  // Create/edit overlay
  if (nyhederAdminCreateOpen || editArticle) {
    return (
      <NewsCreatePage
        article={editArticle}
        onClose={() => {
          setNyhederAdminCreateOpen(false);
          setEditArticle(null);
        }}
        onSaved={() => {
          fetchArticles();
          setNyhederAdminCreateOpen(false);
          setEditArticle(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-3 pb-8">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Søg nyheder..."
          className="pl-9 rounded-[10px] border-border bg-card text-[13px] h-9"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-[10px] bg-card border border-border p-6 text-center">
          <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            {search ? 'Ingen nyheder matcher søgningen' : 'Ingen nyheder endnu'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(article => (
            <div
              key={article.id}
              className="flex items-center gap-3 rounded-[10px] bg-card border border-border p-3"
            >
              {/* Thumbnail */}
              {article.image ? (
                <img
                  src={article.image}
                  alt=""
                  className="h-10 w-10 rounded-[6px] object-cover shrink-0"
                />
              ) : (
                <div className="h-10 w-10 rounded-[6px] bg-muted flex items-center justify-center shrink-0">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-foreground line-clamp-1">{article.title}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {article.source ?? 'Ingen kilde'}
                  {article.date ? ` · ${article.date}` : ''}
                  {article.is_demo && (
                    <span className="ml-1 inline-flex items-center rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                      Demo
                    </span>
                  )}
                  {article.is_scraped && (
                    <span className="ml-1 inline-flex items-center gap-0.5 text-[#007AFF]">
                      <Globe className="h-2.5 w-2.5" /> scraped
                    </span>
                  )}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                {!article.is_demo && (
                  <IOSSwitch
                    checked={article.is_published}
                    onCheckedChange={() => togglePublished(article)}
                  />
                )}
                <button
                  onClick={() => setEditArticle(article)}
                  className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                {!article.is_demo && (
                  <button
                    onClick={() => setDeleteTarget(article)}
                    className="p-1.5 text-muted-foreground hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-[320px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base">Slet nyhed?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            "{deleteTarget?.title}" slettes permanent.
          </p>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => setDeleteTarget(null)}
              className="flex-1 rounded-xl border border-border bg-card py-2.5 text-sm font-medium text-foreground"
            >
              Annuller
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-medium text-white disabled:opacity-50"
            >
              {deleting ? 'Sletter...' : 'Slet'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CREATE / EDIT PAGE (full-screen overlay)
// ═══════════════════════════════════════════════════════════════════════════

function NewsCreatePage({
  article,
  onClose,
  onSaved,
}: {
  article: NewsArticle | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const initTitle = article?.title ?? '';
  const initDesc = article?.description ?? '';
  const initFullText = article?.full_text ?? '';
  const initSource = article?.source ?? '';
  const initDate = article?.date ?? '';
  const initImage = article?.image ?? '';
  const initUrl = article?.url ?? '';
  const initPublished = article?.is_published ?? true;

  const [mode, setMode] = useState<'scrape' | 'manual'>(article ? 'manual' : 'scrape');
  const [scrapeUrl, setScrapeUrl] = useState(article?.url ?? '');
  const [scraping, setScraping] = useState(false);

  const [title, setTitle] = useState(initTitle);
  const [description, setDescription] = useState(initDesc);
  const [fullText, setFullText] = useState(initFullText);
  const [source, setSource] = useState(initSource);
  const [date, setDate] = useState(initDate);
  const [image, setImage] = useState(initImage);
  const [url, setUrl] = useState(initUrl);
  const [isPublished, setIsPublished] = useState(initPublished);
  const [saving, setSaving] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);

  const isDirty = title !== initTitle || description !== initDesc
    || fullText !== initFullText || source !== initSource
    || date !== initDate || image !== initImage || url !== initUrl
    || isPublished !== initPublished;

  const tryClose = () => {
    if (isDirty) {
      setConfirmClose(true);
    } else {
      onClose();
    }
  };

  const handleScrape = async () => {
    if (!scrapeUrl.trim()) {
      toast.error('Indsæt en URL først');
      return;
    }
    setScraping(true);
    const result = await scrapeNews(scrapeUrl.trim());
    if (result) {
      setTitle(result.title);
      setDescription(result.description);
      setFullText(result.fullText);
      setImage(result.image);
      setSource(result.source);
      setUrl(scrapeUrl.trim());
      setDate(new Date().toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' }));
      toast.success('Nyhed hentet');
    } else {
      toast.error('Kunne ikke scrape URL — prøv en anden');
    }
    setScraping(false);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Titel er påkrævet');
      return;
    }
    setSaving(true);

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      full_text: fullText.trim() || null,
      source: source.trim() || null,
      date: date.trim() || null,
      image: image.trim() || null,
      url: url.trim() || null,
      is_published: isPublished,
      is_scraped: mode === 'scrape' && !article,
      updated_at: new Date().toISOString(),
    };

    if (article) {
      const { error } = await supabase.from('news_articles').update(payload).eq('id', article.id);
      if (error) {
        toast.error('Fejl: ' + error.message);
        setSaving(false);
        return;
      }
      toast.success('Nyhed opdateret');
    } else {
      const { error } = await supabase.from('news_articles').insert(payload);
      if (error) {
        toast.error('Fejl: ' + error.message);
        setSaving(false);
        return;
      }
      toast.success('Nyhed oprettet');
    }
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-[60] bg-background flex flex-col">
      {/* Header */}
      <div className="safe-area-pt flex items-center justify-between px-2 pb-2.5 pt-2 border-b border-border">
        <button
          onClick={tryClose}
          className="flex h-9 w-9 items-center justify-center text-foreground"
          aria-label="Tilbage"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="text-[15px] font-semibold text-foreground">
          {article ? 'Rediger nyhed' : 'Opret nyhed'}
        </h1>
        <button
          onClick={tryClose}
          className="flex h-9 w-9 items-center justify-center text-foreground"
          aria-label="Luk"
        >
          <XIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Mode toggle (only for new articles) */}
        {!article && (
          <div className="flex rounded-[10px] bg-[#e8e6df]/50 p-0.5">
            <button
              onClick={() => setMode('scrape')}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 rounded-[8px] py-2 text-[13px] font-medium transition-all',
                mode === 'scrape' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
              )}
            >
              <Globe className="h-3.5 w-3.5" />
              Scrape fra URL
            </button>
            <button
              onClick={() => setMode('manual')}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 rounded-[8px] py-2 text-[13px] font-medium transition-all',
                mode === 'manual' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
              )}
            >
              <FileText className="h-3.5 w-3.5" />
              Skriv manuelt
            </button>
          </div>
        )}

        {/* Scrape input */}
        {mode === 'scrape' && !article && (
          <div className="rounded-[10px] bg-card border border-border p-3 space-y-2">
            <Label className="text-[12px] font-semibold text-muted-foreground">Artikel-URL</Label>
            <div className="flex gap-2">
              <Input
                value={scrapeUrl}
                onChange={e => setScrapeUrl(e.target.value)}
                placeholder="https://..."
                className="flex-1 rounded-[8px] border-border text-[13px] h-9"
              />
              <button
                onClick={handleScrape}
                disabled={scraping}
                className="shrink-0 rounded-[8px] bg-primary px-3 h-9 text-[13px] font-medium text-white disabled:opacity-50 flex items-center gap-1.5"
              >
                {scraping ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Globe className="h-3.5 w-3.5" />
                )}
                Hent
              </button>
            </div>
            {scraping && (
              <p className="text-[11px] text-muted-foreground">Henter artikel-data...</p>
            )}
          </div>
        )}

        {/* Form fields */}
        <div>
          <Label className="text-[12px] font-semibold text-muted-foreground">Titel *</Label>
          <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Nyhedens titel" className="mt-1 rounded-[8px] border-border text-[13px]" />
        </div>

        <div>
          <Label className="text-[12px] font-semibold text-muted-foreground">Beskrivelse</Label>
          <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Kort beskrivelse..." className="mt-1 rounded-[8px] border-border text-[13px] min-h-[60px]" />
        </div>

        <div>
          <Label className="text-[12px] font-semibold text-muted-foreground">Fuld tekst</Label>
          <Textarea value={fullText} onChange={e => setFullText(e.target.value)} placeholder="Artikelens fulde tekst..." className="mt-1 rounded-[8px] border-border text-[13px] min-h-[120px]" />
        </div>

        {/* Image preview */}
        {image && (
          <div className="relative">
            <Label className="text-[12px] font-semibold text-muted-foreground mb-1 block">Billede</Label>
            <img src={image} alt="" className="w-full h-40 object-cover rounded-[8px] border border-border" />
            <button
              onClick={() => setImage('')}
              className="absolute top-7 right-2 bg-black/50 rounded-full p-1"
            >
              <XIcon className="h-3 w-3 text-white" />
            </button>
          </div>
        )}

        <div>
          <Label className="text-[12px] font-semibold text-muted-foreground">Billede-URL</Label>
          <Input value={image} onChange={e => setImage(e.target.value)} placeholder="https://..." className="mt-1 rounded-[8px] border-border text-[13px]" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-[12px] font-semibold text-muted-foreground">Kilde</Label>
            <Input value={source} onChange={e => setSource(e.target.value)} placeholder="F.eks. DR, TV2" className="mt-1 rounded-[8px] border-border text-[13px]" />
          </div>
          <div>
            <Label className="text-[12px] font-semibold text-muted-foreground">Dato</Label>
            <Input value={date} onChange={e => setDate(e.target.value)} placeholder="F.eks. 1. mar 2026" className="mt-1 rounded-[8px] border-border text-[13px]" />
          </div>
        </div>

        <div>
          <Label className="text-[12px] font-semibold text-muted-foreground">Link til artikel</Label>
          <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." className="mt-1 rounded-[8px] border-border text-[13px]" />
          {url && (
            <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-1 text-[11px] text-[#007AFF]">
              <ExternalLink className="h-2.5 w-2.5" /> Åbn link
            </a>
          )}
        </div>

        <div className="flex items-center justify-between rounded-[10px] bg-card border border-border px-3 py-2.5">
          <span className="text-[13px] font-medium text-foreground">Publiceret</span>
          <IOSSwitch checked={isPublished} onCheckedChange={setIsPublished} />
        </div>
      </div>

      {/* Save button */}
      <div className="safe-area-pb border-t border-border px-4 pt-3 pb-3">
        <button
          onClick={handleSave}
          disabled={saving || !title.trim()}
          className="w-full rounded-xl bg-primary py-3 text-[14px] font-semibold text-white disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : null}
          {saving ? 'Gemmer...' : article ? 'Gem ændringer' : 'Opret nyhed'}
        </button>
      </div>

      <ConfirmCloseDialog
        open={confirmClose}
        onCancel={() => setConfirmClose(false)}
        onConfirm={onClose}
      />
    </div>
  );
}
