import { useState, useMemo } from 'react';
import { differenceInDays, format, parseISO, startOfToday } from 'date-fns';
import { da } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ScanLine,
  Plus,
  Loader2,
  PackageSearch,
  AlertTriangle,
  MoreVertical,
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchFromOpenFoodFacts, startBarcodeScanner } from '@/lib/openFoodFacts';
import { useAppStore } from '@/store';
import { toast } from 'sonner';
import { BottomSheet } from '@/components/custom/BottomSheet';
import { NutriScoreBadge } from '@/components/custom/NutriScoreBadge';
import { useNutriScoreMap, matchNutriScore } from '@/hooks/useNutriScoreMap';
import { useAllergenMap, matchAllergens } from '@/hooks/useAllergenMap';
import { matchFamilyAllergens } from '@/lib/allergenMatch';
import type { FridgeItem } from '@/types';

export function KoleskabView() {
  const { currentUser, users, children, fridgeItems, addFridgeItem, removeFridgeItem, archiveFridgeItem, updateFridgeItem } = useAppStore();
  const nutriScoreMap = useNutriScoreMap();
  const allergenMapData = useAllergenMap();
  const familyAllergenProfiles = useMemo(() => {
    const profiles: { name: string; allergens: string[] }[] = [];
    for (const child of children) {
      if (child.allergies?.length) profiles.push({ name: child.name, allergens: child.allergies });
    }
    for (const user of users) {
      if (user.allergies?.length) profiles.push({ name: user.name, allergens: user.allergies });
    }
    return profiles;
  }, [children, users]);

  const [scanLoading, setScanLoading] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [menuItem, setMenuItem] = useState<FridgeItem | null>(null);
  const [editingItem, setEditingItem] = useState<FridgeItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editExpiry, setEditExpiry] = useState('');

  // Add form state
  const [formName, setFormName] = useState('');
  const [formBarcode, setFormBarcode] = useState('');
  const [formExpiry, setFormExpiry] = useState('');
  const [formNutrition, setFormNutrition] = useState<FridgeItem['nutritionPer100g']>(undefined);
  const [manualKcal, setManualKcal] = useState('');
  const [manualProtein, setManualProtein] = useState('');
  const [manualCarbs, setManualCarbs] = useState('');
  const [manualFat, setManualFat] = useState('');
  const [formAllergens, setFormAllergens] = useState<string[] | undefined>(undefined);

  function resetForm() {
    setFormName('');
    setFormBarcode('');
    setFormExpiry('');
    setFormNutrition(undefined);
    setFormAllergens(undefined);
    setManualKcal('');
    setManualProtein('');
    setManualCarbs('');
    setManualFat('');
  }

  async function handleScan() {
    const barcode = await startBarcodeScanner();
    if (!barcode) return;

    setScanLoading(true);
    const product = await fetchFromOpenFoodFacts(barcode);
    setScanLoading(false);

    if (product) {
      setFormName(product.brand ? `${product.brand} ${product.name}` : product.name);
      setFormBarcode(barcode);
      setFormNutrition({
        energyKcal: product.kcalPer100g,
        protein: product.proteinPer100g,
        carbs: product.carbsPer100g,
        fat: product.fatPer100g,
        fiber: product.fiberPer100g,
        sugar: product.sugarPer100g,
        salt: product.saltPer100g,
      });
      setFormAllergens(product.allergens);
      setAddDialogOpen(true);
    } else {
      toast.error(`Vare ikke fundet for stregkode ${barcode}`);
      // Still open dialog so user can add manually
      setFormBarcode(barcode);
      setAddDialogOpen(true);
    }
  }

  function handleAddItem() {
    const name = formName.trim();
    if (!name) {
      toast.error('Navn er påkrævet');
      return;
    }

    const item: FridgeItem = {
      id: `fridge-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name,
      barcode: formBarcode || undefined,
      addedAt: new Date().toISOString(),
      addedBy: currentUser?.id ?? '',
      expiresAt: formExpiry || undefined,
      nutritionPer100g: formNutrition ?? (manualKcal ? {
        energyKcal: parseFloat(manualKcal) || undefined,
        protein: parseFloat(manualProtein) || undefined,
        carbs: parseFloat(manualCarbs) || undefined,
        fat: parseFloat(manualFat) || undefined,
      } : undefined),
      allergens: formAllergens,
    };

    addFridgeItem(item);
    toast.success(`${name} tilføjet til køleskabet`);
    setAddDialogOpen(false);
    resetForm();
  }

  function handleRemoveItem(item: FridgeItem) {
    removeFridgeItem(item.id);
    setMenuItem(null);
    toast('Fjernet fra køleskabet');
  }

  function handleArchive(item: FridgeItem, reason: 'used' | 'thrown_away') {
    archiveFridgeItem(item.id, reason);
    setMenuItem(null);
    toast.success(reason === 'used' ? `${item.name} markeret som brugt` : `${item.name} markeret som smidt ud`);
  }

  function openEdit(item: FridgeItem) {
    setEditingItem(item);
    setEditName(item.name);
    setEditExpiry(item.expiresAt ?? '');
    setMenuItem(null);
  }

  function handleSaveEdit() {
    if (!editingItem || !editName.trim()) return;
    updateFridgeItem(editingItem.id, { name: editName.trim(), expiresAt: editExpiry || undefined });
    setEditingItem(null);
    toast.success('Vare opdateret');
  }

  function getExpiryInfo(expiresAt?: string) {
    if (!expiresAt) return null;
    const daysLeft = differenceInDays(parseISO(expiresAt), startOfToday());
    if (daysLeft < 0) return { label: 'Udløbet', color: 'text-red-600', bgColor: 'bg-red-50 border-red-200' };
    if (daysLeft === 0) return { label: 'Udløber i dag', color: 'text-red-500', bgColor: 'bg-red-50 border-red-200' };
    if (daysLeft <= 3) return { label: `${daysLeft}d tilbage`, color: 'text-amber-600', bgColor: 'bg-amber-50 border-amber-200' };
    return { label: format(parseISO(expiresAt), 'd. MMM', { locale: da }), color: 'text-[#78766d]', bgColor: '' };
  }

  // Sort: expired first, then by expiry date, then by name
  const sortedItems = [...fridgeItems].sort((a, b) => {
    const aExpiry = a.expiresAt ? new Date(a.expiresAt).getTime() : Infinity;
    const bExpiry = b.expiresAt ? new Date(b.expiresAt).getTime() : Infinity;
    if (aExpiry !== bExpiry) return aExpiry - bExpiry;
    return a.name.localeCompare(b.name, 'da');
  });

  const expiredCount = fridgeItems.filter(i => {
    if (!i.expiresAt) return false;
    return differenceInDays(parseISO(i.expiresAt), startOfToday()) < 0;
  }).length;

  return (
    <div className="space-y-3">
      {/* Header actions */}
      <div className="flex gap-2">
        <button
          onClick={handleScan}
          disabled={scanLoading}
          className="flex flex-1 items-center justify-center gap-2 rounded-[8px] bg-[#2f2f2d] py-3.5 text-[14px] font-bold text-white active:scale-[0.98] transition-transform disabled:opacity-50"
        >
          {scanLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ScanLine className="h-4 w-4" />
          )}
          Scan stregkode
        </button>
        <button
          onClick={() => { resetForm(); setAddDialogOpen(true); }}
          className="flex items-center justify-center gap-2 rounded-[8px] border-2 border-[#e5e3dc] bg-white px-5 py-3.5 text-[14px] font-bold text-[#2f2f2d] active:scale-[0.98] transition-transform"
        >
          <Plus className="h-4 w-4" />
          Tilføj
        </button>
      </div>

      {/* Warning for expired items */}
      {expiredCount > 0 && (
        <div className="flex items-center gap-2 rounded-[8px] bg-red-50 border border-red-200 px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
          <p className="text-[13px] font-semibold text-red-700">
            {expiredCount} {expiredCount === 1 ? 'vare' : 'varer'} er udløbet
          </p>
        </div>
      )}

      {/* Items list */}
      {sortedItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-[8px] bg-[#f2f1ed]">
            <PackageSearch className="h-8 w-8 text-[#b0ada4]" />
          </div>
          <div>
            <p className="text-[15px] font-semibold text-[#2f2f2d]">Køleskabet er tomt</p>
            <p className="text-[13px] text-[#9a978f] mt-1">Scan en stregkode eller tilføj varer manuelt</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {sortedItems.map(item => {
            const expiryInfo = getExpiryInfo(item.expiresAt);
            const n = item.nutritionPer100g;
            const fridgeNutriGrade = matchNutriScore(item.name, nutriScoreMap);
            const fridgeItemAllergens = item.allergens ?? matchAllergens(item.name, allergenMapData);
            const fridgeAllergenMatches = matchFamilyAllergens(fridgeItemAllergens, familyAllergenProfiles);
            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className={cn(
                  'rounded-[8px] border bg-white p-4 transition-colors',
                  expiryInfo?.bgColor || 'border-[#e5e3dc]'
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-[15px] font-semibold text-[#2f2f2d] truncate">{item.name}</p>
                      {fridgeNutriGrade && <NutriScoreBadge grade={fridgeNutriGrade} size="sm" />}
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {expiryInfo && (
                        <span className={cn('text-[12px] font-semibold', expiryInfo.color)}>
                          {expiryInfo.label}
                        </span>
                      )}
                      {n && n.energyKcal != null && (
                        <span className="text-[11px] text-[#9a978f]">
                          {Math.round(n.energyKcal)} kcal · P {n.protein?.toFixed(1)}g · K {n.carbs?.toFixed(1)}g · F {n.fat?.toFixed(1)}g /100g
                        </span>
                      )}
                    </div>
                    {fridgeAllergenMatches.length > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
                        <span className="text-[10px] font-semibold text-amber-600 truncate">
                          {fridgeAllergenMatches.map(m => `${m.allergenLabel} (${m.affectedMembers.join(', ')})`).join(' · ')}
                        </span>
                      </div>
                    )}
                    {item.barcode && (
                      <p className="text-[10px] text-[#b0ada4] mt-0.5">{item.barcode}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setMenuItem(item)}
                    className="text-[#b0ada4] hover:text-[#2f2f2d] transition-colors active:scale-95 p-1 shrink-0"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Item action menu */}
      <BottomSheet
        open={!!menuItem}
        onOpenChange={(o) => !o && setMenuItem(null)}
        title={menuItem?.name ?? 'Indstillinger'}
      >
        {menuItem && (
          <div className="space-y-1 px-1 pb-2">
            <button
              onClick={() => { openEdit(menuItem); setMenuItem(null); }}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-[15px] text-[#2f2f2d] active:bg-[#f5f4f0] transition-colors"
            >
              <Pencil className="h-4 w-4 text-[#78766d]" />
              Rediger
            </button>
            <button
              onClick={() => { handleArchive(menuItem, 'used'); setMenuItem(null); }}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-[15px] text-emerald-700 active:bg-emerald-50 transition-colors"
            >
              <CheckCircle className="h-4 w-4" />
              Brugt
            </button>
            <button
              onClick={() => { handleArchive(menuItem, 'thrown_away'); setMenuItem(null); }}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-[15px] text-amber-700 active:bg-amber-50 transition-colors"
            >
              <XCircle className="h-4 w-4" />
              Smidt ud
            </button>
            <div className="mx-3 my-1 border-t border-[#e5e3dc]" />
            <button
              onClick={() => { handleRemoveItem(menuItem); setMenuItem(null); }}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-[15px] text-red-600 active:bg-red-50 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Slet
            </button>
          </div>
        )}
      </BottomSheet>

      {/* Add item dialog */}
      <AnimatePresence>
        {addDialogOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-[60] bg-black/40"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setAddDialogOpen(false)}
            />
            <motion.div
              className="fixed bottom-0 left-0 right-0 z-[61] bg-white rounded-t-3xl shadow-2xl pb-[env(safe-area-inset-bottom,24px)] max-h-[90vh] flex flex-col"
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 40 }}
            >
              <div className="flex justify-center pt-3 pb-1">
                <div className="h-1 w-10 rounded-full bg-[#d8d7cf]" />
              </div>
              <div className="px-4 pb-[220px] space-y-4 overflow-y-auto flex-1">
                {/* Header */}
                <div className="text-center pb-2">
                  <h2 className="text-[18px] font-black text-[#2f2f2d]">Tilføj til køleskab</h2>
                </div>

                {/* Name */}
                <div>
                  <label className="text-[12px] font-semibold text-[#78766d] mb-1 block">Navn *</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    placeholder="fx Arla Letmælk"
                    autoFocus
                    className="w-full rounded-[8px] border border-[#e5e3dc] bg-[#faf9f6] px-3 py-3 text-[14px] text-[#2f2f2d] placeholder:text-[#b0ada4] outline-none focus:border-[#f58a2d]"
                  />
                </div>

                {/* Expiry date */}
                <div>
                  <label className="text-[12px] font-semibold text-[#78766d] mb-1 block">Sidste anvendelsesdato</label>
                  <input
                    type="date"
                    value={formExpiry}
                    onChange={e => setFormExpiry(e.target.value)}
                    className="w-full rounded-[8px] border border-[#e5e3dc] bg-[#faf9f6] px-3 py-3 text-[14px] text-[#2f2f2d] outline-none focus:border-[#f58a2d]"
                  />
                </div>

                {/* Manual nutrition entry (if no scan data) */}
                {!formNutrition && (
                  <div className="space-y-2">
                    <p className="text-[12px] font-semibold text-[#78766d]">Næringsindhold pr. 100g (valgfrit)</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] text-[#9a978f] mb-0.5 block">Kalorier (kcal)</label>
                        <input
                          type="number"
                          inputMode="numeric"
                          value={manualKcal}
                          onChange={e => setManualKcal(e.target.value)}
                          placeholder="0"
                          className="w-full rounded-[8px] border border-[#e5e3dc] bg-[#faf9f6] px-3 py-2.5 text-[13px] text-[#2f2f2d] placeholder:text-[#b0ada4] outline-none focus:border-[#f58a2d]"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-[#9a978f] mb-0.5 block">Protein (g)</label>
                        <input
                          type="number"
                          inputMode="decimal"
                          value={manualProtein}
                          onChange={e => setManualProtein(e.target.value)}
                          placeholder="0"
                          className="w-full rounded-[8px] border border-[#e5e3dc] bg-[#faf9f6] px-3 py-2.5 text-[13px] text-[#2f2f2d] placeholder:text-[#b0ada4] outline-none focus:border-[#f58a2d]"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-[#9a978f] mb-0.5 block">Kulhydrater (g)</label>
                        <input
                          type="number"
                          inputMode="decimal"
                          value={manualCarbs}
                          onChange={e => setManualCarbs(e.target.value)}
                          placeholder="0"
                          className="w-full rounded-[8px] border border-[#e5e3dc] bg-[#faf9f6] px-3 py-2.5 text-[13px] text-[#2f2f2d] placeholder:text-[#b0ada4] outline-none focus:border-[#f58a2d]"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-[#9a978f] mb-0.5 block">Fedt (g)</label>
                        <input
                          type="number"
                          inputMode="decimal"
                          value={manualFat}
                          onChange={e => setManualFat(e.target.value)}
                          placeholder="0"
                          className="w-full rounded-[8px] border border-[#e5e3dc] bg-[#faf9f6] px-3 py-2.5 text-[13px] text-[#2f2f2d] placeholder:text-[#b0ada4] outline-none focus:border-[#f58a2d]"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Nutrition preview (if from scan) */}
                {formNutrition && formNutrition.energyKcal != null && (
                  <div className="rounded-[8px] bg-[#f2f1ed] p-3">
                    <p className="text-[12px] font-semibold text-[#78766d] mb-1">Næringsindhold pr. 100g</p>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { label: 'Kcal', value: Math.round(formNutrition.energyKcal ?? 0), color: '#f58a2d' },
                        { label: 'Protein', value: `${(formNutrition.protein ?? 0).toFixed(1)}g`, color: '#3b82f6' },
                        { label: 'Kulh.', value: `${(formNutrition.carbs ?? 0).toFixed(1)}g`, color: '#f59e0b' },
                        { label: 'Fedt', value: `${(formNutrition.fat ?? 0).toFixed(1)}g`, color: '#ef4444' },
                      ].map(n => (
                        <div key={n.label} className="text-center">
                          <p className="text-[14px] font-black" style={{ color: n.color }}>{n.value}</p>
                          <p className="text-[10px] text-[#9a978f]">{n.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add button */}
                <button
                  onClick={handleAddItem}
                  disabled={!formName.trim()}
                  className="w-full rounded-[8px] bg-[#f58a2d] py-4 text-[15px] font-bold text-white active:scale-[0.98] transition-transform disabled:opacity-40"
                >
                  Tilføj til køleskab
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Edit BottomSheet */}
      <BottomSheet open={!!editingItem} onOpenChange={(o) => { if (!o) setEditingItem(null); }} title="Rediger vare">
        <div className="space-y-4">
          <div>
            <label className="text-[12px] font-semibold text-[#78766d] mb-1 block">Navn</label>
            <input
              type="text"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              className="w-full rounded-[8px] border border-[#e5e3dc] bg-[#faf9f6] px-3 py-3 text-[14px] text-[#2f2f2d] outline-none focus:border-[#f58a2d]"
            />
          </div>
          <div>
            <label className="text-[12px] font-semibold text-[#78766d] mb-1 block">Sidste anvendelsesdato</label>
            <input
              type="date"
              value={editExpiry}
              onChange={e => setEditExpiry(e.target.value)}
              className="w-full rounded-[8px] border border-[#e5e3dc] bg-[#faf9f6] px-3 py-3 text-[14px] text-[#2f2f2d] outline-none focus:border-[#f58a2d]"
            />
          </div>
          <button
            onClick={handleSaveEdit}
            disabled={!editName.trim()}
            className="w-full rounded-[8px] bg-[#2f2f2f] py-3.5 text-[15px] font-bold text-white active:scale-[0.98] transition-transform disabled:opacity-40"
          >
            Gem ændringer
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}
