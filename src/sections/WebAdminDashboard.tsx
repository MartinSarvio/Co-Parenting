import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Upload, FileText, Search, Trash2, RefreshCw, Eye, Check, X,
  Plus, Pencil, ExternalLink, ImagePlus, Crop,
  LogOut, Link2, AlertTriangle,
  Newspaper, Globe, Loader2,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { parsePdfBatch } from '@/lib/pdfParse';
import { FLYERS } from '@/lib/etilbudsavis';
import { DEMO_NEWS } from '@/sections/FeedView';
import { toast, Toaster } from 'sonner';

// Hardcoded affiliate sponsors (same as TilbudMainPage)
const DEFAULT_SPONSORS = [
  {
    id: 'bulk-dk',
    name: 'Bulk',
    url: 'https://www.awin1.com/cread.php?awinmid=18540&awinaffid=900803&ued=https%3A%2F%2Fwww.bulk.com%2Fdk%2Ftodays-offers',
    store: 'Bulk',
    category: 'Kosttilskud',
    banner_image: null as string | null,
    banner_position_y: 50,
  },
  {
    id: 'myprotein-dk-1',
    name: 'Myprotein',
    url: 'https://www.awin1.com/cread.php?s=3487002&v=8983&q=349344&r=900803',
    store: 'Myprotein',
    category: 'Kosttilskud',
    banner_image: 'https://www.awin1.com/cshow.php?s=3487002&v=8983&q=349344&r=900803',
    banner_position_y: 50,
  },
  {
    id: 'myprotein-dk-2',
    name: 'Myprotein',
    url: 'https://www.awin1.com/cread.php?s=4680362&v=8983&q=596085&r=900803',
    store: 'Myprotein',
    category: 'Kosttilskud',
    banner_image: 'https://www.awin1.com/cshow.php?s=4680362&v=8983&q=596085&r=900803',
    banner_position_y: 50,
  },
];

// ── Types ───────────────────────────────────────────────────────────────────

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
  image_url: string | null;
}

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

const STORES = [
  'Bilka', 'Netto', 'Føtex', 'REMA 1000', 'Lidl', 'MENY', 'Løvbjerg', 'Coop 365',
  'Brugsen', 'Kvickly', 'SuperBrugsen', "Dagli'Brugsen", 'Spar',
];

// ═══════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════

export function WebAdminDashboard() {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tilbudsaviser' | 'affiliate' | 'nyheder'>('tilbudsaviser');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ? { id: data.user.id, email: data.user.email ?? undefined } : null);
      setLoading(false);
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <RefreshCw className="h-6 w-6 animate-spin text-[#9ca3af]" />
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Header */}
      <header className="bg-white border-b border-[#e5e5e5] px-6 py-3 flex items-center gap-4 sticky top-0 z-10">
        <img src="/huska-logo.svg" alt="Huska" className="h-8 w-8 rounded-xl" />
        <h1 className="text-[16px] font-bold text-[#1a1a1a]">Huska <span className="text-[12px] font-medium text-[#9ca3af] ml-1">Admin</span></h1>
        <div className="flex-1" />
        <span className="text-[12px] text-[#9ca3af]">{user.email}</span>
        <button onClick={handleLogout} className="p-2 rounded-lg hover:bg-[#f5f5f5] text-[#9ca3af]" title="Log ud">
          <LogOut className="h-4 w-4" />
        </button>
      </header>

      {/* Tab Bar */}
      <div className="bg-white border-b border-[#e5e5e5] px-6 flex gap-1">
        {([
          { id: 'tilbudsaviser' as const, label: 'Tilbudsaviser', icon: FileText },
          { id: 'affiliate' as const, label: 'Affiliate-links', icon: Link2 },
          { id: 'nyheder' as const, label: 'Nyheder', icon: Newspaper },
        ]).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-[13px] font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-[#1a1a1a] text-[#1a1a1a]'
                : 'border-transparent text-[#9ca3af] hover:text-[#1a1a1a]'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="max-w-[1200px] mx-auto px-6 py-6">
        {activeTab === 'tilbudsaviser' ? <TilbudsaviserTab /> : activeTab === 'affiliate' ? <AffiliateTab /> : <NyhederTab />}
      </div>

      <Toaster position="top-center" />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// LOGIN FORM
// ═══════════════════════════════════════════════════════════════════════════

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error('Login fejl: ' + error.message);
    } else {
      window.location.reload();
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
      <form onSubmit={handleLogin} className="bg-white rounded-xl shadow-sm border border-[#e5e5e5] p-8 w-full max-w-[400px] space-y-4">
        <div className="text-center mb-6">
          <img src="/huska-logo.svg" alt="Huska" className="h-12 w-12 rounded-2xl mx-auto mb-3" />
          <h1 className="text-[18px] font-bold text-[#1a1a1a]">Huska <span className="text-[#9ca3af] font-medium">Admin</span></h1>
          <p className="text-[13px] text-[#9ca3af] mt-1">Log ind for at administrere indhold</p>
        </div>
        <div>
          <label className="text-[12px] font-semibold text-[#6b7280] block mb-1">E-mail</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full h-10 rounded-lg border border-[#e5e5e5] px-3 text-[13px]"
            required
          />
        </div>
        <div>
          <label className="text-[12px] font-semibold text-[#6b7280] block mb-1">Adgangskode</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full h-10 rounded-lg border border-[#e5e5e5] px-3 text-[13px]"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full h-10 rounded-lg bg-[#1a1a1a] text-white font-semibold text-[14px] hover:bg-[#333] disabled:opacity-50"
        >
          {loading ? 'Logger ind...' : 'Log ind'}
        </button>
      </form>
      <Toaster position="top-center" />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TILBUDSAVISER TAB
// ═══════════════════════════════════════════════════════════════════════════

function TilbudsaviserTab() {
  const [batches, setBatches] = useState<ImportBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [previewBatch, setPreviewBatch] = useState<ImportBatch | null>(null);
  const [previewItems, setPreviewItems] = useState<ImportItem[]>([]);
  const [cropBatch, setCropBatch] = useState<ImportBatch | null>(null);

  const fetchBatches = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('pdf_import_batches')
      .select('*')
      .order('created_at', { ascending: false });
    setBatches(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchBatches(); }, [fetchBatches]);

  const handleDelete = async (id: string) => {
    if (!confirm('Slet denne tilbudsavis?')) return;
    await supabase.from('pdf_import_items').delete().eq('batch_id', id);
    await supabase.from('pdf_import_batches').delete().eq('id', id);
    toast.success('Tilbudsavis slettet');
    fetchBatches();
  };

  const loadPreview = async (batch: ImportBatch) => {
    setPreviewBatch(batch);
    const { data } = await supabase
      .from('pdf_import_items')
      .select('*')
      .eq('batch_id', batch.id)
      .order('category', { ascending: true });
    setPreviewItems(data ?? []);
  };

  const today = new Date().toISOString().slice(0, 10);
  const activeBatches = batches.filter(b =>
    b.status !== 'failed' && b.valid_from && b.valid_until &&
    b.valid_from <= today && b.valid_until >= today
  );
  const scheduledBatches = batches.filter(b =>
    b.status !== 'failed' && b.valid_from && b.valid_from > today
  );
  const otherBatches = batches.filter(b =>
    !activeBatches.includes(b) && !scheduledBatches.includes(b)
  );

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      confirmed: 'bg-green-100 text-green-700',
      preview: 'bg-blue-100 text-blue-700',
      processing: 'bg-yellow-100 text-yellow-700',
      pending: 'bg-gray-100 text-gray-600',
      failed: 'bg-red-100 text-red-700',
      scheduled: 'bg-purple-100 text-purple-700',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${colors[status] ?? 'bg-gray-100 text-gray-600'}`}>
        {status}
      </span>
    );
  };

  const BatchTable = ({ title, items }: { title: string; items: ImportBatch[] }) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-6">
        <h3 className="text-[13px] font-semibold text-[#6b7280] mb-2">{title} ({items.length})</h3>
        <div className="bg-white rounded-lg border border-[#e5e5e5] overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#f0f0f0] bg-[#fafafa]">
                <th className="px-4 py-2 text-[11px] font-semibold text-[#9ca3af]">Butik</th>
                <th className="px-4 py-2 text-[11px] font-semibold text-[#9ca3af]">Fil</th>
                <th className="px-4 py-2 text-[11px] font-semibold text-[#9ca3af]">Periode</th>
                <th className="px-4 py-2 text-[11px] font-semibold text-[#9ca3af] text-center">Produkter</th>
                <th className="px-4 py-2 text-[11px] font-semibold text-[#9ca3af] text-center">Status</th>
                <th className="px-4 py-2 text-[11px] font-semibold text-[#9ca3af]"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((b, i) => (
                <tr key={b.id} className={i % 2 === 0 ? 'bg-white' : 'bg-[#fafafa]'}>
                  <td className="px-4 py-2.5 text-[13px] font-semibold text-[#1a1a1a]">{b.store ?? '—'}</td>
                  <td className="px-4 py-2.5 text-[12px] text-[#9ca3af] truncate max-w-[200px]">{b.file_name}</td>
                  <td className="px-4 py-2.5 text-[12px] text-[#6b7280]">
                    {b.valid_from && b.valid_until
                      ? `${new Date(b.valid_from).toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })} – ${new Date(b.valid_until).toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })}`
                      : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-center text-[13px] font-semibold text-[#1a1a1a]">{b.total_products || 0}</td>
                  <td className="px-4 py-2.5 text-center">{statusBadge(b.status)}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex gap-1 justify-end">
                      {b.total_products > 0 && (
                        <button onClick={() => loadPreview(b)} className="p-1.5 rounded-md hover:bg-[#f5f5f5] text-[#9ca3af]" title="Se produkter">
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {b.total_products > 0 && b.file_url && (
                        <button onClick={() => setCropBatch(b)} className="p-1.5 rounded-md hover:bg-[#f5f5f5] text-[#9ca3af]" title="Tilknyt billeder">
                          <Crop className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {(b.status === 'pending' || b.status === 'failed' || b.total_products === 0) && b.file_url && (
                        <button
                          onClick={() => { parsePdfBatch(b, fetchBatches); }}
                          className="p-1.5 rounded-md hover:bg-blue-50 text-blue-600"
                          title="Parse PDF"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button onClick={() => handleDelete(b.id)} className="p-1.5 rounded-md hover:bg-red-50 text-red-500" title="Slet">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[18px] font-bold text-[#1a1a1a]">Tilbudsaviser</h2>
        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1a1a1a] text-white text-[13px] font-semibold hover:bg-[#333]"
        >
          <Plus className="h-4 w-4" />
          Upload tilbudsavis
        </button>
      </div>

      {/* ── Aktive aviser fra app (hardcoded FLYERS) ── */}
      <div className="mb-6">
        <h3 className="text-[13px] font-semibold text-[#6b7280] mb-2">Aviser i appen ({FLYERS.length})</h3>
        <div className="bg-white rounded-lg border border-[#e5e5e5] overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#f0f0f0] bg-[#fafafa]">
                <th className="px-4 py-2 text-[11px] font-semibold text-[#9ca3af]">Cover</th>
                <th className="px-4 py-2 text-[11px] font-semibold text-[#9ca3af]">Butik</th>
                <th className="px-4 py-2 text-[11px] font-semibold text-[#9ca3af]">Periode</th>
                <th className="px-4 py-2 text-[11px] font-semibold text-[#9ca3af] text-center">Sider</th>
                <th className="px-4 py-2 text-[11px] font-semibold text-[#9ca3af] text-center">Status</th>
                <th className="px-4 py-2 text-[11px] font-semibold text-[#9ca3af]"></th>
              </tr>
            </thead>
            <tbody>
              {FLYERS.map((f, i) => {
                const isActive = (() => {
                  // Simple heuristic — parse "27. feb" style dates relative to 2026
                  // For now, show all as "Hardcoded"
                  return true;
                })();
                return (
                  <tr key={f.id} className={i % 2 === 0 ? 'bg-white' : 'bg-[#fafafa]'}>
                    <td className="px-4 py-2">
                      {f.coverImage ? (
                        <img src={f.coverImage} alt={f.store} className="h-10 w-8 object-cover rounded shadow-sm" />
                      ) : (
                        <div className="h-10 w-8 rounded flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: f.storeColor }}>
                          {f.storeInitial}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-flex items-center justify-center h-5 min-w-[20px] px-1 rounded text-[9px] font-bold text-white"
                          style={{ backgroundColor: f.storeColor }}
                        >
                          {f.storeInitial}
                        </span>
                        <span className="text-[13px] font-semibold text-[#1a1a1a]">
                          {f.store}{f.label ? ` (${f.label})` : ''}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-[12px] text-[#6b7280]">{f.validFrom} – {f.validUntil}</td>
                    <td className="px-4 py-2.5 text-center text-[13px] font-semibold text-[#1a1a1a]">{f.pages}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {isActive ? 'Aktiv' : 'Udløbet'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <a
                        href={f.webUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-md hover:bg-[#f5f5f5] text-[#9ca3af] inline-flex"
                        title="Åbn tilbudsavis"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Uploadede batches fra database ── */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="h-5 w-5 animate-spin text-[#9ca3af]" />
        </div>
      ) : (
        <>
          <BatchTable title="Uploadede — aktive" items={activeBatches} />
          <BatchTable title="Uploadede — kommende" items={scheduledBatches} />
          <BatchTable title="Uploadede — historik & fejlede" items={otherBatches} />
          {batches.length === 0 && (
            <div className="text-center py-10">
              <FileText className="h-8 w-8 text-[#c8c6bc] mx-auto mb-2" />
              <p className="text-[13px] text-[#9ca3af]">Ingen uploadede tilbudsaviser endnu — brug knappen ovenfor</p>
            </div>
          )}
        </>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <UploadModal
          allBatches={batches}
          onClose={() => setShowUpload(false)}
          onSaved={() => { setShowUpload(false); fetchBatches(); }}
        />
      )}

      {/* Preview Modal */}
      {previewBatch && (
        <PreviewModal
          batch={previewBatch}
          items={previewItems}
          onClose={() => { setPreviewBatch(null); setPreviewItems([]); }}
        />
      )}

      {/* Crop Modal */}
      {cropBatch && (
        <CropModal
          batch={cropBatch}
          onClose={() => setCropBatch(null)}
          onUpdated={fetchBatches}
        />
      )}
    </div>
  );
}

// ── Upload Modal ─────────────────────────────────────────────────────────────

function UploadModal({ allBatches, onClose, onSaved }: { allBatches: ImportBatch[]; onClose: () => void; onSaved: () => void }) {
  const [store, setStore] = useState('');
  const [validFrom, setValidFrom] = useState(new Date().toISOString().slice(0, 10));
  const [validUntil, setValidUntil] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  });
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    if (!pdfFile) { toast.error('Vælg en PDF-fil'); return; }
    if (!store) { toast.error('Vælg en butikskæde'); return; }

    setSaving(true);
    try {
      // Auto-expire old batch for same store
      if (store && validFrom) {
        const todayStr = new Date().toISOString().slice(0, 10);
        const existing = allBatches.find(b =>
          b.store === store && b.status !== 'failed' &&
          b.valid_from && b.valid_until &&
          b.valid_from <= todayStr && b.valid_until >= todayStr
        );
        if (existing) {
          const dayBefore = new Date(validFrom);
          dayBefore.setDate(dayBefore.getDate() - 1);
          await supabase
            .from('pdf_import_batches')
            .update({ valid_until: dayBefore.toISOString().slice(0, 10) })
            .eq('id', existing.id);
        }
      }

      // Upload PDF
      const fileName = `${Date.now()}_${pdfFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('tilbudsaviser')
        .upload(fileName, pdfFile);
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
          file_name: pdfFile.name,
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

      toast.success('Tilbudsavis uploadet!');
      onSaved();

      // Start parsing in background
      parsePdfBatch(newBatch);
    } catch {
      toast.error('Uventet fejl');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-[500px] p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[16px] font-bold text-[#1a1a1a]">Upload tilbudsavis</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#f5f5f5] text-[#9ca3af]">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Store */}
          <div>
            <label className="text-[12px] font-semibold text-[#6b7280] block mb-1">Butikskæde *</label>
            <select
              value={store}
              onChange={e => setStore(e.target.value)}
              className="w-full h-10 rounded-lg border border-[#e5e5e5] px-3 text-[13px]"
            >
              <option value="">Vælg butik...</option>
              {STORES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* PDF */}
          <div>
            <label className="text-[12px] font-semibold text-[#6b7280] block mb-1">PDF-fil *</label>
            <input ref={fileRef} type="file" accept=".pdf" onChange={e => { const f = e.target.files?.[0]; if (f) setPdfFile(f); e.target.value = ''; }} className="hidden" />
            <div
              onClick={() => fileRef.current?.click()}
              className="rounded-lg border-2 border-dashed border-[#d0cec5] bg-[#fafafa] hover:border-[#b0ae9f] p-6 text-center cursor-pointer transition-colors"
            >
              {pdfFile ? (
                <div className="flex flex-col items-center gap-2">
                  <FileText className="h-8 w-8 text-green-500" />
                  <p className="text-[13px] font-semibold text-[#1a1a1a]">{pdfFile.name}</p>
                  <p className="text-[11px] text-[#9ca3af]">{(pdfFile.size / 1024 / 1024).toFixed(1)} MB</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-[#c8c6bc]" />
                  <p className="text-[13px] font-semibold text-[#3f3e3a]">Klik for at vælge PDF</p>
                  <p className="text-[11px] text-[#9ca3af]">Max 70 MB</p>
                </div>
              )}
            </div>
          </div>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] font-semibold text-[#6b7280] block mb-1">Gyldig fra</label>
              <input type="date" value={validFrom} onChange={e => setValidFrom(e.target.value)} className="w-full h-10 rounded-lg border border-[#e5e5e5] px-3 text-[13px]" />
            </div>
            <div>
              <label className="text-[12px] font-semibold text-[#6b7280] block mb-1">Gyldig til</label>
              <input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} className="w-full h-10 rounded-lg border border-[#e5e5e5] px-3 text-[13px]" />
            </div>
          </div>

          {validFrom > new Date().toISOString().slice(0, 10) && (
            <div className="flex items-center gap-2 text-[12px] text-purple-600 bg-purple-50 rounded-lg px-3 py-2">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              Denne tilbudsavis vil blive planlagt (scheduled) da startdatoen er i fremtiden.
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-6">
          <button onClick={onClose} className="flex-1 h-10 rounded-lg border border-[#e5e5e5] text-[13px] font-medium text-[#6b7280] hover:bg-[#f5f5f5]">
            Annuller
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 h-10 rounded-lg bg-[#1a1a1a] text-white text-[13px] font-semibold hover:bg-[#333] disabled:opacity-50"
          >
            {saving ? 'Uploader...' : 'Upload & Parse'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Preview Modal ────────────────────────────────────────────────────────────

function PreviewModal({ batch, items, onClose }: { batch: ImportBatch; items: ImportItem[]; onClose: () => void }) {
  const grouped = items.reduce((acc, item) => {
    const cat = item.category ?? 'Andet';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, ImportItem[]>);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-[800px] max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e5e5]">
          <div>
            <h3 className="text-[16px] font-bold text-[#1a1a1a]">{batch.store} — {batch.total_products} produkter</h3>
            <p className="text-[12px] text-[#9ca3af]">{batch.file_name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#f5f5f5] text-[#9ca3af]">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([cat, catItems]) => (
            <div key={cat} className="mb-4">
              <h4 className="text-[12px] font-semibold text-[#9ca3af] uppercase tracking-wide mb-2">{cat} ({catItems.length})</h4>
              <div className="space-y-1">
                {catItems.map(item => (
                  <div key={item.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#fafafa]">
                    {item.image_url ? (
                      <img src={item.image_url} alt="" className="h-10 w-10 rounded object-cover shrink-0" />
                    ) : (
                      <div className="h-10 w-10 rounded bg-[#f5f5f5] shrink-0 flex items-center justify-center">
                        <FileText className="h-4 w-4 text-[#c8c6bc]" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-[#1a1a1a] truncate">{item.title}</p>
                      <p className="text-[11px] text-[#9ca3af]">{item.unit ?? ''}</p>
                    </div>
                    {item.discount && (
                      <span className="text-[11px] font-semibold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">{item.discount}</span>
                    )}
                    {item.original_price && (
                      <span className="text-[12px] text-[#9ca3af] line-through">{item.original_price} kr</span>
                    )}
                    <span className="text-[14px] font-bold text-[#1a1a1a]">{item.price} kr</span>
                    <div className={`w-2 h-2 rounded-full ${(item.confidence ?? 0) >= 0.7 ? 'bg-green-400' : 'bg-yellow-400'}`} title={`Confidence: ${((item.confidence ?? 0) * 100).toFixed(0)}%`} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Crop Modal (PDF viewer + image cropping) ─────────────────────────────────

function CropModal({ batch, onClose }: { batch: ImportBatch; onClose: () => void; onUpdated?: () => void }) {
  const [items, setItems] = useState<ImportItem[]>([]);
  const [pages, setPages] = useState<HTMLCanvasElement[]>([]);
  const [loadingPdf, setLoadingPdf] = useState(true);
  const [selectedItem, setSelectedItem] = useState<ImportItem | null>(null);
  const [selectedPage, setSelectedPage] = useState(0);
  const [cropping, setCropping] = useState(false);
  const [cropStart, setCropStart] = useState<{ x: number; y: number } | null>(null);
  const [cropEnd, setCropEnd] = useState<{ x: number; y: number } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);

  // Load items
  useEffect(() => {
    supabase
      .from('pdf_import_items')
      .select('*')
      .eq('batch_id', batch.id)
      .eq('is_rejected', false)
      .order('category')
      .then(({ data }) => setItems(data ?? []));
  }, [batch.id]);

  // Load PDF pages
  useEffect(() => {
    if (!batch.file_url) return;
    const { data: urlData } = supabase.storage.from('tilbudsaviser').getPublicUrl(batch.file_url);
    if (!urlData?.publicUrl) return;

    (async () => {
      try {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

        const resp = await fetch(urlData.publicUrl);
        const pdfBytes = await resp.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: pdfBytes }).promise;
        const rendered: HTMLCanvasElement[] = [];

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1.5 });
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d')!;
          await page.render({ canvasContext: ctx, viewport, canvas } as never).promise;
          rendered.push(canvas);
        }

        setPages(rendered);
      } catch (err) {
        console.error('PDF load error:', err);
        toast.error('Kunne ikke indlæse PDF');
      } finally {
        setLoadingPdf(false);
      }
    })();
  }, [batch.file_url]);

  // Draw current page on canvas
  useEffect(() => {
    if (!canvasRef.current || pages.length === 0) return;
    const page = pages[selectedPage];
    if (!page) return;
    const canvas = canvasRef.current;
    canvas.width = page.width;
    canvas.height = page.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(page, 0, 0);

    // Setup overlay
    if (overlayRef.current) {
      overlayRef.current.width = page.width;
      overlayRef.current.height = page.height;
    }
  }, [pages, selectedPage]);

  // Draw crop rectangle on overlay
  useEffect(() => {
    if (!overlayRef.current) return;
    const ctx = overlayRef.current.getContext('2d')!;
    ctx.clearRect(0, 0, overlayRef.current.width, overlayRef.current.height);
    if (cropStart && cropEnd) {
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 3]);
      const x = Math.min(cropStart.x, cropEnd.x);
      const y = Math.min(cropStart.y, cropEnd.y);
      const w = Math.abs(cropEnd.x - cropStart.x);
      const h = Math.abs(cropEnd.y - cropStart.y);
      ctx.strokeRect(x, y, w, h);
      // Dim outside
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(0, 0, overlayRef.current.width, y);
      ctx.fillRect(0, y + h, overlayRef.current.width, overlayRef.current.height - y - h);
      ctx.fillRect(0, y, x, h);
      ctx.fillRect(x + w, y, overlayRef.current.width - x - w, h);
    }
  }, [cropStart, cropEnd]);

  const getCanvasCoords = (e: React.MouseEvent) => {
    const rect = overlayRef.current!.getBoundingClientRect();
    const scaleX = overlayRef.current!.width / rect.width;
    const scaleY = overlayRef.current!.height / rect.height;
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!selectedItem) return;
    setCropping(true);
    const pos = getCanvasCoords(e);
    setCropStart(pos);
    setCropEnd(pos);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cropping) return;
    setCropEnd(getCanvasCoords(e));
  };

  const handleMouseUp = async () => {
    if (!cropping || !cropStart || !cropEnd || !selectedItem) return;
    setCropping(false);

    const x = Math.min(cropStart.x, cropEnd.x);
    const y = Math.min(cropStart.y, cropEnd.y);
    const w = Math.abs(cropEnd.x - cropStart.x);
    const h = Math.abs(cropEnd.y - cropStart.y);

    if (w < 20 || h < 20) {
      setCropStart(null);
      setCropEnd(null);
      return;
    }

    // Crop from original page canvas
    const page = pages[selectedPage];
    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = w;
    cropCanvas.height = h;
    const ctx = cropCanvas.getContext('2d')!;
    ctx.drawImage(page, x, y, w, h, 0, 0, w, h);

    // Convert to blob
    const blob = await new Promise<Blob | null>(resolve => cropCanvas.toBlob(resolve, 'image/jpeg', 0.85));
    if (!blob) { toast.error('Kunne ikke oprette billede'); return; }

    // Upload
    const fileName = `product-images/${batch.id}/${selectedItem.id}.jpg`;
    const { error: uploadErr } = await supabase.storage.from('tilbudsaviser').upload(fileName, blob, { upsert: true });
    if (uploadErr) { toast.error('Upload fejl: ' + uploadErr.message); return; }

    const { data: pubData } = supabase.storage.from('tilbudsaviser').getPublicUrl(fileName);
    const imageUrl = pubData?.publicUrl;

    // Update item
    await supabase.from('pdf_import_items').update({ image_url: imageUrl }).eq('id', selectedItem.id);
    setItems(prev => prev.map(it => it.id === selectedItem.id ? { ...it, image_url: imageUrl ?? null } : it));
    toast.success(`Billede gemt for "${selectedItem.title}"`);
    setCropStart(null);
    setCropEnd(null);
    setSelectedItem(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex" onClick={onClose}>
      <div className="bg-white w-full h-full flex" onClick={e => e.stopPropagation()}>
        {/* Left: Product list */}
        <div className="w-[300px] border-r border-[#e5e5e5] flex flex-col">
          <div className="px-4 py-3 border-b border-[#e5e5e5] flex items-center justify-between">
            <h3 className="text-[14px] font-bold text-[#1a1a1a]">Produkter</h3>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#f5f5f5] text-[#9ca3af]">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {items.map(item => (
              <button
                key={item.id}
                onClick={() => { setSelectedItem(item); setCropStart(null); setCropEnd(null); }}
                className={`w-full text-left px-4 py-2.5 border-b border-[#f0f0f0] hover:bg-[#fafafa] flex items-center gap-2 ${selectedItem?.id === item.id ? 'bg-gray-100' : ''}`}
              >
                {item.image_url ? (
                  <img src={item.image_url} alt="" className="h-8 w-8 rounded object-cover shrink-0" />
                ) : (
                  <div className="h-8 w-8 rounded bg-[#f5f5f5] shrink-0 flex items-center justify-center">
                    <ImagePlus className="h-3 w-3 text-[#c8c6bc]" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium text-[#1a1a1a] truncate">{item.title}</p>
                  <p className="text-[11px] text-[#1a1a1a] font-semibold">{item.price} kr</p>
                </div>
                {item.image_url && <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />}
              </button>
            ))}
          </div>
        </div>

        {/* Right: PDF viewer */}
        <div className="flex-1 flex flex-col bg-[#e5e5e5]">
          {/* Page selector */}
          <div className="bg-white border-b border-[#e5e5e5] px-4 py-2 flex items-center gap-3">
            <span className="text-[12px] text-[#9ca3af]">Side:</span>
            <div className="flex gap-1 flex-wrap">
              {pages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setSelectedPage(i); setCropStart(null); setCropEnd(null); }}
                  className={`w-7 h-7 rounded text-[11px] font-medium ${selectedPage === i ? 'bg-[#1a1a1a] text-white' : 'bg-[#f5f5f5] text-[#6b7280] hover:bg-[#e5e5e5]'}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <div className="flex-1" />
            {selectedItem && (
              <span className="text-[12px] text-[#1a1a1a] font-medium">
                Vælger billede for: {selectedItem.title}
              </span>
            )}
          </div>

          {/* Canvas */}
          <div className="flex-1 overflow-auto p-4 flex items-start justify-center">
            {loadingPdf ? (
              <div className="flex flex-col items-center gap-3 py-20">
                <RefreshCw className="h-6 w-6 animate-spin text-[#9ca3af]" />
                <p className="text-[13px] text-[#9ca3af]">Indlæser PDF...</p>
              </div>
            ) : pages.length === 0 ? (
              <p className="text-[13px] text-[#9ca3af] py-20">Ingen sider fundet</p>
            ) : (
              <div className="relative inline-block" style={{ cursor: selectedItem ? 'crosshair' : 'default' }}>
                <canvas ref={canvasRef} className="max-w-full shadow-lg rounded" />
                <canvas
                  ref={overlayRef}
                  className="absolute inset-0 max-w-full"
                  style={{ width: '100%', height: '100%' }}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// AFFILIATE TAB
// ═══════════════════════════════════════════════════════════════════════════

function AffiliateTab() {
  const [links, setLinks] = useState<AffiliateLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editLink, setEditLink] = useState<AffiliateLink | null>(null);

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
    if (!confirm('Slet dette affiliate-link?')) return;
    await supabase.from('affiliate_links').delete().eq('id', id);
    toast.success('Affiliate-link slettet');
    fetchLinks();
  };

  const handleToggle = async (id: string, active: boolean) => {
    await supabase.from('affiliate_links').update({ is_active: active, updated_at: new Date().toISOString() }).eq('id', id);
    setLinks(prev => prev.map(l => l.id === id ? { ...l, is_active: active } : l));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[18px] font-bold text-[#1a1a1a]">Affiliate-links</h2>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1a1a1a] text-white text-[13px] font-semibold hover:bg-[#333]"
        >
          <Plus className="h-4 w-4" />
          Opret affiliate-link
        </button>
      </div>

      {/* ── Standard sponsors (hardcoded i appen) ── */}
      <div className="mb-6">
        <h3 className="text-[13px] font-semibold text-[#6b7280] mb-2">Standard sponsors i appen ({DEFAULT_SPONSORS.length})</h3>
        <div className="bg-white rounded-lg border border-[#e5e5e5] overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#f0f0f0] bg-[#fafafa]">
                <th className="px-4 py-2 text-[11px] font-semibold text-[#9ca3af]">Banner</th>
                <th className="px-4 py-2 text-[11px] font-semibold text-[#9ca3af]">Navn</th>
                <th className="px-4 py-2 text-[11px] font-semibold text-[#9ca3af]">Butik</th>
                <th className="px-4 py-2 text-[11px] font-semibold text-[#9ca3af]">Kategori</th>
                <th className="px-4 py-2 text-[11px] font-semibold text-[#9ca3af]">Type</th>
                <th className="px-4 py-2 text-[11px] font-semibold text-[#9ca3af]"></th>
              </tr>
            </thead>
            <tbody>
              {DEFAULT_SPONSORS.map((s, i) => (
                <tr key={s.id} className={i % 2 === 0 ? 'bg-white' : 'bg-[#fafafa]'}>
                  <td className="px-4 py-2">
                    {s.banner_image ? (
                      <img src={s.banner_image} alt="" className="h-8 w-16 object-cover rounded" />
                    ) : (
                      <div className="h-8 w-16 bg-[#f5f5f5] rounded flex items-center justify-center">
                        <ImagePlus className="h-3 w-3 text-[#c8c6bc]" />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <p className="text-[13px] font-semibold text-[#1a1a1a]">{s.name}</p>
                    <p className="text-[10px] text-[#9ca3af] truncate max-w-[200px]">{s.url}</p>
                  </td>
                  <td className="px-4 py-2 text-[12px] text-[#6b7280]">{s.store}</td>
                  <td className="px-4 py-2 text-[12px] text-[#6b7280]">{s.category}</td>
                  <td className="px-4 py-2">
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-purple-100 text-purple-700">Hardcoded</span>
                  </td>
                  <td className="px-4 py-2">
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-md hover:bg-[#f5f5f5] text-[#9ca3af] inline-flex"
                      title="Åbn link"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Database affiliate-links ── */}
      <h3 className="text-[13px] font-semibold text-[#6b7280] mb-2">Database affiliate-links</h3>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9ca3af]" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Søg affiliate-links..."
          className="w-full h-10 rounded-lg border border-[#e5e5e5] pl-10 pr-3 text-[13px]"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-[#e5e5e5] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-5 w-5 animate-spin text-[#9ca3af]" />
          </div>
        ) : filteredLinks.length === 0 ? (
          <div className="text-center py-12">
            <ExternalLink className="h-8 w-8 text-[#c8c6bc] mx-auto mb-2" />
            <p className="text-[14px] font-semibold text-[#3f3e3a]">Ingen affiliate-links</p>
            <p className="text-[12px] text-[#9ca3af]">Opret dit første affiliate-link ovenfor</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#f0f0f0] bg-[#fafafa]">
                <th className="px-4 py-2 text-[11px] font-semibold text-[#9ca3af]">Banner</th>
                <th className="px-4 py-2 text-[11px] font-semibold text-[#9ca3af]">Navn</th>
                <th className="px-4 py-2 text-[11px] font-semibold text-[#9ca3af]">Butik</th>
                <th className="px-4 py-2 text-[11px] font-semibold text-[#9ca3af]">Kategori</th>
                <th className="px-4 py-2 text-[11px] font-semibold text-[#9ca3af] text-center">Aktiv</th>
                <th className="px-4 py-2 text-[11px] font-semibold text-[#9ca3af] text-right">Klik</th>
                <th className="px-4 py-2 text-[11px] font-semibold text-[#9ca3af]"></th>
              </tr>
            </thead>
            <tbody>
              {filteredLinks.map((link, i) => (
                <tr key={link.id} className={i % 2 === 0 ? 'bg-white' : 'bg-[#fafafa]'}>
                  <td className="px-4 py-2">
                    {link.banner_image ? (
                      <img src={link.banner_image} alt="" className="h-8 w-16 object-cover rounded" />
                    ) : (
                      <div className="h-8 w-16 bg-[#f5f5f5] rounded flex items-center justify-center">
                        <ImagePlus className="h-3 w-3 text-[#c8c6bc]" />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <p className="text-[13px] font-semibold text-[#1a1a1a]">{link.name}</p>
                    <p className="text-[10px] text-[#9ca3af] truncate max-w-[200px]">{link.url}</p>
                  </td>
                  <td className="px-4 py-2 text-[12px] text-[#6b7280]">{link.store ?? '—'}</td>
                  <td className="px-4 py-2 text-[12px] text-[#6b7280]">{link.category ?? '—'}</td>
                  <td className="px-4 py-2 text-center">
                    <button
                      onClick={() => handleToggle(link.id, !link.is_active)}
                      className={`px-3 py-1 rounded-full text-[11px] font-medium ${
                        link.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {link.is_active ? 'Aktiv' : 'Inaktiv'}
                    </button>
                  </td>
                  <td className="px-4 py-2 text-[13px] font-semibold text-[#1a1a1a] text-right">{link.click_count}</td>
                  <td className="px-4 py-2">
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => setEditLink(link)} className="p-1.5 rounded-md hover:bg-[#f5f5f5] text-[#9ca3af]">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleDelete(link.id)} className="p-1.5 rounded-md hover:bg-red-50 text-red-500">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreate || editLink) && (
        <AffiliateFormModal
          link={editLink}
          onClose={() => { setShowCreate(false); setEditLink(null); }}
          onSaved={() => { setShowCreate(false); setEditLink(null); fetchLinks(); }}
        />
      )}
    </div>
  );
}

// ── Affiliate Form Modal ─────────────────────────────────────────────────────

function AffiliateFormModal({ link, onClose, onSaved }: { link: AffiliateLink | null; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(link?.name ?? '');
  const [url, setUrl] = useState(link?.url ?? '');
  const [store, setStore] = useState(link?.store ?? '');
  const [partner, setPartner] = useState(link?.partner ?? '');
  const [category, setCategory] = useState(link?.category ?? '');
  const [isActive, setIsActive] = useState(link?.is_active ?? true);
  const [bannerImage, setBannerImage] = useState(link?.banner_image ?? '');
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPositionY, setBannerPositionY] = useState(link?.banner_position_y ?? 50);
  const [sourceUrl, setSourceUrl] = useState(link?.source_url ?? '');
  const [saving, setSaving] = useState(false);
  const bannerRef = useRef<HTMLInputElement>(null);

  const handleBannerSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerFile(file);
    const reader = new FileReader();
    reader.onload = () => setBannerImage(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSave = async () => {
    if (!name.trim() || !url.trim()) {
      toast.error('Navn og URL er påkrævet');
      return;
    }
    setSaving(true);
    try {
      let bannerUrl = bannerImage;
      if (bannerFile) {
        const fileName = `affiliate-banners/${Date.now()}_${bannerFile.name}`;
        const { error: uploadError } = await supabase.storage.from('tilbudsaviser').upload(fileName, bannerFile);
        if (uploadError) { toast.error('Banner upload fejl: ' + uploadError.message); setSaving(false); return; }
        const { data: pubData } = supabase.storage.from('tilbudsaviser').getPublicUrl(fileName);
        bannerUrl = pubData.publicUrl;
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
        if (error) { toast.error('Fejl: ' + error.message); return; }
        toast.success('Affiliate-link opdateret');
      } else {
        const { error } = await supabase.from('affiliate_links').insert(payload);
        if (error) { toast.error('Fejl: ' + error.message); return; }
        toast.success('Affiliate-link oprettet');
      }
      onSaved();
    } catch (err) {
      toast.error('Uventet fejl');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-[500px] max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[16px] font-bold text-[#1a1a1a]">{link ? 'Rediger' : 'Opret'} affiliate-link</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#f5f5f5] text-[#9ca3af]">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[12px] font-semibold text-[#6b7280] block mb-1">Navn *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="F.eks. Bilka Affiliate" className="w-full h-10 rounded-lg border border-[#e5e5e5] px-3 text-[13px]" />
          </div>
          <div>
            <label className="text-[12px] font-semibold text-[#6b7280] block mb-1">Affiliate-URL *</label>
            <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." className="w-full h-10 rounded-lg border border-[#e5e5e5] px-3 text-[13px]" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] font-semibold text-[#6b7280] block mb-1">Butik</label>
              <input list="admin-store-list" value={store} onChange={e => setStore(e.target.value)} placeholder="Vælg butik..." className="w-full h-10 rounded-lg border border-[#e5e5e5] px-3 text-[13px]" />
              <datalist id="admin-store-list">{STORES.map(s => <option key={s} value={s} />)}</datalist>
            </div>
            <div>
              <label className="text-[12px] font-semibold text-[#6b7280] block mb-1">Partner</label>
              <input value={partner} onChange={e => setPartner(e.target.value)} placeholder="Partner-navn" className="w-full h-10 rounded-lg border border-[#e5e5e5] px-3 text-[13px]" />
            </div>
          </div>
          <div>
            <label className="text-[12px] font-semibold text-[#6b7280] block mb-1">Kategori</label>
            <input value={category} onChange={e => setCategory(e.target.value)} placeholder="F.eks. Elektronik, Mejeri" className="w-full h-10 rounded-lg border border-[#e5e5e5] px-3 text-[13px]" />
          </div>

          {/* Banner */}
          <div>
            <label className="text-[12px] font-semibold text-[#6b7280] block mb-1">Banner-billede</label>
            <input ref={bannerRef} type="file" accept="image/*" onChange={handleBannerSelect} className="hidden" />
            {bannerImage ? (
              <div className="space-y-2">
                <div className="relative">
                  <img src={bannerImage} alt="Banner" className="w-full h-24 object-cover rounded-lg" style={{ objectPosition: `center ${bannerPositionY}%` }} />
                  <div className="absolute top-1.5 right-1.5 flex gap-1">
                    <button onClick={() => bannerRef.current?.click()} className="h-7 w-7 rounded-full bg-white/90 flex items-center justify-center shadow-sm">
                      <Pencil className="h-3 w-3 text-[#6b7280]" />
                    </button>
                    <button onClick={() => { setBannerImage(''); setBannerFile(null); }} className="h-7 w-7 rounded-full bg-white/90 flex items-center justify-center shadow-sm">
                      <X className="h-3 w-3 text-red-500" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-[#9ca3af]">Position</span>
                  <input type="range" min={0} max={100} value={bannerPositionY} onChange={e => setBannerPositionY(Number(e.target.value))} className="flex-1 h-1 accent-[#1a1a1a]" />
                  <span className="text-[11px] text-[#9ca3af] w-8 text-right">{bannerPositionY}%</span>
                </div>
              </div>
            ) : (
              <button onClick={() => bannerRef.current?.click()} className="w-full h-20 rounded-lg border-2 border-dashed border-[#d0cec5] bg-[#fafafa] hover:border-[#b0ae9f] flex flex-col items-center justify-center gap-1 transition-colors">
                <ImagePlus className="h-5 w-5 text-[#c8c6bc]" />
                <p className="text-[11px] text-[#9ca3af]">Upload banner</p>
              </button>
            )}
          </div>

          <div>
            <label className="text-[12px] font-semibold text-[#6b7280] block mb-1">Kilde / URL</label>
            <input value={sourceUrl} onChange={e => setSourceUrl(e.target.value)} placeholder="URL til partner-side" className="w-full h-10 rounded-lg border border-[#e5e5e5] px-3 text-[13px]" />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-[#e5e5e5] px-4 py-3">
            <span className="text-[13px] font-semibold text-[#1a1a1a]">Aktiv</span>
            <button
              onClick={() => setIsActive(!isActive)}
              className={`w-12 h-7 rounded-full transition-colors ${isActive ? 'bg-[#34C759]' : 'bg-[#e5e5e5]'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mx-1 ${isActive ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button onClick={onClose} className="flex-1 h-10 rounded-lg border border-[#e5e5e5] text-[13px] font-medium text-[#6b7280] hover:bg-[#f5f5f5]">
            Annuller
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 h-10 rounded-lg bg-[#1a1a1a] text-white text-[13px] font-semibold hover:bg-[#333] disabled:opacity-50"
          >
            {saving ? 'Gemmer...' : link ? 'Opdater' : 'Opret'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// NYHEDER TAB
// ═══════════════════════════════════════════════════════════════════════════

/** Web-compatible news scraper (uses fetch instead of CapacitorHttp) */
async function scrapeNewsWeb(url: string): Promise<{
  title: string; description: string; fullText: string;
  image: string; source: string;
} | null> {
  try {
    const res = await fetch(url);
    const html = await res.text();
    if (!html) return null;

    const getMeta = (prop: string) => {
      const m = html.match(new RegExp(`<meta[^>]*(?:property|name)=["']${prop}["'][^>]*content=["']([^"']*?)["']`, 'i'))
        || html.match(new RegExp(`<meta[^>]*content=["']([^"']*?)["'][^>]*(?:property|name)=["']${prop}["']`, 'i'));
      return m ? m[1].trim() : '';
    };

    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const pageTitle = titleMatch ? titleMatch[1].replace(/\s*[-|–—].*$/, '').trim() : '';

    const title = getMeta('og:title') || pageTitle;
    const description = getMeta('og:description') || getMeta('description');
    const image = getMeta('og:image');
    const source = getMeta('og:site_name') || new URL(url).hostname.replace('www.', '');

    // Extract body text from <p> tags
    const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
    const paragraphs: string[] = [];
    let pMatch;
    while ((pMatch = pRegex.exec(html)) !== null) {
      const text = pMatch[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').trim();
      if (text.length > 40) paragraphs.push(text);
    }
    const fullText = paragraphs.slice(0, 10).join('\n\n');

    if (!title) return null;
    return { title, description, fullText, image, source };
  } catch {
    return null;
  }
}

function NyhederTab() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editArticle, setEditArticle] = useState<NewsArticle | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<NewsArticle | null>(null);
  const [deleting, setDeleting] = useState(false);

  const demoArticles: NewsArticle[] = DEMO_NEWS.map(n => ({
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
    is_demo: true,
    created_at: new Date().toISOString(),
  }));

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

  const allArticles = [...articles, ...demoArticles];

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

  // Show create/edit form
  if (createOpen || editArticle) {
    return (
      <NewsForm
        article={editArticle}
        onClose={() => { setCreateOpen(false); setEditArticle(null); }}
        onSaved={() => { fetchArticles(); setCreateOpen(false); setEditArticle(null); }}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9ca3af]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Søg nyheder..."
            className="w-full pl-9 pr-3 h-10 rounded-lg border border-[#e5e5e5] bg-white text-[13px] text-[#1a1a1a] placeholder:text-[#d1d5db] focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/30 focus:border-[#1a1a1a]"
          />
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 h-10 px-4 rounded-lg bg-[#1a1a1a] text-white text-[13px] font-semibold hover:bg-[#333] transition-colors"
        >
          <Plus className="h-4 w-4" />
          Opret nyhed
        </button>
      </div>

      {/* Article list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-[#9ca3af]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl bg-white border border-[#e5e5e5] p-12 text-center">
          <Newspaper className="h-10 w-10 text-[#c5c3bb] mx-auto mb-3" />
          <p className="text-sm text-[#9ca3af]">
            {search ? 'Ingen nyheder matcher søgningen' : 'Ingen nyheder endnu'}
          </p>
        </div>
      ) : (
        <div className="rounded-xl bg-white border border-[#e5e5e5] overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[auto_1fr_120px_100px_80px_100px] items-center gap-3 px-4 py-2.5 bg-[#fafaf7] border-b border-[#e5e5e5] text-[11px] font-semibold text-[#9ca3af] uppercase tracking-wide">
            <div className="w-10" />
            <div>Titel</div>
            <div>Kilde</div>
            <div>Dato</div>
            <div>Status</div>
            <div className="text-right">Handlinger</div>
          </div>

          {filtered.map(article => (
            <div
              key={article.id}
              className="grid grid-cols-[auto_1fr_120px_100px_80px_100px] items-center gap-3 px-4 py-3 border-b border-[#e5e5e5] last:border-b-0 hover:bg-[#fafaf7] transition-colors"
            >
              {/* Thumbnail */}
              {article.image ? (
                <img src={article.image} alt="" className="h-10 w-10 rounded-lg object-cover" />
              ) : (
                <div className="h-10 w-10 rounded-lg bg-[#f0efe8] flex items-center justify-center">
                  <FileText className="h-4 w-4 text-[#9ca3af]" />
                </div>
              )}

              {/* Title */}
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-[#1a1a1a] truncate">{article.title}</p>
                {article.description && (
                  <p className="text-[11px] text-[#9ca3af] truncate mt-0.5">{article.description}</p>
                )}
              </div>

              {/* Source */}
              <div className="text-[12px] text-[#9ca3af] truncate">
                {article.source ?? '—'}
                {article.is_scraped && (
                  <span className="ml-1 inline-flex items-center gap-0.5 text-[#007AFF] text-[10px]">
                    <Globe className="h-2.5 w-2.5" /> scraped
                  </span>
                )}
              </div>

              {/* Date */}
              <div className="text-[12px] text-[#9ca3af]">{article.date ?? '—'}</div>

              {/* Status badges */}
              <div className="flex items-center gap-1">
                {article.is_demo ? (
                  <span className="inline-flex items-center rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-600 ring-1 ring-purple-200">
                    Demo
                  </span>
                ) : article.is_published ? (
                  <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-600 ring-1 ring-green-200">
                    Aktiv
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-[#f5f5f5] px-2 py-0.5 text-[10px] font-semibold text-[#9ca3af] ring-1 ring-[#e5e5e5]">
                    Kladde
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-1">
                {!article.is_demo && (
                  <button
                    onClick={() => togglePublished(article)}
                    title={article.is_published ? 'Skjul' : 'Publicer'}
                    className={`p-1.5 rounded-md transition-colors ${
                      article.is_published
                        ? 'text-green-600 hover:bg-green-50'
                        : 'text-[#9ca3af] hover:bg-[#f5f5f5]'
                    }`}
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                )}
                {article.url && (
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-md text-[#9ca3af] hover:text-[#007AFF] hover:bg-blue-50 transition-colors"
                    title="Åbn link"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
                <button
                  onClick={() => setEditArticle(article)}
                  className="p-1.5 rounded-md text-[#9ca3af] hover:text-[#1a1a1a] hover:bg-[#f5f5f5] transition-colors"
                  title="Rediger"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                {!article.is_demo && (
                  <button
                    onClick={() => setDeleteTarget(article)}
                    className="p-1.5 rounded-md text-[#9ca3af] hover:text-red-500 hover:bg-red-50 transition-colors"
                    title="Slet"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-[15px] font-bold text-[#1a1a1a] mb-2">Slet nyhed?</h3>
            <p className="text-[13px] text-[#9ca3af] mb-4">
              &ldquo;{deleteTarget.title}&rdquo; slettes permanent.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 h-10 rounded-lg border border-[#e5e5e5] text-[13px] font-medium text-[#6b7280] hover:bg-[#f5f5f5]"
              >
                Annuller
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 h-10 rounded-lg bg-red-500 text-white text-[13px] font-semibold hover:bg-red-600 disabled:opacity-50"
              >
                {deleting ? 'Sletter...' : 'Slet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// NEWS FORM (Create / Edit)
// ═══════════════════════════════════════════════════════════════════════════

function NewsForm({
  article,
  onClose,
  onSaved,
}: {
  article: NewsArticle | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!article;
  const [mode, setMode] = useState<'scrape' | 'manual'>(article ? 'manual' : 'scrape');
  const [scrapeUrl, setScrapeUrl] = useState(article?.url ?? '');
  const [scraping, setScraping] = useState(false);

  const [title, setTitle] = useState(article?.title ?? '');
  const [description, setDescription] = useState(article?.description ?? '');
  const [fullText, setFullText] = useState(article?.full_text ?? '');
  const [source, setSource] = useState(article?.source ?? '');
  const [date, setDate] = useState(article?.date ?? '');
  const [image, setImage] = useState(article?.image ?? '');
  const [url, setUrl] = useState(article?.url ?? '');
  const [isPublished, setIsPublished] = useState(article?.is_published ?? true);
  const [saving, setSaving] = useState(false);

  const handleScrape = async () => {
    if (!scrapeUrl.trim()) { toast.error('Indsæt en URL først'); return; }
    setScraping(true);
    const result = await scrapeNewsWeb(scrapeUrl.trim());
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
      toast.error('Kunne ikke scrape URL — CORS kan blokere. Prøv manuelt.');
    }
    setScraping(false);
  };

  const handleSave = async () => {
    if (!title.trim()) { toast.error('Titel er påkrævet'); return; }
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

    if (article && !article.is_demo) {
      const { error } = await supabase.from('news_articles').update(payload).eq('id', article.id);
      if (error) { toast.error('Fejl: ' + error.message); setSaving(false); return; }
      toast.success('Nyhed opdateret');
    } else {
      const { error } = await supabase.from('news_articles').insert(payload);
      if (error) { toast.error('Fejl: ' + error.message); setSaving(false); return; }
      toast.success('Nyhed oprettet');
    }
    setSaving(false);
    onSaved();
  };

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[18px] font-bold text-[#1a1a1a]">
          {isEdit ? 'Rediger nyhed' : 'Opret nyhed'}
        </h2>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-[#f5f5f5] text-[#9ca3af]">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Mode toggle (only for new) */}
      {!isEdit && (
        <div className="flex rounded-lg bg-[#f5f5f5] p-1 mb-5">
          <button
            onClick={() => setMode('scrape')}
            className={`flex-1 flex items-center justify-center gap-2 rounded-md py-2 text-[13px] font-medium transition-all ${
              mode === 'scrape' ? 'bg-white text-[#1a1a1a] shadow-sm' : 'text-[#9ca3af]'
            }`}
          >
            <Globe className="h-3.5 w-3.5" />
            Scrape fra URL
          </button>
          <button
            onClick={() => setMode('manual')}
            className={`flex-1 flex items-center justify-center gap-2 rounded-md py-2 text-[13px] font-medium transition-all ${
              mode === 'manual' ? 'bg-white text-[#1a1a1a] shadow-sm' : 'text-[#9ca3af]'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            Skriv manuelt
          </button>
        </div>
      )}

      {/* Scrape URL input */}
      {mode === 'scrape' && !isEdit && (
        <div className="rounded-xl bg-white border border-[#e5e5e5] p-4 mb-5">
          <label className="block text-[12px] font-semibold text-[#6b7280] mb-1.5">Artikel-URL</label>
          <div className="flex gap-2">
            <input
              value={scrapeUrl}
              onChange={e => setScrapeUrl(e.target.value)}
              placeholder="https://..."
              className="flex-1 h-10 px-3 rounded-lg border border-[#e5e5e5] text-[13px] text-[#1a1a1a] placeholder:text-[#d1d5db] focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/30 focus:border-[#1a1a1a]"
            />
            <button
              onClick={handleScrape}
              disabled={scraping}
              className="flex items-center gap-2 h-10 px-4 rounded-lg bg-[#1a1a1a] text-white text-[13px] font-medium hover:bg-[#1a1a1a] disabled:opacity-50"
            >
              {scraping ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Globe className="h-3.5 w-3.5" />}
              Hent
            </button>
          </div>
          {scraping && <p className="text-[11px] text-[#9ca3af] mt-2">Henter artikel-data...</p>}
        </div>
      )}

      {/* Form fields */}
      <div className="space-y-4">
        <div>
          <label className="block text-[12px] font-semibold text-[#6b7280] mb-1.5">Titel *</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Nyhedens titel"
            className="w-full h-10 px-3 rounded-lg border border-[#e5e5e5] bg-white text-[13px] text-[#1a1a1a] placeholder:text-[#d1d5db] focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/30 focus:border-[#1a1a1a]"
          />
        </div>

        <div>
          <label className="block text-[12px] font-semibold text-[#6b7280] mb-1.5">Beskrivelse</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Kort beskrivelse..."
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-[#e5e5e5] bg-white text-[13px] text-[#1a1a1a] placeholder:text-[#d1d5db] resize-y focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/30 focus:border-[#1a1a1a]"
          />
        </div>

        <div>
          <label className="block text-[12px] font-semibold text-[#6b7280] mb-1.5">Fuld tekst</label>
          <textarea
            value={fullText}
            onChange={e => setFullText(e.target.value)}
            placeholder="Artikelens fulde tekst..."
            rows={5}
            className="w-full px-3 py-2 rounded-lg border border-[#e5e5e5] bg-white text-[13px] text-[#1a1a1a] placeholder:text-[#d1d5db] resize-y focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/30 focus:border-[#1a1a1a]"
          />
        </div>

        {/* Image preview + URL */}
        <div>
          <label className="block text-[12px] font-semibold text-[#6b7280] mb-1.5">Billede-URL</label>
          <input
            value={image}
            onChange={e => setImage(e.target.value)}
            placeholder="https://..."
            className="w-full h-10 px-3 rounded-lg border border-[#e5e5e5] bg-white text-[13px] text-[#1a1a1a] placeholder:text-[#d1d5db] focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/30 focus:border-[#1a1a1a]"
          />
          {image && (
            <div className="relative mt-2">
              <img src={image} alt="" className="w-full h-40 object-cover rounded-lg border border-[#e5e5e5]" />
              <button
                onClick={() => setImage('')}
                className="absolute top-2 right-2 bg-black/50 rounded-full p-1 hover:bg-black/70"
              >
                <X className="h-3 w-3 text-white" />
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[12px] font-semibold text-[#6b7280] mb-1.5">Kilde</label>
            <input
              value={source}
              onChange={e => setSource(e.target.value)}
              placeholder="F.eks. DR, TV2"
              className="w-full h-10 px-3 rounded-lg border border-[#e5e5e5] bg-white text-[13px] text-[#1a1a1a] placeholder:text-[#d1d5db] focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/30 focus:border-[#1a1a1a]"
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-[#6b7280] mb-1.5">Dato</label>
            <input
              value={date}
              onChange={e => setDate(e.target.value)}
              placeholder="F.eks. 1. mar 2026"
              className="w-full h-10 px-3 rounded-lg border border-[#e5e5e5] bg-white text-[13px] text-[#1a1a1a] placeholder:text-[#d1d5db] focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/30 focus:border-[#1a1a1a]"
            />
          </div>
        </div>

        <div>
          <label className="block text-[12px] font-semibold text-[#6b7280] mb-1.5">Link til artikel</label>
          <input
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://..."
            className="w-full h-10 px-3 rounded-lg border border-[#e5e5e5] bg-white text-[13px] text-[#1a1a1a] placeholder:text-[#d1d5db] focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/30 focus:border-[#1a1a1a]"
          />
          {url && (
            <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-1 text-[11px] text-[#007AFF] hover:underline">
              <ExternalLink className="h-2.5 w-2.5" /> Åbn link
            </a>
          )}
        </div>

        {/* Published toggle */}
        <div className="flex items-center justify-between rounded-xl bg-white border border-[#e5e5e5] px-4 py-3">
          <span className="text-[13px] font-medium text-[#1a1a1a]">Publiceret</span>
          <button
            onClick={() => setIsPublished(!isPublished)}
            className={`relative w-11 h-6 rounded-full transition-colors ${isPublished ? 'bg-green-500' : 'bg-[#d1d0ca]'}`}
          >
            <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${isPublished ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
          </button>
        </div>

        {/* Save / Cancel */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 h-10 rounded-lg border border-[#e5e5e5] text-[13px] font-medium text-[#6b7280] hover:bg-[#f5f5f5]"
          >
            Annuller
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !title.trim()}
            className="flex-1 h-10 rounded-lg bg-[#1a1a1a] text-white text-[13px] font-semibold hover:bg-[#333] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? 'Gemmer...' : isEdit ? 'Gem ændringer' : 'Opret nyhed'}
          </button>
        </div>
      </div>
    </div>
  );
}
