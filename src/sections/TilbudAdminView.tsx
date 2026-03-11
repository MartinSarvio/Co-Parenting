import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Pencil, Trash2, Search, Upload, FileText,
  Check, X as XIcon, AlertTriangle, ExternalLink,
  ChevronLeft, RefreshCw, Eye, ImagePlus, Info,
  ScanBarcode, Play,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { IOSSwitch } from '@/components/ui/ios-switch';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ConfirmCloseDialog } from '@/components/custom/ConfirmCloseDialog';
import { SavingOverlay } from '@/components/custom/SavingOverlay';
import { StoreBadge } from '@/components/custom/StoreBadge';
import { FLYERS, getFlyerStoreSlug } from '@/lib/etilbudsavis';
import { startBarcodeScanner } from '@/lib/openFoodFacts';
import { saveItemsToProductPrices } from '@/lib/productSync';
import { parsePdfBatch } from '@/lib/pdfParse';

// ── Types ───────────────────────────────────────────────────────────────────

interface AffiliateLink {
  id: string;
  name: string;
  url: string;
  store: string | null;
  partner: string | null;
  category: string | null;
  banner_image: string | null;
  banner_position_y: number;
  source_url: string | null;
  is_active: boolean;
  click_count: number;
  created_at: string;
}

interface ImportBatch {
  id: string;
  file_name: string;
  file_url: string | null;
  store: string | null;
  status: string;
  total_products: number;
  confirmed_products: number;
  low_confidence_count: number;
  error_message: string | null;
  valid_from: string | null;
  valid_until: string | null;
  uploaded_by: string | null;
  created_at: string;
  processed_at: string | null;
}

interface ImportItem {
  id: string;
  batch_id: string;
  title: string;
  price: string | null;
  original_price: string | null;
  discount: string | null;
  category: string | null;
  unit: string | null;
  confidence: number | null;
  is_confirmed: boolean;
  is_rejected: boolean;
  admin_notes: string | null;
  barcode: string | null;
}

// ── Stores list ─────────────────────────────────────────────────────────────

const STORES = [
  'Bilka', 'Netto', 'Føtex', 'REMA 1000', 'Lidl', 'MENY', 'Løvbjerg', 'Coop 365',
  'Brugsen', 'Kvickly', 'SuperBrugsen', "Dagli'Brugsen",
];

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function TilbudAdminView() {
  const { tilbudAdminTab: activeTab } = useAppStore();

  return (
    <div className="space-y-4 pb-8">
      {activeTab === 'affiliates' ? <AffiliateTab /> : <PdfImportTab />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// AFFILIATE TAB
// ═══════════════════════════════════════════════════════════════════════════

function AffiliateTab() {
  const { tilbudAdminCreateOpen, setTilbudAdminCreateOpen } = useAppStore();
  const [links, setLinks] = useState<AffiliateLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editLink, setEditLink] = useState<AffiliateLink | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Watch for header plus button trigger
  useEffect(() => {
    if (tilbudAdminCreateOpen) {
      setShowCreate(true);
      setTilbudAdminCreateOpen(false);
    }
  }, [tilbudAdminCreateOpen, setTilbudAdminCreateOpen]);

  const fetchLinks = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('affiliate_links')
      .select('*')
      .order('created_at', { ascending: false });
    setLinks(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchLinks(); }, [fetchLinks]);

  const filteredLinks = links.filter(l =>
    !search || l.name.toLowerCase().includes(search.toLowerCase()) ||
    (l.store ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    await supabase.from('affiliate_links').delete().eq('id', id);
    setDeleteConfirm(null);
    toast.success('Affiliate-link slettet');
    fetchLinks();
  };

  const handleToggleActive = async (id: string, active: boolean) => {
    await supabase.from('affiliate_links').update({ is_active: active, updated_at: new Date().toISOString() }).eq('id', id);
    setLinks(prev => prev.map(l => l.id === id ? { ...l, is_active: active } : l));
  };

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9a978f]" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Søg affiliate-links..."
          className="pl-8 h-9 text-[13px] rounded-[8px] border-[#e8e6df]"
        />
      </div>

      {/* Table */}
      <div className="rounded-[8px] border border-[#e8e6df] bg-white overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-5 w-5 text-[#c8c6bc] animate-spin" />
          </div>
        ) : filteredLinks.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <ExternalLink className="h-8 w-8 text-[#c8c6bc]" />
            <p className="text-sm font-semibold text-[#3f3e3a]">Ingen affiliate-links endnu</p>
            <p className="text-[12px] text-[#78766d]">Opret dit første affiliate-link ovenfor</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[500px]">
              <thead>
                <tr className="border-b border-[#f2f1ed]">
                  <th className="px-3 py-2 text-[11px] font-semibold text-[#9a978f]">Navn</th>
                  <th className="px-3 py-2 text-[11px] font-semibold text-[#9a978f]">Butik</th>
                  <th className="px-3 py-2 text-[11px] font-semibold text-[#9a978f]">Kategori</th>
                  <th className="px-3 py-2 text-[11px] font-semibold text-[#9a978f] text-center">Aktiv</th>
                  <th className="px-3 py-2 text-[11px] font-semibold text-[#9a978f] text-right">Klik</th>
                  <th className="px-3 py-2 text-[11px] font-semibold text-[#9a978f]"></th>
                </tr>
              </thead>
              <tbody>
                {filteredLinks.map((link, i) => (
                  <tr key={link.id} className={cn(i % 2 === 0 ? 'bg-white' : 'bg-[#faf9f6]')}>
                    <td className="px-3 py-2.5">
                      <p className="text-[12px] font-semibold text-[#2f2f2d]">{link.name}</p>
                      <p className="text-[10px] text-[#9a978f] truncate max-w-[150px]">{link.url}</p>
                    </td>
                    <td className="px-3 py-2.5 text-[12px] text-[#5f5d56]">{link.store ?? '—'}</td>
                    <td className="px-3 py-2.5 text-[12px] text-[#5f5d56]">{link.category ?? '—'}</td>
                    <td className="px-3 py-2.5 text-center">
                      <IOSSwitch
                        checked={link.is_active}
                        onCheckedChange={(v) => handleToggleActive(link.id, v)}
                      />
                    </td>
                    <td className="px-3 py-2.5 text-[12px] font-semibold text-[#2f2f2d] text-right">
                      {link.click_count}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex gap-1.5 justify-end">
                        <button
                          onClick={() => setEditLink(link)}
                          className="p-1.5 rounded-[6px] hover:bg-[#f2f1ed] text-[#7a786f] transition-colors"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(link.id)}
                          className="p-1.5 rounded-[6px] hover:bg-[#fef2f2] text-[#FF3B30] transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Page (full-screen) */}
      {(showCreate || editLink) && (
        <AffiliateCreatePage
          link={editLink}
          onClose={() => { setShowCreate(false); setEditLink(null); }}
          onSaved={fetchLinks}
        />
      )}

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="rounded-[12px]">
          <DialogHeader>
            <DialogTitle className="text-[15px]">Slet affiliate-link?</DialogTitle>
          </DialogHeader>
          <p className="text-[13px] text-[#5f5d56]">
            Er du sikker på at du vil slette dette affiliate-link? Handlingen kan ikke fortrydes.
          </p>
          <div className="flex gap-2 justify-end mt-3">
            <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(null)} className="rounded-[8px]">
              Annuller
            </Button>
            <Button
              size="sm"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="rounded-[8px] bg-[#FF3B30] text-white hover:bg-[#d63028]"
            >
              Slet
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Affiliate Create/Edit Page (full-screen) ────────────────────────────────

function AffiliateCreatePage({
  link,
  onClose,
  onSaved,
}: {
  link: AffiliateLink | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const initName = link?.name ?? '';
  const initUrl = link?.url ?? '';
  const initStore = link?.store ?? '';
  const initPartner = link?.partner ?? '';
  const initCategory = link?.category ?? '';
  const initActive = link?.is_active ?? true;
  const initBannerImage = link?.banner_image ?? '';
  const initBannerPositionY = link?.banner_position_y ?? 50;
  const initSourceUrl = link?.source_url ?? '';

  const [name, setName] = useState(initName);
  const [url, setUrl] = useState(initUrl);
  const [store, setStore] = useState(initStore);
  const [partner, setPartner] = useState(initPartner);
  const [category, setCategory] = useState(initCategory);
  const [isActive, setIsActive] = useState(initActive);
  const [bannerImage, setBannerImage] = useState(initBannerImage);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPositionY, setBannerPositionY] = useState(initBannerPositionY);
  const [sourceUrl, setSourceUrl] = useState(initSourceUrl);
  const [saving, setSaving] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const bannerRef = useRef<HTMLInputElement>(null);

  const isDirty = name !== initName || url !== initUrl || store !== initStore
    || partner !== initPartner || category !== initCategory || isActive !== initActive
    || bannerImage !== initBannerImage || !!bannerFile
    || bannerPositionY !== initBannerPositionY || sourceUrl !== initSourceUrl;

  const handleBannerSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerFile(file);
    const reader = new FileReader();
    reader.onload = () => setBannerImage(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const tryClose = () => {
    if (isDirty) {
      setConfirmClose(true);
    } else {
      onClose();
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !url.trim()) {
      toast.error('Navn og URL er påkrævet');
      return;
    }
    setSaving(true);
    try {
      // Upload banner image if a new file was selected
      let bannerUrl = bannerImage;
      if (bannerFile) {
        const fileName = `affiliate-banners/${Date.now()}_${bannerFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from('tilbudsaviser')
          .upload(fileName, bannerFile);
        if (uploadError) {
          toast.error('Banner-upload fejlede: ' + uploadError.message);
          setSaving(false);
          return;
        }
        const { data: publicData } = supabase.storage.from('tilbudsaviser').getPublicUrl(fileName);
        bannerUrl = publicData.publicUrl;
      }

      const payload = {
        name: name.trim(),
        url: url.trim(),
        store: store.trim() || null,
        partner: partner.trim() || null,
        category: category.trim() || null,
        banner_image: bannerUrl || null,
        banner_position_y: bannerPositionY,
        source_url: sourceUrl.trim() || null,
        is_active: isActive,
        updated_at: new Date().toISOString(),
      };

      if (link) {
        const { error } = await supabase.from('affiliate_links').update(payload).eq('id', link.id);
        if (error) {
          toast.error('Fejl: ' + error.message);
          return;
        }
        toast.success('Affiliate-link opdateret');
      } else {
        const { error } = await supabase.from('affiliate_links').insert(payload);
        if (error) {
          toast.error('Fejl: ' + error.message);
          return;
        }
        toast.success('Affiliate-link oprettet');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error('Uventet fejl: ' + (err instanceof Error ? err.message : 'Ukendt'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-[#f7f6f2] flex flex-col">
      {/* Header */}
      <div className="safe-area-pt flex items-center gap-1 px-2 pb-2.5 pt-2">
        <button
          onClick={tryClose}
          className="flex h-9 w-9 items-center justify-center text-[#30302d]"
          aria-label="Tilbage"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="text-[15px] font-semibold text-[#2f2f2d] flex-1">
          {link ? 'Rediger affiliate-link' : 'Opret affiliate-link'}
        </h1>
        <button
          onClick={tryClose}
          className="flex h-9 w-9 items-center justify-center text-[#30302d]"
          aria-label="Luk"
        >
          <XIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <div>
          <Label className="text-[12px] font-semibold text-[#5f5d56]">Navn *</Label>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="F.eks. Bilka Affiliate" className="mt-1 rounded-[8px] border-[#e8e6df] text-[13px]" />
        </div>
        <div>
          <Label className="text-[12px] font-semibold text-[#5f5d56]">Affiliate-URL *</Label>
          <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." className="mt-1 rounded-[8px] border-[#e8e6df] text-[13px]" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-[12px] font-semibold text-[#5f5d56]">Butik</Label>
            <Input
              list="affiliate-store-suggestions"
              value={store}
              onChange={e => setStore(e.target.value)}
              placeholder="Skriv eller vælg butik..."
              className="mt-1 rounded-[8px] border-[#e8e6df] text-[13px]"
            />
            <datalist id="affiliate-store-suggestions">
              {STORES.map(s => <option key={s} value={s} />)}
            </datalist>
          </div>
          <div>
            <Label className="text-[12px] font-semibold text-[#5f5d56]">Partner</Label>
            <Input value={partner} onChange={e => setPartner(e.target.value)} placeholder="Partner-navn" className="mt-1 rounded-[8px] border-[#e8e6df] text-[13px]" />
          </div>
        </div>
        <div>
          <Label className="text-[12px] font-semibold text-[#5f5d56]">Kategori</Label>
          <Input value={category} onChange={e => setCategory(e.target.value)} placeholder="F.eks. Elektronik, Mejeri" className="mt-1 rounded-[8px] border-[#e8e6df] text-[13px]" />
        </div>

        {/* Banner Image Upload */}
        <div>
          <Label className="text-[12px] font-semibold text-[#5f5d56]">Banner-billede</Label>
          <input ref={bannerRef} type="file" accept="image/*" onChange={handleBannerSelect} className="hidden" />
          {bannerImage ? (
            <div className="mt-1 space-y-2">
              <div className="relative">
                <img
                  src={bannerImage}
                  alt="Banner"
                  className="w-full h-24 object-cover rounded-[8px]"
                  style={{ objectPosition: `center ${bannerPositionY}%` }}
                />
                <div className="absolute top-1.5 right-1.5 flex gap-1">
                  <button
                    type="button"
                    onClick={() => bannerRef.current?.click()}
                    className="h-7 w-7 rounded-full bg-white/90 flex items-center justify-center shadow-sm"
                  >
                    <Pencil className="h-3 w-3 text-[#5f5d56]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => { setBannerImage(''); setBannerFile(null); }}
                    className="h-7 w-7 rounded-full bg-white/90 flex items-center justify-center shadow-sm"
                  >
                    <XIcon className="h-3 w-3 text-[#FF3B30]" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-[11px] text-[#78766d] shrink-0">Position</Label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={bannerPositionY}
                  onChange={e => setBannerPositionY(Number(e.target.value))}
                  className="flex-1 h-1 accent-[#f58a2d]"
                />
                <span className="text-[11px] text-[#9a978f] w-8 text-right">{bannerPositionY}%</span>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => bannerRef.current?.click()}
              className="mt-1 w-full h-24 rounded-[8px] border-2 border-dashed border-[#d0cec5] bg-[#faf9f6] hover:border-[#b0ae9f] flex flex-col items-center justify-center gap-1.5 transition-colors"
            >
              <ImagePlus className="h-6 w-6 text-[#c8c6bc]" />
              <p className="text-[11px] text-[#78766d]">Upload banner-billede</p>
            </button>
          )}
        </div>

        <div>
          <Label className="text-[12px] font-semibold text-[#5f5d56]">Kilde / URL</Label>
          <Input value={sourceUrl} onChange={e => setSourceUrl(e.target.value)} placeholder="URL til banner-kilde eller partner-side" className="mt-1 rounded-[8px] border-[#e8e6df] text-[13px]" />
        </div>

        <div className="flex items-center justify-between rounded-[8px] border border-[#e8e6df] bg-white px-3 py-3">
          <Label className="text-[13px] font-semibold text-[#2f2f2d]">Aktiv</Label>
          <IOSSwitch checked={isActive} onCheckedChange={setIsActive} />
        </div>
      </div>

      {/* Save button */}
      <div className="safe-area-pb px-4 py-3">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full h-11 rounded-[10px] bg-[#f58a2d] text-white hover:bg-[#e47921] text-[14px] font-semibold"
        >
          {saving ? 'Gemmer...' : link ? 'Opdater' : 'Opret'}
        </Button>
      </div>

      <SavingOverlay open={saving} />
      <ConfirmCloseDialog
        open={confirmClose}
        onCancel={() => setConfirmClose(false)}
        onConfirm={onClose}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PDF IMPORT TAB — Overview + Create/Edit
// ═══════════════════════════════════════════════════════════════════════════

// ── Helper: parse Danish date strings like "27. feb" ────────────────────────
function parseDanishDate(dateStr: string): Date {
  const months: Record<string, number> = {
    jan: 0, feb: 1, mar: 2, apr: 3, maj: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, okt: 9, nov: 10, dec: 11,
  };
  const parts = dateStr.replace('.', '').trim().split(/\s+/);
  const day = parseInt(parts[0], 10);
  const month = months[parts[1]?.toLowerCase()] ?? 0;
  const year = new Date().getFullYear();
  return new Date(year, month, day);
}

function SwipeableBatchRow({ children, onDelete }: { children: React.ReactNode; onDelete: () => void }) {
  const rowRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const currentX = useRef(0);
  const swiping = useRef(false);
  const threshold = 80;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    currentX.current = 0;
    swiping.current = true;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!swiping.current || !rowRef.current) return;
    const diff = startX.current - e.touches[0].clientX;
    currentX.current = Math.max(0, Math.min(diff, 120));
    rowRef.current.style.transform = `translateX(-${currentX.current}px)`;
    rowRef.current.style.transition = 'none';
  }, []);

  const handleTouchEnd = useCallback(() => {
    swiping.current = false;
    if (!rowRef.current) return;
    if (currentX.current >= threshold) {
      rowRef.current.style.transition = 'transform 0.25s ease';
      rowRef.current.style.transform = 'translateX(-120px)';
    } else {
      rowRef.current.style.transition = 'transform 0.2s ease';
      rowRef.current.style.transform = 'translateX(0)';
    }
    currentX.current = 0;
  }, []);

  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-y-0 right-0 flex w-[120px] items-center justify-center bg-[#FF3B30]">
        <button
          onClick={onDelete}
          className="flex flex-col items-center gap-0.5 text-white"
        >
          <Trash2 className="h-5 w-5" />
          <span className="text-[10px] font-semibold">Slet</span>
        </button>
      </div>
      <div
        ref={rowRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative z-10 bg-white"
        style={{ transform: 'translateX(0)' }}
      >
        {children}
      </div>
    </div>
  );
}

function PdfImportTab() {
  const { tilbudAdminCreateOpen, setTilbudAdminCreateOpen } = useAppStore();
  const [batches, setBatches] = useState<ImportBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editBatch, setEditBatch] = useState<ImportBatch | null>(null);
  const [previewBatch, setPreviewBatch] = useState<ImportBatch | null>(null);
  const [previewItems, setPreviewItems] = useState<ImportItem[]>([]);
  const [infoFlyer, setInfoFlyer] = useState<(typeof FLYERS[number]) & { isActive: boolean; daysLeft: number } | null>(null);
  const [deleteBatchId, setDeleteBatchId] = useState<string | null>(null);

  // Watch for header plus button trigger
  useEffect(() => {
    if (tilbudAdminCreateOpen) {
      setShowCreate(true);
      setTilbudAdminCreateOpen(false);
    }
  }, [tilbudAdminCreateOpen, setTilbudAdminCreateOpen]);

  const fetchBatches = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('pdf_import_batches')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    setBatches(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchBatches(); }, [fetchBatches]);

  const today = new Date().toISOString().slice(0, 10);

  // FLYERS status
  const flyersWithStatus = useMemo(() => {
    const now = new Date();
    return FLYERS.map(f => {
      const from = parseDanishDate(f.validFrom);
      const until = parseDanishDate(f.validUntil);
      const isActive = now >= from && now <= until;
      const diff = Math.ceil((until.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return { ...f, isActive, daysLeft: diff };
    });
  }, []);

  const filteredBatches = batches.filter(b =>
    !search || (b.store ?? '').toLowerCase().includes(search.toLowerCase()) ||
    b.file_name.toLowerCase().includes(search.toLowerCase())
  );

  const flyerStoreNames = new Set(FLYERS.map(f => f.store.toLowerCase()));
  const activeBatches = filteredBatches.filter(b =>
    b.status !== 'failed' && b.valid_from && b.valid_until &&
    b.valid_from <= today && b.valid_until >= today &&
    !flyerStoreNames.has((b.store ?? '').toLowerCase())
  );

  const upcomingBatches = filteredBatches.filter(b =>
    b.status !== 'failed' && b.valid_from && b.valid_from > today
  );

  const otherBatches = filteredBatches.filter(b =>
    !activeBatches.includes(b) && !upcomingBatches.includes(b)
  );

  const openPreview = async (batch: ImportBatch) => {
    setPreviewBatch(batch);
    const { data } = await supabase
      .from('pdf_import_items')
      .select('*')
      .eq('batch_id', batch.id)
      .order('created_at', { ascending: true });
    setPreviewItems(data ?? []);
  };

  const handleConfirmItem = async (itemId: string) => {
    await supabase.from('pdf_import_items').update({ is_confirmed: true, is_rejected: false }).eq('id', itemId);
    setPreviewItems(prev => prev.map(it => it.id === itemId ? { ...it, is_confirmed: true, is_rejected: false } : it));
  };

  const handleRejectItem = async (itemId: string) => {
    await supabase.from('pdf_import_items').update({ is_rejected: true, is_confirmed: false }).eq('id', itemId);
    setPreviewItems(prev => prev.map(it => it.id === itemId ? { ...it, is_rejected: true, is_confirmed: false } : it));
  };

  const handleScanBarcode = async (itemId: string) => {
    const barcode = await startBarcodeScanner();
    if (!barcode) return;
    setPreviewItems(prev => prev.map(it => it.id === itemId ? { ...it, barcode } : it));
    await supabase.from('pdf_import_items').update({ barcode }).eq('id', itemId);
    toast.success(`Stregkode ${barcode} tilknyttet`);
  };

  const handleConfirmAll = async () => {
    if (!previewBatch) return;
    const unrejected = previewItems.filter(it => !it.is_rejected);
    await supabase
      .from('pdf_import_items')
      .update({ is_confirmed: true })
      .eq('batch_id', previewBatch.id)
      .eq('is_rejected', false);
    await supabase
      .from('pdf_import_batches')
      .update({
        status: 'confirmed',
        confirmed_products: unrejected.length,
        processed_at: new Date().toISOString(),
      })
      .eq('id', previewBatch.id);

    // Save confirmed items to product_prices (+ OFF lookup for barcoded items)
    try {
      const result = await saveItemsToProductPrices({
        batchId: previewBatch.id,
        store: previewBatch.store ?? 'Ukendt',
        fileName: previewBatch.file_name,
        validFrom: previewBatch.valid_from,
        validTo: previewBatch.valid_until,
        items: unrejected,
      });
      const linkMsg = result.linked > 0 ? ` (${result.linked} koblet til OFF)` : '';
      toast.success(`${result.saved} produktpriser gemt${linkMsg}`);
    } catch {
      toast.error('Priser kunne ikke gemmes til prishistorik');
    }

    setPreviewBatch(null);
    setPreviewItems([]);
    fetchBatches();
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-[#f2f1ed] text-[#7a786f]',
      processing: 'bg-[#fff6ef] text-[#f58a2d]',
      preview: 'bg-[#e6f7ff] text-[#5AC8FA]',
      confirmed: 'bg-[#eef9ee] text-[#34C759]',
      failed: 'bg-[#fef2f2] text-[#FF3B30]',
      scheduled: 'bg-[#e6f0ff] text-[#007AFF]',
    };
    const labels: Record<string, string> = {
      pending: 'Afventer',
      processing: 'Parser...',
      preview: 'Forhåndsvisning',
      confirmed: 'Bekræftet',
      failed: 'Fejlet',
      scheduled: 'Planlagt',
    };
    return (
      <span className={cn('rounded-[6px] px-2 py-0.5 text-[10px] font-semibold', styles[status] ?? styles.pending)}>
        {labels[status] ?? status}
      </span>
    );
  };

  const getDaysLeft = (validUntil: string | null) => {
    if (!validUntil) return null;
    const diff = Math.ceil((new Date(validUntil).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return 'Udløbet';
    if (diff === 0) return 'Udløber i dag';
    if (diff === 1) return 'Udløber i morgen';
    return `${diff} dage`;
  };

  const handleActivateBatch = async (batch: ImportBatch) => {
    const todayStr = new Date().toISOString().slice(0, 10);
    await supabase
      .from('pdf_import_batches')
      .update({
        status: 'confirmed',
        valid_from: batch.valid_from && batch.valid_from > todayStr ? todayStr : batch.valid_from,
        processed_at: new Date().toISOString(),
      })
      .eq('id', batch.id);
    toast.success(`${batch.store ?? 'Tilbudsavis'} aktiveret`);
    fetchBatches();
  };

  const handleDeleteBatch = async (batchId: string) => {
    const batch = batches.find(b => b.id === batchId);
    // Delete items first, then batch, then storage file
    await supabase.from('pdf_import_items').delete().eq('batch_id', batchId);
    await supabase.from('pdf_import_batches').delete().eq('id', batchId);
    if (batch?.file_url) {
      await supabase.storage.from('tilbudsaviser').remove([batch.file_url]);
    }
    setDeleteBatchId(null);
    toast.success('Tilbudsavis slettet');
    fetchBatches();
  };

  const renderBatchCard = (batch: ImportBatch, { showActivate = false }: { showActivate?: boolean } = {}) => {
    const daysLeft = getDaysLeft(batch.valid_until);
    const isExpired = batch.valid_until ? batch.valid_until < today : false;
    const isSoonExpiring = !isExpired && batch.valid_until
      ? Math.ceil((new Date(batch.valid_until).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) <= 2
      : false;
    const isDateActive = batch.valid_from && batch.valid_until &&
      batch.valid_from <= today && batch.valid_until >= today;

    return (
      <div
        key={batch.id}
        className="flex items-center gap-3 px-3 py-2.5 active:bg-[#f5f4f0] transition-colors cursor-pointer"
        onClick={() => setEditBatch(batch)}
      >
        {batch.store ? (
          <StoreBadge storeId={batch.store.toLowerCase().replace(/\s+/g, '')} size="sm" />
        ) : (
          <FileText className="h-6 w-6 text-[#9a978f] shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-semibold text-[#2f2f2d] truncate">{batch.store || batch.file_name}</p>
          <p className="text-[12px] text-[#9a978f]">
            {batch.valid_from && batch.valid_until
              ? `${new Date(batch.valid_from).toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })} – ${new Date(batch.valid_until).toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })}`
              : batch.file_name}
            {' · '}{batch.total_products} produkter
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex flex-col items-end gap-0.5">
            {isDateActive ? (
              <span className="rounded-[6px] px-2 py-0.5 text-[10px] font-semibold bg-[#eef9ee] text-[#34C759]">
                Aktiv
              </span>
            ) : getStatusBadge(batch.status)}
            {daysLeft && (
              <span className={cn(
                'text-[10px] font-medium',
                isExpired ? 'text-[#FF3B30]' : isSoonExpiring ? 'text-[#f58a2d]' : 'text-[#7a786f]'
              )}>
                {daysLeft}
              </span>
            )}
          </div>
          {showActivate && batch.status !== 'confirmed' && (
            <button
              onClick={(e) => { e.stopPropagation(); handleActivateBatch(batch); }}
              className="flex items-center gap-1 px-2 py-1 rounded-[6px] bg-[#34C759] text-white text-[10px] font-semibold transition-colors active:bg-[#2db14d]"
            >
              <Play className="h-3 w-3" />
              Aktivér
            </button>
          )}
          {batch.total_products === 0 && batch.status !== 'processing' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                parsePdfBatch(batch, fetchBatches);
              }}
              className="flex items-center gap-1 px-2 py-1 rounded-[6px] bg-[#007AFF]/10 text-[#007AFF] text-[10px] font-semibold transition-colors active:bg-[#007AFF]/20"
            >
              <RefreshCw className="h-3 w-3" />
              Parse
            </button>
          )}
          {(batch.status === 'preview' || batch.status === 'confirmed') && (
            <button
              onClick={(e) => { e.stopPropagation(); openPreview(batch); }}
              className="p-1.5 rounded-[6px] hover:bg-[#f2f1ed] text-[#7a786f] transition-colors"
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
          )}
          <Info className="h-3.5 w-3.5 text-[#c8c6bc]" />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9a978f]" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Søg tilbudsaviser..."
          className="pl-8 h-9 text-[13px] rounded-[8px] border-[#e8e6df]"
        />
      </div>

      {/* ─── AKTIVE TILBUDSAVISER (FLYERS + active uploaded batches) ─── */}
      <div>
        <p className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#9a978f] mb-2">
          Aktive tilbudsaviser
        </p>
        <div className="rounded-[8px] border border-[#e8e6df] bg-white overflow-hidden divide-y divide-[#f2f1ed]">
          {flyersWithStatus.map(f => (
            <div
              key={f.id}
              className="flex items-center gap-3 px-3 py-2.5 active:bg-[#f5f4f0] transition-colors cursor-pointer"
              onClick={() => setInfoFlyer(f)}
            >
              <StoreBadge storeId={getFlyerStoreSlug(f)} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-[#2f2f2d] truncate">{f.store}</p>
                <p className="text-[12px] text-[#9a978f]">
                  {f.validFrom} – {f.validUntil} · {f.pages} sider
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex flex-col items-end gap-0.5">
                  <span className={cn(
                    'rounded-[6px] px-2 py-0.5 text-[10px] font-semibold',
                    f.isActive ? 'bg-[#eef9ee] text-[#34C759]' : 'bg-[#fef2f2] text-[#FF3B30]'
                  )}>
                    {f.isActive ? 'Aktiv' : 'Udløbet'}
                  </span>
                  {f.isActive && f.daysLeft >= 0 && (
                    <span className={cn(
                      'text-[10px] font-medium',
                      f.daysLeft <= 2 ? 'text-[#f58a2d]' : 'text-[#7a786f]'
                    )}>
                      {f.daysLeft === 0 ? 'Udløber i dag' : f.daysLeft === 1 ? 'Udløber i morgen' : `${f.daysLeft} dage`}
                    </span>
                  )}
                </div>
                <Info className="h-3.5 w-3.5 text-[#c8c6bc]" />
              </div>
            </div>
          ))}
          {/* Active uploaded batches — merged into same section */}
          {!loading && activeBatches.map(b => (
            <SwipeableBatchRow key={`swipe-${b.id}`} onDelete={() => setDeleteBatchId(b.id)}>
              {renderBatchCard(b)}
            </SwipeableBatchRow>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-5 w-5 text-[#c8c6bc] animate-spin" />
        </div>
      ) : (
        <>
          {/* Kommende tilbudsaviser */}
          {upcomingBatches.length > 0 && (
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#9a978f] mb-2">
                Kommende tilbudsaviser
              </p>
              <div className="rounded-[8px] border border-[#e8e6df] bg-white overflow-hidden divide-y divide-[#f2f1ed]">
                {upcomingBatches.map(b => (
                  <SwipeableBatchRow key={`swipe-${b.id}`} onDelete={() => setDeleteBatchId(b.id)}>
                    {renderBatchCard(b, { showActivate: true })}
                  </SwipeableBatchRow>
                ))}
              </div>
            </div>
          )}

          {/* Historik */}
          {otherBatches.length > 0 && (
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#9a978f] mb-2">
                Historik
              </p>
              <div className="rounded-[8px] border border-[#e8e6df] bg-white overflow-hidden divide-y divide-[#f2f1ed]">
                {otherBatches.map(b => (
                  <SwipeableBatchRow key={`swipe-${b.id}`} onDelete={() => setDeleteBatchId(b.id)}>
                    {renderBatchCard(b)}
                  </SwipeableBatchRow>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Datakilder */}
      <div className="rounded-[12px] bg-[#faf9f6] p-4 space-y-2 mt-2">
        <p className="text-[13px] font-semibold text-[#2f2f2d]">Datakilder</p>
        <p className="text-[12px] text-[#78766d]">
          Næringsdata leveret af{' '}
          <a href="https://world.openfoodfacts.org" target="_blank" rel="noopener noreferrer" className="text-[#f58a2d] underline">
            Open Food Facts
          </a>
          {' '}under{' '}
          <a href="https://opendatacommons.org/licenses/odbl/1-0/" target="_blank" rel="noopener noreferrer" className="text-[#f58a2d] underline">
            ODbL 1.0
          </a>
          {' '}licens.
        </p>
      </div>

      {/* Create / Edit Page (full-screen) */}
      {(showCreate || editBatch) && (
        <PdfImportCreatePage
          batch={editBatch}
          allBatches={batches}
          onClose={() => { setShowCreate(false); setEditBatch(null); }}
          onSaved={fetchBatches}
        />
      )}

      {/* Preview Dialog — batch items */}
      <Dialog open={!!previewBatch} onOpenChange={() => { setPreviewBatch(null); setPreviewItems([]); }}>
        <DialogContent className="rounded-[12px] max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-[15px]">
              Forhåndsvisning: {previewBatch?.file_name}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto -mx-6 px-6">
            {previewItems.length === 0 ? (
              <p className="text-[13px] text-[#78766d] text-center py-8">Ingen produkter fundet</p>
            ) : (
              <div className="space-y-2">
                {previewItems.map(item => {
                  const lowConfidence = (item.confidence ?? 1) < 0.7;
                  return (
                    <div
                      key={item.id}
                      className={cn(
                        'rounded-[8px] border p-2.5 transition-colors',
                        item.is_rejected
                          ? 'border-[#fecaca] bg-[#fef2f2] opacity-50'
                          : item.is_confirmed
                            ? 'border-[#bbf7d0] bg-[#f0fdf4]'
                            : lowConfidence
                              ? 'border-[#fde68a] bg-[#fffbeb]'
                              : 'border-[#e8e6df] bg-white'
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-[12px] font-semibold text-[#2f2f2d]">{item.title}</p>
                            {lowConfidence && (
                              <AlertTriangle className="h-3 w-3 text-[#f59e0b] shrink-0" />
                            )}
                          </div>
                          <div className="flex gap-3 mt-0.5">
                            {item.price && <p className="text-[11px] text-[#34C759] font-semibold">{item.price} kr</p>}
                            {item.original_price && <p className="text-[11px] text-[#9a978f] line-through">{item.original_price} kr</p>}
                            {item.discount && <p className="text-[11px] text-[#f58a2d]">{item.discount}</p>}
                          </div>
                          <div className="flex gap-2 mt-0.5">
                            {item.category && <p className="text-[10px] text-[#7a786f]">{item.category}</p>}
                            {item.unit && <p className="text-[10px] text-[#7a786f]">· {item.unit}</p>}
                            {item.confidence != null && (
                              <p className={cn('text-[10px]', lowConfidence ? 'text-[#f59e0b]' : 'text-[#9a978f]')}>
                                {Math.round(item.confidence * 100)}% sikkerhed
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            {item.barcode ? (
                              <p className="text-[10px] text-[#5AC8FA] font-mono">{item.barcode}</p>
                            ) : (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleScanBarcode(item.id); }}
                                className="text-[10px] text-[#9a978f] hover:text-[#5AC8FA] flex items-center gap-0.5"
                              >
                                <ScanBarcode className="h-2.5 w-2.5" />
                                Scan stregkode
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button
                            onClick={() => handleConfirmItem(item.id)}
                            className={cn(
                              'p-1.5 rounded-[6px] transition-colors',
                              item.is_confirmed
                                ? 'bg-[#34C759] text-white'
                                : 'hover:bg-[#eef9ee] text-[#34C759]'
                            )}
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleRejectItem(item.id)}
                            className={cn(
                              'p-1.5 rounded-[6px] transition-colors',
                              item.is_rejected
                                ? 'bg-[#FF3B30] text-white'
                                : 'hover:bg-[#fef2f2] text-[#FF3B30]'
                            )}
                          >
                            <XIcon className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {previewBatch?.status === 'preview' && previewItems.length > 0 && (
            <div className="flex gap-2 justify-end pt-3 border-t border-[#f2f1ed]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setPreviewBatch(null); setPreviewItems([]); }}
                className="rounded-[8px]"
              >
                Luk
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmAll}
                className="rounded-[8px] bg-[#34C759] text-white hover:bg-[#2db14d]"
              >
                <Check className="h-3.5 w-3.5 mr-1" />
                Bekræft alle ({previewItems.filter(it => !it.is_rejected).length})
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Info dialog for FLYERS */}
      <Dialog open={!!infoFlyer} onOpenChange={() => setInfoFlyer(null)}>
        <DialogContent className="rounded-[12px] max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[15px] flex items-center gap-2">
              {infoFlyer && <StoreBadge storeId={infoFlyer.id} size="sm" />}
              {infoFlyer?.store}
            </DialogTitle>
          </DialogHeader>
          {infoFlyer && (
            <div className="space-y-2 text-[13px] text-[#5f5d56]">
              <p><span className="font-medium text-[#2f2f2d]">Gyldig:</span> {infoFlyer.validFrom} – {infoFlyer.validUntil}</p>
              <p><span className="font-medium text-[#2f2f2d]">Sider:</span> {infoFlyer.pages}</p>
              <p><span className="font-medium text-[#2f2f2d]">Status:</span> {infoFlyer.isActive ? 'Aktiv' : 'Udløbet'}</p>
              {infoFlyer.webUrl && (
                <a
                  href={infoFlyer.webUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-[#007AFF] text-[13px] font-medium mt-2"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Åbn tilbudsavis
                </a>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <ConfirmCloseDialog
        open={!!deleteBatchId}
        onCancel={() => setDeleteBatchId(null)}
        onConfirm={() => deleteBatchId && handleDeleteBatch(deleteBatchId)}
        title="Slet tilbudsavis?"
        description="Er du sikker på at du vil slette denne tilbudsavis? Handlingen kan ikke fortrydes."
        cancelLabel="Fortryd handling"
        confirmLabel="Fortsæt"
        confirmColor="#FF3B30"
      />
    </div>
  );
}

// ── PDF Import Create/Edit Page (full-screen) ─────────────────────────────

function PdfImportCreatePage({
  batch,
  allBatches,
  onClose,
  onSaved,
}: {
  batch: ImportBatch | null;
  allBatches: ImportBatch[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!batch;
  const initStore = batch?.store ?? '';
  const initValidFrom = batch?.valid_from ?? new Date().toISOString().slice(0, 10);
  const initValidUntil = batch?.valid_until ?? (() => {
    const d = new Date(); d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  })();

  const [store, setStore] = useState(initStore);
  const [validFrom, setValidFrom] = useState(initValidFrom);
  const [validUntil, setValidUntil] = useState(initValidUntil);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [replaceBatchId, setReplaceBatchId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const replaceOptions = allBatches
    .filter(b => b.status !== 'failed' && b.valid_until && b.valid_until >= new Date().toISOString().slice(0, 10))
    .map(b => ({ id: b.id, label: `${b.store ?? 'Ukendt'} (${b.valid_from ?? '?'} → ${b.valid_until ?? '?'})` }));

  const isDirty = store !== initStore || validFrom !== initValidFrom || validUntil !== initValidUntil || !!pdfFile;

  const tryClose = () => {
    if (isDirty) {
      setConfirmClose(true);
    } else {
      onClose();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.includes('pdf')) {
        toast.error('Kun PDF-filer understøttes');
        return;
      }
      if (file.size > 70 * 1024 * 1024) {
        toast.error('Filen er for stor (max 70 MB)');
        return;
      }
      setPdfFile(file);
    }
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (!file.type.includes('pdf')) {
        toast.error('Kun PDF-filer understøttes');
        return;
      }
      if (file.size > 70 * 1024 * 1024) {
        toast.error('Filen er for stor (max 70 MB)');
        return;
      }
      setPdfFile(file);
    }
  };

  const handleSave = async () => {
    if (!isEdit && !pdfFile) {
      toast.error('Vælg en PDF-fil');
      return;
    }
    if (!store) {
      toast.error('Vælg en butikskæde');
      return;
    }

    setSaving(true);
    try {
      if (isEdit) {
        // Update existing batch
        await supabase
          .from('pdf_import_batches')
          .update({
            store: store || null,
            valid_from: validFrom || null,
            valid_until: validUntil || null,
          })
          .eq('id', batch.id);
        toast.success('Tilbudsavis opdateret');
      } else {
        // Expire the batch being replaced
        if (replaceBatchId && validFrom) {
          const dayBefore = new Date(validFrom);
          dayBefore.setDate(dayBefore.getDate() - 1);
          await supabase
            .from('pdf_import_batches')
            .update({ valid_until: dayBefore.toISOString().slice(0, 10) })
            .eq('id', replaceBatchId);
        }

        // Upload PDF
        const fileName = `${Date.now()}_${pdfFile!.name}`;
        const { error: uploadError } = await supabase.storage
          .from('tilbudsaviser')
          .upload(fileName, pdfFile!);
        if (uploadError) {
          toast.error('Upload fejlede: ' + uploadError.message);
          setSaving(false);
          return;
        }

        // Create batch
        const isScheduled = validFrom > new Date().toISOString().slice(0, 10);
        const { data: newBatch, error: batchError } = await supabase
          .from('pdf_import_batches')
          .insert({
            file_name: pdfFile!.name,
            file_url: fileName,
            store: store || null,
            status: isScheduled ? 'scheduled' : 'pending',
            valid_from: validFrom || null,
            valid_until: validUntil || null,
          })
          .select()
          .single();

        if (batchError || !newBatch) {
          toast.error('Kunne ikke oprette tilbudsavis');
          setSaving(false);
          return;
        }

        // Batch created successfully
        toast.success('Tilbudsavis oprettet');

        // Start client-side PDF parsing (non-blocking)
        parsePdfBatch(newBatch, onSaved);
      }

      onSaved();
      onClose();
    } catch {
      toast.error('Uventet fejl');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-[#f7f6f2] flex flex-col">
      {/* Header */}
      <div className="safe-area-pt flex items-center gap-1 px-2 pb-2.5 pt-2">
        <button
          onClick={tryClose}
          className="flex h-9 w-9 items-center justify-center text-[#30302d]"
          aria-label="Tilbage"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="text-[15px] font-semibold text-[#2f2f2d] flex-1">
          {isEdit ? 'Rediger tilbudsavis' : 'Opret tilbudsavis'}
        </h1>
        <button
          onClick={tryClose}
          className="flex h-9 w-9 items-center justify-center text-[#30302d]"
          aria-label="Luk"
        >
          <XIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Store selection */}
        <div>
          <Label className="text-[12px] font-semibold text-[#5f5d56]">Butikskæde *</Label>
          <input
            list="pdf-store-suggestions"
            value={store}
            onChange={e => setStore(e.target.value)}
            placeholder="Skriv eller vælg butik..."
            className="mt-1 w-full h-9 rounded-[8px] border border-[#e8e6df] bg-white px-2.5 text-[13px] text-[#2f2f2d]"
          />
          <datalist id="pdf-store-suggestions">
            {STORES.map(s => <option key={s} value={s} />)}
          </datalist>
        </div>

        {/* PDF Upload */}
        {!isEdit ? (
          <div>
            <Label className="text-[12px] font-semibold text-[#5f5d56]">PDF-fil *</Label>
            <input ref={fileRef} type="file" accept=".pdf" onChange={handleFileSelect} className="hidden" />
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={cn(
                'mt-1 rounded-[8px] border-2 border-dashed p-6 text-center transition-colors cursor-pointer',
                dragOver ? 'border-[#f58a2d] bg-[#fff6ef]' : 'border-[#d0cec5] bg-[#faf9f6] hover:border-[#b0ae9f]'
              )}
            >
              {pdfFile ? (
                <div className="flex flex-col items-center gap-2">
                  <FileText className="h-8 w-8 text-[#34C759]" />
                  <p className="text-[13px] font-semibold text-[#2f2f2d]">{pdfFile.name}</p>
                  <p className="text-[11px] text-[#78766d]">{(pdfFile.size / 1024 / 1024).toFixed(1)} MB — Klik for at ændre</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-[#c8c6bc]" />
                  <p className="text-[13px] font-semibold text-[#3f3e3a]">Upload tilbudsavis (PDF)</p>
                  <p className="text-[11px] text-[#78766d]">Træk og slip eller klik for at vælge fil (max 70 MB)</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-[8px] border border-[#e8e6df] bg-white px-3 py-3">
            <FileText className="h-5 w-5 text-[#9a978f] shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-[#2f2f2d] truncate">{batch.file_name}</p>
              <p className="text-[10px] text-[#78766d]">PDF kan ikke ændres efter upload</p>
            </div>
          </div>
        )}

        {/* Replace existing batch */}
        {!isEdit && replaceOptions.length > 0 && (
          <div>
            <Label className="text-[12px] font-semibold text-[#5f5d56]">Erstatter eksisterende avis (valgfrit)</Label>
            <select
              value={replaceBatchId ?? ''}
              onChange={e => {
                const id = e.target.value || null;
                setReplaceBatchId(id);
                if (id) setValidFrom(new Date().toISOString().slice(0, 10));
              }}
              className="mt-1 w-full h-9 rounded-[8px] border border-[#e8e6df] bg-white px-2.5 text-[13px] text-[#2f2f2d]"
            >
              <option value="">Ingen — ny avis</option>
              {replaceOptions.map(o => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </select>
          </div>
        )}

        {/* Date range */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-[12px] font-semibold text-[#5f5d56]">Gyldig fra</Label>
            <Input
              type="date"
              value={validFrom}
              onChange={e => setValidFrom(e.target.value)}
              className="mt-1 rounded-[8px] border-[#e8e6df] text-[13px]"
            />
          </div>
          <div>
            <Label className="text-[12px] font-semibold text-[#5f5d56]">Gyldig til</Label>
            <Input
              type="date"
              value={validUntil}
              onChange={e => setValidUntil(e.target.value)}
              className="mt-1 rounded-[8px] border-[#e8e6df] text-[13px]"
            />
          </div>
        </div>
      </div>

      {/* Save button */}
      <div className="safe-area-pb px-4 py-3">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full h-11 rounded-[10px] bg-[#f58a2d] text-white hover:bg-[#e47921] text-[14px] font-semibold"
        >
          {saving ? 'Gemmer...' : isEdit ? 'Opdater' : 'Opret tilbudsavis'}
        </Button>
      </div>

      <SavingOverlay open={saving} />
      <ConfirmCloseDialog
        open={confirmClose}
        onCancel={() => setConfirmClose(false)}
        onConfirm={onClose}
      />
    </div>
  );
}
